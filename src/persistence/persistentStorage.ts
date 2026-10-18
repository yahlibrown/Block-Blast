// Asks the browser to keep the site's saved data (Best Score, Skins, the Run)
// instead of clearing it under storage pressure or after a week away.
// Fire and forget: nothing depends on the answer, and failures are ignored.

/** The slice of `Navigator` this module uses (inject a fake in tests). */
export interface PersistNavigatorLike {
  readonly storage?: { readonly persist?: () => Promise<boolean> };
}

export function requestPersistentStorage(nav: PersistNavigatorLike | undefined): void {
  try {
    const persist = nav?.storage?.persist;
    if (typeof persist !== "function") return;
    Promise.resolve(persist.call(nav!.storage)).catch(() => {});
  } catch {
    // Unsupported or blocked: play on.
  }
}
