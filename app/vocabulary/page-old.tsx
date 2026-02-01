"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VocabularyWord } from "@/types/vocabulary";
import {
  loadVocabularyFromStorage,
  saveVocabularyToStorage,
  updateWordProgress,
} from "@/lib/vocabulary";
import { filterVocabulary, getFilterOptions } from "@/lib/stats";
import {
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleDot,
} from "lucide-react";

export default function VocabularyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    levels: [] as string[],
    functions: [] as string[],
  });

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "all",
    level: searchParams.get("level") || "all",
    progress: searchParams.get("progress") || "all",
    function: searchParams.get("function") || "all",
    search: searchParams.get("search") || "",
  });

  useEffect(() => {
    const stored = loadVocabularyFromStorage();
    setVocabulary(stored);
    setFilterOptions(getFilterOptions(stored));
  }, []);

  useEffect(() => {
    const filtered = filterVocabulary(vocabulary, filters);
    setFilteredWords(filtered);
  }, [vocabulary, filters]);

  const handleProgressChange = (wordId: string, progress: "new" | "learning" | "mastered") => {
    const updated = updateWordProgress(vocabulary, wordId, progress);
    setVocabulary(updated);
    saveVocabularyToStorage(updated);
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case "new":
        return <Circle className="w-5 h-5 text-red-500" />;
      case "learning":
        return <CircleDot className="w-5 h-5 text-yellow-500" />;
      case "mastered":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Vocabulary
          </h1>
          <p className="text-gray-600">
            {filteredWords.length} of {vocabulary.length} words
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search words..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="all">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              {/* Level Filter */}
              <Select
                value={filters.level}
                onChange={(e) =>
                  setFilters({ ...filters, level: e.target.value })
                }
              >
                <option value="all">All Levels</option>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>

              {/* Progress Filter */}
              <Select
                value={filters.progress}
                onChange={(e) =>
                  setFilters({ ...filters, progress: e.target.value })
                }
              >
                <option value="all">All Progress</option>
                <option value="new">New</option>
                <option value="learning">Learning</option>
                <option value="mastered">Mastered</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Word Cards */}
        {filteredWords.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">No words found</h2>
              <p className="text-gray-600">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredWords.map((word) => (
              <Card
                key={word.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {word.dutch}
                        </h2>
                        <Badge variant="outline">{word.level}</Badge>
                        <span className="text-sm text-gray-500 italic">
                          {word.pos}
                        </span>
                      </div>
                      <p className="text-lg text-gray-600 mb-3">
                        {word.english}
                      </p>
                    </div>

                    {/* Progress Buttons */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleProgressChange(word.id, "new")}
                        className={`p-2 rounded-lg transition-colors ${
                          word.progress === "new"
                            ? "bg-red-100"
                            : "hover:bg-gray-100"
                        }`}
                        title="Mark as New"
                      >
                        <Circle className="w-5 h-5 text-red-500" />
                      </button>
                      <button
                        onClick={() =>
                          handleProgressChange(word.id, "learning")
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          word.progress === "learning"
                            ? "bg-yellow-100"
                            : "hover:bg-gray-100"
                        }`}
                        title="Mark as Learning"
                      >
                        <CircleDot className="w-5 h-5 text-yellow-500" />
                      </button>
                      <button
                        onClick={() =>
                          handleProgressChange(word.id, "mastered")
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          word.progress === "mastered"
                            ? "bg-green-100"
                            : "hover:bg-gray-100"
                        }`}
                        title="Mark as Mastered"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </button>
                    </div>
                  </div>

                  {/* Example */}
                  {word.example && (word.example.nl || word.example.en) && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-3">
                      {word.example.nl && (
                        <p className="italic text-gray-900 mb-1">
                          "{word.example.nl}"
                        </p>
                      )}
                      {word.example.en && (
                        <p className="text-sm text-gray-600">
                          {word.example.en}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Categories & Tags */}
                  <div className="flex flex-wrap gap-2">
                    {word.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                    {word.functions?.map((func) => (
                      <Badge key={func} variant="outline">
                        {func}
                      </Badge>
                    ))}
                  </div>

                  {/* Notes */}
                  {word.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Note:</span>{" "}
                        {word.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
