// Run: tsx src/__tests__/univer-preview-signal.test.ts

import { inferUniverPreviewSignal } from "../lib/univerPreviewSignal";

let passed = 0;
let failed = 0;

function eq(a: unknown, b: unknown, label: string) {
  if (a === b) {
    process.stdout.write(`  PASS  ${label}\n`);
    passed += 1;
  } else {
    process.stdout.write(`  FAIL  ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}\n`);
    failed += 1;
  }
}

console.log("\nUniver preview signal");

{
  const got = inferUniverPreviewSignal([
    { kind: "user", id: "u1" },
    { kind: "tool", id: "t1", status: "done", args: JSON.stringify({ file: "reports/q2.univer" }) },
  ]);
  eq(got?.path, "reports/q2.univer", "extracts a unique .univer path from tool JSON args");
}

{
  const got = inferUniverPreviewSignal([
    { kind: "user", id: "u1" },
    { kind: "tool", id: "t1", status: "done", args: "univer inspect ./reports/q2.univer --json" },
  ]);
  eq(got?.path, "reports/q2.univer", "extracts a unique .univer path from shell-like args");
}

{
  const got = inferUniverPreviewSignal([
    { kind: "user", id: "u1" },
    { kind: "tool", id: "t1", status: "done", args: "univer inspect a.univer b.univer" },
  ]);
  eq(got, null, "does not infer ambiguous .univer paths");
}

{
  const got = inferUniverPreviewSignal([
    { kind: "user", id: "u1" },
    { kind: "tool", id: "old", status: "done", args: "univer inspect old.univer" },
    { kind: "user", id: "u2" },
    { kind: "tool", id: "new", status: "done", output: "wrote new.univer" },
  ]);
  eq(got?.path, "new.univer", "only considers activity after the latest user turn");
}

{
  const got = inferUniverPreviewSignal([
    { kind: "user", id: "u1" },
    { kind: "tool", id: "t1", status: "done", output: "preview http://127.0.0.1/uf/book.univer" },
  ]);
  eq(got, null, "does not infer from preview URLs");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
