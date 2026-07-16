# Study Service

Manages decks and the spaced-repetition scheduling of flashcards.

## Spaced repetition algorithm

Every flashcard tracked in a deck has a `StudyRecordEntity` with two numbers that drive scheduling:

- **`intervalDays`** — how many days to wait before the card is due again.
- **`easeFactor`** — a multiplier that grows or shrinks how quickly the interval increases. It starts at `2.5` and never drops below `1.3` (the same bounds used by SM-2-style algorithms such as Anki's).

When a flashcard is first added to a deck (`POST /decks/{deck_id}/flashcards`), its record starts at `intervalDays = 0` and `easeFactor = 2.5`, and it is due immediately.

Each time the learner studies a card, they rate how well they remembered it — `again`, `hard`, `good`, or `easy` — and the service recalculates `intervalDays` and `easeFactor` from the *current* values:

| Rating | New interval | Ease factor change |
|--------|--------------|---------------------|
| **Again** | Reset to `0` (due immediately) | Decrease by the "again" penalty, floored at the minimum ease |
| **Hard** | `max(1, round(max(currentInterval, 1) × 1.2))` days | Decrease by the "hard" penalty, floored at the minimum ease |
| **Good** | `1` day if the card had no interval yet, otherwise `round(currentInterval × easeFactor)` days | Unchanged |
| **Easy** | `2` days if the card had no interval yet, otherwise `round(currentInterval × easeFactor × 1.3)` days | Increase by the "easy" bonus |

The new due date is `now` (if the interval is `0`) or `now + intervalDays` days — **except** for one case: if the card hasn't graduated past the reset state yet (`intervalDays <= 0` before this update, i.e. it's brand new or was just reset by "Again") and is rated **Hard**, it's due again after a short learning-step delay (`STUDY_HARD_FIRST_STEP_MINUTES`, default `10` minutes) instead of jumping straight to a full day. `intervalDays` is still recorded as `1` so later ratings grow from that baseline normally — only the *next* due timestamp for this one review is shortened.

Intuitively:
- **Again** means the card wasn't remembered at all — it resets to the beginning and gets a little harder to grow next time.
- **Hard** still grows the interval, just slower than normal, and nudges the ease down. If the card hasn't graduated past the reset state yet, this is a quick retry (minutes) rather than a full day, so it doesn't disappear from the queue for a whole day the first time it's mildly difficult.
- **Good** is the "as expected" path — the interval grows by whatever the ease factor currently is.
- **Easy** grows the interval faster than Good (by an extra 1.3× multiplier) and raises the ease factor, so future intervals grow faster too.

Because the ease factor is unique to each card, cards that are consistently rated Easy pull ahead with longer and longer gaps between reviews, while cards repeatedly marked Again or Hard stay in a tighter review loop.

## Configuring the ease factor via environment variables

The ease-factor constants are not hardcoded — they're read from Spring configuration (`application.properties`), which can be overridden with environment variables at deploy time:

| Environment variable | Property | Default | Meaning |
|---|---|---|---|
| `STUDY_EASE_DEFAULT` | `study.ease.default` | `2.5` | Starting ease factor for a newly tracked card |
| `STUDY_EASE_MIN` | `study.ease.min` | `1.3` | Lower bound the ease factor can never drop below |
| `STUDY_EASE_AGAIN_PENALTY` | `study.ease.again-penalty` | `0.20` | Amount subtracted from the ease factor on "Again" |
| `STUDY_EASE_HARD_PENALTY` | `study.ease.hard-penalty` | `0.15` | Amount subtracted from the ease factor on "Hard" |
| `STUDY_EASE_EASY_BONUS` | `study.ease.easy-bonus` | `0.15` | Amount added to the ease factor on "Easy" |
| `STUDY_HARD_FIRST_STEP_MINUTES` | `study.hard-first-step-minutes` | `10` | Minutes until a still-learning card rated "Hard" is due again |

The interval multipliers (`1.2` for Hard, `1.3` for Easy) are algorithm constants, not ease-factor tuning knobs, and remain fixed in `StudyService`.

### Keeping the frontend in sync

`web-client` previews the next interval for each rating button before the learner picks one (see `web-client/src/lib/spacedRepetition.ts`), which requires re-implementing this same formula in TypeScript. Its ease-factor and learning-step values are read from build-time `VITE_STUDY_EASE_*`/`VITE_STUDY_HARD_FIRST_STEP_MINUTES` env vars (see `web-client/.env.example`) — **these must be set to the same values as the vars above**, or the preview shown in the UI will drift from what the backend actually schedules. `STUDY_EASE_DEFAULT` has no frontend counterpart since it only applies when a card is first tracked, before any preview is shown.
