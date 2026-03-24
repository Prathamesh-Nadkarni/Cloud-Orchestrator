// Notification Service
// Handles dispatching alerts to users via multiple channels.

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    metadata?: Record<string, any>;
    createdAt: Date;
    read: boolean;
}

export class NotificationService {
    /**
     * Sends a notification to a specific user.
     */
    static async send(notification: {
        userId: string;
        type: string;
        title: string;
        body: string;
        metadata?: any
    }): Promise<void> {
        console.log('Pushing notification to', notification.userId, notification.title);
        // In prod: persist to DB and push via WebSockets/Email
    }

    static async listForUser(userId: string): Promise<Notification[]> {
        // Scaffold: Return empty list
        return [];
    }

    static async markAsRead(notificationId: string): Promise<void> {
        // Scaffold
    }
}
