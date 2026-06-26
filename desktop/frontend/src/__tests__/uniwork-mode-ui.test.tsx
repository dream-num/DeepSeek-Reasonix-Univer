// Run: tsx src/__tests__/uniwork-mode-ui.test.tsx

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { UniworkActivitySwitch, UniworkMode, UniworkSidebar, type WorkspaceActivity } from "../components/UniworkMode";
import { LocaleProvider } from "../lib/i18n";

const testDir = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(testDir, "../App.tsx"), "utf8");
const cssSource = readFileSync(resolve(testDir, "../styles.css"), "utf8");
const uniworkModeSource = readFileSync(resolve(testDir, "../components/UniworkMode.tsx"), "utf8");
const uniworkComposerSource = readFileSync(resolve(testDir, "../components/UniworkComposer.tsx"), "utf8");
const uniworkTranscriptSource = readFileSync(resolve(testDir, "../components/UniworkTranscript.tsx"), "utf8");
const uniworkProjectTreeSource = readFileSync(resolve(testDir, "../components/UniworkProjectTree.tsx"), "utf8");
const zhLocaleSource = readFileSync(resolve(testDir, "../locales/zh.ts"), "utf8");

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

function textContent() {
  return document.body.textContent ?? "";
}

function flushTimers(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
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
  globalThis.Event = dom.window.Event;
  globalThis.MouseEvent = dom.window.MouseEvent;
  return dom;
}

async function renderUniworkMode() {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("missing root");
  const root = createRoot(rootEl);
  const switchCalls: WorkspaceActivity[] = [];
  await act(async () => {
    root.render(
      <LocaleProvider>
        <UniworkActivitySwitch activity="uniwork" onActivityChange={(activity) => switchCalls.push(activity)} />
        <UniworkSidebar projectTreeSlot={<section className="sidebar__section sidebar__section--projects" data-testid="project-tree-slot">Project Tree</section>} />
        <UniworkMode
          transcriptSlot={<section data-testid="uniwork-transcript-slot">Uniwork transcript</section>}
          composerSlot={
            <footer className="footer" data-testid="shared-agent-footer">
              <textarea id="composer-input" aria-label="Shared composer" />
            </footer>
          }
        />
      </LocaleProvider>,
    );
    await flushTimers();
  });
  return { root, switchCalls };
}

console.log("\nuniwork mode ui");

{
  const dom = installDom();
  const { root, switchCalls } = await renderUniworkMode();

  ok(
    document.querySelector(".uniwork-activity-switch__item--active")?.textContent === "Uniwork",
    "activity switch shows Uniwork as the selected workspace mode",
  );
  ok(
    Boolean(document.querySelector(".uniwork-sidebar--project-tree [data-testid='project-tree-slot']")),
    "Uniwork sidebar is based on the host project tree slot",
  );
  ok(
    /import \{ UniworkProjectTree \} from "\.\/components\/UniworkProjectTree";/.test(appSource) &&
      /<UniworkProjectTree\b/.test(appSource) &&
      /<ProjectTree\b/.test(appSource),
    "App keeps UniworkProjectTree separate from the Code ProjectTree",
  );
  ok(
    /import \{ UniworkComposer \} from "\.\/components\/UniworkComposer";/.test(appSource) &&
      /import \{ UniworkTranscript \} from "\.\/components\/UniworkTranscript";/.test(appSource) &&
      /<UniworkComposer\b/.test(appSource) &&
      /<UniworkTranscript\b/.test(appSource) &&
      /<Composer\b/.test(appSource) &&
      /<StatusBar\b/.test(appSource),
    "App keeps UniworkComposer and UniworkTranscript separate while Code still owns Composer and StatusBar",
  );
  ok(
    /export function UniworkProjectTree\(/.test(uniworkProjectTreeSource) &&
      !/export function ProjectTree\(/.test(uniworkProjectTreeSource),
    "UniworkProjectTree has its own exported component boundary",
  );
  ok(
    /function isBrowserDemoProjectTree/.test(uniworkProjectTreeSource) &&
      /function buildUniworkDemoProjectTree/.test(uniworkProjectTreeSource) &&
      /"~\/projects\/joyquant-db"/.test(uniworkProjectTreeSource) &&
      /"~\/projects\/joyquant-sys"/.test(uniworkProjectTreeSource) &&
      /mock\.uniworkProjectFinance/.test(uniworkProjectTreeSource) &&
      /mock\.uniworkTopicCliImport/.test(uniworkProjectTreeSource) &&
      /"mock\.uniworkProjectFinance": "财务报表工作区"/.test(zhLocaleSource) &&
      /"mock\.uniworkTopicMonthlyReport": "月度经营报表自动汇总"/.test(zhLocaleSource) &&
      /"mock\.uniworkTopicCliImport": "Univer CLI 批量导入模板校验"/.test(zhLocaleSource),
    "UniworkProjectTree remaps browser demo seed data to office and Univer CLI examples",
  );
  ok(
    /export function UniworkComposer\(/.test(uniworkComposerSource) &&
      !/export function Composer\(/.test(uniworkComposerSource) &&
      /uniwork-composer__context-group/.test(uniworkComposerSource) &&
      /uniwork-composer__utility-row/.test(uniworkComposerSource) &&
      /uniwork-controls-menu/.test(uniworkComposerSource) &&
      /uniwork-status-menu/.test(uniworkComposerSource) &&
      !/uniwork-composer__status-row/.test(uniworkComposerSource),
    "UniworkComposer separates context, input, and a lightweight utility/status row",
  );
  ok(
    /export function UniworkTranscript\(/.test(uniworkTranscriptSource) &&
      !/export function Transcript\(/.test(uniworkTranscriptSource) &&
      /fork of the Code Transcript/.test(uniworkTranscriptSource),
    "UniworkTranscript is forked from the Code transcript for independent evolution",
  );
  ok(
    /const \[activeQuestionTurn, setActiveQuestionTurn\] = useState<number \| null>\(null\);/.test(uniworkTranscriptSource) &&
      /const updateActiveQuestionFromScroll = useCallback/.test(uniworkTranscriptSource) &&
      /onScroll=\{handleTranscriptScroll\}/.test(uniworkTranscriptSource) &&
      /<QuestionJumpBar questions=\{questions\} activeTurn=\{activeQuestionTurn\} onJump=\{handleJumpToQuestion\} \/>/.test(uniworkTranscriptSource) &&
      /activeTurn: number \| null;/.test(uniworkTranscriptSource),
    "UniworkTranscript updates the question jump bar active marker from transcript scrolling",
  );
  ok(
      /\.transcript-shell > \.jump-bar\s*\{[^}]*right:\s*0;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.transcript-shell > \.jump-bar\s*\{[^}]*right:\s*auto;[^}]*left:\s*0;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.transcript-shell > \.jump-bar\s*\{[^}]*transform:\s*translate\(-4px, -50%\);/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.jump-preview\s*\{[^}]*right:\s*auto;[^}]*left:\s*100%;/s.test(cssSource),
    "UniworkTranscript keeps the question jump bar in the outer left gutter without changing Code transcript positioning",
  );
  ok(
    /transcriptSlot/.test(uniworkModeSource) &&
      /uniwork-body/.test(uniworkModeSource) &&
      /uniwork-transcript-pane/.test(uniworkModeSource) &&
      /uniwork-actions-rail/.test(uniworkModeSource) &&
      /uniwork-actions-rail__skeleton/.test(uniworkModeSource) &&
      /uniwork-actions-preview/.test(uniworkModeSource) &&
      /t\("uniwork\.actions\.label"\)/.test(uniworkModeSource) &&
      /t\("uniwork\.sidebar\.newTask"\)/.test(uniworkModeSource) &&
      uniworkModeSource.includes("\"uniwork.activitySwitcher.uniwork\"") &&
      /\.uniwork-shell\s*\{[^}]*--uniwork-actions-rail-width:\s*320px;(?![^}]*--uniwork-composer-text-inset)/s.test(cssSource) &&
      /\.uniwork-body\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--uniwork-actions-rail-width\);[^}]*gap:\s*0;(?![^}]*padding:)/s.test(cssSource) &&
      /\.uniwork-transcript-pane\s*\{(?![^}]*padding-left:)[^}]*overflow:\s*hidden;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.transcript\s*\{[^}]*padding-left:\s*60px;[^}]*scrollbar-gutter:\s*auto;[^}]*scrollbar-width:\s*none;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.transcript::\-webkit-scrollbar\s*\{[^}]*display:\s*none;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.transcript > \*\s*\{(?![^}]*width:\s*100%)[^}]*max-width:\s*none;[^}]*margin-right:\s*0;/s.test(cssSource) &&
      /\.uniwork-transcript-pane \.warm-turn__body > \*,\s*\.uniwork-transcript-pane \.readonly-batch__body > \*,\s*\.uniwork-transcript-pane \.turn-collapse__body > \*\s*\{[^}]*max-width:\s*none;[^}]*margin-left:\s*0;[^}]*margin-right:\s*0;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.uniwork-transcript-pane \.transcript\s*\{[^}]*padding-left:\s*60px;[^}]*scrollbar-gutter:\s*auto;[^}]*scrollbar-width:\s*none;/s.test(cssSource) &&
      /\.uniwork-actions-rail\s*\{(?![^}]*border-left:)[^}]*background:\s*color-mix\(in srgb, var\(--uniwork-canvas\) 86%, var\(--bg-soft\)\);/s.test(cssSource),
    "UniworkMode hosts the transcript and a fixed empty action rail with text aligned to the composer input",
  );
  ok(
    /\.uniwork-actions-rail__skeleton\s*\{[^}]*gap:\s*12px;[^}]*pointer-events:\s*none;/s.test(cssSource) &&
      /\.uniwork-actions-rail__toolbar\s*\{[^}]*gap:\s*8px;/s.test(cssSource) &&
      /\.uniwork-actions-preview\s*\{[^}]*min-height:\s*176px;[^}]*border-radius:\s*8px;/s.test(cssSource) &&
      /\.uniwork-actions-preview__surface\s*\{[^}]*gap:\s*10px;[^}]*padding:\s*12px;/s.test(cssSource),
    "Uniwork actions rail renders a compact non-interactive button and preview skeleton",
  );
  ok(
    /t\("uniwork\.composer\./.test(uniworkComposerSource) &&
      /t\("uniwork\.status\./.test(uniworkComposerSource),
    "UniworkComposer registers composer and status copy through the uniwork locale namespace",
  );
  ok(
    !/uniworkProjectTreeText/.test(uniworkProjectTreeSource) &&
      !/\bt\("projectTree\./.test(uniworkProjectTreeSource) &&
      !/\bt\("history\./.test(uniworkProjectTreeSource) &&
      !/\bt\("msg\./.test(uniworkProjectTreeSource) &&
      /\bt\("uniwork\.projectTree\./.test(uniworkProjectTreeSource),
    "UniworkProjectTree uses the uniwork.projectTree locale namespace",
  );
  ok(
    textContent().includes("New task") &&
      !textContent().includes("Artifacts") &&
      !textContent().includes("Scheduled"),
    "Uniwork sidebar hides future-only Artifacts and Scheduled entries",
  );
  ok(
    !document.querySelector(".uniwork-topbar") && !textContent().includes("Back to Code"),
    "Uniwork mode does not render a separate top bar or Back to Code action",
  );
  ok(
    Boolean(document.querySelector("[data-testid='uniwork-transcript-slot']")) &&
      textContent().includes("Uniwork transcript") &&
      !textContent().includes("Let's tackle something together"),
    "Uniwork mode renders the transcript slot instead of the old hero home",
  );
  ok(
    !textContent().includes("How can I help you today?") &&
      !textContent().includes("Work in a project or folder"),
    "Uniwork home no longer renders a fake composer or scope controls",
  );
  ok(
    Boolean(document.querySelector("[data-testid='shared-agent-footer']")) &&
      Boolean(document.querySelector("#composer-input")),
    "Uniwork mode renders the host-provided shared agent footer",
  );
  ok(
    Boolean(document.querySelector(".uniwork-body")) &&
      Boolean(document.querySelector(".uniwork-transcript-pane")) &&
      Boolean(document.querySelector(".uniwork-actions-rail")),
    "Uniwork mode renders a transcript column and an empty fixed action rail",
  );
  ok(
    /\.app--uniwork \.layout\s*\{[^}]*--statusbar-height:\s*0px;/s.test(cssSource) &&
      /\.app--uniwork \.footer\s*\{[^}]*border-top:\s*0;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.footer\s*\{[^}]*padding:\s*0;[^}]*border-top:\s*0;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.uniwork-composer-card\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s.test(cssSource),
    "Uniwork layout removes the inherited bottom statusbar reservation",
  );
  ok(
      /\.app--uniwork \.footer--uniwork\s*\{[^}]*padding:\s*8px 56px;/s.test(cssSource) &&
      /\.uniwork-composer-wrap\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*1680px;/s.test(cssSource) &&
      !/\.uniwork-composer-wrap\s*\{[^}]*100vw/s.test(cssSource) &&
      /\.uniwork-composer__input\s*\{(?![^}]*margin:)[^}]*min-height:\s*48px;[^}]*align-items:\s*center;[^}]*padding:\s*10px;/s.test(cssSource) &&
      /\.uniwork-composer__input \.composer__input\s*\{[^}]*font-size:\s*var\(--font-content\);/s.test(cssSource) &&
      /\.uniwork-composer__scope-row\s*\{[^}]*padding:\s*0 2px 8px;/s.test(cssSource) &&
      /\.uniwork-composer__utility-row\s*\{[^}]*min-height:\s*32px;[^}]*padding:\s*8px 2px 0;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.footer--uniwork\s*\{[^}]*padding:\s*8px 56px;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.uniwork-composer-wrap\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*1680px;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.uniwork-composer__input\s*\{(?![^}]*margin:)[^}]*min-height:\s*48px;[^}]*padding:\s*10px;/s.test(cssSource) &&
      /:root\[data-theme-style\] \.app--uniwork \.uniwork-composer__input \.composer__input\s*\{[^}]*font-size:\s*var\(--font-content\);/s.test(cssSource),
    "Uniwork composer uses compact single-line input sizing within the host pane",
  );
  ok(
    /const \[controlsMenuOpen, setControlsMenuOpen\] = useState\(false\);/.test(uniworkComposerSource) &&
      /className=\{controlsMenuOpen \? "uniwork-composer__mode-trigger uniwork-composer__mode-trigger--open" : "uniwork-composer__mode-trigger"\}/.test(uniworkComposerSource) &&
      /import \{ AnchoredPopover \} from "\.\/AnchoredPopover";/.test(uniworkComposerSource) &&
      /className="modelsw__menu modelsw__menu--portal uniwork-controls-menu"/.test(uniworkComposerSource) &&
      /className="modelsw__menu modelsw__menu--portal uniwork-status-menu"/.test(uniworkComposerSource) &&
      !/t\("uniwork\.accessPanel\.title"\)/.test(uniworkComposerSource) &&
      !/uniwork-controls-menu__title/.test(uniworkComposerSource) &&
      !/uniwork\.accessPanel\.current/.test(uniworkComposerSource) &&
      /role="option"/.test(uniworkComposerSource) &&
      /modelsw__item modelsw__item--current uniwork-controls-menu__option/.test(uniworkComposerSource) &&
      !/aria-label=\{t\("uniwork\.status\.details"\)\}[\s\S]*?<span className=\{running \? "uniwork-composer__dot uniwork-composer__dot--busy" : "uniwork-composer__dot"\} \/>[\s\S]*?<ChevronUp size=\{12\} \/>/.test(uniworkComposerSource) &&
      !/uniwork-composer-menu/.test(uniworkComposerSource) &&
      !/menuitemradio/.test(uniworkComposerSource) &&
      !/uniwork-status-menu__section--controls/.test(uniworkComposerSource) &&
      !/\bchooseMode\b/.test(uniworkComposerSource) &&
      !/\bchooseTokenMode\b/.test(uniworkComposerSource) &&
      /\.uniwork-controls-menu\s*\{[^}]*width:\s*min\(360px, calc\(100vw - 16px\)\);/s.test(cssSource) &&
      /\.uniwork-status-menu\s*\{[^}]*width:\s*min\(360px, calc\(100vw - 16px\)\);/s.test(cssSource) &&
      /\.modelsw__item\.uniwork-controls-menu__option\s*\{[^}]*min-height:\s*46px;/s.test(cssSource) &&
      /\.modelsw__item\.uniwork-status-menu__row\s*\{[^}]*min-height:\s*26px;/s.test(cssSource),
    "Uniwork controls and status reuse the compact model switcher popover while status stays read-only",
  );
  ok(
    /"uniwork\.accessPanel\.askTitle": "请求批准"/.test(zhLocaleSource) &&
      /"uniwork\.accessPanel\.autoTitle": "替我审批"/.test(zhLocaleSource) &&
      /"uniwork\.accessPanel\.yoloTitle": "完全访问限制"/.test(zhLocaleSource),
    "Uniwork tool approval labels use clear action-oriented Chinese copy",
  );
  ok(
    /\.uniwork-sidebar\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/s.test(cssSource) &&
      /\.uniwork-sidebar--project-tree \.sidebar__section--projects\s*\{[^}]*overflow-x:\s*hidden;/s.test(cssSource) &&
      /\.app--uniwork \.project-tree\s*\{[^}]*min-width:\s*0;[^}]*overflow-x:\s*hidden;/s.test(cssSource),
    "Uniwork sidebar only scrolls vertically and clips wide project tree content",
  );
  ok(!document.querySelector(".uniwork-block"), "Uniwork home does not start inside a mock document-review task");

  await act(async () => {
    const codeTab = document.querySelectorAll(".uniwork-activity-switch__item")[0] as HTMLButtonElement | undefined;
    if (!codeTab) throw new Error("missing Code activity tab");
    codeTab.click();
    await flushTimers();
  });
  ok(switchCalls.includes("code"), "top-level activity switch delegates Code selection to the host layout");

  await act(async () => {
    root.unmount();
  });
  dom.window.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
