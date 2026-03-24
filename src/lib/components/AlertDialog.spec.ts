import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AlertDialog from './AlertDialog.svelte';

// NOTE: Svelte 5 runes are not fully compatible with @testing-library/svelte yet
// These tests are skipped until the library fully supports Svelte 5
describe.skip('AlertDialog', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(AlertDialog, {
      props: { isOpen: false, title: 'Test', message: 'Hello' },
    });
    expect(container.querySelector('.alert-backdrop')).toBeNull();
  });

  it('renders the dialog when isOpen is true', () => {
    render(AlertDialog, {
      props: { isOpen: true, title: 'Warning', message: 'Something went wrong' },
    });
    expect(screen.getByText('Warning')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows a "Got it" dismiss button', () => {
    render(AlertDialog, {
      props: { isOpen: true, title: 'Info', message: 'Done', type: 'info' },
    });
    expect(screen.getByText('Got it')).toBeTruthy();
  });
});
