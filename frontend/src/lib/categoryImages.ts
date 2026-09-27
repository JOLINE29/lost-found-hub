const CATEGORY_IMAGES: Record<string, string> = {
  Electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
  Bags:        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  Documents:   "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&q=80",
  Clothing:    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
  Accessories: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80",
  Keys:        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  Wallet:      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
  Other:       "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=600&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=600&q=80";

export function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] ?? DEFAULT_IMAGE;
}
