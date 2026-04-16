import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Cache the database in memory after first load (server-side only)
let _db: Record<string, Record<string, string[]>> | null = null;

function loadDB() {
  if (_db) return _db;
  const dbPath = path.join(process.cwd(), "data", "unified_medicines_database.json");
  const raw = fs.readFileSync(dbPath, "utf-8");
  _db = JSON.parse(raw);
  return _db!;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "40"), 100);
    const categoryFilter = searchParams.get("category") ?? ""; // Allopathic | Ayurvedic | Homeopathic | ""

    if (q.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const db = loadDB();
    const categories = categoryFilter
      ? [categoryFilter]
      : ["Allopathic", "Ayurvedic", "Homeopathic"];

    const results: { name: string; category: string }[] = [];

    for (const cat of categories) {
      if (!db[cat]) continue;
      const letterBuckets = db[cat];

      // Determine which letters to check — start with the query's first letter for speed,
      // then fall through to all letters for substring matches
      const firstLetter = q[0].toUpperCase();
      const bucketsToSearch =
        letterBuckets[firstLetter]
          ? { [firstLetter]: letterBuckets[firstLetter], ...letterBuckets }
          : letterBuckets;

      for (const [, names] of Object.entries(bucketsToSearch)) {
        for (const name of names) {
          if (name.toLowerCase().includes(q)) {
            results.push({ name, category: cat });
            if (results.length >= limit) break;
          }
        }
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    // Sort: exact prefix matches first, then alphabetically
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ results: results.slice(0, limit), total: results.length });
  } catch (error) {
    console.error("Medicine search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
