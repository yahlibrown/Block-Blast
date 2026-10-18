// Error log: an opt-in, on-screen list of uncaught errors and unhandled promise
// rejections, for playtests on phones without a Web Inspector (e.g. an iPhone
// and no Mac). Switched on by the `?debug` URL flag; players never see it.

export interface ErrorLogOptions {
  /** The page's query string, e.g. `location.search`. */
  search: string;
  /** Where the browser reports errors (`window`). */
  target: EventTarget;
  /** Shows one log line on screen. */
  show: (line: string) => void;
}

/** Starts listening when the debug flag is set; returns whether it did. */
export function startErrorLog({ search, target, show }: ErrorLogOptions): boolean {
  if (!new URLSearchParams(search).has("debug")) return false;
  target.addEventListener("error", (e) => show(describeError(e as ErrorEvent)));
  target.addEventListener("unhandledrejection", (e) =>
    show(`Unhandled rejection: ${describe((e as PromiseRejectionEvent).reason)}`),
  );
  return true;
}

function describeError(e: ErrorEvent): string {
  const where = e.filename ? ` (${e.filename}:${e.lineno}:${e.colno})` : "";
  return `${e.error !== undefined ? describe(e.error) : e.message}${where}`;
}

/** A thrown value as text: an Error's name, message and stack top, or the value itself. */
function describe(value: unknown): string {
  if (value instanceof Error) {
    const stack = value.stack?.split("\n").slice(1, 4).join("\n") ?? "";
    return `${value.name}: ${value.message}${stack ? `\n${stack}` : ""}`;
  }
  return String(value);
}
