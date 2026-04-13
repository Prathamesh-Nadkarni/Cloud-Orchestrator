import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './index';

describe('EventBus', () => {
    it('should allow publishing and subscribing to events', async () => {
        const mockHandler = vi.fn().mockResolvedValue(undefined);

        EventBus.subscribe('audit', mockHandler);

        const eventId = await EventBus.publish('audit', { some: 'payload' });

        expect(eventId).toBeDefined();

        // Check if handler was called asynchronously
        await new Promise(resolve => setImmediate(resolve));

        expect(mockHandler).toHaveBeenCalled();
        const eventArg = mockHandler.mock.calls[0][0];
        expect(eventArg.topic).toBe('audit');
        expect(eventArg.payload).toEqual({ some: 'payload' });
    });
});
