import { describe, expect, it } from "vitest";
import { resolveBase } from "./basePath";

describe("resolveBase", () => {
  it("uses a relative base when no Pages path is given (local dev/preview)", () => {
    expect(resolveBase(undefined)).toBe("./");
  });

  it("turns a project-site Pages path into an absolute base with a trailing slash", () => {
    expect(resolveBase("/block-blast")).toBe("/block-blast/");
  });

  it("keeps an already slash-terminated path", () => {
    expect(resolveBase("/block-blast/")).toBe("/block-blast/");
  });

  it("adds a missing leading slash", () => {
    expect(resolveBase("block-blast")).toBe("/block-blast/");
  });

  it("maps an empty Pages path (user site or custom domain) to the root", () => {
    expect(resolveBase("")).toBe("/");
    expect(resolveBase("/")).toBe("/");
  });

  it("ignores surrounding whitespace", () => {
    expect(resolveBase("  /block-blast \n")).toBe("/block-blast/");
  });
});
