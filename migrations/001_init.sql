CREATE TABLE IF NOT EXISTS app_sea_battle__sea_battle_games (
  id            TEXT    NOT NULL,
  challenger_id   TEXT  NOT NULL,
  challenger_name TEXT  NOT NULL,
  opponent_id     TEXT  NOT NULL,
  opponent_name   TEXT  NOT NULL,
  status          TEXT  NOT NULL DEFAULT 'pending_challenger',
  current_turn_id TEXT,
  winner_id       TEXT,
  winner_name     TEXT,
  created_at      TEXT  NOT NULL,
  updated_at      TEXT  NOT NULL,
  resigned_by_id  TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_sea_battle__sea_battle_ships (
  id           TEXT    NOT NULL,
  game_id      TEXT    NOT NULL,
  owner_id     TEXT    NOT NULL,
  ship_type    TEXT    NOT NULL,
  ship_size    INTEGER NOT NULL,
  positions    TEXT    NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_sea_battle__sea_battle_shots (
  id               TEXT    NOT NULL,
  game_id          TEXT    NOT NULL,
  shooter_id       TEXT    NOT NULL,
  target_player_id TEXT    NOT NULL,
  target_row       INTEGER NOT NULL,
  target_col       INTEGER NOT NULL,
  result           TEXT    NOT NULL,
  sunk_ship_type   TEXT,
  shot_at          TEXT    NOT NULL,
  PRIMARY KEY (id)
);
