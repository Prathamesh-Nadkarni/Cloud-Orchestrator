import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TutorialOverlay from './TutorialOverlay.svelte';

// NOTE: Svelte 5 runes incompatible with @testing-library/svelte
describe.skip('TutorialOverlay', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(TutorialOverlay, { props: { isOpen: false } });
    expect(container.querySelector('.tutorial-overlay')).toBeNull();
  });

  it('renders the Getting Started heading when open', () => {
    render(TutorialOverlay, { props: { isOpen: true } });
    expect(screen.getByText('Getting Started')).toBeTruthy();
  });

  it('shows the Guide and Load Sample tabs', () => {
    render(TutorialOverlay, { props: { isOpen: true } });
    expect(screen.getByText('Guide')).toBeTruthy();
    expect(screen.getByText('Load Sample')).toBeTruthy();
  });

  it('shows the subtitle text', () => {
    render(TutorialOverlay, { props: { isOpen: true } });
    expect(screen.getByText(/Learn how to design cloud architectures/i)).toBeTruthy();
  });

  it('shows the Pinpoint UI button', () => {
    render(TutorialOverlay, { props: { isOpen: true } });
    expect(screen.getByText('Pinpoint UI')).toBeTruthy();
  });

  it('displays guide steps', () => {
    render(TutorialOverlay, { props: { isOpen: true } });
    expect(screen.getByText(/Drag & Drop Resources/i)).toBeTruthy();
    expect(screen.getByText(/Nest Inside Containers/i)).toBeTruthy();
    expect(screen.getByText(/Generate Infrastructure Code/i)).toBeTruthy();
  });
});
