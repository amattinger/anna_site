/**
 * Configuration for password-protected pages.
 * Change PRIVATE_PASSWORD to set your access password.
 * PRIVATE_PATH_TOKEN makes private URLs unguessable; change it to your own random string.
 * Note: Client-side password protection is not cryptographically secure -
 * it prevents casual access but determined users could bypass it.
 */
export const PRIVATE_PASSWORD = 'debonairdirtbag';
export const PRIVATE_STORAGE_KEY = 'anna_private_access';

/** Unguessable path segment for private routes. Only this path is built; others 404. */
export const PRIVATE_PATH_TOKEN = 'm7Kp2xQ9vL4nR8wE';
