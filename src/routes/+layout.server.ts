import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { AuthService } from '$lib/server/auth';

/**
 * Global Route Protection.
 * Runs on the server side before rendering any page in the app (unless overridden).
 */
export const load: LayoutServerLoad = async (event) => {
    const sessionId = event.cookies.get('auth_session');

    // Allow unrestricted access to the authentication pages
    if (event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/signup')) {
        if (sessionId) {
            const { session } = await AuthService.validateSessionToken(sessionId);
            if (session) {
                throw redirect(303, '/');
            }
        }
        return { user: null };
    }

    // If no session token is found, bounce them to login
    if (!sessionId) {
        throw redirect(303, '/login');
    }

    // Validate the session token against the Database
    const { session, user } = await AuthService.validateSessionToken(sessionId);

    // If the session is invalid or expired
    if (!session || !user) {
        event.cookies.delete('auth_session', { path: '/' });
        throw redirect(303, '/login');
    }

    // Pass user details down to all pages + client side state
    return {
        user: {
            id: user.id,
            email: user.email,
            mfaEnabled: user.mfaEnabled,
            mfaVerifiedAt: session.mfaVerifiedAt
        }
    };
};
