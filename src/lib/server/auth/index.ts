// Authentication and Session Management Abstraction
// Target implementation: Lucia Auth or custom secure HttpOnly cookie session manager
import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { AuditLogger } from '../audit';
import type { RequestEvent } from '@sveltejs/kit';

export interface SessionValidationResult {
    session: { id: string; userId: string; expiresAt: Date; mfaVerifiedAt: Date | null } | null;
    user: { id: string; email: string; mfaEnabled: boolean } | null;
}

export class AuthService {
    /**
     * Scaffolding for creating a secure session and setting the HttpOnly cookie
     */
    static async createSession(userId: string, event: RequestEvent): Promise<string> {
        const sessionId = randomUUID(); // In prod, use cryptographically secure random strings
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

        await prisma.session.create({
            data: {
                id: sessionId,
                userId: userId,
                expiresAt: expiresAt,
                ipAddress: event.getClientAddress(),
                userAgent: event.request.headers.get('user-agent'),
            }
        });

        await AuditLogger.log({
            actorId: userId,
            action: 'USER_LOGIN',
            status: 'SUCCESS',
            metadata: { sessionId }
        });

        event.cookies.set('auth_session', sessionId, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            expires: expiresAt
        });

        return sessionId;
    }

    /**
     * Scaffolding for session validation.
     */
    static async validateSessionToken(token: string): Promise<SessionValidationResult> {
        const session = await prisma.session.findUnique({
            where: { id: token },
            include: { user: true }
        });

        if (!session || Date.now() >= session.expiresAt.getTime()) {
            return { session: null, user: null };
        }

        return {
            session: {
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt,
                mfaVerifiedAt: session.mfaVerifiedAt
            },
            user: {
                id: session.user.id,
                email: session.user.email,
                mfaEnabled: session.user.mfaEnabled
            }
        };
    }

    /**
     * Destroys session
     */
    static async invalidateSession(sessionId: string, event: RequestEvent): Promise<void> {
        await prisma.session.delete({ where: { id: sessionId } });
        event.cookies.delete('auth_session', { path: '/' });
    }
}
