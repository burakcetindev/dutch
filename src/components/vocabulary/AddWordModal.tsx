"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { VocabularyWord } from "@/types/vocabulary";

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (word: VocabularyWord) => void;
}

// Simple UUID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function AddWordModal({ isOpen, onClose, onAdd }: AddWordModalProps) {
  const [formData, setFormData] = useState({
    dutch: "",
    english: "",
    pos: "",
    present: "",
    past: "",
    future: "",
    exampleNl: "",
    exampleEn: "",
    level: "A1-A2",
    categories: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dutch || !formData.english) {
      alert("Dutch word and English translation are required!");
      return;
    }

    const newWord: VocabularyWord = {
      id: generateId(),
      dutch: formData.dutch.trim(),
      english: formData.english.trim(),
      pos: formData.pos.trim() || "",
      grammar: (formData.present || formData.past || formData.future) ? {
        present: formData.present.trim() || "",
        past: formData.past.trim() || "",
        future: formData.future.trim() || "",
      } : undefined,
      example: (formData.exampleNl || formData.exampleEn) ? {
        nl: formData.exampleNl.trim() || "",
        en: formData.exampleEn.trim() || "",
      } : undefined,
      level: formData.level as any,
      categories: formData.categories ? formData.categories.split(",").map(c => c.trim()).filter(Boolean) : [],
      progress: "new",
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAdd(newWord);
    
    // Reset form
    setFormData({
      dutch: "",
      english: "",
      pos: "",
      present: "",
      past: "",
      future: "",
      exampleNl: "",
      exampleEn: "",
      level: "A1-A2",
      categories: "",
      notes: "",
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-card p-8 bg-white/95 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add New Word
          </h2>
          <button
            onClick={onClose}
            className="p-2 glass rounded-xl hover:bg-red-100 hover:scale-110 transition-all duration-300"
          >
            <X className="w-6 h-6 text-gray-600 hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dutch Word <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.dutch}
                onChange={(e) => setFormData({ ...formData, dutch: e.target.value })}
                placeholder="e.g., huis"
                className="glass"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                English Translation <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.english}
                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                placeholder="e.g., house"
                className="glass"
                required
              />
            </div>
          </div>

          {/* Grammar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Part of Speech
              </label>
              <Input
                value={formData.pos}
                onChange={(e) => setFormData({ ...formData, pos: e.target.value })}
                placeholder="e.g., noun, het"
                className="glass"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CEFR Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 glass rounded-xl border border-purple-200/50 focus:border-purple-400 focus:outline-none"
              >
                <option value="A1-A2">A1-A2 (Beginner)</option>
                <option value="B1-B2">B1-B2 (Intermediate)</option>
                <option value="C1-C2">C1-C2 (Advanced)</option>
              </select>
            </div>
          </div>

          {/* Verb Conjugations */}
          <div className="glass rounded-2xl p-4 bg-gradient-to-br from-green-50/50 to-teal-50/50">
            <p className="text-sm font-semibold text-teal-600 mb-3">Verb Conjugations (Optional)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Present</label>
                <Input
                  value={formData.present}
                  onChange={(e) => setFormData({ ...formData, present: e.target.value })}
                  placeholder="werken"
                  className="glass text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Past</label>
                <Input
                  value={formData.past}
                  onChange={(e) => setFormData({ ...formData, past: e.target.value })}
                  placeholder="werkte"
                  className="glass text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Future</label>
                <Input
                  value={formData.future}
                  onChange={(e) => setFormData({ ...formData, future: e.target.value })}
                  placeholder="zal werken"
                  className="glass text-sm"
                />
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="glass rounded-2xl p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <p className="text-sm font-semibold text-purple-600 mb-3">Example Sentences (Optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dutch Example</label>
                <Input
                  value={formData.exampleNl}
                  onChange={(e) => setFormData({ ...formData, exampleNl: e.target.value })}
                  placeholder="Het huis is groot."
                  className="glass text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">English Example</label>
                <Input
                  value={formData.exampleEn}
                  onChange={(e) => setFormData({ ...formData, exampleEn: e.target.value })}
                  placeholder="The house is big."
                  className="glass text-sm"
                />
              </div>
            </div>
          </div>

          {/* Categories and Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categories (comma-separated)
              </label>
              <Input
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                placeholder="e.g., Housing, Common, Daily Life"
                className="glass"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="glass"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Word
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="px-6 glass hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
