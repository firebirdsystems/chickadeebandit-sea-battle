-- A game whose opponent has left the household could not be closed honestly.
-- games is party_scoped, so only the two players ever see it, and resign was the
-- only endpoint that ends a game — so the surviving player's only exit was to
-- hand a departed member the win, which is both untrue and (via the
-- game.completed event) a fabricated leaderboard result for someone who is gone.
--
-- abandoned_at marks a game closed with no winner. NULL for every game that
-- ended by play or by resignation, so nothing existing changes meaning.
ALTER TABLE app_sea_battle__games ADD COLUMN abandoned_at TEXT;
