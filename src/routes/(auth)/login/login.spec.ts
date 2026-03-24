import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Login from './+page.svelte';

describe('Login Component', () => {
    it('should render the login form', () => {
        // Svelte components can be rendered using testing-library
        render(Login);

        // Check if the headings and labels are present
        expect(screen.getByText('Cloud Orchestrator Login')).toBeTruthy();
        expect(screen.getByLabelText(/Email address/i)).toBeTruthy();
        expect(screen.getByLabelText(/Password/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeTruthy();
    });
});
