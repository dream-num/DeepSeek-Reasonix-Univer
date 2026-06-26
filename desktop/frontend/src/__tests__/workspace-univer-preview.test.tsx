// Run: tsx src/__tests__/workspace-univer-preview.test.tsx

import { JSDOM } from "jsdom";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { WorkspacePanel } from "../components/WorkspacePanel";
import type { AppBindings } from "../lib/bridge";
import { LocaleProvider } from "../lib/i18n";

let passed = 0;
let failed = 0;

function ok(value: boolean, label: string) {
  if (value) {
    process.stdout.write(`  PASS  ${label}\n`);
    passed += 1;
  } else {
    process.stdout.write(`  FAIL  ${label}\n`);
    failed += 1;
  }
}

function eq(a: unknown, b: unknown, label: string) {
  if (a === b) {
    process.stdout.write(`  PASS  ${label}\n`);
    passed += 1;
  } else {
    process.stdout.write(`  FAIL  ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}\n`);
    failed += 1;
  }
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(label: string, predicate: () => boolean) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await act(async () => {
      await flushPromises();
    });
    if (predicate()) return;
  }
  throw new Error(`timed out waiting for ${label}`);
}

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/",
  });
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  globalThis.Node = dom.window.Node;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;
  globalThis.MouseEvent = dom.window.MouseEvent;
  globalThis.PointerEvent = dom.window.MouseEvent as unknown as typeof PointerEvent;
  globalThis.MutationObserver = dom.window.MutationObserver;
  globalThis.ResizeObserver = TestResizeObserver;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  Object.defineProperty(dom.window.HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => {} });
  return dom;
}

console.log("\nworkspace Univer preview");

{
  const dom = installDom();
  let livePreviewPath = "";
  let readFileCalls = 0;
  window.go = {
    main: {
      App: {
        ListDir: async () => [{ name: "report.univer", isDir: false }],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => {
          readFileCalls += 1;
          return { path, body: "", size: 0, truncated: false, binary: false };
        },
        LiveUniverPreview: async (path: string) => {
          livePreviewPath = path;
          return { ok: true, url: "http://127.0.0.1:5173/uf/report" };
        },
        WorkspaceChanges: async () => ({ files: [], gitAvailable: true }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-a"
          cwd="/repo"
          maximized={false}
          revealPathRequest={{ id: 1, path: "report.univer" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });

  await waitFor("Univer preview iframe", () => Boolean(document.querySelector(".workspace-univer-preview__frame")));
  const iframe = document.querySelector(".workspace-univer-preview__frame") as HTMLIFrameElement | null;
  eq(livePreviewPath, "report.univer", "selected .univer file uses LiveUniverPreview");
  eq(readFileCalls, 0, "selected .univer file does not use ReadFile");
  eq(iframe?.getAttribute("src"), "http://127.0.0.1:5173/uf/report", "preview iframe uses returned URL");
  ok(Boolean(document.querySelector(".workspace-preview__body--univer")), "preview body switches to Univer layout");

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

{
  const dom = installDom();
  let readFileCalls = 0;
  let livePreviewCalls = 0;
  window.go = {
    main: {
      App: {
        ListDir: async () => [{ name: "notes.txt", isDir: false }],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => {
          readFileCalls += 1;
          return { path, body: "Plain markdown body", size: 19, truncated: false, binary: false };
        },
        LiveUniverPreview: async () => {
          livePreviewCalls += 1;
          return { ok: true, url: "http://127.0.0.1:5173/uf/unexpected" };
        },
        WorkspaceChanges: async () => ({ files: [], gitAvailable: true }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-fallback"
          cwd="/repo"
          maximized={false}
          revealPathRequest={{ id: 1, path: "notes.txt" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });

  await waitFor("non-Univer file body", () => document.body.textContent?.includes("Plain markdown body") === true);
  eq(readFileCalls, 1, "non-.univer file uses ReadFile");
  eq(livePreviewCalls, 0, "non-.univer file does not use LiveUniverPreview");

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

{
  const dom = installDom();
  let livePreviewPath = "";
  window.go = {
    main: {
      App: {
        ListDir: async () => [{ name: "agent.univer", isDir: false }],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => ({ path, body: "", size: 0, truncated: false, binary: false }),
        LiveUniverPreview: async (path: string) => {
          livePreviewPath = path;
          return { ok: true, url: "http://127.0.0.1:5173/uf/agent" };
        },
        WorkspaceChanges: async () => ({ files: [], gitAvailable: true }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-agent"
          cwd="/repo"
          maximized={false}
          agentPreviewPathRequest={{ id: 1, path: "agent.univer" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });

  await waitFor("agent Univer preview iframe", () => Boolean(document.querySelector(".workspace-univer-preview__frame")));
  eq(livePreviewPath, "agent.univer", "agent signal opens LiveUniverPreview when no explicit target is active");

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

{
  const dom = installDom();
  let livePreviewPath = "";
  window.go = {
    main: {
      App: {
        ListDir: async () => [{ name: "changes", isDir: true }],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => ({ path, body: "", size: 0, truncated: false, binary: false }),
        LiveUniverPreview: async (path: string) => {
          livePreviewPath = path;
          return { ok: true, url: "http://127.0.0.1:5173/uf/session-change" };
        },
        WorkspaceChanges: async () => ({
          files: [{ path: "changes/session.univer", sources: ["session"], gitStatus: "M" }],
          gitAvailable: true,
        }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-session-change"
          cwd="/repo"
          maximized={false}
          refreshKey={1}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });

  await waitFor("session change Univer preview iframe", () => Boolean(document.querySelector(".workspace-univer-preview__frame")));
  eq(livePreviewPath, "changes/session.univer", "unique session workspace change opens LiveUniverPreview");

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

{
  const dom = installDom();
  const previewPaths: string[] = [];
  window.go = {
    main: {
      App: {
        ListDir: async () => [
          { name: "first.univer", isDir: false },
          { name: "second.univer", isDir: false },
        ],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => ({ path, body: "", size: 0, truncated: false, binary: false }),
        LiveUniverPreview: async (path: string) => {
          previewPaths.push(path);
          return { ok: true, url: `http://127.0.0.1:5173/uf/${encodeURIComponent(path)}` };
        },
        WorkspaceChanges: async () => ({ files: [], gitAvailable: true }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-explicit"
          cwd="/repo"
          maximized={false}
          revealPathRequest={{ id: 1, path: "first.univer" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });
  await waitFor("explicit Univer preview iframe", () =>
    document.querySelector(".workspace-univer-preview__frame")?.getAttribute("src") === "http://127.0.0.1:5173/uf/first.univer",
  );

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-explicit"
          cwd="/repo"
          maximized={false}
          agentPreviewPathRequest={{ id: 2, path: "second.univer" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });

  eq(previewPaths.join(","), "first.univer", "agent signal does not override a different explicit .univer target");
  eq(
    document.querySelector(".workspace-univer-preview__frame")?.getAttribute("src"),
    "http://127.0.0.1:5173/uf/first.univer",
    "explicit .univer target remains visible after different agent signal",
  );

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

{
  const dom = installDom();
  let livePreviewCalls = 0;
  window.go = {
    main: {
      App: {
        ListDir: async () => [{ name: "retry.univer", isDir: false }],
        SearchFileRefs: async () => [],
        ReadFile: async (path: string) => ({ path, body: "", size: 0, truncated: false, binary: false }),
        LiveUniverPreview: async () => {
          livePreviewCalls += 1;
          if (livePreviewCalls === 1) return { ok: false, error: "preview failed" };
          return { ok: true, url: "http://127.0.0.1:5173/uf/retry" };
        },
        WorkspaceChanges: async () => ({ files: [], gitAvailable: true }),
        WorkspaceGitHistory: async () => [],
      } as Partial<AppBindings> as AppBindings,
    },
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);

  await act(async () => {
    root.render(
      <LocaleProvider>
        <WorkspacePanel
          open
          tabId="tab-retry"
          cwd="/repo"
          maximized={false}
          agentPreviewPathRequest={{ id: 1, path: "retry.univer" }}
          onClose={() => {}}
          onToggleMaximized={() => {}}
        />
      </LocaleProvider>,
    );
    await flushPromises();
  });
  await waitFor("preview failure state", () => document.body.textContent?.includes("preview failed") === true);
  ok(document.body.textContent?.includes("preview failed") === true, "preview command failure stays in preview failure surface");

  const retry = document.querySelector(".workspace-univer-preview__retry") as HTMLButtonElement | null;
  await act(async () => {
    retry?.click();
    await flushPromises();
  });
  await waitFor("retry calls LiveUniverPreview again", () => livePreviewCalls === 2);
  eq(livePreviewCalls, 2, "retry invokes LiveUniverPreview again");
  await waitFor("retry Univer preview iframe", () => Boolean(document.querySelector(".workspace-univer-preview__frame")));

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
