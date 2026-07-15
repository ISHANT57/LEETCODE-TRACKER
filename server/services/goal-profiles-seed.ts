import { db } from "../db";
import { goalProfiles, goalProfileTargets } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

// Curated, hand-picked category-weight sets reflecting commonly-cited interview
// focus areas for these companies — NOT scraped from real company-tagged
// problem data (LeetCode doesn't expose that publicly). Editable here.
const BUILTIN_PROFILES: { name: string; targets: { categorySlug: string; weight: number; targetScore: number }[] }[] = [
  {
    name: "Amazon",
    targets: [
      { categorySlug: "array", weight: 2, targetScore: 75 },
      { categorySlug: "string", weight: 1.5, targetScore: 70 },
      { categorySlug: "hash-table", weight: 1.5, targetScore: 70 },
      { categorySlug: "two-pointers", weight: 1, targetScore: 65 },
      { categorySlug: "sliding-window", weight: 1, targetScore: 65 },
      { categorySlug: "tree", weight: 1.5, targetScore: 70 },
      { categorySlug: "graph", weight: 1.5, targetScore: 65 },
      { categorySlug: "breadth-first-search", weight: 1, targetScore: 65 },
      { categorySlug: "depth-first-search", weight: 1, targetScore: 65 },
      { categorySlug: "dynamic-programming", weight: 1.5, targetScore: 65 },
      { categorySlug: "design", weight: 1, targetScore: 60 },
    ],
  },
  {
    name: "Google",
    targets: [
      { categorySlug: "graph", weight: 2, targetScore: 75 },
      { categorySlug: "dynamic-programming", weight: 2, targetScore: 75 },
      { categorySlug: "tree", weight: 1.5, targetScore: 70 },
      { categorySlug: "backtracking", weight: 1.5, targetScore: 65 },
      { categorySlug: "math", weight: 1, targetScore: 60 },
      { categorySlug: "bit-manipulation", weight: 1, targetScore: 60 },
      { categorySlug: "binary-search", weight: 1, targetScore: 65 },
      { categorySlug: "greedy", weight: 1, targetScore: 60 },
      { categorySlug: "design", weight: 1.5, targetScore: 65 },
      { categorySlug: "recursion", weight: 1, targetScore: 60 },
      { categorySlug: "union-find", weight: 1, targetScore: 55 },
    ],
  },
];

/** Idempotently seed the shared builtin goal profiles (Amazon/Google) at boot. */
export async function seedBuiltinGoalProfiles(): Promise<void> {
  for (const { name, targets } of BUILTIN_PROFILES) {
    const existing = await db
      .select()
      .from(goalProfiles)
      .where(and(isNull(goalProfiles.ownerStudentId), eq(goalProfiles.name, name)))
      .limit(1);

    if (existing[0]) continue;

    const created = await db.insert(goalProfiles).values({ name, kind: "builtin", ownerStudentId: null }).returning();
    const profileId = created[0].id;
    await db.insert(goalProfileTargets).values(targets.map((t) => ({ goalProfileId: profileId, ...t })));
  }
}
