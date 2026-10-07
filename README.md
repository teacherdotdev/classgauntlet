# Class Gauntlet

**A classroom review game where one student takes on the rest of the class, and nobody gets knocked out.**

A serverless rebuild of an [open-source EdTech-a-thon project](https://github.com/deadbeef101010/1v100-edtechathon) that needs no server: instead of a Docker container with Node, Socket.IO and SQLite, the **teacher's browser tab runs the game** and every student's device connects straight to it over WebRTC, through teacher.dev's peer-to-peer matchmaking server. Teachers can also write their own question sets in the app.

## How a game works

1. The teacher picks a question set and opens a room. The projector shows a six-character code and a QR code.
2. Students go to `/join`, type the code and a nickname. (Up to 40 students.)
3. The teacher picks **The One** (the Spotlight Player); everyone else is the **Challenge Team**.
4. **Everybody answers first** on their own devices. The question is hidden from The One and from the projector.
5. **Spotlight Round:** The One sees the question and answers, or uses one lifeline per question (each once per game):
   - **Poll the Class**: see how many classmates chose an answer.
   - **Ask Two**: one classmate who was right and one who wasn't explain out loud (+5 each).
   - **Go with the Class**: lock in the class's most popular answer.
6. **The Reveal:** if The One is right, classmates who missed join the **Comeback Crew** (still answering, still scoring) and the **Prize Pot** grows by 20 per classmate. If The One is wrong, they lose a chance.
7. The game ends when The One runs out of chances (the surviving Challenge Team splits the pot), clears every question (The One banks the pot and survivors get a bonus), or empties the Challenge Team (jackpot: pot × 1.5). Then someone new takes the Spotlight.

The scoring rules are ported unchanged from the original (`src/lib/game/scoring.ts`), including the optional **On a Roll** meter: fast, unaided right answers by The One earn back a chance once per game.

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/` | everyone | Start or join a game |
| `/host` | teacher | Choose a question set and rules, then run the game: controls, answer key, roster, projector preview |
| `/show` | projector | Opened from the teacher console on the same computer; mirrors it over a `BroadcastChannel` |
| `/join?code=ABC234` | students | Join, answer, use lifelines |
| `/questions` | teacher | Question sets: write, import CSV / paste from a spreadsheet, download CSV, share by link |

## Custom questions

Question sets are saved in the teacher's browser (local storage). Ways to get questions in:

- **Write them** in the editor (`/questions/edit`): 2–4 choices per question and an optional explanation shown after the reveal.
- **Import a CSV** or **paste cells from Google Sheets/Excel** with a header row `question, A, B, C, D, answer, explanation` (D and explanation optional; `answer` is a letter or the answer's text).
- The original project's CSV format (`set title, subject, grade, question, choices, correct, explanation`, with `choices` a JSON array) imports too, one set per title.
- **Share links**: the set is compressed into the part of the link after `#`, which never reaches any server. Opening the link offers to add the set.

## Architecture

```
student phones ──WebRTC data channels──▶ teacher's tab (runs the rules, saves to local storage)
        ▲                                        │ BroadcastChannel
        └── peer.teacher.dev (PeerJS) introduces └──▶ /show projector window
            them; TURN relays when a network blocks direct connections
```

- `src/lib/game/` — the rules as plain TypeScript: `engine.ts` (commands and phases), `scoring.ts`, `views.ts` (what each screen may see: the correct answer never leaves the teacher's tab before the reveal).
- `src/lib/host.svelte.ts` — the teacher's room: registers `classgauntlet-<CODE>` on the PeerJS server, accepts students, broadcasts views, and saves the whole game after every change. Reloading the tab offers to resume, reclaims the same code, and students reconnect on their own.
- `src/lib/student.svelte.ts` — a student's link. Its seat (player id + secret) is kept in local storage, so a reload or dropped Wi-Fi puts the student back in with their points.
- `src/lib/peer.ts` — shared with Happy Hallways: picks `peer.teacher.dev` or `peer.happyhallways.com`, fetches TURN logins from `/api/turn`, reconnects with backoff, heartbeats.
- `api/turn.ts` — a Vercel function that hands out short-lived Cloudflare TURN logins. Needs `TURN_KEY_ID` and `TURN_KEY_API_TOKEN`.

The teacher's tab must stay open during the game; closing it ends the room (a reload resumes it).

## Development

```bash
bun install
bun run dev        # http://localhost:8000
bun test src       # rules, scoring, CSV
bun run test:e2e   # plays a whole game between separate browsers via the real peer server
bun run check
bun run build
```

Put `TURN_KEY_ID` / `TURN_KEY_API_TOKEN` in `.env.local` to test the relay locally (see `.env.example`). Without them, devices on the same network still connect directly.

## Deploying

Live at **https://classgauntlet.teacher.dev**, on Vercel (project `classgauntlet`, repo `teacherdotdev/classgauntlet`), created with the Sites scripts (`../sites`): `bun run create-site --path ../classroom-review-game --slug classgauntlet`. Pushing `main` redeploys. The Vercel project has `TURN_KEY_ID` and `TURN_KEY_API_TOKEN` set (the same Cloudflare TURN key as Happy Hallways).

## License

Apache 2.0, like the project it is adapted from: https://github.com/deadbeef101010/1v100-edtechathon (Copyright 2026 deadbeef101010 and contributors).
