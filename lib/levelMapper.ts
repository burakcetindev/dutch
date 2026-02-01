// Map individual CEFR levels to grouped levels
export function mapToGroupedLevel(level: string): string {
  const levelUpper = level.toUpperCase();
  
  if (levelUpper === 'A1' || levelUpper === 'A2') return 'A1-A2';
  if (levelUpper === 'B1' || levelUpper === 'B2') return 'B1-B2';
  if (levelUpper === 'C1' || levelUpper === 'C2') return 'C1-C2';
  
  // Default to A1-A2 if unknown
  return 'A1-A2';
}

// Check if a word's grouped level matches the filter
export function matchesGroupedLevel(wordLevel: string, filterLevel: string): boolean {
  if (filterLevel === 'all') return true;
  
  // Handle comma-separated levels from URL (e.g., "A1,A2")
  if (filterLevel.includes(',')) {
    const levels = filterLevel.split(',').map(l => l.trim());
    // Convert individual levels to grouped
    const groupedLevels = levels.map(mapToGroupedLevel);
    return groupedLevels.includes(wordLevel);
  }
  
  return wordLevel === filterLevel;
}
