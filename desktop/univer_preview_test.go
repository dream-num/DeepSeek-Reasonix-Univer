package main

import (
	"context"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestUniverPreviewCommandArgsRequiresOverride(t *testing.T) {
	t.Setenv(univerPreviewCommandEnv, "")
	absPath := filepath.Join(t.TempDir(), "book.univer")

	if _, err := univerPreviewCommandArgs(absPath); err == nil {
		t.Fatal("expected empty preview command error")
	}
}

func TestUniverPreviewCommandArgsOverrideWithPlaceholder(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book with spaces.univer")
	t.Setenv(univerPreviewCommandEnv, `node preview.js --target "{file}" --json`)

	got, err := univerPreviewCommandArgs(absPath)
	if err != nil {
		t.Fatalf("univerPreviewCommandArgs returned error: %v", err)
	}
	want := []string{"node", "preview.js", "--target", absPath, "--json"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestUniverPreviewCommandArgsOverrideAppendsFileContract(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	t.Setenv(univerPreviewCommandEnv, "univer-preview")

	got, err := univerPreviewCommandArgs(absPath)
	if err != nil {
		t.Fatalf("univerPreviewCommandArgs returned error: %v", err)
	}
	want := []string{"univer-preview", "--file", absPath, "--json"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("args = %#v, want %#v", got, want)
	}
}

func TestRunUniverPreviewUsesOverrideCommand(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	t.Setenv(univerPreviewCommandEnv, `"`+os.Args[0]+`" -test.run=TestUniverPreviewCommandHelper -- {file}`)
	t.Setenv("REASONIX_UNIVER_PREVIEW_HELPER", "json-success")

	got := runUniverPreview(context.Background(), absPath)
	if !got.OK {
		t.Fatalf("runUniverPreview returned failure: %s", got.Error)
	}
	if got.URL != "http://127.0.0.1:5173/?file=book.univer" {
		t.Fatalf("URL = %q", got.URL)
	}
}

func TestRunUniverDaemonPreviewUsesRunningStatus(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	var calls [][]string

	got := runUniverDaemonPreviewWithExec(context.Background(), absPath, func(_ context.Context, args []string) ([]byte, error) {
		calls = append(calls, append([]string(nil), args...))
		return []byte(`{"ok":true,"collabGateway":{"ok":true,"origin":"http://127.0.0.1:5174","viewUrl":"http://127.0.0.1:5174/"},"daemon":{"state":"running","pid":1234}}`), nil
	})

	if !got.OK {
		t.Fatalf("runUniverDaemonPreviewWithExec returned failure: %s", got.Error)
	}
	assertPreviewURLFile(t, got.URL, absPath)
	if got.GatewayURL != "http://127.0.0.1:5174" {
		t.Fatalf("GatewayURL = %q", got.GatewayURL)
	}
	if got.PID != 1234 || got.Managed {
		t.Fatalf("daemon sidecar = pid %d managed %v", got.PID, got.Managed)
	}
	want := [][]string{{"univer", "daemon", "status", "--json"}}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("calls = %#v, want %#v", calls, want)
	}
}

func TestRunUniverDaemonPreviewStartsWhenStopped(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	var calls [][]string
	statusCalls := 0

	got := runUniverDaemonPreviewWithExec(context.Background(), absPath, func(_ context.Context, args []string) ([]byte, error) {
		calls = append(calls, append([]string(nil), args...))
		if reflect.DeepEqual(args, []string{"univer", "daemon", "start"}) {
			return []byte("univer daemon: started"), nil
		}
		statusCalls++
		if statusCalls == 1 {
			return []byte(`{"ok":true,"collabGateway":null,"daemon":{"state":"stopped"},"diagnostics":[]}`), nil
		}
		return []byte(`{"ok":true,"collabGateway":{"ok":true,"origin":"http://127.0.0.1:5175","viewUrl":"http://127.0.0.1:5175/"},"daemon":{"state":"running","pid":2345}}`), nil
	})

	if !got.OK {
		t.Fatalf("runUniverDaemonPreviewWithExec returned failure: %s", got.Error)
	}
	assertPreviewURLFile(t, got.URL, absPath)
	want := [][]string{
		{"univer", "daemon", "status", "--json"},
		{"univer", "daemon", "start"},
		{"univer", "daemon", "status", "--json"},
	}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("calls = %#v, want %#v", calls, want)
	}
}

func TestRunUniverDaemonPreviewReturnsDiagnosticsWhenGatewayUnavailable(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "private", "book.univer")
	status := `{"ok":true,"collabGateway":null,"daemon":{"state":"running"},"diagnostics":[{"message":"cannot open ` + filepath.ToSlash(absPath) + `"}]}`
	var calls int

	got := runUniverDaemonPreviewWithExec(context.Background(), absPath, func(_ context.Context, args []string) ([]byte, error) {
		calls++
		if reflect.DeepEqual(args, []string{"univer", "daemon", "start"}) {
			return []byte("already running"), nil
		}
		return []byte(status), nil
	})

	if got.OK {
		t.Fatal("expected failure result")
	}
	if calls != 3 {
		t.Fatalf("calls = %d, want 3", calls)
	}
	if strings.Contains(got.Error, absPath) || strings.Contains(got.Error, filepath.ToSlash(absPath)) {
		t.Fatalf("error leaked target path: %q", got.Error)
	}
	if !strings.Contains(got.Error, "<univerfile>") {
		t.Fatalf("error did not contain redacted target marker: %q", got.Error)
	}
}

func assertPreviewURLFile(t *testing.T, rawURL, absPath string) {
	t.Helper()
	parsed, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("preview URL did not parse: %v", err)
	}
	if parsed.Scheme != "http" || parsed.Host == "" {
		t.Fatalf("preview URL = %q", rawURL)
	}
	if got := parsed.Query().Get("file"); got != absPath {
		t.Fatalf("file query = %q, want %q", got, absPath)
	}
}

func TestParseUniverPreviewOutputAcceptsSidecarEnvelope(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	out := []byte(`{"ok":true,"previewUrl":"http://127.0.0.1:5173/uf","sidecar":{"pid":1234,"managed":true,"gatewayUrl":"http://127.0.0.1:3010"}}`)

	got := parseUniverPreviewOutput(absPath, out)
	if !got.OK {
		t.Fatalf("parseUniverPreviewOutput returned failure: %s", got.Error)
	}
	if got.URL != "http://127.0.0.1:5173/uf" {
		t.Fatalf("URL = %q", got.URL)
	}
	if got.PID != 1234 || !got.Managed {
		t.Fatalf("sidecar = pid %d managed %v", got.PID, got.Managed)
	}
	if got.GatewayURL != "http://127.0.0.1:3010" {
		t.Fatalf("GatewayURL = %q", got.GatewayURL)
	}
}

func TestParseUniverPreviewOutputRedactsTargetPathOnFailure(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "private", "book.univer")
	out := []byte(`{"ok":false,"error":{"message":"cannot open ` + filepath.ToSlash(absPath) + `"}}`)

	got := parseUniverPreviewOutput(absPath, out)
	if got.OK {
		t.Fatal("expected failure result")
	}
	if strings.Contains(got.Error, absPath) || strings.Contains(got.Error, filepath.ToSlash(absPath)) {
		t.Fatalf("error leaked target path: %q", got.Error)
	}
	if !strings.Contains(got.Error, "<univerfile>") {
		t.Fatalf("error did not contain redacted target marker: %q", got.Error)
	}
}

func TestParseUniverPreviewOutputRejectsInvalidJSON(t *testing.T) {
	got := parseUniverPreviewOutput("/tmp/book.univer", []byte("not json"))
	if got.OK {
		t.Fatal("expected failure result")
	}
	if !strings.Contains(got.Error, "invalid JSON") {
		t.Fatalf("error = %q", got.Error)
	}
}

func TestRunUniverPreviewCommandMissingCommandFails(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "book.univer")
	t.Setenv(univerPreviewCommandEnv, filepath.Join(t.TempDir(), "missing-preview-command")+" {file}")

	got := runUniverPreviewCommand(context.Background(), absPath)
	if got.OK {
		t.Fatal("expected failure result")
	}
	if got.Error == "" {
		t.Fatal("expected error message")
	}
}

func TestRunUniverPreviewCommandNonZeroRedactsOutput(t *testing.T) {
	absPath := filepath.Join(t.TempDir(), "private", "book.univer")
	t.Setenv(univerPreviewCommandEnv, `"`+os.Args[0]+`" -test.run=TestUniverPreviewCommandHelper -- {file}`)
	t.Setenv("REASONIX_UNIVER_PREVIEW_HELPER", "nonzero")

	got := runUniverPreviewCommand(context.Background(), absPath)
	if got.OK {
		t.Fatal("expected failure result")
	}
	if strings.Contains(got.Error, absPath) || strings.Contains(got.Error, filepath.ToSlash(absPath)) {
		t.Fatalf("error leaked target path: %q", got.Error)
	}
	if !strings.Contains(got.Error, "<univerfile>") {
		t.Fatalf("error did not contain redacted target marker: %q", got.Error)
	}
}

func TestUniverPreviewCommandHelper(t *testing.T) {
	if os.Getenv("REASONIX_UNIVER_PREVIEW_HELPER") == "" {
		return
	}
	if os.Getenv("REASONIX_UNIVER_PREVIEW_HELPER") == "json-success" {
		_, _ = os.Stdout.WriteString(`{"ok":true,"url":"http://127.0.0.1:5173/?file=book.univer"}`)
		return
	}
	args := os.Args
	target := args[len(args)-1]
	_, _ = os.Stdout.WriteString("cannot open " + target)
	os.Exit(7)
}

func TestLiveUniverPreviewUsesWorkspacePathAndInjectedRunner(t *testing.T) {
	dir := t.TempDir()
	oldWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(oldWd)
	})

	target := filepath.Join(dir, "book.univer")
	if err := os.WriteFile(target, []byte("univer"), 0o644); err != nil {
		t.Fatal(err)
	}

	var gotPath string
	app := NewApp()
	app.univerPreview = &univerPreviewManager{
		managedPIDs: map[int]bool{},
		run: func(_ context.Context, absPath string) UniverPreviewResult {
			gotPath = absPath
			return UniverPreviewResult{OK: true, URL: "http://127.0.0.1:5173/uf"}
		},
		kill: func(int) error { return nil },
	}

	got := app.LiveUniverPreview("book.univer")
	if !got.OK {
		t.Fatalf("LiveUniverPreview returned failure: %s", got.Error)
	}
	wantPath, err := filepath.EvalSymlinks(target)
	if err != nil {
		t.Fatal(err)
	}
	if gotPath != wantPath {
		t.Fatalf("preview command path = %q, want %q", gotPath, wantPath)
	}
}

func TestUniverPreviewManagerClosesOnlyManagedPIDs(t *testing.T) {
	results := []UniverPreviewResult{
		{OK: true, URL: "http://127.0.0.1:5173/a", PID: 111, Managed: false},
		{OK: true, URL: "http://127.0.0.1:5173/b", PID: 222, Managed: true},
		{OK: false, Error: "failed", PID: 333, Managed: true},
	}
	var calls int
	var killed []int
	manager := &univerPreviewManager{
		managedPIDs: map[int]bool{},
		run: func(context.Context, string) UniverPreviewResult {
			result := results[calls]
			calls++
			return result
		},
		kill: func(pid int) error {
			killed = append(killed, pid)
			return nil
		},
	}

	manager.preview(context.Background(), "a.univer")
	manager.preview(context.Background(), "b.univer")
	manager.preview(context.Background(), "c.univer")
	manager.close()

	want := []int{222}
	if !reflect.DeepEqual(killed, want) {
		t.Fatalf("killed = %#v, want %#v", killed, want)
	}
}
