/**
 * Vite `base` for a build.
 *
 * `pagesPath` is the GitHub Pages path from actions/configure-pages
 * (`base_path` output): "/<repo>" for a project site, "" for a user site or
 * custom domain. Undefined means "not building for Pages" (local dev/preview),
 * where a relative base works from any folder.
 */
export function resolveBase(pagesPath: string | undefined): string {
  if (pagesPath === undefined) return "./";
  const trimmed = pagesPath.trim().replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? "/" : `/${trimmed}/`;
}
