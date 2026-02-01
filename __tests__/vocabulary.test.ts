/**
 * Comprehensive tests for Dutch Vocabulary Learning App
 * Validates core functionality: CRUD operations, grammar imports, and UI interactions
 */

describe('Vocabulary App - Core Functionality', () => {
  describe('Database Operations', () => {
    test('should fetch all vocabulary from database', async () => {
      const response = await fetch('/api/vocabulary-db');
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.vocabulary).toBeDefined();
      expect(Array.isArray(data.vocabulary)).toBe(true);
      expect(data.vocabulary.length).toBeGreaterThan(0);
    });

    test('should add new word to database', async () => {
      const newWord = {
        id: `test-word-${Date.now()}`,
        dutch: 'testwoord',
        english: 'test word',
        level: 'A1-A2',
        progress: 'new'
      };

      const response = await fetch('/api/vocabulary-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [newWord] })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.inserted).toBeGreaterThan(0);
    });

    test('should prevent duplicate words', async () => {
      const word = {
        id: `duplicate-test-${Date.now()}`,
        dutch: 'unieke',
        english: 'unique',
        level: 'B1-B2'
      };

      // Add first time
      await fetch('/api/vocabulary-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [word] })
      });

      // Try to add duplicate
      const response = await fetch('/api/vocabulary-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [word] })
      });

      const data = await response.json();
      expect(data.duplicates).toBeGreaterThan(0);
    });

    test('should delete word from database', async () => {
      // First get a word to delete
      const getResponse = await fetch('/api/vocabulary-db');
      const data = await getResponse.json();
      const wordToDelete = data.vocabulary[0];

      // Delete it
      const deleteResponse = await fetch(`/api/vocabulary-db?id=${wordToDelete.id}`, {
        method: 'DELETE'
      });

      expect(deleteResponse.ok).toBe(true);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);
    });

    test('should update word progress', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();
      const word = data.vocabulary[0];

      const updateResponse = await fetch('/api/vocabulary-db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: word.id,
          updates: { progress: 'learning' }
        })
      });

      expect(updateResponse.ok).toBe(true);
      const updatedData = await updateResponse.json();
      expect(updatedData.success).toBe(true);
      expect(updatedData.word.progress).toBe('learning');
    });
  });

  describe('Grammar Data', () => {
    test('should have grammar data for vocabulary words', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();
      
      // Check if at least some words have grammar data
      const wordsWithGrammar = data.vocabulary.filter((w: any) => 
        w.grammar && (w.grammar.present || w.grammar.past || w.grammar.future)
      );
      
      expect(wordsWithGrammar.length).toBeGreaterThan(0);
    });

    test('grammar data should have required fields', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();
      
      const wordWithGrammar = data.vocabulary.find((w: any) => 
        w.grammar && w.grammar.present
      );

      if (wordWithGrammar && wordWithGrammar.grammar) {
        expect(wordWithGrammar.grammar).toHaveProperty('present');
        expect(typeof wordWithGrammar.grammar.present).toBe('string');
      }
    });
  });

  describe('Vocabulary Validation', () => {
    test('should validate word structure', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();
      const word = data.vocabulary[0];

      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('dutch');
      expect(word).toHaveProperty('english');
      expect(word).toHaveProperty('level');
      expect(word).toHaveProperty('progress');
    });

    test('word progress should be one of valid states', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();

      const validProgresses = ['new', 'learning', 'mastered'];
      data.vocabulary.forEach((word: any) => {
        expect(validProgresses).toContain(word.progress);
      });
    });

    test('word level should be valid CEFR level', async () => {
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();

      const validLevels = ['A1-A2', 'B1-B2', 'C1-C2'];
      data.vocabulary.forEach((word: any) => {
        expect(validLevels).toContain(word.level);
      });
    });
  });

  describe('Data Persistence', () => {
    test('should persist data across requests', async () => {
      // Add word
      const newWord = {
        id: `persist-test-${Date.now()}`,
        dutch: 'persistent',
        english: 'persistent word',
        level: 'A1-A2'
      };

      await fetch('/api/vocabulary-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [newWord] })
      });

      // Fetch and verify
      const response = await fetch('/api/vocabulary-db');
      const data = await response.json();
      
      const found = data.vocabulary.find((w: any) => w.dutch === 'persistent');
      expect(found).toBeDefined();
      expect(found.english).toBe('persistent word');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid word ID gracefully', async () => {
      const response = await fetch('/api/vocabulary-db?id=invalid-id-12345', {
        method: 'DELETE'
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('should handle malformed POST request', async () => {
      const response = await fetch('/api/vocabulary-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
    });
  });
});
