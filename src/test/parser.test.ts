import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleWord } from '../electron/backend/parser.js';
import { AppState } from '../electron/backend/state.js';

// Mock the controller bridge
vi.mock('../electron/backend/controllerBridge.js', () => ({
  sendActionToController: vi.fn(),
}));

describe('Parser', () => {
  beforeEach(() => {
    // Reset AppState before each test
    AppState.recentWords = [];
    AppState.mappings = {};
    AppState.isRunning = true;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('handleWord', () => {
    it('should clean and process valid words', () => {
      handleWord('JUMP!');
      expect(AppState.recentWords).toEqual(['jump']);
    });

    it('should skip empty words after cleaning', () => {
      handleWord('!!!');
      expect(AppState.recentWords).toEqual([]);
    });

    it('should filter out filter words', () => {
      handleWord('speaknow');
      expect(AppState.recentWords).toEqual([]);
    });

    it('should strip filter words from long strings', () => {
      // Need a string longer than 14 characters to trigger filter word stripping
      handleWord('jumpspeaknowrecording'); // 21 characters
      expect(AppState.recentWords).toEqual(['jump']);
    });

    it('should maintain a maximum of 3 recent words', () => {
      handleWord('jump');
      handleWord('run');
      handleWord('dodge');
      handleWord('block');

      expect(AppState.recentWords).toEqual(['run', 'dodge', 'block']);
    });

    it('should check for phrase matches and trigger actions', async () => {
      const { sendActionToController } = await import('../electron/backend/controllerBridge.js');

      // Set up mappings
      AppState.mappings = {
        'jump': '["space"]',
        'run forward': '["shift", "w"]',
        'triple jump': '["space", "space", "space"]'
      };

      // Test single word match
      handleWord('jump');
      expect(sendActionToController).toHaveBeenCalledWith('["space"]');
      expect(AppState.recentWords).toEqual([]); // Should be cleared after match

      // Reset mock
      vi.clearAllMocks();

      // Test two word phrase match
      handleWord('run');
      handleWord('forward');
      expect(sendActionToController).toHaveBeenCalledWith('["shift", "w"]');
      expect(AppState.recentWords).toEqual([]); // Should be cleared after match
    });

    it('should prioritize longer phrases over shorter ones', async () => {
      const { sendActionToController } = await import('../electron/backend/controllerBridge.js');

      // Set up mappings where both 'jump' and 'triple jump' exist
      AppState.mappings = {
        'jump': '["space"]',
        'triple jump': '["space", "space", "space"]'
      };

      handleWord('triple');
      handleWord('jump');

      // Should match 'triple jump' (2-word phrase) over 'jump' (1-word)
      expect(sendActionToController).toHaveBeenCalledWith('["space", "space", "space"]');
      expect(AppState.recentWords).toEqual([]);
    });

    it('should not trigger actions when no matches found', async () => {
      const { sendActionToController } = await import('../electron/backend/controllerBridge.js');

      AppState.mappings = {
        'jump': '["space"]'
      };

      handleWord('run');
      handleWord('walk');

      expect(sendActionToController).not.toHaveBeenCalled();
      expect(AppState.recentWords).toEqual(['run', 'walk']);
    });

    it('should handle case insensitive matching', async () => {
      const { sendActionToController } = await import('../electron/backend/controllerBridge.js');

      AppState.mappings = {
        'jump': '["space"]'
      };

      handleWord('JUMP');
      expect(sendActionToController).toHaveBeenCalledWith('["space"]');
    });

    it('should clear only matched words from queue', async () => {
      const { sendActionToController } = await import('../electron/backend/controllerBridge.js');

      AppState.mappings = {
        'run forward': '["shift", "w"]'
      };

      handleWord('jump');
      handleWord('run');
      handleWord('forward');

      expect(sendActionToController).toHaveBeenCalledWith('["shift", "w"]');
      expect(AppState.recentWords).toEqual(['jump']); // Only unmatched word remains
    });
  });
});