-- Sea Battle shipped with no indexes at all. Every board render reads ships and
-- shots by game_id, and a game accumulates roughly a hundred shots.
--
-- games is party_scoped over challenger_id/opponent_id: the policy rewrite
-- becomes `challenger_id = ? OR opponent_id = ?`, and SQLite cannot use a
-- composite index for an OR of two columns — each needs its own (the same
-- lesson as borrowing's party_scoped lists).
CREATE INDEX IF NOT EXISTS app_sea_battle__idx_ships_game
  ON app_sea_battle__ships (game_id);

CREATE INDEX IF NOT EXISTS app_sea_battle__idx_shots_game
  ON app_sea_battle__shots (game_id, shot_at);

CREATE INDEX IF NOT EXISTS app_sea_battle__idx_games_challenger
  ON app_sea_battle__games (challenger_id);

CREATE INDEX IF NOT EXISTS app_sea_battle__idx_games_opponent
  ON app_sea_battle__games (opponent_id);

CREATE INDEX IF NOT EXISTS app_sea_battle__idx_games_status
  ON app_sea_battle__games (status);

-- retain_days sweep key.
CREATE INDEX IF NOT EXISTS app_sea_battle__games_retention_idx
  ON app_sea_battle__games (updated_at, id);
