import { createContext, memo, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Item, LiveStream } from "../lib/useController";
import type { CheckpointMeta } from "../lib/types";
import { useT, type DictKey, type Translator } from "../lib/i18n";
import { AssistantMessage, TurnActions, UserMessage } from "./Message";
import { ProcessCompactIcon, ProcessPhaseIcon } from "./ProcessCard";
import { ToolCard } from "./ToolCard";
import { ArrowDown, ChevronRight, FileSpreadsheet, FileCheck2, ListChecks } from "lucide-react";
import { ReadOnlyBatch } from "./ReadOnlyBatch";
import { ToolGroup, isCreationGroupableTool, toolGroupKind, type ToolGroupKind } from "./ToolGroup";
import { getDisplayMode, onDisplayModeChange, type DisplayMode } from "../lib/displayMode";
import { isReadOnlyTool } from "../lib/useController";
import { useGSAPCollapse } from "../lib/useGSAPCollapse";
import { useEntranceAnimation } from "../lib/useEntranceAnimation";
import { useScrollManager } from "../lib/useScrollManager";
import { buildTurnGroups, compactQuestionText, questionAnchorId, scrollVersion, warmUserPreview, type QuestionAnchor, type TurnGroup } from "../lib/transcriptGrouping";

type ToolItem = Extract<Item, { kind: "tool" }>;
type AssistantItem = Extract<Item, { kind: "assistant" }>;
type OpenTurnAction = { turn: number; menu: "summary" | "rewind" };

const QUESTION_NAV_MIN_COUNT = 2;
const LiveStreamContext = createContext<LiveStream | undefined>(undefined);

const LiveAssistantMessage = memo(function LiveAssistantMessage({
  item,
  defaultExpanded = false,
  expandWhileStreaming = true,
  truncateStreamingReasoning = false,
  creationMode = false,
}: {
  item: AssistantItem;
  defaultExpanded?: boolean;
  expandWhileStreaming?: boolean;
  truncateStreamingReasoning?: boolean;
  creationMode?: boolean;
}) {
  const live = useContext(LiveStreamContext);
  const shown = useMemo(
    () =>
      live && live.id === item.id
        ? { ...item, text: live.text, reasoning: live.reasoning, streaming: true, reasoningComplete: live.reasoningComplete }
        : item,
    [item, live?.id, live?.text, live?.reasoning, live?.reasoningComplete],
  );
  return (
    <AssistantMessage
      item={shown}
      defaultExpanded={defaultExpanded}
      expandWhileStreaming={expandWhileStreaming}
      truncateStreamingReasoning={truncateStreamingReasoning}
      creationMode={creationMode}
    />
  );
});

// ── Layer budgets ─────────────────────────────────────────────────────────────
// Hot zone: the most recent N user turns are always fully rendered. All data
// stays in memory (items[]), so expanding a warm turn is instant — no API call.
// Cold zone: a "load more" button paginates the warm zone in batches.
//
//   items[0]  ─┐
//   ...        │ Cold zone  ───  paginated, shown on "load more"
//              ├────────────  warmTurnStart
//   ...        │ Warm zone  ───  collapsible summary cards (individual expand)
//              ├────────────  hotStartIdx
//   items[N]  ─┤ Hot zone   ───  fully rendered
//   ...        │
//   items[end] ┘

const HOT_TURNS = 30;
const WARM_PAGE_SIZE = 20; // cold-zone pagination batch

// ── Helpers ───────────────────────────────────────────────────────────────────

// UniworkTranscript starts as a fork of the Code Transcript so Uniwork can evolve
// its message structure independently without changing Code mode behavior.

type UniworkMockScenario = {
  topicLabel: DictKey;
  user: DictKey;
  toolName: string;
  toolArgs: Record<string, string>;
  toolSummary: DictKey;
  toolOutput: DictKey;
  outcome: DictKey;
  actions: DictKey;
};

const DEFAULT_UNIWORK_MOCK_TOPIC = "uniwork_topic_monthly_report";

const UNIWORK_MOCK_SCENARIOS: Record<string, UniworkMockScenario> = {
  uniwork_topic_monthly_report: {
    topicLabel: "mock.uniworkTopicMonthlyReport",
    user: "uniwork.mockTranscript.monthly.user",
    toolName: "univer inspect",
    toolArgs: { file: "~/office/finance-suite/june-ops.univer", view: "overview" },
    toolSummary: "uniwork.mockTranscript.monthly.toolSummary",
    toolOutput: "uniwork.mockTranscript.monthly.toolOutput",
    outcome: "uniwork.mockTranscript.monthly.outcome",
    actions: "uniwork.mockTranscript.monthly.actions",
  },
  uniwork_topic_budget_variance: {
    topicLabel: "mock.uniworkTopicBudgetVariance",
    user: "uniwork.mockTranscript.budget.user",
    toolName: "univer comments",
    toolArgs: { file: "~/office/finance-suite/budget-variance.univer", region: "variance-comments" },
    toolSummary: "uniwork.mockTranscript.budget.toolSummary",
    toolOutput: "uniwork.mockTranscript.budget.toolOutput",
    outcome: "uniwork.mockTranscript.budget.outcome",
    actions: "uniwork.mockTranscript.budget.actions",
  },
  uniwork_topic_sales_forecast: {
    topicLabel: "mock.uniworkTopicSalesForecast",
    user: "uniwork.mockTranscript.forecast.user",
    toolName: "univer formulas",
    toolArgs: { file: "~/office/finance-suite/sales-forecast.univer", checks: "drivers,links,confidence" },
    toolSummary: "uniwork.mockTranscript.forecast.toolSummary",
    toolOutput: "uniwork.mockTranscript.forecast.toolOutput",
    outcome: "uniwork.mockTranscript.forecast.outcome",
    actions: "uniwork.mockTranscript.forecast.actions",
  },
  uniwork_topic_contract_register: {
    topicLabel: "mock.uniworkTopicContractRegister",
    user: "uniwork.mockTranscript.contract.user",
    toolName: "univer normalize",
    toolArgs: { file: "~/office/operations/contracts.univer", table: "contract_register" },
    toolSummary: "uniwork.mockTranscript.contract.toolSummary",
    toolOutput: "uniwork.mockTranscript.contract.toolOutput",
    outcome: "uniwork.mockTranscript.contract.outcome",
    actions: "uniwork.mockTranscript.contract.actions",
  },
  uniwork_topic_okr_weekly: {
    topicLabel: "mock.uniworkTopicOkrWeekly",
    user: "uniwork.mockTranscript.okr.user",
    toolName: "office pack",
    toolArgs: { source: "~/office/operations/okr-weekly", output: "weekly-brief" },
    toolSummary: "uniwork.mockTranscript.okr.toolSummary",
    toolOutput: "uniwork.mockTranscript.okr.toolOutput",
    outcome: "uniwork.mockTranscript.okr.outcome",
    actions: "uniwork.mockTranscript.okr.actions",
  },
  uniwork_topic_review_packets: {
    topicLabel: "mock.uniworkTopicReviewPackets",
    user: "uniwork.mockTranscript.review.user",
    toolName: "document binder",
    toolArgs: { folder: "~/office/operations/review-packet", order: "agenda,workbook,appendix" },
    toolSummary: "uniwork.mockTranscript.review.toolSummary",
    toolOutput: "uniwork.mockTranscript.review.toolOutput",
    outcome: "uniwork.mockTranscript.review.outcome",
    actions: "uniwork.mockTranscript.review.actions",
  },
  uniwork_topic_cli_import: {
    topicLabel: "mock.uniworkTopicCliImport",
    user: "uniwork.mockTranscript.import.user",
    toolName: "univer import --dry-run",
    toolArgs: { template: "~/tools/univer-cli/templates/batch-import.xlsx", profile: "office-suite" },
    toolSummary: "uniwork.mockTranscript.import.toolSummary",
    toolOutput: "uniwork.mockTranscript.import.toolOutput",
    outcome: "uniwork.mockTranscript.import.outcome",
    actions: "uniwork.mockTranscript.import.actions",
  },
  uniwork_topic_cli_merge_preview: {
    topicLabel: "mock.uniworkTopicCliMergePreview",
    user: "uniwork.mockTranscript.merge.user",
    toolName: "univer merge --preview",
    toolArgs: { base: "forecast-v3.univer", incoming: "forecast-salesops.univer" },
    toolSummary: "uniwork.mockTranscript.merge.toolSummary",
    toolOutput: "uniwork.mockTranscript.merge.toolOutput",
    outcome: "uniwork.mockTranscript.merge.outcome",
    actions: "uniwork.mockTranscript.merge.actions",
  },
  uniwork_topic_cli_sidecar: {
    topicLabel: "mock.uniworkTopicCliSidecar",
    user: "uniwork.mockTranscript.sidecar.user",
    toolName: "univer preview doctor",
    toolArgs: { workspace: "~/tools/univer-cli", port: "auto" },
    toolSummary: "uniwork.mockTranscript.sidecar.toolSummary",
    toolOutput: "uniwork.mockTranscript.sidecar.toolOutput",
    outcome: "uniwork.mockTranscript.sidecar.outcome",
    actions: "uniwork.mockTranscript.sidecar.actions",
  },
  uniwork_global_office_automation: {
    topicLabel: "mock.uniworkTopicOfficeAutomation",
    user: "uniwork.mockTranscript.automation.user",
    toolName: "template audit",
    toolArgs: { folder: "~/office/templates", scope: "approval-ready" },
    toolSummary: "uniwork.mockTranscript.automation.toolSummary",
    toolOutput: "uniwork.mockTranscript.automation.toolOutput",
    outcome: "uniwork.mockTranscript.automation.outcome",
    actions: "uniwork.mockTranscript.automation.actions",
  },
  uniwork_global_cli_recipes: {
    topicLabel: "mock.uniworkTopicCliRecipes",
    user: "uniwork.mockTranscript.recipes.user",
    toolName: "recipe index",
    toolArgs: { folder: "~/tools/univer-cli/recipes", audience: "office-agents" },
    toolSummary: "uniwork.mockTranscript.recipes.toolSummary",
    toolOutput: "uniwork.mockTranscript.recipes.toolOutput",
    outcome: "uniwork.mockTranscript.recipes.outcome",
    actions: "uniwork.mockTranscript.recipes.actions",
  },
};

export function hasUniworkMockScenario(topicId?: string): boolean {
  return Boolean(topicId && UNIWORK_MOCK_SCENARIOS[topicId]);
}

function uniworkMockScenario(topicId?: string): UniworkMockScenario {
  return UNIWORK_MOCK_SCENARIOS[topicId || ""] ?? UNIWORK_MOCK_SCENARIOS[DEFAULT_UNIWORK_MOCK_TOPIC];
}

function buildUniworkMockTranscript(t: Translator, topicId?: string): Item[] {
  const scenario = uniworkMockScenario(topicId);
  const topicKey = topicId || DEFAULT_UNIWORK_MOCK_TOPIC;
  const task = t(scenario.topicLabel);
  const toolOutput = t(scenario.toolOutput);
  const outcome = t(scenario.outcome);
  const actions = t(scenario.actions);
  const now = Date.now();
  const user = (id: string, text: string, minutesAgo: number): Item => ({
    kind: "user",
    id,
    text,
    createdAt: now - minutesAgo * 60_000,
  });
  const assistant = (id: string, text: string): Item => ({
    kind: "assistant",
    id,
    text,
    reasoning: "",
    streaming: false,
  });
  const tool = (id: string, name: string, args: string, output: string, summary: string, readOnly: boolean, durationMs: number): Item => ({
    kind: "tool",
    id,
    name,
    args,
    output,
    summary,
    readOnly,
    status: "done",
    durationMs,
  });

  return [
    user(`uniwork-mock-${topicKey}-u1`, t(scenario.user), 52),
    assistant(`uniwork-mock-${topicKey}-a1`, t("uniwork.mockTranscript.commonPlan", { task, tool: scenario.toolName })),
    tool(
      `uniwork-mock-${topicKey}-t1`,
      scenario.toolName,
      JSON.stringify(scenario.toolArgs),
      toolOutput,
      t(scenario.toolSummary),
      true,
      420,
    ),
    assistant(`uniwork-mock-${topicKey}-a2`, t("uniwork.mockTranscript.commonOutcome", { outcome })),
    user(`uniwork-mock-${topicKey}-u2`, t("uniwork.mockTranscript.commonStructureRequest", { task }), 47),
    assistant(`uniwork-mock-${topicKey}-a3`, t("uniwork.mockTranscript.commonStructureAnswer", { task, toolOutput })),
    user(`uniwork-mock-${topicKey}-u3`, t("uniwork.mockTranscript.commonPriorityRequest", { task }), 42),
    tool(
      `uniwork-mock-${topicKey}-t2`,
      "priority map",
      JSON.stringify({ task, sourceTool: scenario.toolName }),
      t("uniwork.mockTranscript.commonPriorityToolOutput", { task, outcome }),
      t("uniwork.mockTranscript.commonPriorityToolSummary"),
      true,
      360,
    ),
    assistant(`uniwork-mock-${topicKey}-a4`, t("uniwork.mockTranscript.commonPriorityAnswer", { task, outcome })),
    user(`uniwork-mock-${topicKey}-u4`, t("uniwork.mockTranscript.commonRiskRequest", { task }), 37),
    assistant(`uniwork-mock-${topicKey}-a5`, t("uniwork.mockTranscript.commonRiskAnswer", { task, outcome, actions })),
    user(`uniwork-mock-${topicKey}-u5`, t("uniwork.mockTranscript.commonAudienceRequest", { task }), 32),
    assistant(`uniwork-mock-${topicKey}-a6`, t("uniwork.mockTranscript.commonAudienceAnswer", { task, actions })),
    user(`uniwork-mock-${topicKey}-u6`, t("uniwork.mockTranscript.commonOwnerRequest", { task }), 27),
    tool(
      `uniwork-mock-${topicKey}-t3`,
      "owner matrix",
      JSON.stringify({ task, format: "owner,decision,deadline" }),
      t("uniwork.mockTranscript.commonOwnerToolOutput", { task, actions }),
      t("uniwork.mockTranscript.commonOwnerToolSummary"),
      false,
      390,
    ),
    assistant(`uniwork-mock-${topicKey}-a7`, t("uniwork.mockTranscript.commonOwnerAnswer", { task, actions })),
    user(`uniwork-mock-${topicKey}-u7`, t("uniwork.mockTranscript.commonDraftRequest", { task }), 22),
    assistant(`uniwork-mock-${topicKey}-a8`, t("uniwork.mockTranscript.commonDraftAnswer", { task, outcome, actions })),
    user(`uniwork-mock-${topicKey}-u8`, t("uniwork.mockTranscript.commonValidationRequest", { task }), 17),
    tool(
      `uniwork-mock-${topicKey}-t4`,
      "publish check",
      JSON.stringify({ task, checks: "inputs,risks,handoff" }),
      t("uniwork.mockTranscript.commonValidationToolOutput", { task, toolOutput }),
      t("uniwork.mockTranscript.commonValidationToolSummary"),
      true,
      440,
    ),
    assistant(`uniwork-mock-${topicKey}-a9`, t("uniwork.mockTranscript.commonValidationAnswer", { task, outcome })),
    user(`uniwork-mock-${topicKey}-u9`, t("uniwork.mockTranscript.commonHandoffRequest", { task }), 12),
    assistant(`uniwork-mock-${topicKey}-a10`, t("uniwork.mockTranscript.commonHandoffAnswer", { task, actions })),
    user(`uniwork-mock-${topicKey}-u10`, t("uniwork.mockTranscript.commonFollowUp"), 7),
    tool(
      `uniwork-mock-${topicKey}-t5`,
      "prepare brief",
      JSON.stringify({ task, format: "next-actions" }),
      actions,
      t("uniwork.mockTranscript.commonBriefSummary"),
      false,
      510,
    ),
    assistant(`uniwork-mock-${topicKey}-a11`, t("uniwork.mockTranscript.commonFinal", { actions })),
    user(`uniwork-mock-${topicKey}-u11`, t("uniwork.mockTranscript.commonCloseRequest", { task }), 3),
    assistant(`uniwork-mock-${topicKey}-a12`, t("uniwork.mockTranscript.commonCloseAnswer", { task, actions })),
  ];
}

function UniworkWelcome({ onPrompt }: { onPrompt: (text: string) => void }) {
  const t = useT();
  const prompts = [
    { icon: <FileSpreadsheet size={15} aria-hidden="true" />, text: t("uniwork.welcome.promptWorkbook") },
    { icon: <FileCheck2 size={15} aria-hidden="true" />, text: t("uniwork.welcome.promptVerify") },
    { icon: <ListChecks size={15} aria-hidden="true" />, text: t("uniwork.welcome.promptChecklist") },
  ];
  return (
    <section className="uniwork-welcome" aria-label={t("uniwork.welcome.label")} data-entrance="uniwork-welcome">
      <div className="uniwork-welcome__copy">
        <div className="uniwork-welcome__eyebrow">
          <span>{t("uniwork.welcome.kicker")}</span>
        </div>
        <h2 className="uniwork-welcome__title">{t("uniwork.welcome.title")}</h2>
        <p className="uniwork-welcome__body">{t("uniwork.welcome.body")}</p>
      </div>
      <div className="uniwork-welcome__prompts">
        {prompts.map((prompt) => (
          <button key={prompt.text} type="button" className="uniwork-welcome__prompt" onClick={() => onPrompt(prompt.text)}>
            {prompt.icon}
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function UniworkTranscript({
  items: sourceItems,
  live,
  tabId,
  footerHeight = 0,
  onPrompt,
  onEditPrompt,
  onRewind,
  checkpoints = [],
  actionPending = false,
  rewindDisabled = false,
  running = false,
  questionNavigator = true,
  creationMode = false,
  actionHoverMenus = false,
  rewindSignal = 0,
  revealSignal = 0,
  hydrating = false,
  mockTopicId,
}: {
  items: Item[];
  live?: LiveStream;
  tabId?: string;
  footerHeight?: number;
  onPrompt: (text: string) => void;
  onEditPrompt?: (turn: number, displayText: string, submitText?: string) => boolean | void | Promise<boolean | void>;
  onRewind?: (turn: number, scope: string) => void;
  checkpoints?: CheckpointMeta[];
  actionPending?: boolean;
  rewindDisabled?: boolean;
  running?: boolean;
  questionNavigator?: boolean;
  creationMode?: boolean;
  actionHoverMenus?: boolean;
  rewindSignal?: number;
  revealSignal?: number;
  hydrating?: boolean;
  mockTopicId?: string;
}) {
  const t = useT();
  const showMockTranscript = sourceItems.length === 0 && !hydrating && !running && hasUniworkMockScenario(mockTopicId);
  const items = useMemo(() => showMockTranscript ? buildUniworkMockTranscript(t, mockTopicId) : sourceItems, [mockTopicId, showMockTranscript, sourceItems, t]);
  const liveStream = showMockTranscript ? undefined : live;
  const {
    scrollRef,
    stick,
    onScroll,
    isAtBottom,
    smoothScrollTo,
    scrollToBottomAfterLayout,
    trackQuestions,
    repinIfWasPinned,
    resizeFrame,
    lastClientHeight,
    lastFooterHeight,
  } = useScrollManager();
  const autoScrollFrame = useRef<number | null>(null);
  const pendingRevealBottomScroll = useRef(false);
  const sessionKey = useMemo(() => `${items[0]?.id ?? ""}|${items[items.length - 1]?.id ?? ""}`, [items]);
  const entranceRef = useEntranceAnimation<HTMLDivElement>(sessionKey, items.length);

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => getDisplayMode());
  useEffect(() => onDisplayModeChange((mode) => setDisplayMode(mode)), []);

  const questions = useMemo<QuestionAnchor[]>(() => {
    const anchors: QuestionAnchor[] = [];
    let turn = 0;
    for (const it of items) {
      if (it.kind !== "user") continue;
      anchors.push({ id: it.id, text: compactQuestionText(it.text), turn });
      turn += 1;
    }
    return anchors;
  }, [items]);
  const showQuestionNav = questionNavigator && questions.length >= QUESTION_NAV_MIN_COUNT;
  const [activeQuestionTurn, setActiveQuestionTurn] = useState<number | null>(null);

  const updateActiveQuestionFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !showQuestionNav) {
      setActiveQuestionTurn(null);
      return;
    }

    const threshold = el.scrollTop + 32;
    let nextTurn: number | null = null;
    const anchors = el.querySelectorAll<HTMLElement>("[data-question-anchor][data-turn]");
    for (const anchor of anchors) {
      const turn = Number(anchor.dataset.turn);
      if (!Number.isFinite(turn)) continue;
      const top = anchor.offsetTop - el.offsetTop;
      if (top <= threshold) {
        nextTurn = turn;
        continue;
      }
      if (nextTurn === null) nextTurn = turn;
      break;
    }
    if (nextTurn === null) nextTurn = questions[questions.length - 1]?.turn ?? null;
    setActiveQuestionTurn((current) => (current === nextTurn ? current : nextTurn));
  }, [questions, scrollRef, showQuestionNav]);

  const handleTranscriptScroll = useCallback(() => {
    onScroll();
    updateActiveQuestionFromScroll();
  }, [onScroll, updateActiveQuestionFromScroll]);

  // Track question count and auto-scroll on new messages.
  useEffect(() => { trackQuestions(questions.length); }, [questions.length, trackQuestions]);

  useEffect(() => {
    if (!showQuestionNav) {
      setActiveQuestionTurn(null);
      return;
    }
    const frame = requestAnimationFrame(updateActiveQuestionFromScroll);
    return () => cancelAnimationFrame(frame);
  }, [showQuestionNav, updateActiveQuestionFromScroll, tabId]);

  // Reset the auto-scroll pin when switching tabs so the new session always
  // starts at the bottom. Without this, stick.current from the previous tab
  // persists across React re-renders (Transcript is not keyed by tabId) and
  // disables auto-scroll when the user had scrolled up in the old tab (#4584).
  useEffect(() => {
    stick.current = true;
    pendingRevealBottomScroll.current = true;
  }, [tabId, revealSignal]);

  useEffect(() => {
    if (!pendingRevealBottomScroll.current || items.length === 0) return;
    pendingRevealBottomScroll.current = false;
    if (showMockTranscript) {
      const frame = requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = 0;
      });
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => {
      scrollToBottomAfterLayout(5);
    });
    return () => cancelAnimationFrame(frame);
  }, [items.length, revealSignal, scrollRef, scrollToBottomAfterLayout, showMockTranscript, tabId]);

  // Auto-scroll to bottom during streaming. Coalesce fast token/reasoning
  // updates into one layout read/write per animation frame.
  const contentVersion = useMemo(() => scrollVersion(items), [items]);
  useEffect(() => {
    if (items.length === 0) return;
    if (showMockTranscript) return;
    if (!stick.current) return;
    if (autoScrollFrame.current !== null) return;
    autoScrollFrame.current = requestAnimationFrame(() => {
      autoScrollFrame.current = null;
      if (!stick.current) return;
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [contentVersion, liveStream?.text?.length ?? 0, liveStream?.reasoning?.length ?? 0, showMockTranscript]);
  useEffect(() => {
    return () => {
      if (autoScrollFrame.current !== null) {
        cancelAnimationFrame(autoScrollFrame.current);
        autoScrollFrame.current = null;
      }
    };
  }, []);

  // ResizeObserver for container height changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    lastClientHeight.current = el.clientHeight;
    const observer = new ResizeObserver(() => {
      const previous = lastClientHeight.current ?? el.clientHeight;
      lastClientHeight.current = el.clientHeight;
      if (items.length === 0) return;
      repinIfWasPinned(el.clientHeight - previous);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (resizeFrame.current !== null) {
        cancelAnimationFrame(resizeFrame.current);
        resizeFrame.current = null;
      }
    };
  }, [items.length]);

  // Footer height changes → smooth scroll repin with GSAP.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const previous = lastFooterHeight.current ?? footerHeight;
    lastFooterHeight.current = footerHeight;
    if (items.length === 0) return;
    repinIfWasPinned(previous - footerHeight);
  }, [footerHeight, items.length]);

  // After a non-fork rewind, scroll to the last user message (the
  // rewound-to point) so the user knows where they are.
  useEffect(() => {
    if (rewindSignal <= 0 || questions.length === 0) return;
    const lastQ = questions[questions.length - 1];
    const el = document.getElementById(questionAnchorId(lastQ.id));
    if (!el || !scrollRef.current) return;
    stick.current = false;
    scrollRef.current.scrollTop = el.offsetTop - scrollRef.current.offsetTop - 12;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewindSignal]);

  // Sub-agent calls carry a parentId; collect them under their parent `task`
  // call so the parent card can render them nested, and skip them at top level.
  const subcallsByParent = useMemo(() => {
    const m = new Map<string, ToolItem[]>();
    for (const it of items) {
      if (it.kind === "tool" && it.parentId) {
        const arr = m.get(it.parentId) ?? [];
        arr.push(it);
        m.set(it.parentId, arr);
      }
    }
    return m;
  }, [items]);

  // ── Layer state ────────────────────────────────────────────────────────────
  const [expandedWarmTurns, setExpandedWarmTurns] = useState<Set<number>>(new Set());
  const [coldPage, setColdPage] = useState(0);

  // Compute turn groups from the structural item list. Streaming text updates
  // keep the same items[] reference, so this stays out of the token hot path.
  const turnGroups = useMemo(() => buildTurnGroups(items), [items]);

  // hotStartIdx: first index of the hot zone in items[].
  const hotStartIdx = useMemo(() => {
    let needed = HOT_TURNS;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].kind === "user") {
        needed--;
        if (needed <= 0) return i;
      }
    }
    return 0;
  }, [items]);

  // How many turns are in the cold zone (not yet shown).
  const warmTurnCount = turnGroups.length - Math.min(turnGroups.length, HOT_TURNS);
  const shownWarmStart = Math.max(0, warmTurnCount - coldPage * WARM_PAGE_SIZE);
  const coldTurnCount = shownWarmStart;

  // ── The turn action menu ──────────────────────────────────────────────────
  const [openAction, setOpenAction] = useState<OpenTurnAction | null>(null);
  useEffect(() => {
    if (openAction === null) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el || !el.closest(".turn-actions")) setOpenAction(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openAction]);

  const userTurn = useMemo(() => new Map(questions.map((question) => [question.id, question.turn])), [questions]);
  const checkpointsByTurn = useMemo(() => new Map(checkpoints.map((checkpoint) => [checkpoint.turn, checkpoint])), [checkpoints]);

  // ── JumpBar integration ───────────────────────────────────────────────────
  const jumpToQuestion = (question: QuestionAnchor) => {
    const node = document.getElementById(questionAnchorId(question.id));
    if (!node) return;
    stick.current = false;
    smoothScrollTo(node, 12);
  };

  const handleJumpToQuestion = useCallback((question: QuestionAnchor) => {
    setActiveQuestionTurn(question.turn);
    // Auto-expand the warm turn when jumping to an old question.
    const warmTurnStart = turnGroups.length - HOT_TURNS;
    if (question.turn < warmTurnStart) {
      setExpandedWarmTurns((prev) => {
        if (prev.has(question.turn)) return prev;
        return new Set([...prev, question.turn]);
      });
    }
    jumpToQuestion(question);
  }, [turnGroups.length]);

  // ── Hot zone: fully rendered from hotStartIdx to end ─────────────────────
  // Memoized separately from the assembly so streaming tokens don't rebuild
  // the warm/cold zone JSX trees. Uses LiveStreamContext for streaming data
  // (added by upstream PR #3423) instead of per-call renderSegments.
  const empty = items.length === 0;
  const showWelcome = empty && !hydrating;

  useLayoutEffect(() => {
    if (!empty && !showMockTranscript) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    stick.current = false;
    const frame = requestAnimationFrame(() => {
      el.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [empty, scrollRef, showMockTranscript, stick, tabId]);

  // In compact mode, break each turn into step groups.
  // A step = one assistant + its tool results, from one assistant to the next.
  // Each completed non-final step is folded into "Processed".
  const stepGroups = useMemo(() => {
    if (displayMode === "standard") return null;
    const groups: { items: Item[]; isFinal: boolean; isComplete: boolean }[] = [];
    let current: Item[] = [];

    for (let i = hotStartIdx; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "user") {
        if (current.length > 0) {
          const first = current[0];
          const isFinal = first.kind === "assistant" && !first.streaming && first.text.trim() !== "";
          groups.push({ items: current, isFinal, isComplete: true });
          current = [];
        }
        groups.push({ items: [it], isFinal: false, isComplete: true });
        continue;
      }
      if (it.kind === "assistant") {
        if (current.length > 0) {
          groups.push({ items: current, isFinal: false, isComplete: true });
          current = [];
        }
        current.push(it);
      } else {
        current.push(it);
      }
    }
    if (current.length > 0) {
      const first = current[0];
      const isFinal = first.kind === "assistant" && !first.streaming && first.text.trim() !== "";
      groups.push({ items: current, isFinal, isComplete: false });
    }
    return groups;
  }, [displayMode, hotStartIdx, items]);

  const hotZoneNodes = useMemo<ReactNode[]>(() => {
    const out: ReactNode[] = [];
    let actionText = "";
    let actionReady = false;
    let activeTurn: number | undefined;
    const pushTurnActions = () => {
      if (activeTurn == null || !actionReady || actionText.trim() === "") return;
      const turn = activeTurn;
      const openMenu = openAction && openAction.turn === turn ? openAction.menu : null;
      out.push(
        <TurnActions
          key={`ta-${turn}`}
          text={actionText}
          turn={turn}
          openMenu={openMenu}
          onOpenMenu={(menu) => setOpenAction(menu ? { turn, menu } : null)}
          checkpoint={checkpointsByTurn.get(turn)}
          actionPending={actionPending}
          rewindDisabled={rewindDisabled}
          hoverMenus={actionHoverMenus}
          onRewind={(targetTurn, scope) => {
            onRewind?.(targetTurn, scope);
            setOpenAction(null);
          }}
        />,
      );
      actionText = "";
      actionReady = false;
    };

    // Compact mode: step-based rendering
    // Standard mode: flat rendering (no step groups)
    if (stepGroups) {
      // Collect consecutive completed non-final steps into batches
      let collapseBatch: Item[] = [];
      let collapseBatchStart: string | null = null;
      const flushCollapseBatch = () => {
        if (collapseBatch.length === 0) return;
        const dur = collapseBatch.reduce((ms, it) => ms + (it.kind === "tool" ? it.durationMs ?? 0 : 0), 0);
        out.push(
          <TurnCollapse
            key={`step-batch-${collapseBatchStart}`}
            items={collapseBatch}
            durationMs={dur}
            mode={displayMode}
            subcalls={subcallsByParent}
            tabId={tabId}
            creationMode={creationMode}
          />,
        );
        collapseBatch = [];
        collapseBatchStart = null;
      };

      for (const group of stepGroups) {
        const first = group.items[0];

        if (first.kind === "user") {
          flushCollapseBatch();
          pushTurnActions();
          const tn = userTurn.get(first.id);
          const checkpoint = tn == null ? undefined : checkpointsByTurn.get(tn);
          activeTurn = tn;
          out.push(
            <UserMessage
              key={first.id}
              id={first.id}
              text={first.text}
              submitText={first.submitText}
              failed={first.failed}
              createdAt={first.createdAt}
              turn={tn}
              anchorId={questionAnchorId(first.id)}
              onEdit={onEditPrompt}
              editDisabled={rewindDisabled || !checkpoint?.canConversation}
            />,
          );
          continue;
        }

        // Completed non-final step → batch it
        if (group.isComplete && !group.isFinal) {
          if (!collapseBatchStart) collapseBatchStart = first.id;
          collapseBatch.push(...group.items);
          continue;
        }

        // Final answer or active step → flush any pending batch then render
        flushCollapseBatch();
        const nonAssistantItems = group.items.filter(
          (it) => it.kind !== "assistant" || (it.streaming && !it.text.trim())
        );
        const hasRunning = nonAssistantItems.some((it) => it.kind === "tool" && it.status === "running");
        if (nonAssistantItems.length > 0 && !hasRunning) {
          const dur = nonAssistantItems.reduce((ms, it) => ms + (it.kind === "tool" ? ((it as ToolItem).durationMs ?? 0) : 0), 0);
          out.push(
            <TurnCollapse
              key={`step-${first.id}`}
              items={nonAssistantItems}
              durationMs={dur}
              mode={displayMode}
              subcalls={subcallsByParent}
              tabId={tabId}
              creationMode={creationMode}
            />,
          );
        } else if (nonAssistantItems.length > 0) {
          for (const it of nonAssistantItems) {
            if (it.kind === "tool") {
              if (it.parentId) continue;
              if (it.name === "todo_write" || it.name === "exit_plan_mode") continue;
              out.push(<ToolCard key={it.id} item={it as ToolItem} subcalls={subcallsByParent.get(it.id)} tabId={tabId} />);
            }
            if (it.kind === "phase") out.push(<PhaseCard key={it.id} text={it.text} />);
          }
        }
        // Render the final assistant message (if any) directly
        for (const it of group.items) {
          if (it.kind !== "assistant") continue;
          out.push(
            <LiveAssistantMessage
              key={it.id}
              item={it as AssistantItem}
              defaultExpanded={false}
              expandWhileStreaming={false}
              truncateStreamingReasoning={true}
              creationMode={creationMode}
            />,
          );
          if (!it.streaming && it.text.trim() !== "") {
            actionText = it.text;
            actionReady = true;
          }
        }
      }
      flushCollapseBatch();
      if (!running) pushTurnActions();
    } else {
      // Standard mode: flat rendering
      const roBatch: ToolItem[] = [];
      const toolBatch: ToolItem[] = [];
      let toolBatchKind: ToolGroupKind | null = null;
      const flushRO = () => {
        if (roBatch.length === 0) return;
        out.push(<ReadOnlyBatch key={`rob-${roBatch[0].id}`} items={[...roBatch]} subcalls={subcallsByParent} tabId={tabId} />);
        roBatch.length = 0;
      };
      const flushToolBatch = () => {
        if (!toolBatchKind || toolBatch.length === 0) return;
        out.push(<ToolGroup key={`tg-${toolBatch[0].id}`} kind={toolBatchKind} items={[...toolBatch]} subcalls={subcallsByParent} tabId={tabId} />);
        toolBatch.length = 0;
        toolBatchKind = null;
      };
      for (let i = hotStartIdx; i < items.length; i++) {
        const it = items[i];
        if (creationMode && it.kind === "tool" && isCreationGroupableTool(it as ToolItem)) {
          const kind = toolGroupKind(it as ToolItem);
          if (kind) {
            if (toolBatchKind && toolBatchKind !== kind) flushToolBatch();
            toolBatchKind = kind;
            toolBatch.push(it as ToolItem);
            continue;
          }
        }
        if (
          !creationMode &&
          it.kind === "tool" &&
          !it.parentId &&
          it.status !== "running" &&
          it.name !== "todo_write" &&
          it.name !== "exit_plan_mode" &&
          isReadOnlyTool(it.name)
        ) {
          roBatch.push(it as ToolItem);
          continue;
        }
        flushToolBatch();
        flushRO();
        switch (it.kind) {
          case "user": {
            pushTurnActions();
            const tn = userTurn.get(it.id);
            const checkpoint = tn == null ? undefined : checkpointsByTurn.get(tn);
            activeTurn = tn;
            out.push(
              <UserMessage
                key={it.id}
                id={it.id}
                text={it.text}
                submitText={it.submitText}
                failed={it.failed}
                createdAt={it.createdAt}
                turn={tn}
                anchorId={questionAnchorId(it.id)}
                onEdit={onEditPrompt}
                editDisabled={rewindDisabled || !checkpoint?.canConversation}
              />,
            );
            break;
          }
          case "assistant":
            out.push(<LiveAssistantMessage key={it.id} item={it as AssistantItem} defaultExpanded={false} creationMode={creationMode} />);
            if (!it.streaming && it.text.trim() !== "") {
              actionText = it.text;
              actionReady = true;
            }
            break;
          case "tool":
            if (it.parentId) break;
            if (it.name === "todo_write") break;
            if (it.name === "exit_plan_mode") break;
            out.push(<ToolCard key={it.id} item={it} subcalls={subcallsByParent.get(it.id)} tabId={tabId} />);
            break;
          case "phase": out.push(<PhaseCard key={it.id} text={it.text} />); break;
          case "notice": out.push(<NoticeCard key={it.id} level={it.level} text={it.text} />); break;
          case "compaction": out.push(<CompactionCard key={it.id} item={it} />); break;
        }
      }
      flushToolBatch();
      flushRO();
      if (!running) pushTurnActions();
    }
    return out;
  }, [hotStartIdx, items, openAction, actionPending, rewindDisabled, running, onEditPrompt, onRewind, subcallsByParent, userTurn, checkpointsByTurn, displayMode, stepGroups, tabId, actionHoverMenus, creationMode]);

  // ── Assemble rendered output ──────────────────────────────────────────────
  // Warm/cold zone is a separate memo'd WarmZone component so streaming tokens
  // don't rebuild it. The hot zone uses LiveAssistantMessage (reads live from
  // LiveStreamContext) so streaming updates are captured immediately.
  return (
    <div className="transcript-shell">
      <div
        className={`transcript${empty ? " transcript--empty" : ""}`}
        ref={scrollRef}
        onScroll={handleTranscriptScroll}
      >
        {showWelcome && <UniworkWelcome onPrompt={onPrompt} />}

        <LiveStreamContext.Provider value={liveStream}>
          {turnGroups.length > HOT_TURNS && (
            <WarmZone
              turnGroups={turnGroups}
              expandedWarmTurns={expandedWarmTurns}
              shownWarmStart={shownWarmStart}
              coldTurnCount={coldTurnCount}
              scrollRef={scrollRef}
              warmItems={items}
              warmSubcalls={subcallsByParent}
              warmUserTurn={userTurn}
              warmCheckpoints={checkpointsByTurn}
              warmOpenAction={openAction}
              warmActionPending={actionPending}
              warmRewindDisabled={rewindDisabled}
              warmActionHoverMenus={actionHoverMenus}
              warmOnRewind={onRewind}
              warmSetOpenAction={setOpenAction}
              warmOnEdit={onEditPrompt}
              tabId={tabId}
              creationMode={creationMode}
              onToggleColdPage={() => setColdPage((p) => p + 1)}
              onToggleWarmTurn={(g, expand) => {
                setExpandedWarmTurns((prev) => {
                  const next = new Set(prev);
                  if (expand) next.add(g); else next.delete(g);
                  return next;
                });
              }}
            />
          )}
          <div ref={entranceRef}>
            {hotZoneNodes}
          </div>
        </LiveStreamContext.Provider>
      </div>

      {!empty && showQuestionNav && (
        <QuestionJumpBar questions={questions} activeTurn={activeQuestionTurn} onJump={handleJumpToQuestion} />
      )}

      {!empty && !isAtBottom && (
        <button
          type="button"
          className="transcript__jump-bottom"
          onClick={() => scrollToBottomAfterLayout(2)}
          aria-label={t("transcript.jumpToBottom")}
          title={t("transcript.jumpToBottom")}
        >
          <ArrowDown size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ── WarmZone sub-component (React.memo for streaming isolation) ────────────
// Receives structural props only; reads streaming state (items, live) via refs
// so it never invalidates on streaming token arrival.

const WarmZone = memo(function WarmZone({
  turnGroups,
  expandedWarmTurns,
  shownWarmStart,
  coldTurnCount,
  scrollRef,
  warmItems,
  warmSubcalls,
  warmUserTurn,
  warmCheckpoints,
  warmOpenAction,
  warmActionPending,
  warmRewindDisabled,
  warmActionHoverMenus,
  warmOnRewind,
  warmSetOpenAction,
  warmOnEdit,
  tabId,
  creationMode,
  onToggleColdPage,
  onToggleWarmTurn,
}: {
  turnGroups: TurnGroup[];
  expandedWarmTurns: ReadonlySet<number>;
  shownWarmStart: number;
  coldTurnCount: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  warmItems: readonly Item[];
  warmSubcalls: ReadonlyMap<string, ToolItem[]>;
  warmUserTurn: ReadonlyMap<string, number>;
  warmCheckpoints: ReadonlyMap<number, CheckpointMeta>;
  warmOpenAction: OpenTurnAction | null;
  warmActionPending: boolean;
  warmRewindDisabled: boolean;
  warmActionHoverMenus: boolean;
  warmOnRewind: ((turn: number, scope: string) => void) | undefined;
  warmSetOpenAction: (action: OpenTurnAction | null) => void;
  warmOnEdit?: (turn: number, displayText: string, submitText?: string) => boolean | void | Promise<boolean | void>;
  tabId?: string;
  creationMode?: boolean;
  onToggleColdPage: () => void;
  onToggleWarmTurn: (g: number, expand: boolean) => void;
}) {
  const t = useT();
  const out: React.ReactNode[] = [];

  // 1. Cold zone: paginated warm turns (show more button).
  if (coldTurnCount > 0) {
    out.push(
      <button
        key="cold-load-more"
        type="button"
        className="warm-collapse"
        onClick={onToggleColdPage}
      >
        {t("transcript.showEarlierHistory", { n: coldTurnCount })}
      </button>,
    );
  }

  // 2. Warm zone: collapsed/expanded warm turn cards.
  let warmStartTurn = 0;
  if (turnGroups.length > HOT_TURNS) {
    warmStartTurn = turnGroups.length - HOT_TURNS - shownWarmStart;
    for (let g = warmStartTurn; g < turnGroups.length - HOT_TURNS; g++) {
      const group = turnGroups[g];
      if (!group) continue;
      const expanded = expandedWarmTurns.has(g);

      if (expanded) {
        const userText = group.userItem.kind === "user" ? group.userItem.text : "";
        out.push(
          <WarmTurnCard
            key={`warm-${g}`}
            userText={warmUserPreview(userText)}
            assistantPreview={group.assistantPreview}
            toolCount={group.toolCount}
            expanded={true}
            onToggle={() => onToggleWarmTurn(g, false)}
          >
            {/* Expanded warm turns render items that are stable (never the
                streaming turn), so this captures items/live via a ref. */}
            <WarmTurnItems
              startIdx={group.startIdx}
              endIdx={group.endIdx}
              items={warmItems}
              subcalls={warmSubcalls}
              userTurnMap={warmUserTurn}
              checkpoints={warmCheckpoints}
              openAction={warmOpenAction}
              actionPending={warmActionPending}
              rewindDisabled={warmRewindDisabled}
              actionHoverMenus={warmActionHoverMenus}
              onRewind={warmOnRewind}
              setOpenAction={warmSetOpenAction}
              onEdit={warmOnEdit}
              tabId={tabId}
              creationMode={creationMode}
            />
          </WarmTurnCard>,
        );
      } else {
        const userText = group.userItem.kind === "user" ? group.userItem.text : "";
        out.push(
          <WarmTurnCard
            key={`warm-${g}`}
            userText={warmUserPreview(userText)}
            assistantPreview={group.assistantPreview}
            toolCount={group.toolCount}
            expanded={false}
            onToggle={() => {
              onToggleWarmTurn(g, true);
              const el = scrollRef.current;
              const node = document.getElementById(questionAnchorId(group.userItem.id));
              if (el && node) {
                requestAnimationFrame(() => {
                  el.scrollTo({ top: node.offsetTop - el.offsetTop - 80, behavior: "smooth" });
                });
              }
            }}
          />,
        );
      }
    }
  }

  return out;
});

function WarmTurnItems({
  startIdx,
  endIdx,
  items,
  subcalls,
  userTurnMap,
  checkpoints,
  openAction,
  actionPending,
  rewindDisabled,
  actionHoverMenus,
  onRewind,
  setOpenAction,
  onEdit,
  tabId,
  creationMode = false,
}: {
  startIdx: number;
  endIdx: number;
  items: readonly Item[];
  subcalls: ReadonlyMap<string, ToolItem[]>;
  userTurnMap: ReadonlyMap<string, number>;
  checkpoints: ReadonlyMap<number, CheckpointMeta>;
  openAction: OpenTurnAction | null;
  actionPending: boolean;
  rewindDisabled: boolean;
  actionHoverMenus: boolean;
  onRewind: ((turn: number, scope: string) => void) | undefined;
  setOpenAction: (action: OpenTurnAction | null) => void;
  onEdit?: (turn: number, displayText: string, submitText?: string) => boolean | void | Promise<boolean | void>;
  tabId?: string;
  creationMode?: boolean;
}) {
  const nodes: React.ReactNode[] = [];
  let actionText = "";
  let actionReady = false;
  let activeTurn: number | undefined;
  const pushTurnActions = () => {
    if (activeTurn == null || !actionReady || actionText.trim() === "") return;
    const turn = activeTurn;
    const openMenu = openAction && openAction.turn === turn ? openAction.menu : null;
    nodes.push(
      <TurnActions
        key={`ta-${turn}`}
        text={actionText}
        turn={turn}
        openMenu={openMenu}
        onOpenMenu={(menu) => setOpenAction(menu ? { turn, menu } : null)}
        checkpoint={checkpoints.get(turn)}
        actionPending={actionPending}
        rewindDisabled={rewindDisabled}
        hoverMenus={actionHoverMenus}
        onRewind={(targetTurn, scope) => {
          onRewind?.(targetTurn, scope);
          setOpenAction(null);
        }}
      />,
    );
    actionText = "";
    actionReady = false;
  };

  // Group consecutive completed read-only tools into ReadOnlyBatch
  const roBatch: ToolItem[] = [];
  const toolBatch: ToolItem[] = [];
  let toolBatchKind: ToolGroupKind | null = null;
  const flushRO = () => {
    if (roBatch.length === 0) return;
    nodes.push(<ReadOnlyBatch key={`rob-${roBatch[0].id}`} items={[...roBatch]} subcalls={subcalls} tabId={tabId} />);
    roBatch.length = 0;
  };
  const flushToolBatch = () => {
    if (!toolBatchKind || toolBatch.length === 0) return;
    nodes.push(<ToolGroup key={`tg-${toolBatch[0].id}`} kind={toolBatchKind} items={[...toolBatch]} subcalls={subcalls} tabId={tabId} />);
    toolBatch.length = 0;
    toolBatchKind = null;
  };

  for (let i = startIdx; i < endIdx && i < items.length; i++) {
    const it = items[i];

    // Completed read-only tools → batch into ReadOnlyBatch
    if (creationMode && it.kind === "tool" && isCreationGroupableTool(it as ToolItem)) {
      const kind = toolGroupKind(it as ToolItem);
      if (kind) {
        if (toolBatchKind && toolBatchKind !== kind) flushToolBatch();
        toolBatchKind = kind;
        toolBatch.push(it as ToolItem);
        continue;
      }
    }
    if (!creationMode && it.kind === "tool" && !it.parentId && it.name !== "todo_write" && it.name !== "exit_plan_mode" && isReadOnlyTool(it.name)) {
      roBatch.push(it as ToolItem);
      continue;
    }
    flushToolBatch();
    flushRO();

    switch (it.kind) {
      case "user": {
        pushTurnActions();
        const tn = userTurnMap.get(it.id);
        const checkpoint = tn == null ? undefined : checkpoints.get(tn);
        activeTurn = tn;
        nodes.push(
          <UserMessage
            key={it.id}
            text={it.text}
            submitText={it.submitText}
            failed={it.failed}
            createdAt={it.createdAt}
            turn={tn}
            anchorId={questionAnchorId(it.id)}
            onEdit={onEdit}
            editDisabled={rewindDisabled || !checkpoint?.canConversation}
          />,
        );
        break;
      }
      case "assistant": {
        nodes.push(<AssistantMessage key={it.id} item={it} defaultExpanded={false} creationMode={creationMode} />);
        if (!it.streaming && it.text.trim() !== "") {
          actionText = it.text;
          actionReady = true;
        }
        break;
      }
      case "tool": {
        if (it.parentId) break;
        if (it.name === "todo_write") break;
        if (it.name === "exit_plan_mode") break;
        nodes.push(<ToolCard key={it.id} item={it} subcalls={subcalls.get(it.id)} tabId={tabId} />);
        break;
      }
      case "phase": nodes.push(<PhaseCard key={it.id} text={it.text} />); break;
      case "notice": nodes.push(<NoticeCard key={it.id} level={it.level} text={it.text} />); break;
      case "compaction": nodes.push(<CompactionCard key={it.id} item={it} />); break;
    }
  }
  flushToolBatch();
  flushRO();
  pushTurnActions();
  return nodes;
}

// ── Warm turn summary card ────────────────────────────────────────────────────

function WarmTurnCard({
  userText,
  assistantPreview,
  toolCount,
  expanded,
  onToggle,
  children,
}: {
  userText: string;
  assistantPreview: string;
  toolCount: number;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const t = useT();
  const contentRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  useGSAPCollapse(contentRef, expanded, { prevHeight: prevHeightRef.current });
  // Always render both children so the container's scrollHeight reflects
  // the correct content at all times.  The inactive one is display:none.
  return (
    <div className={`warm-turn${expanded ? " warm-turn--expanded" : ""}`}>
      <button
        type="button"
        className="warm-turn__head"
        onClick={() => {
          // Capture height before DOM swap so the collapse animation
          // starts from the correct (expanded) height.
          const el = contentRef.current;
          if (el) {
            el.style.height = "auto";
            prevHeightRef.current = el.scrollHeight;
          }
          onToggle();
        }}
        aria-expanded={expanded}
      >
        <span className="warm-turn__chevron">
          <ChevronRight className={expanded ? "warm-turn__chevron--open" : ""} size={13} />
        </span>
        <span className="warm-turn__preview">{userText}</span>
        <span className="warm-turn__meta">
          {toolCount > 0 && <span>{t("transcript.toolCount", { n: toolCount })}</span>}
        </span>
      </button>
      <div ref={contentRef} className="warm-turn__content">
        <div className="warm-turn__body" style={{ display: expanded ? undefined : "none" }}>{children}</div>
        {assistantPreview && (
          <div className="warm-turn__assistant" style={{ display: expanded ? "none" : undefined }}>{assistantPreview}</div>
        )}
      </div>
    </div>
  );
}

// ── TurnCollapse: compact mode grouping ──────────────────────────────────────

type TurnCollapseProps = {
  items: Item[];       // intermediate items (tools, reasoning, phase)
  durationMs: number;  // summed tool execution time across the batch; 0 when unknown
  mode: DisplayMode;
  subcalls: Map<string, ToolItem[]>;
  tabId?: string;
  creationMode?: boolean;
};

function TurnCollapse({ items, durationMs, mode, subcalls, tabId, creationMode = false }: TurnCollapseProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  useGSAPCollapse(bodyRef, open);

  // Keep only items the body will actually render — an expandable fold over
  // nothing is worse than no fold.
  const displayItems = useMemo(() => {
    return items.filter((it) => {
      if (it.kind === "assistant") {
        if (it.text.trim() !== "") return true;
        return Boolean(it.reasoning);
      }
      if (it.kind === "phase") return true;
      if (it.kind !== "tool") return false;
      if (it.parentId || it.name === "todo_write" || it.name === "exit_plan_mode") return false;
      return true;
    });
  }, [items, mode]);

  const seconds = Math.round(durationMs / 1000);
  const label = seconds > 0 ? t("transcript.processedDuration", { s: seconds }) : t("transcript.processed");

  if (displayItems.length === 0) return null;

  const collapseKind = displayItems.some((it) => it.kind === "tool")
    ? "tool"
    : displayItems.some((it) => it.kind === "assistant" && Boolean(it.reasoning))
      ? "reasoning"
      : "process";
  const creationLabel = collapseKind === "tool"
    ? t("creation.toolCallsLabel")
    : collapseKind === "reasoning"
      ? t("creation.reasoningLabel")
      : label;

  // Pre-compute body: group consecutive completed read-only tools into ReadOnlyBatch
  const body: ReactNode[] = [];
  const roBatch: ToolItem[] = [];
  const toolBatch: ToolItem[] = [];
  let toolBatchKind: ToolGroupKind | null = null;
  const flushRO = () => {
    if (roBatch.length === 0) return;
    body.push(<ReadOnlyBatch key={`rob-${roBatch[0].id}`} items={[...roBatch]} subcalls={subcalls} tabId={tabId} />);
    roBatch.length = 0;
  };
  const flushToolBatch = () => {
    if (!toolBatchKind || toolBatch.length === 0) return;
    body.push(<ToolGroup key={`tg-${toolBatch[0].id}`} kind={toolBatchKind} items={[...toolBatch]} subcalls={subcalls} tabId={tabId} />);
    toolBatch.length = 0;
    toolBatchKind = null;
  };
  for (const it of displayItems) {
    if (creationMode && it.kind === "tool" && isCreationGroupableTool(it as ToolItem)) {
      const kind = toolGroupKind(it as ToolItem);
      if (kind) {
        if (toolBatchKind && toolBatchKind !== kind) flushToolBatch();
        toolBatchKind = kind;
        toolBatch.push(it as ToolItem);
        continue;
      }
    }
    if (!creationMode && it.kind === "tool" && !it.parentId && it.name !== "todo_write" && it.name !== "exit_plan_mode" && it.status !== "running" && isReadOnlyTool(it.name)) {
      roBatch.push(it as ToolItem);
      continue;
    }
    flushToolBatch();
    flushRO();
    switch (it.kind) {
      case "tool":
        if (it.parentId) break;
        if (it.name === "todo_write") break;
        if (it.name === "exit_plan_mode") break;
        body.push(<ToolCard key={it.id} item={it as ToolItem} subcalls={subcalls.get(it.id)} tabId={tabId} />);
        break;
      case "phase": body.push(<PhaseCard key={it.id} text={it.text} />); break;
      case "assistant": {
        const displayItem = it;
        body.push(<AssistantMessage key={it.id} item={displayItem as AssistantItem} creationMode={creationMode} />);
        break;
      }
    }
  }
  flushToolBatch();
  flushRO();

  return (
    <div className={`turn-collapse${open ? " turn-collapse--open" : ""}`} data-kind={collapseKind} data-entrance={displayItems[0]?.id || undefined}>
      <button
        type="button"
        className="reasoning__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronRight className={`reasoning__chevron${open ? " reasoning__chevron--open" : ""}`} size={12} />
        <span className="turn-collapse__label" data-creation-label={creationLabel}>{label}</span>
      </button>
      <div ref={bodyRef} className="turn-collapse__body">{body}</div>
    </div>
  );
}

// ── JumpBar, PhaseCard, NoticeCard, CompactionCard ────────────────────────────

function QuestionJumpBar({
  questions,
  activeTurn,
  onJump,
}: {
  questions: QuestionAnchor[];
  activeTurn: number | null;
  onJump: (question: QuestionAnchor) => void;
}) {
  const t = useT();
  const [hovered, setHovered] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const previewTop = useRef(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (activeTurn === null) return;
    const el = barRef.current?.querySelector(`[data-turn="${activeTurn}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeTurn]);

  const hoverIdx = hovered !== null ? questions.findIndex((question) => question.turn === hovered) : -1;
  const hoveredQuestion = hovered !== null ? questions.find((question) => question.turn === hovered) : undefined;

  const closestQuestionFromY = (clientY: number): { question: QuestionAnchor; previewY: number } | null => {
    const el = barRef.current;
    if (!el) return null;
    const markers = el.querySelectorAll<HTMLElement>(".jump-item");
    const barRect = el.getBoundingClientRect();
    let closest = -1;
    let closestDist = Infinity;
    let closestY = 0;
    markers.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - midY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = index;
        closestY = midY - barRect.top;
      }
    });
    const question = questions[closest];
    if (!question) return null;
    return { question, previewY: closestY };
  };

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const closest = closestQuestionFromY(e.clientY);
    if (!closest) return;
    previewTop.current = closest.previewY;
    setHovered(closest.question.turn);
    setShowPreview(true);
  };

  const scrollTo = (question: QuestionAnchor) => {
    onJump(question);
  };

  const onRailMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const closest = closestQuestionFromY(e.clientY);
    if (!closest) return;
    e.preventDefault();
    previewTop.current = closest.previewY;
    setHovered(closest.question.turn);
    setShowPreview(true);
    scrollTo(closest.question);
  };

  const onItemMouseDown = (e: ReactMouseEvent<HTMLButtonElement>, question: QuestionAnchor) => {
    e.preventDefault();
    scrollTo(question);
  };

  const dotProps = (
    idx: number,
    turn: number,
  ): { style: CSSProperties; "data-d"?: string } => {
    const isActive = activeTurn === turn;
    if (hoverIdx < 0) {
      return { style: { width: isActive ? 18 : 12, background: isActive ? "var(--accent)" : undefined } };
    }
    const d = Math.abs(idx - hoverIdx);
    const width = d === 0 ? 32 : d === 1 ? 20 : d === 2 ? 14 : isActive ? 18 : 12;
    const background = d <= 2 ? undefined : isActive ? "var(--accent)" : undefined;
    return {
      style: { width, transitionDelay: `${d * 20}ms`, background },
      "data-d": d <= 2 ? String(d) : undefined,
    };
  };

  return (
    <nav
      className="jump-bar"
      ref={barRef}
      aria-label={t("questionNav.label")}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setHovered(null);
        setShowPreview(false);
      }}
    >
      <div className="jump-scroll" onMouseDown={onRailMouseDown} onClick={onRailMouseDown}>
        {questions.map((question, index) => (
          <button
            className="jump-item"
            key={question.id}
            type="button"
            data-turn={question.turn}
            aria-label={t("questionNav.jump", { n: question.turn + 1 })}
            onMouseDown={(e) => onItemMouseDown(e, question)}
            onClick={(e) => {
              e.stopPropagation();
              if (e.detail === 0) scrollTo(question);
            }}
          >
            <span className="jump-dot" {...dotProps(index, question.turn)} />
          </button>
        ))}
      </div>
      {showPreview && hoveredQuestion && (
        <div className="jump-preview" style={{ top: previewTop.current }} role="tooltip">
          <span className="jump-text">{hoveredQuestion.text}</span>
        </div>
      )}
    </nav>
  );
}

type CompactionItem = Extract<Item, { kind: "compaction" }>;
type NoticeItem = Extract<Item, { kind: "notice" }>;

function PhaseCard({ text }: { text: string }) {
  return <div className="phase" data-entrance="true"><ProcessPhaseIcon size={12} /><span>{text}</span></div>;
}

function NoticeCard({ level, text }: { level: NoticeItem["level"]; text: string }) {
  return (
    <div className={`notice-line notice-line--${level}`} data-entrance="true">
      <span className="notice-line__icon">{level === "warn" ? "⚠ " : "ℹ "}</span>
      <span className="notice-line__text">{text}</span>
    </div>
  );
}

function CompactionCard({ item }: { item: CompactionItem }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (item.pending) {
    return <div className="compaction compaction--pending" data-entrance={item.id}><ProcessCompactIcon size={12} /><span>{t("compaction.working")}</span></div>;
  }
  return (
    <div className="compaction" data-entrance={item.id}>
      <button type="button" className="compaction__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <ProcessCompactIcon size={12} />
        <span>{t("compaction.title")}</span>
        <span className="compaction__meta">{t("compaction.messages", { n: item.messages })}{item.trigger ? ` · ${item.trigger}` : ""}</span>
        <ChevronRight className={open ? "compaction__chevron--open" : ""} size={12} />
      </button>
      {open && <pre className="compaction__body">{item.summary}</pre>}
    </div>
  );
}
