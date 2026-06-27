import { type ReactNode, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderTree,
  GitMerge,
  ListChecks,
  PanelLeft,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
} from "lucide-react";
import { useT } from "../lib/i18n";

export type WorkspaceActivity = "code" | "uniwork";

function ActivityIcon({ activity }: { activity: WorkspaceActivity }) {
  return activity === "uniwork" ? <FileText size={15} aria-hidden="true" /> : <Code2 size={15} aria-hidden="true" />;
}

export function UniworkActivitySwitch({
  activity,
  onActivityChange,
}: {
  activity: WorkspaceActivity;
  onActivityChange: (activity: WorkspaceActivity) => void;
}) {
  const t = useT();

  return (
    <div className="uniwork-activity-switch" role="tablist" aria-label={t("uniwork.activitySwitcher.label")}>
      {(["code", "uniwork"] as const).map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={activity === item}
          className={`uniwork-activity-switch__item${activity === item ? " uniwork-activity-switch__item--active" : ""}`}
          onClick={() => onActivityChange(item)}
        >
          <ActivityIcon activity={item} />
          <span>{t(item === "code" ? "uniwork.activitySwitcher.code" : "uniwork.activitySwitcher.uniwork")}</span>
        </button>
      ))}
    </div>
  );
}

export function UniworkSidebar({ projectTreeSlot }: { projectTreeSlot: ReactNode }) {
  const t = useT();

  return (
    <div className="uniwork-sidebar uniwork-sidebar--project-tree" aria-label={t("uniwork.sidebar.navigation")}>
      <nav className="uniwork-sidebar__shortcuts" aria-label={t("uniwork.sidebar.shortcuts")}>
        <button className="uniwork-sidebar__shortcut uniwork-sidebar__shortcut--primary" type="button">
          <Plus size={15} aria-hidden="true" />
          <span>{t("uniwork.sidebar.newTask")}</span>
        </button>
      </nav>
      {projectTreeSlot}
    </div>
  );
}

function UniworkProjectBar({
  sidebarCollapsed = false,
  onToggleSidebar,
  taskReviewRailAvailable = true,
  taskReviewRailVisible = true,
  onToggleTaskReviewRail,
}: {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  taskReviewRailAvailable?: boolean;
  taskReviewRailVisible?: boolean;
  onToggleTaskReviewRail?: () => void;
}) {
  const t = useT();
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const targetUnits = [
    { icon: Table2, name: t("uniwork.projectBar.unitSummary"), meta: t("uniwork.projectBar.unitSummaryMeta"), selected: true },
    { icon: Table2, name: t("uniwork.projectBar.unitBudget"), meta: t("uniwork.projectBar.unitBudgetMeta"), selected: false },
    { icon: FileText, name: t("uniwork.projectBar.unitTemplate"), meta: t("uniwork.projectBar.unitTemplateMeta"), selected: false },
  ] as const;

  return (
    <header className="uniwork-project-bar" aria-label={t("uniwork.projectBar.label")}>
      <button
        className="uniwork-project-bar__sidebar-toggle"
        type="button"
        aria-label={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        aria-pressed={!sidebarCollapsed}
        onClick={onToggleSidebar}
      >
        {sidebarCollapsed ? <PanelRight size={14} aria-hidden="true" /> : <PanelLeft size={14} aria-hidden="true" />}
      </button>

      <div className="uniwork-project-bar__trail">
        <span className="uniwork-project-bar__project">
          <FolderTree size={14} aria-hidden="true" />
          <span>{t("uniwork.projectBar.projectName")}</span>
        </span>
        <ChevronRight className="uniwork-project-bar__separator" size={12} aria-hidden="true" />

        <div className="uniwork-project-bar__target-wrap">
          <button
            className="uniwork-project-bar__target"
            type="button"
            aria-label={`${t("uniwork.projectBar.activeTarget")}: ${t("uniwork.projectBar.targetName")}`}
            aria-haspopup="menu"
            aria-expanded={navigatorOpen}
            onClick={() => setNavigatorOpen((open) => !open)}
          >
            <FileSpreadsheet size={14} aria-hidden="true" />
            <span className="uniwork-project-bar__target-name">{t("uniwork.projectBar.targetName")}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </button>

          {navigatorOpen && (
            <div className="uniwork-target-navigator" role="menu" aria-label={t("uniwork.projectBar.navigatorLabel")}>
              <div className="uniwork-target-navigator__head">
                <FolderTree size={14} aria-hidden="true" />
                <span>{t("uniwork.projectBar.navigatorTitle")}</span>
              </div>
              <div className="uniwork-target-navigator__list">
                {targetUnits.map((unit) => {
                  const UnitIcon = unit.icon;
                  return (
                    <button
                      className={`uniwork-target-navigator__item${unit.selected ? " uniwork-target-navigator__item--selected" : ""}`}
                      type="button"
                      role="menuitem"
                      aria-current={unit.selected ? "page" : undefined}
                      key={unit.name}
                    >
                      <UnitIcon size={14} aria-hidden="true" />
                      <span>
                        <strong>{unit.name}</strong>
                        <small>{unit.meta}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {taskReviewRailAvailable && (
        <button
          className={`uniwork-project-bar__rail-toggle${taskReviewRailVisible ? " uniwork-project-bar__rail-toggle--active" : ""}`}
          type="button"
          aria-label={taskReviewRailVisible ? t("uniwork.taskReview.collapse") : t("uniwork.taskReview.expand")}
          title={taskReviewRailVisible ? t("uniwork.taskReview.collapse") : t("uniwork.taskReview.expand")}
          aria-pressed={taskReviewRailVisible}
          onClick={onToggleTaskReviewRail}
        >
          {taskReviewRailVisible ? <PanelRightClose size={14} aria-hidden="true" /> : <PanelRightOpen size={14} aria-hidden="true" />}
        </button>
      )}
    </header>
  );
}

function UniworkTaskReviewRail() {
  const t = useT();

  const changedUnits = [
    { icon: Table2, name: t("uniwork.review.unitSummary"), meta: t("uniwork.review.unitSummaryMeta"), badge: t("uniwork.review.badgeModified"), tone: "modified" },
    { icon: FileText, name: t("uniwork.review.unitTemplate"), meta: t("uniwork.review.unitTemplateMeta"), badge: t("uniwork.review.badgeUpdated"), tone: "updated" },
    { icon: ListChecks, name: t("uniwork.review.unitTodos"), meta: t("uniwork.review.unitTodosMeta"), badge: t("uniwork.review.badgeNew"), tone: "new" },
  ] as const;

  return (
    <div className="uniwork-task-review-rail">
      <section className="uniwork-review-hero" aria-label={t("uniwork.review.currentReview")}>
        <div className="uniwork-review-hero__topline">
          <span className="uniwork-review-hero__label">{t("uniwork.review.label")}</span>
          <span className="uniwork-review-badge uniwork-review-badge--ready">{t("uniwork.review.ready")}</span>
        </div>
        <h2>{t("uniwork.review.title")}</h2>
        <p>{t("uniwork.review.subtitle")}</p>
        <div className="uniwork-review-stats" aria-label={t("uniwork.review.summary")}>
          <span>{t("uniwork.review.statFiles")}</span>
          <span>{t("uniwork.review.statMergeable")}</span>
          <span>{t("uniwork.review.statPreview")}</span>
        </div>
      </section>

      <section className="uniwork-review-section" aria-label={t("uniwork.review.previewMode")}>
        <div className="uniwork-review-section__head">
          <span>{t("uniwork.review.previewMode")}</span>
          <span className="uniwork-review-section__hint">{t("uniwork.review.previewHint")}</span>
        </div>
        <div className="uniwork-review-toggle" role="group" aria-label={t("uniwork.review.previewMode")}>
          <button className="uniwork-review-toggle__item uniwork-review-toggle__item--active" type="button">
            <Eye size={13} aria-hidden="true" />
            <span>{t("uniwork.review.mergePreview")}</span>
          </button>
          <button className="uniwork-review-toggle__item" type="button">
            <RotateCcw size={13} aria-hidden="true" />
            <span>{t("uniwork.review.originalEdit")}</span>
          </button>
        </div>
      </section>

      <section className="uniwork-review-section" aria-label={t("uniwork.review.changedUnits")}>
        <div className="uniwork-review-section__head">
          <span>{t("uniwork.review.changedUnits")}</span>
          <span className="uniwork-review-section__hint">{t("uniwork.review.unitCount")}</span>
        </div>
        <div className="uniwork-review-units">
          {changedUnits.map((unit) => {
            const UnitIcon = unit.icon;
            return (
              <button className="uniwork-review-unit" type="button" key={unit.name} aria-label={t("uniwork.review.openUnit", { unit: unit.name })}>
                <UnitIcon size={14} aria-hidden="true" />
                <span className="uniwork-review-unit__copy">
                  <span className="uniwork-review-unit__name">{unit.name}</span>
                  <span className="uniwork-review-unit__meta">{unit.meta}</span>
                </span>
                <span className={`uniwork-review-status uniwork-review-status--${unit.tone}`}>{unit.badge}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="uniwork-review-section uniwork-review-section--actions" aria-label={t("uniwork.review.actions")}>
        <div className="uniwork-review-actions">
          <button className="uniwork-review-action uniwork-review-action--primary" type="button">
            <GitMerge size={14} aria-hidden="true" />
            <span>{t("uniwork.review.merge")}</span>
          </button>
          <button className="uniwork-review-action" type="button">
            <Trash2 size={14} aria-hidden="true" />
            <span>{t("uniwork.review.discard")}</span>
          </button>
        </div>
        <div className="uniwork-review-note">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>{t("uniwork.review.cleanMerge")}</span>
        </div>
        <div className="uniwork-review-note uniwork-review-note--muted">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>{t("uniwork.review.trunkAdvanced")}</span>
        </div>
      </section>
    </div>
  );
}

export function UniworkMode({
  sidebarCollapsed = false,
  onToggleSidebar,
  taskReviewRailVisible = true,
  taskReviewRailAvailable = taskReviewRailVisible,
  onToggleTaskReviewRail,
  composerSlot,
  transcriptSlot,
}: {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  taskReviewRailAvailable?: boolean;
  onToggleTaskReviewRail?: () => void;
  taskReviewRailVisible?: boolean;
  composerSlot: ReactNode;
  transcriptSlot: ReactNode;
}) {
  const t = useT();

  return (
    <section className="uniwork-shell" aria-label={t("uniwork.home.previewLabel")}>
      <UniworkProjectBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        taskReviewRailAvailable={taskReviewRailAvailable}
        taskReviewRailVisible={taskReviewRailVisible}
        onToggleTaskReviewRail={onToggleTaskReviewRail}
      />
      <div className={`uniwork-body${taskReviewRailVisible ? "" : " uniwork-body--review-hidden"}`}>
        <main className="uniwork-transcript-pane" aria-label={t("uniwork.home.label")}>
          {transcriptSlot}
        </main>
        <aside className="uniwork-task-review-rail-shell" aria-label={t("uniwork.taskReview.label")} aria-hidden={!taskReviewRailVisible}>
          {taskReviewRailVisible && <UniworkTaskReviewRail />}
        </aside>
      </div>

      {composerSlot}
    </section>
  );
}
