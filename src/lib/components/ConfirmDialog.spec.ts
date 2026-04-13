import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConfirmDialog from './ConfirmDialog.svelte';

// NOTE: Svelte 5 runes incompatible with @testing-library/svelte
describe.skip('ConfirmDialog', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(ConfirmDialog, {
      props: { isOpen: false, title: 'Confirm?', message: 'Are you sure?' },
    });
    expect(container.querySelector('.confirm-backdrop')).toBeNull();
  });

  it('shows the title and message when open', () => {
    render(ConfirmDialog, {
      props: { isOpen: true, title: 'Confirm Placement', message: 'Place inside VPC?' },
    });
    expect(screen.getByText('Confirm Placement')).toBeTruthy();
    expect(screen.getByText('Place inside VPC?')).toBeTruthy();
  });
});
