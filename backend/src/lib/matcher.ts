import { Item } from "@prisma/client";

const CATEGORY_WEIGHT = 0.30;
const LOCATION_WEIGHT = 0.25;
const DATE_WEIGHT = 0.20;
const KEYWORD_WEIGHT = 0.15;
const OTHER_WEIGHT = 0.10;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}

function keywordOverlap(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

function locationScore(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1;
  const wordsA = tokenize(la);
  const wordsB = tokenize(lb);
  const shared = wordsA.filter(w => wordsB.includes(w)).length;
  return shared / Math.max(wordsA.length, wordsB.length);
}

function dateScore(a: Date, b: Date): number {
  const diffDays = Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 1;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.2;
  return 0;
}

export function computeMatchScore(lost: Item, found: Item): number {
  const categoryMatch = lost.category.toLowerCase() === found.category.toLowerCase() ? 1 : 0;
  const locScore = locationScore(lost.location, found.location);
  const dScore = dateScore(lost.dateLostFound, found.dateLostFound);
  const kwScore = keywordOverlap(lost.title + " " + lost.description, found.title + " " + found.description);
  const otherScore = keywordOverlap(lost.description, found.description);

  return (
    categoryMatch * CATEGORY_WEIGHT +
    locScore * LOCATION_WEIGHT +
    dScore * DATE_WEIGHT +
    kwScore * KEYWORD_WEIGHT +
    otherScore * OTHER_WEIGHT
  );
}
