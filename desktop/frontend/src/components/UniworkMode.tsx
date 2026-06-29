import { type ReactNode } from "react";
import {
  Code2,
  FileText,
  Plus,
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

export function UniworkMode({
  actionsRailVisible = true,
  composerSlot,
  transcriptSlot,
}: {
  actionsRailVisible?: boolean;
  composerSlot: ReactNode;
  transcriptSlot: ReactNode;
}) {
  const t = useT();

  return (
    <section className="uniwork-shell" aria-label={t("uniwork.home.previewLabel")}>
      <div className={`uniwork-body${actionsRailVisible ? "" : " uniwork-body--actions-hidden"}`}>
        <main className="uniwork-transcript-pane" aria-label={t("uniwork.home.label")}>
          {transcriptSlot}
        </main>
        <aside className="uniwork-actions-rail" aria-label={t("uniwork.actions.label")} aria-hidden={!actionsRailVisible}>
          <div className="uniwork-actions-rail__skeleton" aria-hidden="true">
            <div className="uniwork-actions-rail__toolbar">
              <span className="uniwork-actions-rail__button uniwork-actions-rail__button--active" />
              <span className="uniwork-actions-rail__button" />
              <span className="uniwork-actions-rail__button" />
              <span className="uniwork-actions-rail__button uniwork-actions-rail__button--wide" />
            </div>

            <div className="uniwork-actions-preview">
              <div className="uniwork-actions-preview__topbar">
                <span className="uniwork-actions-preview__dot" />
                <span className="uniwork-actions-preview__line uniwork-actions-preview__line--short" />
              </div>
              <div className="uniwork-actions-preview__surface">
                <span className="uniwork-actions-preview__block uniwork-actions-preview__block--hero" />
                <span className="uniwork-actions-preview__block" />
                <span className="uniwork-actions-preview__block uniwork-actions-preview__block--half" />
              </div>
            </div>

            <div className="uniwork-actions-rail__rows">
              <span />
              <span />
              <span />
            </div>
          </div>
        </aside>
      </div>

      {composerSlot}
    </section>
  );
}
