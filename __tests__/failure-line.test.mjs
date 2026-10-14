import { describe, it, expect } from "vitest";
import { failureLine, challengeFailureLine } from "../src/logic.js";

const err = (status, code, message = "hub text") => Object.assign(new Error(message), { status, code });
const words = { action: "start the game", thing: "game" };

describe("failureLine", () => {
  it("names a duplicate by code, or by the text as a fallback", () => {
    expect(failureLine(err(400, "UNIQUE_CONSTRAINT"), words)).toBe("That game already exists.");
    expect(failureLine(err(400, undefined, "UNIQUE constraint failed: x.id"), words)).toBe("That game already exists.");
  });

  it("says a refusal, not try again", () => {
    expect(failureLine(err(403), words)).toBe("You don’t have permission to start the game.");
    expect(failureLine(err(507), words)).toBe("The household’s storage is full — free up space first.");
    expect(failureLine(err(404), words)).toBe("This game has been removed.");
    expect(failureLine(err(409), words)).toBe("This game was changed by someone else — check it first.");
    expect(failureLine(err(429), words)).toBe("Too many tries — wait a minute and try again.");
  });

  it("says try again for no answer, a 5xx or another 400", () => {
    expect(failureLine(new Error("Failed to fetch"), words)).toBe("Couldn’t start the game — try again.");
    expect(failureLine(err(500), words)).toBe("Couldn’t start the game — try again.");
    expect(failureLine(err(503), words)).toBe("Couldn’t start the game — try again.");
    expect(failureLine(err(400), words)).toBe("Couldn’t start the game — try again.");
  });

  it("shows only an app-worded message, never the hub's", () => {
    expect(failureLine(Object.assign(new Error("Pick an opponent."), { forUser: true }), words)).toBe("Pick an opponent.");
    expect(failureLine(err(500, undefined, "Database request failed (503)"), words)).not.toContain("Database");
  });
});

describe("challengeFailureLine", () => {
  it("a game id another game holds is worth another try with a new id", () => {
    expect(challengeFailureLine(err(409, "game_id_taken"))).toBe("Couldn’t start the game — try again.");
  });

  it("an opponent no longer in the household is said as such", () => {
    expect(challengeFailureLine(err(404))).toBe("That family member isn’t in the household any more.");
  });

  it("falls back to the table", () => {
    expect(challengeFailureLine(err(403))).toBe("You don’t have permission to start the game.");
    expect(challengeFailureLine(err(409))).toBe("This game was changed by someone else — check it first.");
    expect(challengeFailureLine(err(502))).toBe("Couldn’t start the game — try again.");
    expect(challengeFailureLine(null)).toBe("Couldn’t start the game — try again.");
  });
});
