import { describe, it, expect } from "vitest";
import {
  SHIPS, GRID_SIZE, COL_LABELS,
  getShipCells, isInBounds, hasOverlap,
  isValidPlacement, evaluateShot, isAllSunk, totalShipCells,
} from "../src/logic.js";

describe("constants", () => {
  it("GRID_SIZE is 10", () => expect(GRID_SIZE).toBe(10));
  it("SHIPS has 5 entries", () => expect(SHIPS).toHaveLength(5));
  it("COL_LABELS has 10 entries", () => expect(COL_LABELS).toHaveLength(10));
  it("totalShipCells sums to 17", () => expect(totalShipCells()).toBe(17));
});

describe("getShipCells", () => {
  it("horizontal cells", () => {
    expect(getShipCells(0, 0, 3, true)).toEqual([
      { row:0, col:0 }, { row:0, col:1 }, { row:0, col:2 },
    ]);
  });
  it("vertical cells", () => {
    expect(getShipCells(2, 3, 2, false)).toEqual([
      { row:2, col:3 }, { row:3, col:3 },
    ]);
  });
  it("single-cell ship", () => {
    expect(getShipCells(5, 5, 1, true)).toEqual([{ row:5, col:5 }]);
  });
});

describe("isInBounds", () => {
  it("accepts corner cells", () => {
    expect(isInBounds([{ row:0, col:0 }, { row:9, col:9 }])).toBe(true);
  });
  it("rejects col = 10", () => {
    expect(isInBounds([{ row:0, col:10 }])).toBe(false);
  });
  it("rejects row = -1", () => {
    expect(isInBounds([{ row:-1, col:0 }])).toBe(false);
  });
  it("rejects row = 10", () => {
    expect(isInBounds([{ row:10, col:0 }])).toBe(false);
  });
});

describe("hasOverlap", () => {
  const ships = [{ positions: JSON.stringify([{ row:0, col:0 }, { row:0, col:1 }]) }];

  it("detects overlap on occupied cell", () => {
    expect(hasOverlap([{ row:0, col:1 }], ships)).toBe(true);
  });
  it("no overlap on adjacent cell", () => {
    expect(hasOverlap([{ row:0, col:2 }], ships)).toBe(false);
  });
  it("no overlap on empty grid", () => {
    expect(hasOverlap([{ row:5, col:5 }], [])).toBe(false);
  });
  it("accepts pre-parsed positions array", () => {
    const s = [{ positions: [{ row:3, col:3 }] }];
    expect(hasOverlap([{ row:3, col:3 }], s)).toBe(true);
  });
});

describe("isValidPlacement", () => {
  it("valid on empty grid", () => {
    expect(isValidPlacement(5, 5, 3, true, [])).toBe(true);
  });
  it("valid vertical in bounds", () => {
    expect(isValidPlacement(0, 0, 5, false, [])).toBe(true);
  });
  it("invalid: horizontal overflows right edge", () => {
    expect(isValidPlacement(0, 8, 4, true, [])).toBe(false);
  });
  it("invalid: vertical overflows bottom edge", () => {
    expect(isValidPlacement(8, 0, 3, false, [])).toBe(false);
  });
  it("invalid: overlaps existing ship", () => {
    const placed = [{ positions: JSON.stringify([{ row:2, col:2 }, { row:2, col:3 }]) }];
    expect(isValidPlacement(2, 2, 2, true, placed)).toBe(false);
  });
  it("valid: adjacent to existing ship (no buffer rule)", () => {
    const placed = [{ positions: JSON.stringify([{ row:2, col:2 }, { row:2, col:3 }]) }];
    expect(isValidPlacement(2, 4, 2, true, placed)).toBe(true);
  });
});

describe("evaluateShot", () => {
  const ships = [
    { ship_type: "destroyer", positions: JSON.stringify([{ row:0, col:0 }, { row:0, col:1 }]) },
    { ship_type: "cruiser",   positions: JSON.stringify([{ row:5, col:5 }, { row:5, col:6 }, { row:5, col:7 }]) },
  ];

  it("miss when no ship at target", () => {
    expect(evaluateShot(3, 3, ships, [])).toEqual({ result:"miss", shipType:null });
  });

  it("hit (first cell, not yet sunk)", () => {
    expect(evaluateShot(0, 0, ships, [])).toEqual({ result:"hit", shipType:null });
  });

  it("sunk when last remaining cell hit", () => {
    const prior = [{ target_row:0, target_col:0, result:"hit" }];
    expect(evaluateShot(0, 1, ships, prior)).toEqual({ result:"sunk", shipType:"destroyer" });
  });

  it("hit (middle cell of cruiser)", () => {
    expect(evaluateShot(5, 6, ships, [])).toEqual({ result:"hit", shipType:null });
  });

  it("sunk cruiser after all cells hit", () => {
    const prior = [
      { target_row:5, target_col:5, result:"hit" },
      { target_row:5, target_col:6, result:"hit" },
    ];
    expect(evaluateShot(5, 7, ships, prior)).toEqual({ result:"sunk", shipType:"cruiser" });
  });
});

describe("isAllSunk", () => {
  const ships = [
    { positions: JSON.stringify([{ row:0, col:0 }, { row:0, col:1 }]) },
  ];

  it("false when only one cell hit", () => {
    const shots = [{ target_row:0, target_col:0, result:"hit" }];
    expect(isAllSunk(ships, shots)).toBe(false);
  });

  it("true when all cells hit", () => {
    const shots = [
      { target_row:0, target_col:0, result:"hit" },
      { target_row:0, target_col:1, result:"sunk" },
    ];
    expect(isAllSunk(ships, shots)).toBe(true);
  });

  it("false with no shots", () => {
    expect(isAllSunk(ships, [])).toBe(false);
  });

  it("true for multiple ships all hit", () => {
    const multi = [
      { positions: JSON.stringify([{ row:0, col:0 }]) },
      { positions: JSON.stringify([{ row:1, col:1 }]) },
    ];
    const shots = [
      { target_row:0, target_col:0, result:"sunk" },
      { target_row:1, target_col:1, result:"sunk" },
    ];
    expect(isAllSunk(multi, shots)).toBe(true);
  });
});
