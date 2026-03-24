import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';

// NOTE: Svelte 5 runes incompatible with @testing-library/svelte
describe.skip('Sidebar', () => {
  it('renders the Resources heading', () => {
    render(Sidebar);
    expect(screen.getByText('Resources')).toBeTruthy();
  });

  it('renders the search input', () => {
    render(Sidebar);
    expect(screen.getByPlaceholderText('Search blocks...')).toBeTruthy();
  });

  it('renders all 7 provider sections', () => {
    render(Sidebar);
    expect(screen.getByText('AWS')).toBeTruthy();
    expect(screen.getByText('Azure')).toBeTruthy();
    expect(screen.getByText('Google Cloud')).toBeTruthy();
    expect(screen.getByText('Kubernetes')).toBeTruthy();
    expect(screen.getByText('Aviatrix')).toBeTruthy();
    expect(screen.getByText('External Entity')).toBeTruthy();
    expect(screen.getByText('AI Workloads')).toBeTruthy();
  });

  it('renders draggable resource items', () => {
    render(Sidebar);
    // Check a few known resources
    expect(screen.getByText('VPC')).toBeTruthy();
    expect(screen.getByText('EC2 Instance')).toBeTruthy();
    expect(screen.getByText('S3 Bucket')).toBeTruthy();
  });

  it('contains descriptive hint text for users', () => {
    render(Sidebar);
    expect(screen.getByText(/Drag blocks onto the canvas/i)).toBeTruthy();
  });
});
