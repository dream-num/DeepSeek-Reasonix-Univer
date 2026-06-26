package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	univerPreviewCommandEnv   = "REASONIX_UNIVER_PREVIEW_COMMAND"
	univerPreviewTimeoutEnv   = "REASONIX_UNIVER_PREVIEW_TIMEOUT_MS"
	defaultUniverPreviewMsec  = 20_000
	univerPreviewOutputMaxLen = 2_000
)

// UniverPreviewResult is the desktop bridge payload for Live Univer Preview.
// It intentionally omits the target path: the frontend already knows the
// selected workspace file, and bridge errors should not become another path log.
type UniverPreviewResult struct {
	OK         bool   `json:"ok"`
	URL        string `json:"url,omitempty"`
	GatewayURL string `json:"gatewayUrl,omitempty"`
	PID        int    `json:"pid,omitempty"`
	Managed    bool   `json:"managed,omitempty"`
	Error      string `json:"error,omitempty"`
}

type univerPreviewCommandEnvelope struct {
	OK         *bool           `json:"ok"`
	URL        string          `json:"url"`
	PreviewURL string          `json:"previewUrl"`
	GatewayURL string          `json:"gatewayUrl"`
	PID        int             `json:"pid"`
	Managed    *bool           `json:"managed"`
	Message    string          `json:"message"`
	Error      json.RawMessage `json:"error"`
	Sidecar    *struct {
		PID        int    `json:"pid"`
		Managed    *bool  `json:"managed"`
		GatewayURL string `json:"gatewayUrl"`
	} `json:"sidecar"`
}

type univerDaemonStatusEnvelope struct {
	OK            bool `json:"ok"`
	CollabGateway *struct {
		Host      string `json:"host"`
		OK        bool   `json:"ok"`
		Origin    string `json:"origin"`
		Port      int    `json:"port"`
		StartedAt string `json:"startedAt"`
		ViewURL   string `json:"viewUrl"`
	} `json:"collabGateway"`
	Daemon struct {
		BuildID      string `json:"buildId"`
		PID          int    `json:"pid"`
		RuntimeRoot  string `json:"runtimeRoot"`
		SessionCount int    `json:"sessionCount"`
		SocketPath   string `json:"socketPath"`
		StartedAt    string `json:"startedAt"`
		State        string `json:"state"`
	} `json:"daemon"`
	Diagnostics []struct {
		Message string `json:"message"`
	} `json:"diagnostics"`
	Next []struct {
		Command string `json:"command"`
		Reason  string `json:"reason"`
	} `json:"next"`
}

type univerPreviewManager struct {
	mu          sync.Mutex
	managedPIDs map[int]bool
	run         func(context.Context, string) UniverPreviewResult
	kill        func(int) error
}

func newUniverPreviewManager() *univerPreviewManager {
	return &univerPreviewManager{
		managedPIDs: map[int]bool{},
		run:         runUniverPreview,
		kill:        killProcessByPID,
	}
}

func (a *App) ensureUniverPreviewManager() *univerPreviewManager {
	a.univerPreviewMu.Lock()
	defer a.univerPreviewMu.Unlock()
	if a.univerPreview == nil {
		a.univerPreview = newUniverPreviewManager()
	}
	return a.univerPreview
}

// LiveUniverPreview resolves a workspace-relative .univer path and asks Univer
// tooling for an embeddable Preview URL. Failures are returned as ok:false so
// the frontend can keep them local to the preview surface.
func (a *App) LiveUniverPreview(rel string) UniverPreviewResult {
	path, ok, err := a.workspacePath(rel)
	if err != nil || !ok {
		return failUniverPreview(rel, "invalid workspace path")
	}
	if !strings.EqualFold(filepath.Ext(path), ".univer") {
		return failUniverPreview(path, "selected file is not a .univer file")
	}
	info, err := os.Stat(path)
	if err != nil {
		return failUniverPreview(path, err.Error())
	}
	if info.IsDir() || !info.Mode().IsRegular() {
		return failUniverPreview(path, "selected path is not a regular .univer file")
	}
	return a.ensureUniverPreviewManager().preview(a.bootContext(), path)
}

func (a *App) closeUniverPreviewSidecars() {
	a.univerPreviewMu.Lock()
	manager := a.univerPreview
	a.univerPreview = nil
	a.univerPreviewMu.Unlock()
	if manager != nil {
		manager.close()
	}
}

func (m *univerPreviewManager) preview(ctx context.Context, absPath string) UniverPreviewResult {
	result := m.run(ctx, absPath)
	if result.OK && result.Managed && result.PID > 0 {
		m.mu.Lock()
		m.managedPIDs[result.PID] = true
		m.mu.Unlock()
	}
	return result
}

func runUniverPreview(parent context.Context, absPath string) UniverPreviewResult {
	if strings.TrimSpace(os.Getenv(univerPreviewCommandEnv)) != "" {
		return runUniverPreviewCommand(parent, absPath)
	}
	return runUniverDaemonPreview(parent, absPath)
}

type univerPreviewExec func(context.Context, []string) ([]byte, error)

func runUniverDaemonPreview(parent context.Context, absPath string) UniverPreviewResult {
	timeout := univerPreviewTimeout()
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()
	return runUniverDaemonPreviewWithExec(ctx, absPath, runUniverPreviewExec)
}

func runUniverDaemonPreviewWithExec(ctx context.Context, absPath string, run univerPreviewExec) UniverPreviewResult {
	status, err := readUniverDaemonStatus(ctx, absPath, run)
	if err != nil {
		return failUniverPreview(absPath, err.Error())
	}
	if result, ok := previewResultFromDaemonStatus(absPath, status); ok {
		return result
	}

	if out, err := run(ctx, []string{"univer", "daemon", "start"}); err != nil {
		msg := err.Error()
		if trimmed := strings.TrimSpace(string(out)); trimmed != "" {
			msg += ": " + clipPreviewOutput(trimmed)
		}
		return failUniverPreview(absPath, msg)
	}
	if ctx.Err() != nil {
		return failUniverPreview(absPath, "preview command timed out")
	}

	status, err = readUniverDaemonStatus(ctx, absPath, run)
	if err != nil {
		return failUniverPreview(absPath, err.Error())
	}
	if result, ok := previewResultFromDaemonStatus(absPath, status); ok {
		return result
	}
	return failUniverPreview(absPath, daemonStatusFailureMessage(status))
}

func readUniverDaemonStatus(ctx context.Context, absPath string, run univerPreviewExec) (univerDaemonStatusEnvelope, error) {
	var status univerDaemonStatusEnvelope
	out, err := run(ctx, []string{"univer", "daemon", "status", "--json"})
	if ctx.Err() != nil {
		return status, errors.New("preview command timed out")
	}
	trimmed := strings.TrimSpace(string(out))
	if err != nil {
		msg := err.Error()
		if trimmed != "" {
			msg += ": " + clipPreviewOutput(trimmed)
		}
		return status, errors.New(sanitizePreviewError(absPath, msg))
	}
	if trimmed == "" {
		return status, errors.New("univer daemon status did not return JSON")
	}
	dec := json.NewDecoder(strings.NewReader(trimmed))
	if err := dec.Decode(&status); err != nil {
		return status, errors.New("univer daemon status returned invalid JSON")
	}
	return status, nil
}

func previewResultFromDaemonStatus(absPath string, status univerDaemonStatusEnvelope) (UniverPreviewResult, bool) {
	if !status.OK || status.CollabGateway == nil || !status.CollabGateway.OK {
		return UniverPreviewResult{}, false
	}
	previewURL, err := daemonPreviewURL(status.CollabGateway.ViewURL, absPath)
	if err != nil {
		return failUniverPreview(absPath, err.Error()), true
	}
	if !validPreviewURL(previewURL) {
		return failUniverPreview(absPath, "univer daemon returned an invalid Preview URL"), true
	}
	return UniverPreviewResult{
		OK:         true,
		URL:        previewURL,
		GatewayURL: status.CollabGateway.Origin,
		PID:        status.Daemon.PID,
		Managed:    false,
	}, true
}

func daemonPreviewURL(viewURL, absPath string) (string, error) {
	viewURL = strings.TrimSpace(viewURL)
	if viewURL == "" {
		return "", errors.New("univer daemon did not return a Gateway view URL")
	}
	u, err := url.Parse(viewURL)
	if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") {
		return "", errors.New("univer daemon returned an invalid Gateway view URL")
	}
	q := u.Query()
	q.Set("file", absPath)
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func daemonStatusFailureMessage(status univerDaemonStatusEnvelope) string {
	for _, diagnostic := range status.Diagnostics {
		if strings.TrimSpace(diagnostic.Message) != "" {
			return diagnostic.Message
		}
	}
	state := strings.TrimSpace(status.Daemon.State)
	if state == "" {
		state = "unknown"
	}
	return "univer daemon did not return a running Collab Gateway; state=" + state
}

func runUniverPreviewExec(ctx context.Context, args []string) ([]byte, error) {
	if len(args) == 0 {
		return nil, errors.New("preview command is empty")
	}
	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	cmd.Env = os.Environ()
	return cmd.CombinedOutput()
}

func (m *univerPreviewManager) close() {
	m.mu.Lock()
	pids := make([]int, 0, len(m.managedPIDs))
	for pid := range m.managedPIDs {
		pids = append(pids, pid)
	}
	m.managedPIDs = map[int]bool{}
	m.mu.Unlock()
	for _, pid := range pids {
		if pid <= 0 || pid == os.Getpid() {
			continue
		}
		_ = m.kill(pid)
	}
}

func runUniverPreviewCommand(parent context.Context, absPath string) UniverPreviewResult {
	args, err := univerPreviewCommandArgs(absPath)
	if err != nil {
		return failUniverPreview(absPath, err.Error())
	}
	timeout := univerPreviewTimeout()
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	cmd.Env = os.Environ()
	out, runErr := cmd.CombinedOutput()
	if ctx.Err() != nil {
		return failUniverPreview(absPath, "preview command timed out")
	}
	trimmedOutput := strings.TrimSpace(string(out))
	if trimmedOutput != "" && previewOutputLooksJSON(trimmedOutput) {
		parsed := parseUniverPreviewOutput(absPath, out)
		if parsed.OK || parsed.Error != "" {
			return parsed
		}
	}
	if runErr != nil {
		msg := runErr.Error()
		if trimmedOutput != "" {
			msg += ": " + clipPreviewOutput(trimmedOutput)
		}
		return failUniverPreview(absPath, msg)
	}
	if trimmedOutput != "" {
		return parseUniverPreviewOutput(absPath, out)
	}
	return failUniverPreview(absPath, "preview command did not return a Preview URL")
}

func previewOutputLooksJSON(s string) bool {
	s = strings.TrimSpace(s)
	return strings.HasPrefix(s, "{") || strings.HasPrefix(s, "[")
}

func univerPreviewCommandArgs(absPath string) ([]string, error) {
	override := strings.TrimSpace(os.Getenv(univerPreviewCommandEnv))
	if override == "" {
		return nil, errors.New("preview command is empty")
	}
	parts, err := splitPreviewCommandLine(override)
	if err != nil {
		return nil, err
	}
	if len(parts) == 0 {
		return nil, errors.New("preview command is empty")
	}
	hasFile := false
	for i, part := range parts {
		if strings.Contains(part, "{file}") {
			parts[i] = strings.ReplaceAll(part, "{file}", absPath)
			hasFile = true
		}
	}
	if !hasFile {
		parts = append(parts, "--file", absPath, "--json")
	}
	return parts, nil
}

func splitPreviewCommandLine(s string) ([]string, error) {
	var out []string
	var b strings.Builder
	var quote rune
	escaped := false
	flush := func() {
		if b.Len() > 0 {
			out = append(out, b.String())
			b.Reset()
		}
	}
	for _, r := range s {
		if escaped {
			b.WriteRune(r)
			escaped = false
			continue
		}
		if r == '\\' {
			escaped = true
			continue
		}
		if quote != 0 {
			if r == quote {
				quote = 0
			} else {
				b.WriteRune(r)
			}
			continue
		}
		switch r {
		case '\'', '"':
			quote = r
		case ' ', '\t', '\n', '\r':
			flush()
		default:
			b.WriteRune(r)
		}
	}
	if escaped {
		b.WriteRune('\\')
	}
	if quote != 0 {
		return nil, errors.New("preview command contains an unterminated quote")
	}
	flush()
	return out, nil
}

func parseUniverPreviewOutput(absPath string, out []byte) UniverPreviewResult {
	var env univerPreviewCommandEnvelope
	dec := json.NewDecoder(strings.NewReader(strings.TrimSpace(string(out))))
	if err := dec.Decode(&env); err != nil {
		return failUniverPreview(absPath, "preview command returned invalid JSON")
	}
	if env.Sidecar != nil {
		if env.PID == 0 {
			env.PID = env.Sidecar.PID
		}
		if env.Managed == nil {
			env.Managed = env.Sidecar.Managed
		}
		if env.GatewayURL == "" {
			env.GatewayURL = env.Sidecar.GatewayURL
		}
	}
	if env.OK != nil && !*env.OK {
		return failUniverPreview(absPath, firstNonEmptyPreview(previewErrorMessage(env.Error), env.Message, "preview command failed"))
	}
	previewURL := firstNonEmptyPreview(env.URL, env.PreviewURL)
	if previewURL == "" {
		return failUniverPreview(absPath, firstNonEmptyPreview(previewErrorMessage(env.Error), env.Message, "preview command did not return a Preview URL"))
	}
	if !validPreviewURL(previewURL) {
		return failUniverPreview(absPath, "preview command returned an invalid Preview URL")
	}
	managed := false
	if env.Managed != nil {
		managed = *env.Managed
	}
	return UniverPreviewResult{
		OK:         true,
		URL:        previewURL,
		GatewayURL: env.GatewayURL,
		PID:        env.PID,
		Managed:    managed,
	}
}

func previewErrorMessage(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var s string
	if json.Unmarshal(raw, &s) == nil {
		return s
	}
	var obj struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	}
	if json.Unmarshal(raw, &obj) == nil {
		if obj.Message != "" {
			return obj.Message
		}
		return obj.Code
	}
	return ""
}

func validPreviewURL(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return false
	}
	return u.Scheme == "http" || u.Scheme == "https"
}

func univerPreviewTimeout() time.Duration {
	raw := strings.TrimSpace(os.Getenv(univerPreviewTimeoutEnv))
	if raw == "" {
		return time.Duration(defaultUniverPreviewMsec) * time.Millisecond
	}
	ms, err := strconv.Atoi(raw)
	if err != nil || ms <= 0 {
		return time.Duration(defaultUniverPreviewMsec) * time.Millisecond
	}
	return time.Duration(ms) * time.Millisecond
}

func failUniverPreview(absPath, msg string) UniverPreviewResult {
	return UniverPreviewResult{OK: false, Error: sanitizePreviewError(absPath, msg)}
}

func sanitizePreviewError(absPath, msg string) string {
	msg = strings.TrimSpace(msg)
	if msg == "" {
		msg = "preview unavailable"
	}
	if absPath != "" {
		clean := filepath.Clean(absPath)
		msg = strings.ReplaceAll(msg, clean, "<univerfile>")
		msg = strings.ReplaceAll(msg, filepath.ToSlash(clean), "<univerfile>")
	}
	return clipPreviewOutput(msg)
}

func clipPreviewOutput(s string) string {
	s = strings.TrimSpace(s)
	if len(s) <= univerPreviewOutputMaxLen {
		return s
	}
	return strings.TrimSpace(s[:univerPreviewOutputMaxLen]) + "..."
}

func firstNonEmptyPreview(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func killProcessByPID(pid int) error {
	p, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	if err := p.Kill(); err != nil {
		return fmt.Errorf("kill preview sidecar %d: %w", pid, err)
	}
	return nil
}
