import { storage } from "../storage";

const GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const PROBLEMSET_QUERY = `
  query problemsetQuestionListV2($filters: QuestionFilterInput, $limit: Int, $skip: Int, $categorySlug: String) {
    problemsetQuestionListV2(filters: $filters, limit: $limit, skip: $skip, categorySlug: $categorySlug) {
      questions {
        titleSlug
        title
        questionFrontendId
        difficulty
        acRate
        paidOnly
        topicTags {
          name
          slug
        }
      }
      totalLength
    }
  }
`;

interface ProblemsetQuestion {
  titleSlug: string;
  title: string;
  questionFrontendId: string;
  difficulty: string;
  acRate: number;
  paidOnly: boolean;
  topicTags: { name: string; slug: string }[];
}

interface ProblemsetResponse {
  data: {
    problemsetQuestionListV2: {
      questions: ProblemsetQuestion[];
      totalLength: number;
    } | null;
  };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 60; // safety cap well above the ~34 pages needed for LeetCode's ~3,400 problems

class ProblemsCatalogService {
  private async fetchPage(skip: number): Promise<ProblemsetQuestion[]> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        query: PROBLEMSET_QUERY,
        variables: {
          limit: PAGE_SIZE,
          skip,
          categorySlug: "",
          filters: { filterCombineType: "ALL" },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`LeetCode problemset API error: ${response.status}`);
    }

    const data: ProblemsetResponse = await response.json();
    return data.data?.problemsetQuestionListV2?.questions || [];
  }

  /** Paginated bulk sync of LeetCode's public problem catalog + topic tags. */
  async syncCatalog(): Promise<{ upserted: number; pages: number }> {
    let skip = 0;
    let upserted = 0;
    let pages = 0;

    while (pages < MAX_PAGES) {
      const questions = await this.fetchPage(skip);
      if (questions.length === 0) break;

      const problemRows = questions.map((q) => ({
        titleSlug: q.titleSlug,
        questionFrontendId: q.questionFrontendId,
        title: q.title,
        difficulty: q.difficulty,
        acRate: Math.round((q.acRate || 0) * 100),
        paidOnly: q.paidOnly,
      }));
      const tagRows = questions.flatMap((q) =>
        q.topicTags.map((t) => ({
          problemSlug: q.titleSlug,
          tagSlug: t.slug,
          tagName: t.name,
        }))
      );

      await storage.upsertProblems(problemRows);
      await storage.upsertProblemTags(tagRows);

      upserted += questions.length;
      pages += 1;
      skip += PAGE_SIZE;

      if (questions.length < PAGE_SIZE) break;
    }

    return { upserted, pages };
  }

  /** Bootstrap-once check: run a full catalog sync only if the local catalog is empty. */
  async syncIfEmpty(): Promise<void> {
    const count = await storage.getAllProblemsCount();
    if (count > 0) return;
    console.log("Problems catalog is empty — running initial catalog sync...");
    try {
      const result = await this.syncCatalog();
      console.log(`Problems catalog synced: ${result.upserted} problems across ${result.pages} pages.`);
    } catch (error) {
      console.error("Initial problems catalog sync failed:", error);
    }
  }

  /** Fallback lookup for a single problem not yet in the local catalog. */
  async fetchAndUpsertProblem(titleSlug: string): Promise<boolean> {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify({
          query: `query question($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              questionFrontendId
              title
              titleSlug
              difficulty
              topicTags { name slug }
            }
          }`,
          variables: { titleSlug },
        }),
      });

      if (!response.ok) return false;
      const data = await response.json();
      const q = data?.data?.question;
      if (!q) return false;

      await storage.upsertProblems([
        {
          titleSlug: q.titleSlug,
          questionFrontendId: q.questionFrontendId,
          title: q.title,
          difficulty: q.difficulty,
          acRate: 0, // not returned by this single-problem query; catalog sync will backfill it
          paidOnly: false,
        },
      ]);
      await storage.upsertProblemTags(
        (q.topicTags || []).map((t: { name: string; slug: string }) => ({
          problemSlug: q.titleSlug,
          tagSlug: t.slug,
          tagName: t.name,
        }))
      );
      return true;
    } catch (error) {
      console.warn(`Catalog-miss fallback failed for ${titleSlug}:`, error);
      return false;
    }
  }
}

export const problemsCatalogService = new ProblemsCatalogService();
