// Pure game logic — no DOM, no network. Imported by tests.
export const GRID_SIZE = 10;
export const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];
export const SHIPS = [
  { type: 'carrier',    size: 5, label: 'Carrier'    },
  { type: 'battleship', size: 4, label: 'Battleship' },
  { type: 'cruiser',    size: 3, label: 'Cruiser'    },
  { type: 'submarine',  size: 3, label: 'Submarine'  },
  { type: 'destroyer',  size: 2, label: 'Destroyer'  },
];

export function totalShipCells() {
  return SHIPS.reduce((sum, s) => sum + s.size, 0);
}

export function getShipCells(row, col, size, horizontal) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push(horizontal ? { row, col: col + i } : { row: row + i, col });
  }
  return cells;
}

export function isInBounds(cells, gridSize = GRID_SIZE) {
  return cells.every(c => c.row >= 0 && c.row < gridSize && c.col >= 0 && c.col < gridSize);
}

export function hasOverlap(cells, ships) {
  const occupied = new Set();
  for (const ship of ships) {
    const positions = typeof ship.positions === 'string' ? JSON.parse(ship.positions) : ship.positions;
    for (const p of positions) occupied.add(`${p.row},${p.col}`);
  }
  return cells.some(c => occupied.has(`${c.row},${c.col}`));
}

export function isValidPlacement(row, col, size, horizontal, existingShips, gridSize = GRID_SIZE) {
  const cells = getShipCells(row, col, size, horizontal);
  return isInBounds(cells, gridSize) && !hasOverlap(cells, existingShips);
}

export function evaluateShot(row, col, ships, priorShots) {
  for (const ship of ships) {
    const positions = typeof ship.positions === 'string' ? JSON.parse(ship.positions) : ship.positions;
    if (!positions.some(p => p.row === row && p.col === col)) continue;

    const priorHits = new Set(
      priorShots
        .filter(s => s.result === 'hit' || s.result === 'sunk')
        .map(s => `${s.target_row},${s.target_col}`)
    );
    const allHit = positions.every(p =>
      (p.row === row && p.col === col) || priorHits.has(`${p.row},${p.col}`)
    );
    return allHit
      ? { result: 'sunk', shipType: ship.ship_type }
      : { result: 'hit',  shipType: null };
  }
  return { result: 'miss', shipType: null };
}

export function isAllSunk(ships, shots) {
  const hits = new Set(
    shots
      .filter(s => s.result === 'hit' || s.result === 'sunk')
      .map(s => `${s.target_row},${s.target_col}`)
  );
  return ships.every(ship => {
    const positions = typeof ship.positions === 'string' ? JSON.parse(ship.positions) : ship.positions;
    return positions.every(p => hits.has(`${p.row},${p.col}`));
  });
}

// ── Failure wording ──────────────────────────────────────────────────────────
// "Try again" only where trying again can work; never the hub's own text.

/** The line for a failed write, from the error's `status` / `code`. */
export function failureLine(e, { action, thing } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === 'UNIQUE_CONSTRAINT' || /UNIQUE constraint failed/i.test(String(e?.message ?? ''))) return `That ${thing} already exists.`;
  if (e?.status === 403) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return 'The household’s storage is full — free up space first.';
  if (e?.status === 404) return `This ${thing} has been removed.`;
  if (e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  if (e?.status === 429) return 'Too many tries — wait a minute and try again.';
  return `Couldn’t ${action} — try again.`;
}

/**
 * The line for a refused challenge (POST api/game/create). Its 404 means the
 * chosen opponent is not a household member any more, and a 409
 * `game_id_taken` means the page's minted game id belongs to another game:
 * the page mints a fresh one, so trying again can work.
 */
export function challengeFailureLine(e) {
  if (e?.status === 409 && e?.code === 'game_id_taken') return 'Couldn’t start the game — try again.';
  if (e?.status === 404) return 'That family member isn’t in the household any more.';
  return failureLine(e, { action: 'start the game', thing: 'game' });
}
