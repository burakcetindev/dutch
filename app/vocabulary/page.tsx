"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VocabularyWord } from "@/types/vocabulary";
import { VocabularyCard } from "@/src/components/vocabulary/VocabularyCard";
import {
  loadVocabularyFromStorage,
  saveVocabularyToStorage,
  updateWordProgress,
} from "@/lib/vocabulary";
import { filterVocabulary, getFilterOptions } from "@/lib/stats";
import {
  ArrowLeft,
  Search,
  SortAsc,
  SortDesc,
  BookOpen,
  Sparkles,
} from "lucide-react";

type SortBy = "alphabetical" | "category" | "progress" | "level";
type SortOrder = "asc" | "desc";

function VocabularyContent() {
  const searchParams = useSearchParams();

  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
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

  const [sortBy, setSortBy] = useState<SortBy>("alphabetical");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Update filters when URL params change
  useEffect(() => {
    setFilters({
      category: searchParams.get("category") || "all",
      level: searchParams.get("level") || "all",
      progress: searchParams.get("progress") || "all",
      function: searchParams.get("function") || "all",
      search: searchParams.get("search") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/vocabulary-db");
        if (!response.ok) {
          throw new Error('Database request failed');
        }
        
        const data = await response.json();
        setVocabulary(data.vocabulary || []);
        setFilterOptions(getFilterOptions(data.vocabulary || []));
      } catch (error) {
        console.error("Error loading from database:", error);
        alert("Failed to load data from database. Please return to home and reload.");
      }
    };
    
    loadData();
  }, []);

  const handleProgressChange = async (wordId: string, progress: "new" | "learning" | "mastered") => {
    const updated = updateWordProgress(vocabulary, wordId, progress);
    setVocabulary(updated);
    saveVocabularyToStorage(updated);
    
    // Save to database
    try {
      await fetch("/api/vocabulary-db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wordId, updates: { progress } })
      });
    } catch (error) {
      console.error("Error updating progress in database:", error);
    }
  };

  const handlePracticeAdd = async (wordId: string, sentence: string) => {
    const updated = vocabulary.map(word => {
      if (word.id === wordId) {
        return {
          ...word,
          practice: [...(word.practice || []), sentence]
        };
      }
      return word;
    });
    setVocabulary(updated);
    
    // Save to database
    try {
      const word = updated.find(w => w.id === wordId);
      if (word) {
        await fetch("/api/vocabulary-db", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: wordId, updates: { practice: word.practice } })
        });
      }
    } catch (error) {
      console.error("Error updating practice in database:", error);
    }
  };

  const handlePracticeRemove = async (wordId: string, index: number) => {
    const updated = vocabulary.map(word => {
      if (word.id === wordId) {
        const newPractice = [...(word.practice || [])];
        newPractice.splice(index, 1);
        return {
          ...word,
          practice: newPractice
        };
      }
      return word;
    });
    setVocabulary(updated);
    
    // Save to database
    try {
      const word = updated.find(w => w.id === wordId);
      if (word) {
        await fetch("/api/vocabulary-db", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: wordId, updates: { practice: word.practice } })
        });
      }
    } catch (error) {
      console.error("Error updating practice in database:", error);
    }
  };

  // Helper function to show toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const colors = {
      success: 'linear-gradient(to right, #10b981, #059669)',
      error: 'linear-gradient(to right, #ef4444, #dc2626)',
      info: 'linear-gradient(to right, #3b82f6, #2563eb)'
    };
    
    const Toast = document.createElement('div');
    Toast.textContent = message;
    Toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${colors[type]}; color: white; padding: 12px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 600; animation: slideIn 0.3s ease;`;
    document.body.appendChild(Toast);
    setTimeout(() => {
      Toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => Toast.remove(), 300);
    }, 2500);
  };

  const handleEdit = async (wordId: string, updates: Partial<VocabularyWord>) => {
    const word = vocabulary.find(w => w.id === wordId);
    const wordName = word?.dutch || 'Word';
    
    const updated = vocabulary.map(w => {
      if (w.id === wordId) {
        return { ...w, ...updates };
      }
      return w;
    });
    setVocabulary(updated);
    
    // Save to database
    try {
      const response = await fetch("/api/vocabulary-db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wordId, updates })
      });
      
      if (response.ok) {
        showToast(`✨ "${wordName}" is modified in the library`, 'success');
      } else {
        throw new Error('Failed to update word');
      }
    } catch (error) {
      console.error("Error updating word in database:", error);
      showToast(`❌ Failed to modify "${wordName}"`, 'error');
      // Restore original word
      if (word) {
        setVocabulary(vocabulary);
      }
    }
  };

  const handleDelete = async (wordId: string) => {
    const word = vocabulary.find(w => w.id === wordId);
    const wordName = word?.dutch || 'Word';
    const updated = vocabulary.filter(w => w.id !== wordId);
    setVocabulary(updated);
    
    // Delete from database
    try {
      const response = await fetch(`/api/vocabulary-db?id=${wordId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        showToast(`🗑️ "${wordName}" is deleted from the library`, 'info');
      } else {
        throw new Error('Failed to delete word');
      }
    } catch (error) {
      console.error("Error deleting word from database:", error);
      showToast(`❌ Failed to delete "${wordName}"`, 'error');
      // Restore the word if database delete failed
      if (word) {
        setVocabulary([...updated, word]);
      }
    }
  };

  const filteredAndSortedWords = useMemo(() => {
    let filtered = filterVocabulary(vocabulary, filters);

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "alphabetical":
          comparison = a.dutch.localeCompare(b.dutch);
          break;
        case "category":
          const catA = a.categories[0] || "";
          const catB = b.categories[0] || "";
          comparison = catA.localeCompare(catB);
          break;
        case "progress":
          const progressOrder = { new: 0, learning: 1, mastered: 2 };
          comparison = progressOrder[a.progress] - progressOrder[b.progress];
          break;
        case "level":
          comparison = a.level.localeCompare(b.level);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [vocabulary, filters, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button className="glass px-6 py-3 hover:scale-105 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-800 dark:text-gray-200" />
              <span className="text-gray-800 dark:text-gray-200 font-semibold">Back to Dashboard</span>
            </Button>
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                Dutch Vocab
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-2">
                {filteredAndSortedWords.length} of {vocabulary.length} words
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search words..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 glass border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="glass border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>

            {/* Level Filter */}
            <Select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="glass border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Levels</option>
              <option value="A1-A2">A1-A2</option>
              <option value="B1-B2">B1-B2</option>
              <option value="C1-C2">C1-C2</option>
            </Select>

            {/* Progress Filter */}
            <Select
              value={filters.progress}
              onChange={(e) => setFilters({ ...filters, progress: e.target.value })}
              className="glass border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Progress</option>
              <option value="new">New</option>
              <option value="learning">Learning</option>
              <option value="mastered">Mastered</option>
            </Select>

            {/* Sort */}
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="glass border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200 flex-1"
              >
                <option value="alphabetical">A-Z</option>
                <option value="category">Category</option>
                <option value="progress">Progress</option>
                <option value="level">Level</option>
              </Select>
              <button
                onClick={toggleSortOrder}
                className="glass px-4 rounded-md border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-105 transition-all"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                ) : (
                  <SortDesc className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Word Cards */}
        {filteredAndSortedWords.length === 0 ? (
          <div className="glass-card p-12 text-center bg-white/90">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              No words found
            </h2>
            <p className="text-gray-600">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredAndSortedWords.map((word) => (
              <VocabularyCard
                key={word.id}
                word={word}
                onProgressChange={handleProgressChange}
                onPracticeAdd={handlePracticeAdd}
                onPracticeRemove={handlePracticeRemove}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-2xl text-purple-600">Loading...</div></div>}>
      <VocabularyContent />
    </Suspense>
  );
}
