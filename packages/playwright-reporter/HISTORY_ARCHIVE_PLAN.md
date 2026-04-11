# Plan: Bounded Dashboard + Archive JSON for Evicted Runs

## TL;DR
`maxRuns` keeps its current meaning and behavior for `history-index.json` (trimmed to N) and `runs/` dirs (deleted when evicted). The only addition: evicted run entries are appended to a new `history-archive.json` file instead of being silently discarded. Users can inspect or delete that file at will — it has no impact on the dashboard.

---

## What changes vs. today

| | Today | After |
|--|-------|-------|
| `history-index.json` | Trimmed to `maxRuns` | Trimmed to `maxRuns` (unchanged) |
| `runs/` dirs on disk | Deleted for evicted runs | Deleted for evicted runs (unchanged) |
| Dashboard | Shows `maxRuns` entries | Shows `maxRuns` entries (unchanged) |
| Evicted run metadata | Silently lost | Appended to `history-archive.json` |

---

## Phase 1 — `reporter.ts`: `updateHistoryIndex`

**File:** `packages/playwright-reporter/src/reporter.ts`

Current flow (lines 451–457):
1. Unshift new entry
2. Collect `evictedRunIds` = everything beyond `maxRuns`
3. Trim `historyIndex.runs` to `maxRuns`
4. Write `history-index.json`
5. Delete `runs/` dirs for evicted IDs

New step **between 3 and 4** — capture evicted entries and archive them:

```ts
const evictedEntries = historyIndex.runs.slice(this.maxRuns);
const evictedRunIds  = evictedEntries.map(r => r.runId);
historyIndex.runs    = historyIndex.runs.slice(0, this.maxRuns);

if (evictedEntries.length > 0) {
    await this.appendToArchive(evictedEntries);
}

await fs.writeFile(this.historyIndexFile, JSON.stringify(historyIndex, null, 2));

for (const runId of evictedRunIds) await this.deleteRunDir(runId);
```

---

## Phase 2 — `reporter.ts`: new `appendToArchive` method

Add private method on `LocalHistoryReporter`:

```ts
private async appendToArchive(entries: TestHistoryEntry[]) {
    const archivePath = path.join(this.historyDir, 'history-archive.json');
    let archive: HistoryIndex;
    try {
        const content = await fs.readFile(archivePath, 'utf-8');
        archive = JSON.parse(content) as HistoryIndex;
    } catch {
        archive = { runs: [] };
    }
    // Avoid duplicates in case of repeated runs — guard by runId
    const existingIds = new Set(archive.runs.map(r => r.runId));
    for (const entry of entries) {
        if (!existingIds.has(entry.runId)) {
            archive.runs.push(entry);
        }
    }
    await fs.writeFile(archivePath, JSON.stringify(archive, null, 2));
}
```

Archive is append-only, oldest-first. No trimming, no automatic deletion. Grows until the user deletes it.

---

## Phase 3 — README update

**`packages/playwright-reporter/README.md`**

1. Update `maxRuns` option description in the Options table:
   > "How many runs to keep active in the dashboard and on disk. Older runs are moved to `history-archive.json` automatically."

2. Add `history-archive.json` to the file structure section:
   ```
   └── <historyDir>/
       ├── index.html
       ├── history-index.json       ← active runs (last N)
       ├── history-archive.json     ← evicted run metadata (optional, safe to delete)
       └── runs/
   ```

3. Update the Reporter feature bullet:
   - Before: "Retains the last **N runs** (default 30) as the single retention policy — index and disk stay in sync"
   - After: "Retains the last **N runs** (default 30) in the dashboard — evicted run metadata is moved to `history-archive.json`; artifact files on disk are still removed"

4. Update `.gitignore` suggestion to include `history-archive.json` (can grow large over time).

---

## Phase 4 — No dashboard changes

The dashboard only reads `history-index.json`. It is unaware of `history-archive.json`. No changes to any file under `dashboard/`.

---

## Phase 5 — Build & Verify

1. `npm run build` in `packages/playwright-reporter` (TS compile only — no dashboard rebuild needed)
2. Run tests with `maxRuns: 2`, four times total
3. Confirm `history-index.json` has exactly 2 entries (latest 2)
4. Confirm `history-archive.json` exists and has the 2 evicted entries
5. Confirm only 2 `runs/` dirs exist on disk
6. Delete `history-archive.json`, run again — confirm it is recreated from the next eviction
7. Run with no eviction (fewer runs than `maxRuns`) — confirm `history-archive.json` is not created or touched

---

## Relevant Files

| File | Change |
|------|--------|
| `packages/playwright-reporter/src/reporter.ts` | `updateHistoryIndex`: capture evicted entries before trim; call `appendToArchive`; add `appendToArchive` private method |
| `packages/playwright-reporter/README.md` | Update `maxRuns` description, file structure, reporter bullets, `.gitignore` example |

**Not changed:**
- `dashboard/src/js/init.js`
- `dashboard/config.template.js`
- `dashboard/index.html`

---

## Decisions

- `history-archive.json` is **independent** from `history-index.json` — the dashboard never loads it.
- Archive is **append-only, oldest-first** — new evictions go to the end.
- Duplicate guard (by `runId`) prevents double-writing in edge cases.
- Archive has the **same JSON shape** as `history-index.json` (`{ runs: [...] }`) — easy to inspect or parse manually.
- `history-archive.json` is added to the `.gitignore` recommendation.
- No migration needed for existing users — archive starts accumulating from the next eviction.
