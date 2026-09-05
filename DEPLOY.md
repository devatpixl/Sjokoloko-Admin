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
