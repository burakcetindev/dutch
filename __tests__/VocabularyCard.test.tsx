/**
 * Component Tests for VocabularyCard
 * Tests UI rendering, animations, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VocabularyCard } from '../src/components/vocabulary/VocabularyCard';
import { VocabularyWord } from '../types/vocabulary';

const mockWord: VocabularyWord = {
  id: 'test-123',
  dutch: 'test',
  english: 'test',
  level: 'A1-A2',
  progress: 'new',
  categories: ['test'],
  functions: [],
  grammar: {
    present: 'test',
    past: 'tested',
    future: 'will test',
    separable: false
  },
  example: {
    nl: 'Dit is een test',
    en: 'This is a test'
  },
  practice: [],
  notes: 'Test note',
  createdAt: new Date().toISOString(),
  lastReviewed: new Date().toISOString(),
  pos: 'noun'
};

describe('VocabularyCard Component', () => {
  describe('Rendering', () => {
    test('should render word and translation', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    test('should display level badge', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      expect(screen.getByText('A1-A2')).toBeInTheDocument();
    });

    test('should display grammar data when present', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      // Grammar is typically shown on expand
      fireEvent.click(screen.getByTitle('Show more'));
      
      waitFor(() => {
        expect(screen.getByText(/test/)).toBeInTheDocument();
      });
    });

    test('should display example sentence', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      expect(screen.getByText('Dit is een test')).toBeInTheDocument();
    });
  });

  describe('Progress Management', () => {
    test('should handle progress button clicks', () => {
      const mockProgressChange = jest.fn();
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={mockProgressChange}
        />
      );

      const newButton = screen.getByTitle('New');
      fireEvent.click(newButton);

      expect(mockProgressChange).toHaveBeenCalledWith('test-123', 'new');
    });

    test('should highlight current progress', () => {
      const learningWord = { ...mockWord, progress: 'learning' as const };
      render(
        <VocabularyCard
          word={learningWord}
          onProgressChange={() => {}}
        />
      );

      const learningButton = screen.getByTitle('Learning');
      expect(learningButton).toHaveClass('scale-110');
    });
  });

  describe('Actions Menu', () => {
    test('should show edit button when menu is expanded', async () => {
      const mockEdit = jest.fn();
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
          onEdit={mockEdit}
        />
      );

      // Menu should be closed initially
      const editButton = screen.queryByTitle('Edit word');
      expect(editButton).not.toBeInTheDocument();

      // Click menu toggle
      const menuButton = screen.getByTitle('Edit or delete');
      fireEvent.click(menuButton);

      // Edit button should now appear
      waitFor(() => {
        expect(screen.getByTitle('Edit word')).toBeInTheDocument();
      });
    });

    test('should show delete button when menu is expanded', async () => {
      const mockDelete = jest.fn();
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
          onDelete={mockDelete}
        />
      );

      // Click menu toggle
      const menuButton = screen.getByTitle('Edit or delete');
      fireEvent.click(menuButton);

      // Delete button should appear
      waitFor(() => {
        expect(screen.getByTitle('Delete word')).toBeInTheDocument();
      });
    });

    test('should call onDelete when delete button clicked', async () => {
      const mockDelete = jest.fn();
      window.confirm = jest.fn(() => true);

      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
          onDelete={mockDelete}
        />
      );

      // Expand menu
      const menuButton = screen.getByTitle('Edit or delete');
      fireEvent.click(menuButton);

      // Click delete
      waitFor(() => {
        const deleteButton = screen.getByTitle('Delete word');
        fireEvent.click(deleteButton);
        expect(mockDelete).toHaveBeenCalledWith('test-123');
      });
    });
  });

  describe('Expand/Collapse', () => {
    test('should toggle expanded state', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      const expandButton = screen.getByTitle('Show more');
      fireEvent.click(expandButton);

      expect(expandButton).toHaveTitle('Show less');

      fireEvent.click(expandButton);
      expect(expandButton).toHaveTitle('Show more');
    });
  });

  describe('Accessibility', () => {
    test('buttons should have proper titles for accessibility', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      expect(screen.getByTitle('New')).toBeInTheDocument();
      expect(screen.getByTitle('Learning')).toBeInTheDocument();
      expect(screen.getByTitle('Mastered')).toBeInTheDocument();
    });

    test('level badge should have title attribute', () => {
      render(
        <VocabularyCard
          word={mockWord}
          onProgressChange={() => {}}
        />
      );

      const levelBadge = screen.getByTitle(/CEFR Level/);
      expect(levelBadge).toBeInTheDocument();
    });
  });
});
