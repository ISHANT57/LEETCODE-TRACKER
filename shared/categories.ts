// Curated shortlist of LeetCode topic-tag slugs treated as "primary" categories for
// scoring/recommendations UI. LeetCode's own tag taxonomy has ~150 tags; most are
// long-tail (e.g. "reservoir-sampling") and would clutter a per-student score grid.
// This list is deliberately editable in one place — server (candidate categories for
// recommendations) and client (score grid + labels) both import from here.
export const PRIMARY_CATEGORIES: string[] = [
  "array",
  "string",
  "hash-table",
  "two-pointers",
  "sliding-window",
  "sorting",
  "binary-search",
  "stack",
  "linked-list",
  "tree",
  "binary-search-tree",
  "graph",
  "depth-first-search",
  "breadth-first-search",
  "dynamic-programming",
  "greedy",
  "backtracking",
  "heap-priority-queue",
  "trie",
  "union-find",
  "bit-manipulation",
  "math",
  "design",
  "recursion",
];

export const CATEGORY_LABELS: Record<string, string> = {
  "array": "Arrays",
  "string": "Strings",
  "hash-table": "Hash Table",
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  "sorting": "Sorting",
  "binary-search": "Binary Search",
  "stack": "Stack",
  "linked-list": "Linked List",
  "tree": "Trees",
  "binary-search-tree": "BST",
  "graph": "Graphs",
  "depth-first-search": "DFS",
  "breadth-first-search": "BFS",
  "dynamic-programming": "DP",
  "greedy": "Greedy",
  "backtracking": "Backtracking",
  "heap-priority-queue": "Heap",
  "trie": "Trie",
  "union-find": "Union-Find",
  "bit-manipulation": "Bit Manipulation",
  "math": "Math",
  "design": "Design",
  "recursion": "Recursion",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
