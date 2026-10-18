// Asks the browser to keep the site's saved data (Best Score, Skins, the Run)
// instead of clearing it under storage pressure or after a week away.
// Fire and forget: nothing depends on the answer, and failures are ignored.
// Only asked where the browser decides silently (Safari and every iPhone browser, Chromium):
// Gecko Firefox shows the player a permission prompt instead, so it is never asked there.

/** The slice of `Navigator` this module uses (inject a fake in tests). */
export interface PersistNavigatorLike {
  readonly userAgent?: string;
  readonly storage?: { readonly persist?: () => Promise<boolean> };
}

export function requestPersistentStorage(nav: PersistNavigatorLike | undefined): void {
  try {
    const persist = nav?.storage?.persist;
    if (typeof persist !== "function" || promptsForPersistence(nav!.userAgent)) return;
    Promise.resolve(persist.call(nav!.storage)).catch(() => {});
  } catch {
    // Unsupported or blocked: play on.
  }
}

/** Gecko Firefox (desktop and Android) asks the player; Firefox on iPhone ("FxiOS") is WebKit and doesn't. */
function promptsForPersistence(userAgent: string | undefined): boolean {
  return /\bFirefox\//.test(userAgent ?? "");
}
