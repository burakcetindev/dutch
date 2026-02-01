// Data types for Dutch vocabulary app

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "A1-A2" | "B1-B2" | "C1-C2";

export type ProgressStatus = "new" | "learning" | "mastered";

export interface VocabularyWord {
  id: string;
  dutch: string;
  english: string;
  pos: string; // part of speech
  level: CEFRLevel;
  categories: string[];
  functions?: string[];
  contexts?: string[];
  grammar?: {
    present?: string;
    past?: string;
    future?: string;
    separable?: boolean;
    [key: string]: string | boolean | undefined;
  };
  example?: {
    nl: string;
    en: string;
  };
  practice?: string[]; // Custom practice sentences added by user
  progress: ProgressStatus;
  notes?: string;
  createdAt?: string;
  lastReviewed?: string;
}

export interface VocabularyStats {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  byLevel: Record<CEFRLevel, number>;
  byCategory: Record<string, number>;
}

export interface ExcelRow {
  Dutch?: string;
  English?: string;
  "Part of Speech"?: string;
  Level?: string;
  Categories?: string;
  Functions?: string;
  Contexts?: string;
  "Example (NL)"?: string;
  "Example (EN)"?: string;
  Progress?: string;
  Notes?: string;
  [key: string]: string | undefined;
}
