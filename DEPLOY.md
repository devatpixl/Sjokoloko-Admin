# Deploying the Sjoko Loco admin

Server: `root@187.124.180.167`, code at `/srv/sjokoloko/admin`, service
`sjokoloko-admin` (Next.js, port 3001).

**The admin is served at `https://admin.sjokoloco.no`.**

`test-admin.sjokoloco.no` is the retired old name. It still resolves and still
works, but nothing should use it — retire it with
`bash /srv/sjokoloko/retire-test-admin.sh` once you are happy, then delete its
Cloudflare DNS record.

## Trap: never `npm run build` while `sjokoloko-admin` is running

The build rewrites `.next` underneath the running server, so every
`/_next/static/chunks/*.js` request returns **500** for the ~3 minutes the
build takes. The page still returns 200 but no JS loads, so it renders
**completely blank** — the login form is a client component and only appears
after hydration. It fixes itself on `systemctl restart sjokoloko-admin`.

To avoid the blank window entirely:

```bash
systemctl stop sjokoloko-admin
npm run build
systemctl start sjokoloko-admin
```

```bash
ssh root@187.124.180.167
cd /srv/sjokoloko/admin

git pull --ff-only origin main
npm run build
systemctl restart sjokoloko-admin
```

## Trap: `.env.local` is tracked in git but is a symlink on the server

The repo contains a `.env.local` holding **local development** values. On the
server that path is a symlink:

```
/srv/sjokoloko/admin/.env.local -> /srv/sjokoloko/secrets/admin.env
```

`git status` therefore always reports it as a typechange (` T .env.local`).
That is expected. **Never commit a change to that file, and never
`git checkout -- .env.local` on the server** — either will replace the symlink
with the localhost values and point production at `http://localhost:8000`,
which takes the whole admin down.

If it ever happens, restore it with:

```bash
ln -sf /srv/sjokoloko/secrets/admin.env /srv/sjokoloko/admin/.env.local
```

### Fresh clones are dangerous

Because the file is tracked, a **fresh clone of `main` ships the localhost
values and a dev `AUTH_SECRET` that is readable in the repo**. Deploying from a
new clone without recreating the symlink first will boot the admin against
`http://localhost:8000` and sign sessions with a public secret, so logins on
`admin.sjokoloco.no` break. Create the symlink before the first `npm run build`,
not after.

### The server no longer trips over this

As of 2026-09-05 the server copy is marked so git stops seeing the typechange:

```bash
git update-index --skip-worktree .env.local
```

`git status` is clean now and `git pull --ff-only` no longer aborts. If a future
commit ever changes `.env.local` upstream, the pull will complain about the
skip-worktree flag; clear it with `--no-skip-worktree`, sort the file out, then
set it again.

## Trap: don't pipe `git pull` into `tail`

`set -e` does not fire on a failed command inside a pipeline, because the
pipeline's exit status is the *last* command's. A deploy written as

```bash
set -e
git pull --ff-only origin main 2>&1 | tail -3   # <-- failure is swallowed
npm run build
```

will happily rebuild the **old** code and restart, reporting success. This
actually happened on 2026-09-05. Use `set -euo pipefail`, leave the pull
unpiped, and assert the result before building:

```bash
git merge --ff-only origin/main
[ "$(git rev-parse --short HEAD)" = "<expected>" ] || { echo ABORT; exit 1; }
```

## New in this version

- **Etiketter** — print layout for the Zebra 32 × 94 mm ingredient labels,
  with editable text, per-block font sizes, an automatic best-before date and a
  nutrition table. It warns when the font falls below the x-height EU
  1169/2011 requires, and when the content does not fit the label.
- **"Lag fraktetikett og send"** on an order — creates the Profrakt
  consignment, stores the tracking number and mails the customer. Reads
  "Marker som klar til henting" for self-pickup. Requires the `PROFRAKT_*`
  variables in the **API's** `.env`; without them it returns a clear error.
  A consignment cannot be cancelled once created, so it confirms first.
- **"Vis i kundekonto"** on a coupon controls whether customers see it on
  their Rabatter page.
- An expired session now redirects to the login page instead of crashing every
  page with a 500. Sessions still last 8 hours; there is no refresh token yet.
