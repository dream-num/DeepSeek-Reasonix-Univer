export interface UniverPreviewSignal {
  id: string;
  path: string;
}

type SignalItem = {
  kind: string;
  id?: string;
  args?: string;
  output?: string;
  error?: string;
  summary?: string;
  status?: string;
};

const QUOTED_UNIVER_PATH_RE = /["'`]([^"'`]*?\.univer)["'`]/gi;
const UNQUOTED_UNIVER_PATH_RE = /(?:^|[\s(=:\[,])([^\s"'`)\]}:,;]+\.univer)(?=$|[\s"'`)\]}:,;])/gi;
const URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

export function inferUniverPreviewSignal(items: readonly SignalItem[]): UniverPreviewSignal | null {
  const latestUserIndex = latestUserItemIndex(items);
  const activity = items.slice(latestUserIndex + 1).filter((item) => item.kind === "tool");
  if (activity.length === 0) return null;

  const paths = new Set<string>();
  for (const item of activity) {
    collectUniverPaths(item.args, paths);
    collectUniverPaths(item.output, paths);
    collectUniverPaths(item.error, paths);
    collectUniverPaths(item.summary, paths);
  }
  if (paths.size !== 1) return null;
  const [path] = Array.from(paths);
  return {
    path,
    id: activityFingerprint(activity),
  };
}

function latestUserItemIndex(items: readonly SignalItem[]): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i]?.kind === "user") return i;
  }
  return -1;
}

function activityFingerprint(items: readonly SignalItem[]): string {
  return items
    .map((item) => [
      item.id ?? "",
      item.status ?? "",
      item.args?.length ?? 0,
      item.output?.length ?? 0,
      item.error?.length ?? 0,
    ].join(":"))
    .join("|");
}

function collectUniverPaths(value: string | undefined, paths: Set<string>) {
  if (!value) return;
  collectUniverPathsFromText(value, paths);
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return;
  try {
    collectUniverPathsFromJSON(JSON.parse(trimmed), paths);
  } catch {
    // Raw text scanning above still handles normal command output.
  }
}

function collectUniverPathsFromJSON(value: unknown, paths: Set<string>) {
  if (typeof value === "string") {
    collectUniverPathsFromText(value, paths);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUniverPathsFromJSON(item, paths));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((item) => collectUniverPathsFromJSON(item, paths));
}

function collectUniverPathsFromText(text: string, paths: Set<string>) {
  collectWithRegex(text, QUOTED_UNIVER_PATH_RE, paths);
  collectWithRegex(text, UNQUOTED_UNIVER_PATH_RE, paths);
}

function collectWithRegex(text: string, regex: RegExp, paths: Set<string>) {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const path = normalizeInferredUniverPath(match[1]);
    if (path) paths.add(path);
  }
}

function normalizeInferredUniverPath(path: string | undefined): string {
  let next = (path ?? "").trim();
  if (!next.toLowerCase().includes(".univer")) return "";
  if (next.startsWith("//")) return "";
  if (URL_SCHEME_RE.test(next)) {
    if (!next.toLowerCase().startsWith("file://")) return "";
    try {
      next = decodeURIComponent(new URL(next).pathname);
    } catch {
      return "";
    }
  }
  next = next.replace(/[)\]}.,;:]+$/g, "");
  if (!next.toLowerCase().endsWith(".univer")) return "";
  if (next.startsWith("./")) next = next.slice(2);
  return next.replace(/\\/g, "/");
}
