import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadProfileMappings } from '../electron/backend/profileLoader.js';
import { AppState } from '../electron/backend/state.js';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn(),
  },
}));

describe('ProfileLoader', () => {
  beforeEach(() => {
    // Reset AppState before each test
    AppState.profileFilePath = null;
    AppState.mappings = {};

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('loadProfileMappings', () => {
    it('should throw error when no profile is selected', () => {
      AppState.profileFilePath = null;

      expect(() => loadProfileMappings()).toThrow('No profile selected');
    });

    it('should load basic profile mappings without synonyms', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'jump', keymap: ['space'] },
          { keyword: 'run', keymap: ['shift', 'd'] }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      // Mock fs.readFileSync for profile
      (fs.readFileSync as any).mockReturnValueOnce(JSON.stringify(mockProfileData));

      // Mock fs.existsSync to return false for synonyms file
      (fs.existsSync as any).mockReturnValue(false);

      loadProfileMappings();

      expect(AppState.mappings).toEqual({
        'jump': JSON.stringify(['space']),
        'run': JSON.stringify(['shift', 'd'])
      });
    });

    it('should expand mappings with synonyms when synonyms file exists', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'jump', keymap: ['space'] },
          { keyword: 'run', keymap: ['shift', 'd'] }
        ]
      };

      const mockSynonymsData = {
        synonyms: [
          {
            keyword_match: 'jump',
            synonym_words: ['jumped', 'dump', 'lump']
          }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      // Mock fs.readFileSync for profile first, then synonyms
      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify(mockProfileData))
        .mockReturnValueOnce(JSON.stringify(mockSynonymsData));

      // Mock fs.existsSync to return true for synonyms file
      (fs.existsSync as any).mockReturnValue(true);

      // Mock path.join to return the synonyms path
      (path.join as any).mockReturnValue('/path/to/synonyms.json');

      loadProfileMappings();

      expect(AppState.mappings).toEqual({
        'jump': JSON.stringify(['space']),
        'jumped': JSON.stringify(['space']),
        'dump': JSON.stringify(['space']),
        'lump': JSON.stringify(['space']),
        'run': JSON.stringify(['shift', 'd'])
      });
    });

    it('should handle synonyms with different case and trim whitespace', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'JUMP', keymap: ['space'] }
        ]
      };

      const mockSynonymsData = {
        synonyms: [
          {
            keyword_match: 'jump',
            synonym_words: [' Jumped ', ' DUMP ']
          }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify(mockProfileData))
        .mockReturnValueOnce(JSON.stringify(mockSynonymsData));

      (fs.existsSync as any).mockReturnValue(true);
      (path.join as any).mockReturnValue('/path/to/synonyms.json');

      loadProfileMappings();

      expect(AppState.mappings).toEqual({
        'jump': JSON.stringify(['space']),
        'jumped': JSON.stringify(['space']),
        'dump': JSON.stringify(['space'])
      });
    });

    it('should not overwrite existing mappings with synonyms', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'jump', keymap: ['space'] },
          { keyword: 'jumped', keymap: ['enter'] } // Different mapping for synonym
        ]
      };

      const mockSynonymsData = {
        synonyms: [
          {
            keyword_match: 'jump',
            synonym_words: ['jumped'] // This should not overwrite the existing 'jumped' mapping
          }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify(mockProfileData))
        .mockReturnValueOnce(JSON.stringify(mockSynonymsData));

      (fs.existsSync as any).mockReturnValue(true);
      (path.join as any).mockReturnValue('/path/to/synonyms.json');

      loadProfileMappings();

      expect(AppState.mappings).toEqual({
        'jump': JSON.stringify(['space']),
        'jumped': JSON.stringify(['enter']) // Original mapping preserved
      });
    });

    it('should skip synonyms when base keyword does not exist in profile', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'run', keymap: ['shift', 'd'] }
        ]
      };

      const mockSynonymsData = {
        synonyms: [
          {
            keyword_match: 'jump', // This keyword doesn't exist in profile
            synonym_words: ['jumped', 'dump']
          }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify(mockProfileData))
        .mockReturnValueOnce(JSON.stringify(mockSynonymsData));

      (fs.existsSync as any).mockReturnValue(true);
      (path.join as any).mockReturnValue('/path/to/synonyms.json');

      loadProfileMappings();

      expect(AppState.mappings).toEqual({
        'run': JSON.stringify(['shift', 'd'])
        // No synonyms added because 'jump' doesn't exist
      });
    });

    it('should handle malformed profile JSON gracefully', () => {
      const mockProfilePath = '/path/to/profile.json';

      AppState.profileFilePath = mockProfilePath;

      // Mock fs.readFileSync to return invalid JSON
      (fs.readFileSync as any).mockReturnValueOnce('invalid json');

      expect(() => loadProfileMappings()).toThrow();
    });

    it('should handle malformed synonyms JSON gracefully', () => {
      const mockProfilePath = '/path/to/profile.json';
      const mockProfileData = {
        keywords: [
          { keyword: 'jump', keymap: ['space'] }
        ]
      };

      AppState.profileFilePath = mockProfilePath;

      (fs.readFileSync as any)
        .mockReturnValueOnce(JSON.stringify(mockProfileData))
        .mockReturnValueOnce('invalid json');

      (fs.existsSync as any).mockReturnValue(true);
      (path.join as any).mockReturnValue('/path/to/synonyms.json');

      expect(() => loadProfileMappings()).toThrow();
    });
  });
});