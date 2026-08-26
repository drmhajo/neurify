import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("مخطط مزامنة Supabase التجريبي", () => {
  it("يحصر لقطات البيانات في خادم التطبيق ويُفعّل RLS", () => {
    const script = readFileSync(`${process.cwd()}/supabase/department_snapshots.sql`, "utf8");

    expect(script).toContain("create table if not exists public.department_snapshots");
    expect(script).toContain("data jsonb not null");
    expect(script).toContain("alter table public.department_snapshots enable row level security");
    expect(script).toContain("revoke all on table public.department_snapshots from anon, authenticated");
    expect(script).toContain('to service_role');
  });
});
