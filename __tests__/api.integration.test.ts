/**
 * API Integration Tests
 * Tests all API endpoints and their interactions
 */

describe('Vocabulary API Integration Tests', () => {
  const baseUrl = '/api/vocabulary-db';

  describe('GET /api/vocabulary-db', () => {
    test('should return vocabulary array', async () => {
      const response = await fetch(baseUrl);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('vocabulary');
      expect(Array.isArray(data.vocabulary)).toBe(true);
    });

    test('should return vocabulary with required fields', async () => {
      const response = await fetch(baseUrl);
      const data = await response.json();
      
      const word = data.vocabulary[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('dutch');
      expect(word).toHaveProperty('english');
      expect(word).toHaveProperty('level');
      expect(word).toHaveProperty('progress');
    });
  });

  describe('POST /api/vocabulary-db - Add Words', () => {
    test('should add single word', async () => {
      const payload = {
        words: [{
          id: `api-test-${Date.now()}`,
          dutch: 'apitest',
          english: 'api test',
          level: 'B1-B2',
          progress: 'new'
        }]
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.inserted).toBe(1);
    });

    test('should add multiple words', async () => {
      const payload = {
        words: [
          { id: `multi-${Date.now()}-1`, dutch: 'word1', english: 'word one', level: 'A1-A2' },
          { id: `multi-${Date.now()}-2`, dutch: 'word2', english: 'word two', level: 'B1-B2' }
        ]
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      expect(data.inserted).toBe(2);
    });

    test('should include grammar data in POST', async () => {
      const payload = {
        words: [{
          id: `grammar-${Date.now()}`,
          dutch: 'spreken',
          english: 'to speak',
          level: 'A1-A2',
          grammar: {
            present: 'spreek',
            past: 'sprak',
            future: 'zal spreken'
          }
        }]
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should return error for invalid request', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/vocabulary-db - Update Words', () => {
    test('should update word progress', async () => {
      // Get a word first
      const getResponse = await fetch(baseUrl);
      const getData = await getResponse.json();
      const wordId = getData.vocabulary[0].id;

      const payload = {
        id: wordId,
        updates: { progress: 'learning' }
      };

      const response = await fetch(baseUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.word.progress).toBe('learning');
    });

    test('should update multiple fields', async () => {
      const getResponse = await fetch(baseUrl);
      const getData = await getResponse.json();
      const wordId = getData.vocabulary[0].id;

      const payload = {
        id: wordId,
        updates: {
          progress: 'mastered',
          level: 'C1-C2'
        }
      };

      const response = await fetch(baseUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      expect(data.word.progress).toBe('mastered');
      expect(data.word.level).toBe('C1-C2');
    });

    test('should return error for non-existent word', async () => {
      const payload = {
        id: 'non-existent-id-12345',
        updates: { progress: 'learning' }
      };

      const response = await fetch(baseUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/vocabulary-db', () => {
    test('should delete word by ID', async () => {
      // First add a word to delete
      const addPayload = {
        words: [{
          id: `delete-test-${Date.now()}`,
          dutch: 'todelete',
          english: 'to delete',
          level: 'A1-A2'
        }]
      };

      await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addPayload)
      });

      // Now delete it
      const deleteResponse = await fetch(`${baseUrl}?id=${addPayload.words[0].id}`, {
        method: 'DELETE'
      });

      expect(deleteResponse.status).toBe(200);
      const data = await deleteResponse.json();
      expect(data.success).toBe(true);
    });

    test('should return error for invalid ID', async () => {
      const response = await fetch(`${baseUrl}?id=invalid-id-xyz`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('should require ID parameter', async () => {
      const response = await fetch(baseUrl, {
        method: 'DELETE'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency after CRUD operations', async () => {
      const timestamp = Date.now();
      const testWord = {
        id: `consistency-${timestamp}`,
        dutch: 'consistency',
        english: 'consistency test',
        level: 'B1-B2',
        progress: 'new'
      };

      // ADD
      const addResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [testWord] })
      });
      expect(addResponse.ok).toBe(true);

      // READ
      const getResponse = await fetch(baseUrl);
      const getData = await getResponse.json();
      const added = getData.vocabulary.find((w: any) => w.id === testWord.id);
      expect(added).toBeDefined();
      expect(added.english).toBe(testWord.english);

      // UPDATE
      const updateResponse = await fetch(baseUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: testWord.id,
          updates: { progress: 'mastered' }
        })
      });
      expect(updateResponse.ok).toBe(true);

      // VERIFY UPDATE
      const getUpdatedResponse = await fetch(baseUrl);
      const getUpdatedData = await getUpdatedResponse.json();
      const updated = getUpdatedData.vocabulary.find((w: any) => w.id === testWord.id);
      expect(updated.progress).toBe('mastered');

      // DELETE
      const deleteResponse = await fetch(`${baseUrl}?id=${testWord.id}`, {
        method: 'DELETE'
      });
      expect(deleteResponse.ok).toBe(true);

      // VERIFY DELETE
      const getFinalResponse = await fetch(baseUrl);
      const getFinalData = await getFinalResponse.json();
      const deleted = getFinalData.vocabulary.find((w: any) => w.id === testWord.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      try {
        await fetch('http://invalid-url-that-does-not-exist.local/api/vocabulary-db');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle malformed JSON', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
