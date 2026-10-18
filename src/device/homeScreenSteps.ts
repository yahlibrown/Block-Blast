// Home Screen Hint steps: which taps add the game to the Home Screen, read from the browser's user
// agent. Safari 26 moved Share behind its ••• button and Add to Home Screen behind View More; older
// Safari has Share in the toolbar. Other iPhone browsers put Share in different places, so they get
// one generic step. Pure: no DOM; the card draws the steps.

export type StepIcon = "more" | "share" | "add";

export interface HomeScreenStep {
  readonly label: string;
  readonly icon?: StepIcon;
}

const NEWER_SAFARI: readonly HomeScreenStep[] = [
  { label: "Tap •••", icon: "more" },
  { label: "Share", icon: "share" },
  { label: "View More" },
  { label: "Add to Home Screen", icon: "add" },
];

const OLDER_SAFARI: readonly HomeScreenStep[] = [
  { label: "Tap Share", icon: "share" },
  { label: "Add to Home Screen", icon: "add" },
];

const OTHER_BROWSER: readonly HomeScreenStep[] = [{ label: "Open your browser's Share menu, then Add to Home Screen" }];

/** Browsers on iPhone that aren't Safari, though their user agent says "Safari". */
const NOT_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|YaBrowser/;

/** The steps for this browser; an unknown Safari version gets the newest Safari's steps. */
export function homeScreenSteps(userAgent: string | undefined): readonly HomeScreenStep[] {
  if (userAgent === undefined) return NEWER_SAFARI;
  if (NOT_SAFARI.test(userAgent) || !userAgent.includes("Safari/")) return OTHER_BROWSER;
  const version = /Version\/(\d+)/.exec(userAgent);
  if (version && Number(version[1]) < 26) return OLDER_SAFARI;
  return NEWER_SAFARI;
}
