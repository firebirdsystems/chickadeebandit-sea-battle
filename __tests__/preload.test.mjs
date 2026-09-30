import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const html = readFileSync(join(__dirname, "../src/index.html"), "utf-8");
const norm = (s) => s.replace(/\s+/g, " ").trim();
const preload = manifest.preload ?? {};

// The hub runs `manifest.preload` while rendering the document and answers the
// app's matching api/db request from the embedded rows — matching on the
// statement text with whitespace collapsed. A drifted copy is not an error
// anywhere: it is a preload that silently never answers. So the manifest is
// checked against the source here.
describe("manifest.preload mirrors the app's first-render reads", () => {
  const body = norm(html);
  const prefix = `app_${manifest.id.replace(/-/g, "_")}__`;

  it("declares the games list exactly as loadGames posts it, bound to the signed-in member", () => {
    // The whole db('…', [params]) call, not a substring of the SQL: the hub
    // matches the params too, and ":me" only equals `me.id` because `me` starts
    // as the hub's current member (the members[0] fallback is for demo mode,
    // which has no api/db and gets no preload).
    expect(preload.games.params).toEqual([":me", ":me"]);
    expect(body.includes(`db( '${norm(preload.games.sql)}', [me.id, me.id] )`), "preload.games is not the text loadGames posts").toBe(true);
    expect(body).toContain("const ME = window.__CURRENT_MEMBER ?? null;");
    expect(body).toContain("let me = ME ? { ...ME } : null;");
  });

  it("loadGames is the first api/db read at boot", () => {
    expect(body).toMatch(/\(async \(\) => \{ await loadMembers\(\); await loadGames\(\);/);
  });

  it("stays within the hub's caps and reads only this app's tables", () => {
    expect(Object.keys(preload).length).toBeLessThanOrEqual(6);
    for (const [name, { sql, params = [] }] of Object.entries(preload)) {
      expect(sql, name).toMatch(/^(SELECT|WITH) /);
      expect(sql, name).not.toMatch(/;|--/);
      for (const table of sql.match(/(?:FROM|JOIN)\s+(\w+)/g) ?? []) expect(table, name).toMatch(new RegExp(`\\s${prefix}`));
      expect((sql.match(/\?/g) ?? []).length, `${name}: placeholders vs params`).toBe(params.length);
    }
  });
});
