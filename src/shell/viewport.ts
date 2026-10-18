// Visible viewport: sizes the page to what the browser actually shows (Safari's toolbars grow and
// shrink), and reads the safe-area insets (notch, Dynamic Island, Home indicator) for the layout.
import type { Insets } from "../renderer/renderer";

/** Keep `--app-height` on the page equal to the visible viewport height; `changed` gets the insets after every re-measure. */
export function trackViewport(changed: (insets: Insets) => void): void {
  // CSS env() values are only readable through a styled element.
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
    "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
  document.body.appendChild(probe);
  const measure = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    const style = getComputedStyle(probe);
    const px = (v: string) => parseFloat(v) || 0;
    const insets: Insets = {
      top: px(style.paddingTop),
      right: px(style.paddingRight),
      bottom: px(style.paddingBottom),
      left: px(style.paddingLeft),
    };
    window.scrollTo(0, 0); // Safari may have nudged the page while its toolbars moved
    changed(insets);
  };

  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  window.visualViewport?.addEventListener("resize", measure);
  measure();
}
