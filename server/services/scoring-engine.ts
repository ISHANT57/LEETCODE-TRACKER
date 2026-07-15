import { storage } from "../storage";

// See docs in the approved plan for the reasoning behind these constants — they're
// a concretization of an under-specified formula, tunable in this one module.
const DIFFICULTY_WEIGHT: Record<string, number> = {
  EASY: 0.4,
  MEDIUM: 0.7,
  HARD: 1.0,
};
const HALF_LIFE_DAYS = 90;
const CONFIDENCE_DIVISOR = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function decay(daysSinceSolved: number): number {
  return Math.exp((-Math.LN2 * daysSinceSolved) / HALF_LIFE_DAYS);
}

interface SolveInput {
  categorySlug: string;
  difficulty: string;
  daysSinceSolved: number;
  quality: number;
}

export interface CategoryScoreResult {
  categorySlug: string;
  estimatedScore: number;
  confidenceLevel: number;
  adjustedScore: number;
  evidencePoints: number;
  solveCount: number;
  lastSolvedAt: Date | null;
}

/** Pure function: groups per-tag solve rows into per-category score results. */
export function computeCategoryScores(rows: (SolveInput & { solvedAt: Date })[]): Map<string, CategoryScoreResult> {
  const byCategory = new Map<string, (SolveInput & { solvedAt: Date })[]>();
  for (const row of rows) {
    const arr = byCategory.get(row.categorySlug);
    if (arr) arr.push(row);
    else byCategory.set(row.categorySlug, [row]);
  }

  const results = new Map<string, CategoryScoreResult>();
  for (const [categorySlug, solves] of Array.from(byCategory.entries())) {
    let masterySum = 0;
    let evidenceSum = 0;
    let lastSolvedAt: Date | null = null;

    for (const s of solves) {
      const weight = DIFFICULTY_WEIGHT[s.difficulty.toUpperCase()] ?? DIFFICULTY_WEIGHT.MEDIUM;
      const evidence = s.quality * decay(s.daysSinceSolved) * weight;
      masterySum += evidence * 100;
      evidenceSum += evidence;
      if (!lastSolvedAt || s.solvedAt > lastSolvedAt) lastSolvedAt = s.solvedAt;
    }

    const estimatedScore = solves.length > 0 ? masterySum / solves.length : 0;
    const confidenceLevel = Math.min(1, evidenceSum / CONFIDENCE_DIVISOR);
    const adjustedScore = estimatedScore * confidenceLevel;

    results.set(categorySlug, {
      categorySlug,
      estimatedScore,
      confidenceLevel,
      adjustedScore,
      evidencePoints: evidenceSum,
      solveCount: solves.length,
      lastSolvedAt,
    });
  }
  return results;
}

export function computeGoalProfileProgress(
  scoresByCategory: Map<string, CategoryScoreResult>,
  targets: { categorySlug: string; weight: number; targetScore: number }[]
): { overallProgress: number; perCategory: { categorySlug: string; weight: number; targetScore: number; currentScore: number }[] } {
  if (targets.length === 0) return { overallProgress: 0, perCategory: [] };

  const perCategory = targets.map((t) => ({
    categorySlug: t.categorySlug,
    weight: t.weight,
    targetScore: t.targetScore,
    currentScore: scoresByCategory.get(t.categorySlug)?.adjustedScore ?? 0,
  }));

  const totalWeight = perCategory.reduce((sum, t) => sum + t.weight, 0);
  const overallProgress =
    totalWeight > 0
      ? perCategory.reduce((sum, t) => sum + t.weight * Math.min(1, t.currentScore / t.targetScore), 0) / totalWeight
      : 0;

  return { overallProgress: Math.min(1, overallProgress), perCategory };
}

/** Orchestrator: recompute + persist category scores for one student from their current solves. */
export async function recomputeStudentScores(studentId: string): Promise<void> {
  const solves = await storage.getStudentSolves(studentId);
  if (solves.length === 0) return;

  const slugs = solves.map((s) => s.problemSlug);
  const tags = await storage.getTagsForProblems(slugs);
  const tagsBySlug = new Map<string, string[]>();
  for (const t of tags) {
    const arr = tagsBySlug.get(t.problemSlug);
    if (arr) arr.push(t.tagSlug);
    else tagsBySlug.set(t.problemSlug, [t.tagSlug]);
  }

  const problems = await Promise.all(slugs.map((slug) => storage.getProblemBySlug(slug)));
  const problemBySlug = new Map(problems.filter(Boolean).map((p) => [p!.titleSlug, p!]));

  const now = Date.now();
  const rows: (SolveInput & { solvedAt: Date })[] = [];
  for (const solve of solves) {
    const problem = problemBySlug.get(solve.problemSlug);
    if (!problem) continue; // shouldn't happen (FK-enforced), but skip defensively
    const categories = tagsBySlug.get(solve.problemSlug) || [];
    const daysSinceSolved = Math.max(0, (now - solve.solvedAt.getTime()) / MS_PER_DAY);
    for (const categorySlug of categories) {
      rows.push({
        categorySlug,
        difficulty: problem.difficulty,
        daysSinceSolved,
        quality: solve.quality ?? 1.0,
        solvedAt: solve.solvedAt,
      });
    }
  }

  const scores = computeCategoryScores(rows);
  await storage.upsertCategoryScores(
    studentId,
    Array.from(scores.values()).map((s) => ({
      categorySlug: s.categorySlug,
      estimatedScore: s.estimatedScore,
      confidenceLevel: s.confidenceLevel,
      adjustedScore: s.adjustedScore,
      evidencePoints: s.evidencePoints,
      solveCount: s.solveCount,
      lastSolvedAt: s.lastSolvedAt,
    }))
  );
}
