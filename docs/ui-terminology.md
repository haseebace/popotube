# UI terminology (PoPoTube)

Use these terms consistently in user-facing copy (admin and public). Prefer **US English**, **sentence case** for headings and buttons, and **contractions** where they read naturally.

## Core product

| Term            | Use                                                | Avoid                                                                       |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| **PoPoTube**    | Product name                                       | PopoTube, POPOTUBE                                                          |
| **Real-Debrid** | The debrid provider (hyphenated, as on their site) | RD-only in user-facing text unless space is tight; then “RD” is OK in admin |

## Pipeline and backend

| Term                 | Meaning in this app                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Ingest**           | Submitting a magnet (or equivalent) to the backend so Real-Debrid and workers process it—**not** “upload” or “import” for this flow |
| **Queue**            | Background jobs handled by **Redis + BullMQ** (waiting, active, failed, completed)—**not** a user’s watchlist                       |
| **Job**              | A single queued unit of work (often tied to a `videos` row or ingest request)                                                       |
| **Active downloads** | Items still processing (not completed or failed)                                                                                    |

## Search and metadata

| Term          | Meaning                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| **TMDb**      | The Movie Database—use this abbreviation in UI after first mention if needed: “TMDb” |
| **Jackett**   | Local indexer proxy; “Jackett search” in admin                                       |
| **Torrentio** | Stremio/Torrentio catalog integration                                                |
| **Magnet**    | `magnet:?…` link—say “magnet” or “magnet link”                                       |

## Real-Debrid surfaces

| Term                       | Meaning                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Library**                | Torrents stored in the Real-Debrid account (admin **Real-Debrid library**)                 |
| **Unrestricted downloads** | Generated unrestricted links / download history (not the same as “torrents in library”)    |
| **Cached**                 | Already on Real-Debrid’s side (instant availability)—use when describing hash/cache checks |

## Playback (public)

| Term       | Meaning                                                    |
| ---------- | ---------------------------------------------------------- |
| **Stream** | Playing video through the app (browser or external player) |
| **Watch**  | The public movie watch experience (`/watch/...`)           |

## Words to use sparingly or replace

| Instead of             | Prefer                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Utilize, leverage      | Use                                                         |
| Successfully           | (omit—state the outcome: “Saved”, “Sent”)                   |
| Please [verb]…         | Direct instruction unless one “please” softens a harsh step |
| Error / failed (alone) | What failed + what to try next                              |

This file is the source of truth for **word choice**, not full voice-and-tone rules. For copy style, follow project rules and skills under `.cursor/skills/` when applicable.
