"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VocabularyWord, VocabularyStats } from "@/types/vocabulary";
import {
  parseExcelToVocabulary,
  exportVocabularyToExcel,
  loadVocabularyFromStorage,
  saveVocabularyToStorage,
} from "@/lib/vocabulary";
import { calculateStats } from "@/lib/stats";
import {
  BookOpen,
  Upload,
  Download,
  BarChart3,
  BookMarked,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";

export default function Home() {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-load vocabulary from input folder on first mount
    const loadInitialVocabulary = async () => {
      setIsLoading(true);
      
      // Check if we already have vocabulary in storage
      const stored = loadVocabularyFromStorage();
      
      if (stored.length === 0) {
        // No vocabulary in storage, try to load from server
        try {
          const response = await fetch("/api/vocabulary");
          if (response.ok) {
            const data = await response.json();
            if (data.vocabulary && data.vocabulary.length > 0) {
              setVocabulary(data.vocabulary);
              saveVocabularyToStorage(data.vocabulary);
              setStats(calculateStats(data.vocabulary));
              console.log(`Loaded ${data.totalWords} words from ${data.filesProcessed} Excel files`);
            }
          }
        } catch (error) {
          console.error("Error loading vocabulary from server:", error);
        }
      } else {
        // Use stored vocabulary
        setVocabulary(stored);
        setStats(calculateStats(stored));
      }
      
      setIsLoading(false);
    };

    loadInitialVocabulary();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const newVocabulary = await parseExcelToVocabulary(file);
      
      // Merge with existing vocabulary (avoid duplicates by ID)
      const merged = [...vocabulary];
      newVocabulary.forEach((newWord) => {
        const existingIndex = merged.findIndex((w) => w.id === newWord.id);
        if (existingIndex >= 0) {
          // Update existing word
          merged[existingIndex] = { ...merged[existingIndex], ...newWord };
        } else {
          // Add new word
          merged.push(newWord);
        }
      });

      setVocabulary(merged);
      saveVocabularyToStorage(merged);
      setStats(calculateStats(merged));
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      alert("Error parsing Excel file. Please check the format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (vocabulary.length === 0) {
      alert("No vocabulary to export!");
      return;
    }
    exportVocabularyToExcel(vocabulary);
  };

  const handleReloadFromInput = async () => {
    if (!confirm("This will reload all vocabulary from the input folder. Continue?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/vocabulary");
      if (response.ok) {
        const data = await response.json();
        if (data.vocabulary && data.vocabulary.length > 0) {
          setVocabulary(data.vocabulary);
          saveVocabularyToStorage(data.vocabulary);
          setStats(calculateStats(data.vocabulary));
          alert(`Loaded ${data.totalWords} words from ${data.filesProcessed} Excel files!`);
        }
      } else {
        alert("No Excel files found in input folder");
      }
    } catch (error) {
      console.error("Error reloading vocabulary:", error);
      alert("Error loading vocabulary from input folder");
    } finally {
      setIsLoading(false);
    }
  };

  const topCategories = stats
    ? Object.entries(stats.byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dutch Vocabulary 🇳🇱
            </h1>
            <p className="text-gray-600">
              Learn Dutch vocabulary organized like Duolingo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReloadFromInput}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Input Files
            </Button>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" type="button">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {!isLoading && vocabulary.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">No vocabulary loaded</h2>
              <p className="text-gray-600 mb-4">
                Upload an Excel file to get started learning Dutch!
              </p>
              <label htmlFor="file-upload-empty" className="cursor-pointer">
                <Button type="button">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Excel File
                </Button>
              </label>
              <input
                id="file-upload-empty"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {!isLoading && stats && vocabulary.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Words</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>New</CardDescription>
                  <CardTitle className="text-3xl text-red-600">
                    {stats.new}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Learning</CardDescription>
                  <CardTitle className="text-3xl text-yellow-600">
                    {stats.learning}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Mastered</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {stats.mastered}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Link href="/vocabulary">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                      <div>
                        <CardTitle>Browse Vocabulary</CardTitle>
                        <CardDescription>
                          View and filter all your words
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/vocabulary?view=practice">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BookMarked className="w-8 h-8 text-green-600" />
                      <div>
                        <CardTitle>Practice Mode</CardTitle>
                        <CardDescription>
                          Review words you're learning
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            {/* Categories */}
            {topCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {topCategories.map(([category, count]) => (
                      <Link
                        key={category}
                        href={`/vocabulary?category=${encodeURIComponent(
                          category
                        )}`}
                      >
                        <div className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
                          <p className="font-semibold capitalize">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {count} words
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Levels Distribution */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>CEFR Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map(
                    (level) => (
                      <Link
                        key={level}
                        href={`/vocabulary?level=${level}`}
                        className="flex-1 min-w-[100px]"
                      >
                        <div className="border rounded-lg p-4 text-center hover:bg-accent transition-colors cursor-pointer">
                          <p className="text-2xl font-bold">{level}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.byLevel[level]} words
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
