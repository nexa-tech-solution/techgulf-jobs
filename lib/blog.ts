/**
 * Blog posts live in the Firestore `posts` collection (document id = slug).
 * Body syntax (one string per block): "## Heading", "- list item", anything else = paragraph.
 */
export type BlogCategory = "ai" | "dev" | "security" | "cloud" | "career";

export interface Post {
  slug: string;
  title: string;
  summary: string;
  category: BlogCategory;
  date: string; // YYYY-MM-DD
  author: string;
  hot?: boolean;
  /** Cover image: put a 16:9 file in /public/blog/ (≥1600px wide). Defaults to /blog/<slug>.jpg */
  cover?: string;
  coverAlt: string;
  tags: string[];
  body: string[];
}

export const BLOG_CATEGORIES: BlogCategory[] = ["ai", "dev", "security", "cloud", "career"];
export const coverOf = (p: Post) => p.cover ?? `/blog/${p.slug}.jpg`;
