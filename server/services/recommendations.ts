import { storage } from "../storage";
import { PRIMARY_CATEGORIES, categoryLabel } from "@shared/categories";
import type { RecommendedProblem } from "@shared/schema";

const PER_BUCKET_LIMIT = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fundamental / Refresh / New recommendations for one student, computed
 * on-demand at dashboard-request time (cheap — only for the one student
 * viewing their page, unlike category scores which are cached for all
 * students at once for admin/batch dashboards).
 */
export async function getRecommendations(
  studentId: string
): Promise<{ fundamental: RecommendedProblem[]; refresh: RecommendedProblem[]; new: RecommendedProblem[] }> {
  const [scores, solves] = await Promise.all([
    storage.getStudentCategoryScores(studentId),
    storage.getStudentSolves(studentId),
  ]);

  const solvedSlugs = solves.map((s) => s.problemSlug);
  const scoreByCategory = new Map(scores.map((s) => [s.categorySlug, s]));

  // Candidate categories = curated primary list ∪ categories the student has
  // touched. A never-touched category has no score row, so the curated list
  // must be included or it would never surface as a "Fundamental" target.
  const candidateCategories = Array.from(new Set([...PRIMARY_CATEGORIES, ...Array.from(scoreByCategory.keys())]));

  // Weakest categories first (lowest adjustedScore, treating "no evidence" as 0).
  const weakestFirst = [...candidateCategories].sort((a, b) => {
    const scoreA = scoreByCategory.get(a)?.adjustedScore ?? 0;
    const scoreB = scoreByCategory.get(b)?.adjustedScore ?? 0;
    return scoreA - scoreB;
  });

  const fundamental: RecommendedProblem[] = [];
  const newProblems: RecommendedProblem[] = [];
  for (const categorySlug of weakestFirst) {
    if (fundamental.length >= PER_BUCKET_LIMIT && newProblems.length >= PER_BUCKET_LIMIT) break;

    if (fundamental.length < PER_BUCKET_LIMIT) {
      const popular = await storage.getProblemsForTagExcluding(categorySlug, solvedSlugs, {
        orderBy: "acRate",
        limit: 2,
      });
      for (const p of popular) {
        fundamental.push(toRecommendedProblem(p, categorySlug));
      }
    }

    if (newProblems.length < PER_BUCKET_LIMIT) {
      const random = await storage.getProblemsForTagExcluding(categorySlug, solvedSlugs, {
        orderBy: "random",
        limit: 2,
      });
      for (const p of random) {
        if (!fundamental.some((f) => f.titleSlug === p.titleSlug)) {
          newProblems.push(toRecommendedProblem(p, categorySlug));
        }
      }
    }
  }

  // Refresh: the student's own past solves, oldest-first (most decayed),
  // weighted toward categories with a low adjustedScore.
  const weakCategorySet = new Set(weakestFirst.slice(0, 5));
  const tags = await storage.getTagsForProblems(solvedSlugs);
  const tagsBySlug = new Map<string, string[]>();
  for (const t of tags) {
    const arr = tagsBySlug.get(t.problemSlug);
    if (arr) arr.push(t.tagSlug);
    else tagsBySlug.set(t.problemSlug, [t.tagSlug]);
  }

  const solvesWithWeakTag = solves
    .map((s) => {
      const solveTags = tagsBySlug.get(s.problemSlug) || [];
      const weakTag = solveTags.find((t) => weakCategorySet.has(t)) || solveTags[0];
      return { solve: s, weakTag };
    })
    .filter((s) => s.weakTag)
    .sort((a, b) => a.solve.solvedAt.getTime() - b.solve.solvedAt.getTime());

  const refresh: RecommendedProblem[] = [];
  for (const { solve, weakTag } of solvesWithWeakTag.slice(0, PER_BUCKET_LIMIT)) {
    const problem = await storage.getProblemBySlug(solve.problemSlug);
    if (!problem) continue;
    const daysSinceSolved = Math.max(0, Math.round((Date.now() - solve.solvedAt.getTime()) / MS_PER_DAY));
    refresh.push(toRecommendedProblem(problem, weakTag!, daysSinceSolved));
  }

  return {
    fundamental: fundamental.slice(0, PER_BUCKET_LIMIT),
    refresh,
    new: newProblems.slice(0, PER_BUCKET_LIMIT),
  };
}

function toRecommendedProblem(
  problem: { titleSlug: string; title: string; difficulty: string; acRate: number },
  categorySlug: string,
  daysSinceSolved?: number
): RecommendedProblem {
  return {
    titleSlug: problem.titleSlug,
    title: problem.title,
    difficulty: problem.difficulty,
    acRate: problem.acRate,
    categorySlug,
    categoryLabel: categoryLabel(categorySlug),
    ...(daysSinceSolved !== undefined ? { daysSinceSolved } : {}),
  };
}
