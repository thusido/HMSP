import type { PlatformAdapter } from './PlatformAdapter';
import { WebPlatformAdapter } from './WebAdapter';

/** Resolves the platform adapter. Tauri is lazy-loaded so web/PWA bundles exclude @tauri-apps/*. */
export class PlatformServiceFactory {
  static async create(): Promise<PlatformAdapter> {
    const isTauri =
      typeof window !== 'undefined' && !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    if (isTauri) {
      const { TauriAdapter } = await import('./TauriAdapter');
      return new TauriAdapter();
    }
    return new WebPlatformAdapter();
  }
}
