import { writable, readable } from 'svelte/store';

export const page = readable({
  url: new URL('http://localhost:5173'),
  params: {},
  status: 200,
  error: null,
  data: {},
});

export const navigating = readable(null);
export const updated = { check: async () => false, subscribe: writable(false).subscribe };
