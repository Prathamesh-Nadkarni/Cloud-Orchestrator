// Event Bus Abstraction Layer
// Used for Audit and Intelligence plane async decoupling without blocking Orchestrator UI
// Target production implementation: NATS JetStream or Kafka
import { randomUUID } from 'crypto';

export type EventTopic = 'audit' | 'notification' | 'intelligence' | 'policy';

export interface BaseEvent {
    id: string;
    topic: EventTopic;
    timestamp: Date;
    metadata: Record<string, any>;
    payload: any;
}

type EventHandler = (event: BaseEvent) => Promise<void>;

const bus = new Map<EventTopic, EventHandler[]>();

export class EventBus {
    /**
     * Publish an event to a topic asynchronously
     */
    static async publish(topic: EventTopic, payload: any, metadata: Record<string, any> = {}): Promise<string> {
        const event: BaseEvent = {
            id: randomUUID(),
            topic,
            timestamp: new Date(),
            metadata,
            payload
        };

        const handlers = bus.get(topic) || [];

        // Fire and forget (in a real system this would go to a message queue)
        setImmediate(() => {
            handlers.forEach(handler => handler(event).catch(err => {
                console.error(`Error in event handler for topic ${topic}:`, err);
            }));
        });

        return event.id;
    }

    /**
     * Subscribe to a topic
     */
    static subscribe(topic: EventTopic, handler: EventHandler): void {
        const handlers = bus.get(topic) || [];
        handlers.push(handler);
        bus.set(topic, handlers);
    }
}
