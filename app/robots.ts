import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Private pages are noindex rather than disallowed: Google must be able to crawl them to see that.
    rules: [
      { userAgent: "*", allow: "/" },
      // Crawlers that bring no visitors but render every page (each render costs ISR writes and CPU).
      { userAgent: ["GPTBot", "CCBot", "Bytespider", "ClaudeBot", "anthropic-ai", "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "DataForSeoBot", "Amazonbot"], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
