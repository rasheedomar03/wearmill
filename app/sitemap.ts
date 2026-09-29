import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wearmill.com";
  const now = new Date().toISOString();

  const blogPosts = [
    { slug: "screen-printing-houston-tx",            date: "2026-06-09" },
    { slug: "custom-t-shirt-pricing-2026",           date: "2026-06-02" },
    { slug: "screen-printing-vs-embroidery-vs-dtg",  date: "2026-05-26" },
    { slug: "how-to-order-custom-t-shirts",          date: "2026-05-19" },
    { slug: "promotional-products-for-trade-shows",  date: "2026-05-12" },
  ];

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/personal`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/privacy`,
      lastModified: "2026-05-23",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: "2026-05-23",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
