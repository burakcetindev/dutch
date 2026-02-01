import { VocabularyWord, VocabularyStats, CEFRLevel } from "@/types/vocabulary";

/**
 * Calculate statistics from vocabulary data
 */
export function calculateStats(vocabulary: VocabularyWord[]): VocabularyStats {
  const stats: VocabularyStats = {
    total: vocabulary.length,
    new: 0,
    learning: 0,
    mastered: 0,
    byLevel: {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      "A1-A2": 0,
      "B1-B2": 0,
      "C1-C2": 0,
    },
    byCategory: {},
  };

  vocabulary.forEach((word) => {
    // Count by progress
    if (word.progress === "new") stats.new++;
    else if (word.progress === "learning") stats.learning++;
    else if (word.progress === "mastered") stats.mastered++;

    // Count by level
    if (word.level in stats.byLevel) {
      stats.byLevel[word.level as CEFRLevel]++;
    }

    // Count by category
    word.categories.forEach((category) => {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
  });

  return stats;
}

/**
 * Filter vocabulary by various criteria
 */
export function filterVocabulary(
  vocabulary: VocabularyWord[],
  filters: {
    category?: string;
    level?: string;
    progress?: string;
    search?: string;
    function?: string;
  }
): VocabularyWord[] {
  let filtered = [...vocabulary];

  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter((word) =>
      word.categories.includes(filters.category!)
    );
  }

  if (filters.level && filters.level !== "all") {
    // Filter by grouped level (A1-A2, B1-B2, C1-C2)
    filtered = filtered.filter((word) => word.level === filters.level);
  }

  if (filters.progress && filters.progress !== "all") {
    filtered = filtered.filter((word) => word.progress === filters.progress);
  }

  if (filters.function && filters.function !== "all") {
    filtered = filtered.filter(
      (word) => word.functions && word.functions.includes(filters.function!)
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (word) =>
        word.dutch.toLowerCase().includes(searchLower) ||
        word.english.toLowerCase().includes(searchLower) ||
        word.example?.nl.toLowerCase().includes(searchLower) ||
        word.example?.en.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Get unique values for filters
 */
export function getFilterOptions(vocabulary: VocabularyWord[]) {
  const categories = new Set<string>();
  const levels = new Set<CEFRLevel>();
  const functions = new Set<string>();

  vocabulary.forEach((word) => {
    word.categories.forEach((cat) => categories.add(cat));
    levels.add(word.level);
    word.functions?.forEach((func) => functions.add(func));
  });

  return {
    categories: Array.from(categories).sort(),
    levels: Array.from(levels).sort(),
    functions: Array.from(functions).sort(),
  };
}
