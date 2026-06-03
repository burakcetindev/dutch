"use client";

import { VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";
import { Circle, CircleDot, CheckCircle2, Volume2, ChevronDown, ChevronUp, Plus, X, Edit2, Trash2, Save, Settings } from "lucide-react";
import { useState, useCallback, memo } from "react";
import { YouGlish } from "./YouGlish";

interface VocabularyCardProps {
  word: VocabularyWord;
  onProgressChange: (wordId: string, progress: "new" | "learning" | "mastered") => void;
  onPracticeAdd?: (wordId: string, sentence: string) => void;
  onPracticeRemove?: (wordId: string, index: number) => void;
  onPracticeEdit?: (wordId: string, index: number, newSentence: string) => void;
  onEdit?: (wordId: string, updates: Partial<VocabularyWord>) => void;
  onDelete?: (wordId: string) => void;
}

export const VocabularyCard = memo(function VocabularyCard({ word, onProgressChange, onPracticeAdd, onPracticeRemove, onPracticeEdit, onEdit, onDelete }: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newPractice, setNewPractice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [editingPracticeIndex, setEditingPracticeIndex] = useState<number | null>(null);
  const [editedPracticeSentence, setEditedPracticeSentence] = useState("");
  const [editedWord, setEditedWord] = useState({
    dutch: word.dutch,
    english: word.english,
    example_nl: word.example?.nl || "",
    example_en: word.example?.en || ""
  });

  const handleAddPractice = useCallback(() => {
    if (newPractice.trim() && onPracticeAdd) {
      onPracticeAdd(word.id, newPractice.trim());
      setNewPractice("");
    }
  }, [newPractice, onPracticeAdd, word.id]);

  const handleStartEditPractice = useCallback((index: number, sentence: string) => {
    setEditingPracticeIndex(index);
    setEditedPracticeSentence(sentence);
  }, []);

  const handleSavePracticeEdit = useCallback(() => {
    if (editingPracticeIndex !== null && editedPracticeSentence.trim() && onPracticeEdit) {
      onPracticeEdit(word.id, editingPracticeIndex, editedPracticeSentence.trim());
      setEditingPracticeIndex(null);
      setEditedPracticeSentence("");
    }
  }, [editingPracticeIndex, editedPracticeSentence, onPracticeEdit, word.id]);

  const handleCancelPracticeEdit = useCallback(() => {
    setEditingPracticeIndex(null);
    setEditedPracticeSentence("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (onEdit) {
      onEdit(word.id, {
        dutch: editedWord.dutch,
        english: editedWord.english,
        example: {
          nl: editedWord.example_nl,
          en: editedWord.example_en
        }
      });
      setIsEditing(false);
    }
  }, [onEdit, word.id, editedWord]);

  const handleCancelEdit = useCallback(() => {
    setEditedWord({
      dutch: word.dutch,
      english: word.english,
      example_nl: word.example?.nl || "",
      example_en: word.example?.en || ""
    });
    setIsEditing(false);
  }, [word.dutch, word.english, word.example?.nl, word.example?.en]);

  const handleDelete = useCallback(() => {
    if (onDelete && confirm(`Are you sure you want to delete "${word.dutch}"?`)) {
      onDelete(word.id);
    }
  }, [onDelete, word.id, word.dutch]);

  // Determine if the card should show celebration animation
  const isMastered = word.progress === 'mastered';

  return (
    <div className={`relative glass-card p-10 pb-20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 hover:border-purple-300/50 dark:hover:border-purple-500/50 overflow-visible group hover-glow ${isMastered ? 'ring-2 ring-green-400/30' : ''}`}>
      <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={editedWord.dutch}
                    onChange={(e) => setEditedWord({ ...editedWord, dutch: e.target.value })}
                    className="text-3xl font-bold bg-transparent border-b-2 border-purple-400 focus:outline-none focus:border-purple-600 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex-1"
                    placeholder="Dutch word"
                  />
                  {word.level && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      title={`CEFR Level: ${word.level}`}
                    >
                      {word.level}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editedWord.english}
                  onChange={(e) => setEditedWord({ ...editedWord, english: e.target.value })}
                  className="text-xl text-gray-700 dark:text-gray-200 font-medium bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-purple-600 w-full"
                  placeholder="English translation"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {word.dutch}
                  </h2>
                  {word.level && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                      title={`CEFR Level: ${word.level}`}
                    >
                      {word.level}
                    </span>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-2 p-2 glass rounded-xl hover:scale-110 transition-all duration-300 hover:rotate-180 active:scale-95 active:rotate-90 interactive"
                    title={isExpanded ? "Show less" : "Show more"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-300" />
                    )}
                  </button>
                  
                  {/* Gear icon dropdown - next to expand button */}
                  {!isEditing && (onEdit || onDelete) && (
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(!showActionMenu)}
                        className={`p-2 glass rounded-xl transition-all duration-500 active:scale-90 interactive ${
                          showActionMenu 
                            ? "bg-purple-100 dark:bg-purple-900/30 scale-110 rotate-180" 
                            : "bg-purple-100 dark:bg-purple-900/30 hover:scale-105 hover:rotate-90"
                        }`}
                        title={showActionMenu ? "Close menu" : "Open menu"}
                      >
                        <Settings className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-500 ${showActionMenu ? "" : ""}`} />
                      </button>
                      
                      {showActionMenu && (
                        <div className="absolute right-0 top-full mt-2 flex flex-col-reverse gap-2 animate-slide-in-expand z-50">
                          {onEdit && (
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setShowActionMenu(false);
                              }}
                              className="p-3 glass rounded-2xl hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-lg bg-blue-100 dark:bg-blue-900/30 interactive"
                              title="Edit word"
                            >
                              <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={handleDelete}
                              className="p-3 glass rounded-2xl hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-900/30 interactive"
                              title="Delete word"
                            >
                              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-700 dark:text-gray-200 font-medium mb-2">
                  {word.english}
                </p>
                {word.functions && word.functions.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                    {word.functions.join(", ")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Progress and action buttons */}
          <div className="flex gap-2 ml-4 items-center">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-3 glass rounded-2xl hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-lg bg-green-100 dark:bg-green-900/30 interactive"
                  title="Save changes"
                >
                  <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-3 glass rounded-2xl hover:scale-110 active:scale-95 transition-all duration-300 hover:shadow-lg bg-gray-100 dark:bg-gray-800/30 interactive"
                  title="Cancel editing"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onProgressChange(word.id, "new")}
                  style={{ 
                    background: 'linear-gradient(to bottom right, #ef4444, #ec4899)',
                    boxShadow: word.progress === "new" 
                      ? '0 0 25px rgba(239, 68, 68, 0.7), 0 0 45px rgba(239, 68, 68, 0.5)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(239, 68, 68, 0.5), 0 0 35px rgba(239, 68, 68, 0.3)',
                    opacity: word.progress === "new" ? 1 : 0.5
                  }}
                  className={`relative p-3 rounded-2xl transition-all duration-500 active:scale-90 interactive ${
                    word.progress === "new"
                      ? "scale-110 ring-4 ring-red-300 dark:ring-red-700 animate-glow-pulse"
                      : "hover:scale-110 hover:opacity-75"
                  }`}
                  title="New"
                >
                  <Circle className="w-5 h-5 text-white transition-all duration-300" />
                  {word.progress === "new" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <div className="absolute w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onProgressChange(word.id, "learning")}
                  style={{ 
                    background: 'linear-gradient(to bottom right, #f59e0b, #ea580c)',
                    boxShadow: word.progress === "learning" 
                      ? '0 0 25px rgba(245, 158, 11, 0.7), 0 0 45px rgba(245, 158, 11, 0.5)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(245, 158, 11, 0.5), 0 0 35px rgba(245, 158, 11, 0.3)',
                    opacity: word.progress === "learning" ? 1 : 0.5
                  }}
                  className={`relative p-3 rounded-2xl transition-all duration-500 active:scale-90 interactive ${
                    word.progress === "learning"
                      ? "scale-110 ring-4 ring-yellow-300 dark:ring-yellow-700 animate-spin-slow"
                      : "hover:scale-110 hover:opacity-75"
                  }`}
                  title="Learning"
                >
                  <CircleDot className="w-5 h-5 text-white transition-all duration-300" />
                  {word.progress === "learning" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <div className="absolute w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onProgressChange(word.id, "mastered")}
                  style={{ 
                    background: 'linear-gradient(to bottom right, #10b981, #059669)',
                    boxShadow: word.progress === "mastered" 
                      ? '0 0 25px rgba(16, 185, 129, 0.7), 0 0 45px rgba(16, 185, 129, 0.5)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(16, 185, 129, 0.5), 0 0 35px rgba(16, 185, 129, 0.3)',
                    opacity: word.progress === "mastered" ? 1 : 0.5
                  }}
                  className={`relative p-3 rounded-2xl transition-all duration-500 active:scale-90 interactive ${
                    word.progress === "mastered"
                      ? "scale-110 ring-4 ring-green-300 dark:ring-green-700 animate-glow-pulse"
                      : "hover:scale-110 hover:opacity-75"
                  }`}
                  title="Mastered"
                >
                  <CheckCircle2 className="w-5 h-5 text-white transition-all duration-300" />
                  {word.progress === "mastered" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <div className="absolute w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Example sentences - always visible */}
        {isEditing ? (
          <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 space-y-4">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">Example</p>
            <div className="flex items-start gap-4 mb-3">
              <Volume2 className="w-5 h-5 mt-1 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <input
                type="text"
                value={editedWord.example_nl}
                onChange={(e) => setEditedWord({ ...editedWord, example_nl: e.target.value })}
                className="flex-1 italic text-gray-800 dark:text-gray-200 leading-relaxed text-base bg-transparent border-b-2 border-purple-300 focus:outline-none focus:border-purple-600"
                placeholder="Dutch example sentence"
              />
            </div>
            <input
              type="text"
              value={editedWord.example_en}
              onChange={(e) => setEditedWord({ ...editedWord, example_en: e.target.value })}
              className="w-full text-sm text-gray-600 dark:text-gray-400 pl-9 leading-relaxed bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-purple-600"
              placeholder="English translation of example"
            />
          </div>
        ) : (
          word.example && (word.example.nl || word.example.en) && (
            <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 space-y-4">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">Example</p>
              {word.example.nl && (
                <div className="flex items-start gap-4 mb-3">
                  <Volume2 className="w-5 h-5 mt-1 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                  <p className="italic text-gray-800 dark:text-gray-200 leading-relaxed text-base">
                    "{word.example.nl}"
                  </p>
                </div>
              )}
              {word.example.en && (
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-9 leading-relaxed">
                  {word.example.en}
                </p>
              )}
            </div>
          )
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div className="space-y-5 mb-5 overflow-hidden animate-expand-content">
            {/* Grammar/Tense information */}
            {word.grammar && (word.grammar.present || word.grammar.past || word.grammar.future) && (
              <div className="glass rounded-2xl p-5 bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-900/20 dark:to-teal-900/20 animate-slide-up">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-4">Verb Conjugations</p>
                <div className="grid grid-cols-3 gap-4">
                  {word.grammar.present && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Present</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{word.grammar.present}</p>
                    </div>
                  )}
                  {word.grammar.past && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Past</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{word.grammar.past}</p>
                    </div>
                  )}
                  {word.grammar.future && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Future</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{word.grammar.future}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Practice Sentences */}
            <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 animate-slide-up shadow-lg" style={{ animationDelay: '100ms' }}>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">My Practice Sentences</p>
              
              {word.practice && word.practice.length > 0 ? (
                <div className="space-y-0 mb-4">
                  {word.practice.map((sentence, idx) => (
                    <>
                      {editingPracticeIndex === idx ? (
                        <div key={idx} className="flex items-start gap-3 pb-4 mb-4">
                          <input
                            type="text"
                            value={editedPracticeSentence}
                            onChange={(e) => setEditedPracticeSentence(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSavePracticeEdit()}
                            className="flex-1 px-3 py-2 glass rounded-lg border border-purple-300 dark:border-purple-600 focus:border-purple-500 focus:outline-none text-sm text-gray-800 dark:text-gray-200"
                            autoFocus
                          />
                          <button
                            onClick={handleSavePracticeEdit}
                            disabled={!editedPracticeSentence.trim()}
                            className="p-1.5 rounded-lg hover:bg-green-100 transition-all hover:scale-110 duration-300 disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancelPracticeEdit}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-all hover:scale-110 duration-300"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          key={idx} 
                          className="flex items-start gap-3 py-4"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 mt-2 flex-shrink-0" />
                          <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{sentence}</p>
                          <div className="flex gap-1">
                            {onPracticeEdit && (
                              <button
                                onClick={() => handleStartEditPractice(idx, sentence)}
                                className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:scale-110 duration-300"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-purple-500" />
                              </button>
                            )}
                            {onPracticeRemove && (
                              <button
                                onClick={() => onPracticeRemove(word.id, idx)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 hover:rotate-90 duration-300"
                                title="Remove"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">No practice sentences yet. Add your own!</p>
              )}

              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={newPractice}
                  onChange={(e) => setNewPractice(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPractice()}
                  placeholder="Add your own practice sentence..."
                  className="flex-1 px-4 py-3 glass rounded-xl border border-purple-200/50 dark:border-purple-700/50 focus:border-purple-400 dark:focus:border-purple-500 focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={handleAddPractice}
                  disabled={!newPractice.trim()}
                  className="px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center gap-2 font-semibold text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>

            {/* Full metadata */}
            <div className="grid grid-cols-2 gap-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
              {word.contexts && word.contexts.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Contexts</p>
                  <div className="flex flex-wrap gap-2">
                    {word.contexts.map((ctx, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                        {ctx}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="glass rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Progress</p>
                <p className="text-sm capitalize font-medium text-gray-800 dark:text-gray-200">{word.progress}</p>
                {word.lastReviewed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last reviewed: {new Date(word.lastReviewed).toLocaleDateString()}
                  </p>
                )}
                {word.createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Added: {new Date(word.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories - clickable to expand */}
        {(word.categories && word.categories.length > 0) || (word.functions && word.functions.length > 0) && (
          <div 
            className="flex flex-wrap gap-3 mt-5 cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}
            title="Click to see more details"
          >
            {word.categories?.map((category, idx) => (
              <Badge
                key={idx}
                className="category-badge bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-300/30 text-purple-700 hover:from-purple-500/20 hover:to-pink-500/20 px-4 py-2 transition-all"
              >
                {category}
              </Badge>
            ))}
            {word.functions?.map((func, idx) => (
              <Badge
                key={`func-${idx}`}
                variant="outline"
                className="category-badge border-cyan-300/30 text-cyan-700 hover:border-cyan-400/50 transition-all"
              >
                {func}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes - always visible if present */}
        {word.notes && (
          <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold text-purple-600 dark:text-purple-400">Note:</span> {word.notes}
            </p>
          </div>
        )}

        {/* YouGlish Integration - Show in expanded view */}
        {isExpanded && (
          <div className="mt-12">
            <YouGlish word={word.dutch} />
          </div>
        )}
      </div>
  );
});
