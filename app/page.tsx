"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VocabularyWord, VocabularyStats } from "@/types/vocabulary";
import { AddWordModal } from "@/src/components/vocabulary/AddWordModal";
import {
  loadVocabularyFromStorage,
  saveVocabularyToStorage,
  parseFileToVocabulary,
  exportVocabularyToCSV,
  exportVocabularyToJSON,
} from "@/lib/vocabulary";
import { calculateStats } from "@/lib/stats";
import {
  BookOpen,
  Upload,
  Download,
  BarChart3,
  BookMarked,
  Sparkles,
  TrendingUp,
  PlusCircle,
  Save,
  FileText,
  Braces,
} from "lucide-react";

const ThemeToggleButton = dynamic(
  () => import("@/src/components/ThemeToggleButton").then((mod) => ({ default: mod.ThemeToggleButton })),
  { ssr: false }
);

export default function Home() {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch("/api/vocabulary-db");
        if (!response.ok) {
          throw new Error('Database request failed');
        }
        
        const data = await response.json();
        setVocabulary(data.vocabulary || []);
        saveVocabularyToStorage(data.vocabulary || []);
        setStats(calculateStats(data.vocabulary || []));
      } catch (error) {
        console.error("Error loading from database:", error);
        alert("Failed to load data from database. Please check your connection and try reloading.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const newVocabulary = await parseFileToVocabulary(file);
      
      // Send to API for duplicate-checked insertion
      const response = await fetch("/api/vocabulary-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: newVocabulary })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Reload from database to get updated list
        const dbResponse = await fetch("/api/vocabulary-db");
        if (dbResponse.ok) {
          const data = await dbResponse.json();
          setVocabulary(data.vocabulary || []);
          saveVocabularyToStorage(data.vocabulary || []);
          setStats(calculateStats(data.vocabulary || []));
        }
        
        // Show results
        let message = `✅ Import complete!\n\n`;
        message += `Inserted: ${result.inserted} new words\n`;
        message += `Updated: ${result.updated} words (better examples/practice)\n`;
        message += `Skipped: ${result.skipped} words (no new data)`;
        
        if (result.updatedWords && result.updatedWords.length > 0) {
          const updateList = result.updatedWords.slice(0, 5).join(', ');
          const more = result.updatedWords.length > 5 ? ` (+${result.updatedWords.length - 5} more)` : '';
          message += `\n\nUpdated words: ${updateList}${more}`;
        }
        
        alert(message);
      } else {
        const error = await response.json();
        alert(`Failed to import: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error parsing file. Please check the format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (vocabulary.length === 0) {
      alert("No vocabulary to export!");
      return;
    }
    exportVocabularyToCSV(vocabulary);
  };

  const handleExportJSON = () => {
    if (vocabulary.length === 0) {
      alert("No vocabulary to export!");
      return;
    }
    exportVocabularyToJSON(vocabulary);
  };

  const handleAddWord = async (newWord: VocabularyWord) => {
    try {
      // Save to database
      const response = await fetch("/api/vocabulary-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [newWord] })
      });
      
      if (response.ok) {
        const updated = [...vocabulary, newWord];
        setVocabulary(updated);
        saveVocabularyToStorage(updated);
        setStats(calculateStats(updated));
        
        // Show success toast
        const { showToast } = await import('@/lib/toast');
        showToast({
          message: `"${newWord.dutch}" added successfully!`,
          type: 'success',
          duration: 3000
        });
      } else {
        const error = await response.json();
        const { showToast } = await import('@/lib/toast');
        if (error.duplicateWords && error.duplicateWords.length > 0) {
          showToast({
            message: `Word "${error.duplicateWords[0]}" already exists!`,
            type: 'error',
            duration: 3000
          });
        } else {
          showToast({
            message: "Failed to add word to database",
            type: 'error',
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error("Error adding word:", error);
      const { showToast } = await import('@/lib/toast');
      showToast({
        message: "Failed to add word",
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      // Load from database (current state with all edits)
      const response = await fetch("/api/vocabulary-db");
      if (!response.ok) {
        throw new Error('Failed to load from database');
      }
      
      const data = await response.json();
      if (data.vocabulary && data.vocabulary.length > 0) {
        setVocabulary(data.vocabulary);
        saveVocabularyToStorage(data.vocabulary);
        setStats(calculateStats(data.vocabulary));
        
        const { showToast } = await import('@/lib/toast');
        showToast({
          message: `Reloaded ${data.vocabulary.length} words from database!`,
          type: 'success',
          duration: 3000
        });
      } else {
        const { showToast } = await import('@/lib/toast');
        showToast({
          message: "No vocabulary found in database. Add some words first!",
          type: 'warning',
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error reloading:", error);
      const { showToast } = await import('@/lib/toast');
      showToast({
        message: "Failed to reload data from database.",
        type: 'error',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveState = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/save-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabulary })
      });
      
      if (response.ok) {
        const data = await response.json();
        const { showToast } = await import('@/lib/toast');
        showToast({
          message: `Saved ${data.saved} words to database!`,
          type: 'success',
          duration: 3000
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to save state (${response.status})`);
      }
    } catch (error) {
      console.error("Error saving state:", error);
      const { showToast } = await import('@/lib/toast');
      showToast({
        message: `Failed to save state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        duration: 3000
      });
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background blobs - Enhanced with more blobs */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-6000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-8000"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-rose-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-10000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-in-top">
          <div className="inline-flex items-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-yellow-500 dark:text-yellow-400 animate-float drop-shadow-lg" />
            <h1 className="text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl">
              Dutch Vocab
            </h1>
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">
            Learn Dutch vocabulary with elegance and style
          </p>
          {/* Level Filter Pills */}
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/vocabulary?level=A1-A2" className="glass-card px-6 py-2 hover:scale-110 transition-transform duration-300 animate-bounce-in">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                A1-A2
              </span>
            </Link>
            <Link href="/vocabulary?level=B1-B2" className="glass-card px-6 py-2 hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.1s'}}>
              <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                B1-B2
              </span>
            </Link>
            <Link href="/vocabulary?level=C1-C2" className="glass-card px-6 py-2 hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.2s'}}>
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                C1-C2
              </span>
            </Link>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap items-center">
          {/* Import Dropdown */}
          <div className="relative group">
            <button className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
              <Upload className="w-5 h-5 text-gray-800 dark:text-gray-200 group-hover:scale-110 transition-transform" />
              <span className="text-gray-800 dark:text-gray-200 font-semibold">Import</span>
            </button>
            <div className="absolute top-full mt-2 left-0 w-56 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 animate-slide-in-top">
              <label htmlFor="file-upload-csv" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-all duration-200 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center hover:rotate-6 transition-transform duration-500">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Import from CSV</span>
              </label>
              <label htmlFor="file-upload-json" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-all duration-200 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center hover:rotate-6 transition-transform duration-500">
                  <Braces className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Import from JSON</span>
              </label>
            </div>
          </div>
          <input id="file-upload-csv" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <input id="file-upload-json" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
              <Download className="w-5 h-5 text-gray-800 dark:text-gray-200 group-hover:scale-110 transition-transform" />
              <span className="text-gray-800 dark:text-gray-200 font-semibold">Export</span>
            </button>
            <div className="absolute top-full mt-2 left-0 w-56 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 animate-slide-in-top">
              <button onClick={handleExportCSV} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 w-full transition-all duration-200 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center hover:rotate-6 transition-transform duration-500">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Export as CSV</span>
              </button>
              <button onClick={handleExportJSON} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 w-full transition-all duration-200 hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center hover:rotate-6 transition-transform duration-500">
                  <Braces className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Export as JSON</span>
              </button>
            </div>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add Word
            </div>
          </button>

          <button onClick={handleReload} className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Reload
            </div>
          </button>

          <button onClick={handleSaveState} className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Save State
            </div>
          </button>

          <div className="w-px h-8 bg-purple-300 dark:bg-purple-700"></div>

          <ThemeToggleButton />

          <Link href="/about" className="glass-card px-6 py-3 hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
              <BookOpen className="w-5 h-5" />
              About Me
            </div>
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-16 h-16 border-4 border-purple-300 border-t-purple-600 dark:border-purple-700 dark:border-t-purple-400 rounded-full animate-spin"></div>
            <p className="text-gray-800 dark:text-gray-200 mt-4 font-semibold">Loading...</p>
          </div>
        )}

        {!isLoading && vocabulary.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Sparkles className="w-20 h-20 mx-auto mb-4 text-purple-500" />
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              No vocabulary loaded
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload a CSV or JSON file to start your learning journey!
            </p>
          </div>
        )}

        {!isLoading && stats && vocabulary.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Total Words */}
              <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex flex-col justify-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 text-center">Total Words</div>
                <div className="text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center leading-none">{stats.total}</div>
              </div>
              
              {/* Current Status */}
              <div className="glass-card p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex flex-col justify-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3 text-center">Current Status</div>
                <div className="text-6xl font-black text-gray-800 dark:text-gray-200 text-center leading-none">
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.learning}</span>
                  <span className="text-gray-400 dark:text-gray-600 mx-4">|</span>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.mastered}</span>
                </div>
              </div>

              {/* Word Level - Category details with segmented battery */}
              <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group relative">
                <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-3">Word Level</div>
                <div className="space-y-3">
                  {/* A1-A2 Segmented Battery */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">A1-A2 WORDS</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {vocabulary.filter(w => w.level === 'A1-A2').length}
                      </span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                      {(() => {
                        const total = vocabulary.filter(w => w.level === 'A1-A2').length;
                        const mastered = vocabulary.filter(w => w.level === 'A1-A2' && w.progress === 'mastered').length;
                        const learning = vocabulary.filter(w => w.level === 'A1-A2' && w.progress === 'learning').length;
                        const newCount = vocabulary.filter(w => w.level === 'A1-A2' && w.progress === 'new').length;
                        const masteredPct = mastered > 0 ? Math.max(5, (mastered / Math.max(1, total)) * 100) : 0;
                        const learningPct = learning > 0 ? Math.max(5, (learning / Math.max(1, total)) * 100) : 0;
                        const newPct = newCount > 0 ? Math.max(5, (newCount / Math.max(1, total)) * 100) : 0;
                        return (<>
                          {newCount > 0 && <div className="bg-blue-700 dark:bg-blue-900 transition-all duration-500" style={{width: `${newPct}%`}} title={`New: ${newCount}`} />}
                          {mastered > 0 && <div className="bg-blue-100 dark:bg-blue-300 transition-all duration-500" style={{width: `${masteredPct}%`}} title={`Mastered: ${mastered}`} />}
                          {learning > 0 && <div className="bg-blue-400 dark:bg-blue-500 transition-all duration-500" style={{width: `${learningPct}%`}} title={`Learning: ${learning}`} />}
                        </>);
                      })()}
                    </div>
                  </div>
                  
                  {/* B1-B2 Segmented Battery */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">B1-B2 WORDS</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {vocabulary.filter(w => w.level === 'B1-B2').length}
                      </span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                      {(() => {
                        const total = vocabulary.filter(w => w.level === 'B1-B2').length;
                        const mastered = vocabulary.filter(w => w.level === 'B1-B2' && w.progress === 'mastered').length;
                        const learning = vocabulary.filter(w => w.level === 'B1-B2' && w.progress === 'learning').length;
                        const newCount = vocabulary.filter(w => w.level === 'B1-B2' && w.progress === 'new').length;
                        const masteredPct = mastered > 0 ? Math.max(5, (mastered / Math.max(1, total)) * 100) : 0;
                        const learningPct = learning > 0 ? Math.max(5, (learning / Math.max(1, total)) * 100) : 0;
                        const newPct = newCount > 0 ? Math.max(5, (newCount / Math.max(1, total)) * 100) : 0;
                        return (<>
                          {newCount > 0 && <div className="bg-blue-700 dark:bg-blue-900 transition-all duration-500" style={{width: `${newPct}%`}} title={`New: ${newCount}`} />}
                          {mastered > 0 && <div className="bg-blue-100 dark:bg-blue-300 transition-all duration-500" style={{width: `${masteredPct}%`}} title={`Mastered: ${mastered}`} />}
                          {learning > 0 && <div className="bg-blue-400 dark:bg-blue-500 transition-all duration-500" style={{width: `${learningPct}%`}} title={`Learning: ${learning}`} />}
                        </>);
                      })()}
                    </div>
                  </div>
                  
                  {/* C1-C2 Segmented Battery */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">C1-C2 WORDS</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {vocabulary.filter(w => w.level === 'C1-C2').length}
                      </span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                      {(() => {
                        const total = vocabulary.filter(w => w.level === 'C1-C2').length;
                        const mastered = vocabulary.filter(w => w.level === 'C1-C2' && w.progress === 'mastered').length;
                        const learning = vocabulary.filter(w => w.level === 'C1-C2' && w.progress === 'learning').length;
                        const newCount = vocabulary.filter(w => w.level === 'C1-C2' && w.progress === 'new').length;
                        const masteredPct = mastered > 0 ? Math.max(5, (mastered / Math.max(1, total)) * 100) : 0;
                        const learningPct = learning > 0 ? Math.max(5, (learning / Math.max(1, total)) * 100) : 0;
                        const newPct = newCount > 0 ? Math.max(5, (newCount / Math.max(1, total)) * 100) : 0;
                        return (<>
                          {newCount > 0 && <div className="bg-blue-700 dark:bg-blue-900 transition-all duration-500" style={{width: `${newPct}%`}} title={`New: ${newCount}`} />}
                          {mastered > 0 && <div className="bg-blue-100 dark:bg-blue-300 transition-all duration-500" style={{width: `${masteredPct}%`}} title={`Mastered: ${mastered}`} />}
                          {learning > 0 && <div className="bg-blue-400 dark:bg-blue-500 transition-all duration-500" style={{width: `${learningPct}%`}} title={`Learning: ${learning}`} />}
                        </>);
                      })()}
                    </div>
                  </div>
                </div>
                {/* Hover tooltip for Word Level */}
                <div className="absolute left-0 top-full mt-2 w-80 glass-card p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] shadow-xl">
                  <div className="text-xs space-y-3">
                    <div>
                      <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">A1-A2 Words ({vocabulary.filter(w => w.level === 'A1' || w.level === 'A2').length})</div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">New:</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-900">{vocabulary.filter(w => (w.level === 'A1' || w.level === 'A2') && w.progress === 'new').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Learning:</span>
                        <span className="font-semibold text-blue-500">{vocabulary.filter(w => (w.level === 'A1' || w.level === 'A2') && w.progress === 'learning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Mastered:</span>
                        <span className="font-semibold text-blue-200">{vocabulary.filter(w => (w.level === 'A1' || w.level === 'A2') && w.progress === 'mastered').length}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                      <div className="font-bold text-green-600 dark:text-green-400 mb-1">B1-B2 Words ({vocabulary.filter(w => w.level === 'B1' || w.level === 'B2').length})</div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">New:</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-900">{vocabulary.filter(w => (w.level === 'B1' || w.level === 'B2') && w.progress === 'new').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Learning:</span>
                        <span className="font-semibold text-blue-500">{vocabulary.filter(w => (w.level === 'B1' || w.level === 'B2') && w.progress === 'learning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Mastered:</span>
                        <span className="font-semibold text-blue-200">{vocabulary.filter(w => (w.level === 'B1' || w.level === 'B2') && w.progress === 'mastered').length}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                      <div className="font-bold text-orange-600 dark:text-orange-400 mb-1">C1-C2 Words ({vocabulary.filter(w => w.level === 'C1' || w.level === 'C2').length})</div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">New:</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-900">{vocabulary.filter(w => (w.level === 'C1' || w.level === 'C2') && w.progress === 'new').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Learning:</span>
                        <span className="font-semibold text-blue-500">{vocabulary.filter(w => (w.level === 'C1' || w.level === 'C2') && w.progress === 'learning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Mastered:</span>
                        <span className="font-semibold text-blue-200">{vocabulary.filter(w => (w.level === 'C1' || w.level === 'C2') && w.progress === 'mastered').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link href="/vocabulary">
                <div className="glass-card p-8 hover:scale-105 cursor-pointer group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Browse Vocabulary
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        View and filter all {stats.total} words
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/vocabulary?progress=learning">
                <div className="glass-card p-8 hover:scale-105 cursor-pointer group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 group-hover:scale-110 transition-transform">
                      <BookMarked className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Practice Mode
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Review {stats.learning} words you're learning
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Categories */}
            {topCategories.length > 0 && (
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  Top Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {topCategories.map(([category, count]) => (
                    <Link key={category} href={`/vocabulary?category=${encodeURIComponent(category)}`}>
                      <div className="glass p-6 rounded-2xl hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <p className="font-bold text-lg capitalize bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {category}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{count} words</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Word Modal */}
      <AddWordModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWord}
      />

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
