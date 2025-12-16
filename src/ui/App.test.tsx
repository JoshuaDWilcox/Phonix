import { render, screen } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect } from 'vitest';

// Mock the window.api
window.api = {
    getProfiles: vi.fn().mockResolvedValue(['default.json']),
    setProfilePath: vi.fn(),
    readProfile: vi.fn(),
    saveProfile: vi.fn(),
    importProfile: vi.fn(),
    startSession: vi.fn(),
    stopSession: vi.fn(),
} as any;

describe('App', () => {
    it('renders the Phonix logo', () => {
        render(<App />);
        const logo = screen.getByAltText('Phonix logo');
        expect(logo).toBeInTheDocument();
    });

    it('renders the help button', () => {
        render(<App />);
        const button = screen.getByTitle('Help');
        expect(button).toBeInTheDocument();
    });
});
