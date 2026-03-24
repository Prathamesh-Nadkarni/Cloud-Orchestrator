import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthService } from '$lib/server/auth';
import { prisma } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
    const path = event.url.pathname;

    if (path.endsWith('/login')) {
        // Scaffold: Accept mock credentials
        const body = await event.request.json().catch(() => ({}));
        const { email } = body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return json({ error: 'User not found' }, { status: 401 });
        }

        // In prod: verify passwordHash here using argon2/bcrypt

        const sessionId = await AuthService.createSession(user.id, event);
        return json({ message: 'Success', user: { id: user.id, email: user.email } });
    }

    if (path.endsWith('/signup')) {
        const body = await event.request.json().catch(() => ({}));
        const { email, name } = body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return json({ error: 'User already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
                // In prod: hash the password before saving
            }
        });

        const sessionId = await AuthService.createSession(user.id, event);
        return json({ message: 'User created', user: { id: user.id, email: user.email } });
    }

    if (path.endsWith('/logout')) {
        const sessionId = event.cookies.get('auth_session');
        if (sessionId) {
            await AuthService.invalidateSession(sessionId, event);
        }
        return json({ message: 'Logged out' });
    }

    return json({ error: 'Not found' }, { status: 404 });
};
