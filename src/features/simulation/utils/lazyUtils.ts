import React from 'react';

/**
 * A wrapper around React.lazy that handles "Failed to fetch dynamically imported module" errors
 * which typically happen after a new deployment when old chunks are deleted.
 */
export function safeLazy<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        try {
            return await factory();
        } catch (error: any) {
            // Check if it's a chunk loading error
            const isChunkError =
                /failed to fetch dynamically imported module/i.test(error.message) ||
                /loading chunk/i.test(error.message);

            if (isChunkError) {
                const RELOAD_KEY = 'last_chunk_reload';
                const now = Date.now();
                const lastReload = parseInt(localStorage.getItem(RELOAD_KEY) || '0', 10);

                // Prevent reload loops - only reload if we haven't in the last 10 seconds
                if (now - lastReload > 10000) {
                    localStorage.setItem(RELOAD_KEY, now.toString());
                    console.warn("Chunk load error detected. Reloading application to fetch latest version...");
                    window.location.reload();
                    // Return a never-resolving promise to hold the UI
                    return new Promise(() => { });
                }
            }

            // If it's not a chunk error or we already reloaded recently, rethrow
            throw error;
        }
    });
}
