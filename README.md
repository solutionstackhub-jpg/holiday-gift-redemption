# Holiday Gift: code redemption for a client thank-you campaign

A law firm sends ~4,000 clients a Christmas postcard or a Mailchimp email. Each card carries a
personal code. The client enters it (or scans the QR / taps the email button) and gets a
**$10 Starbucks eGift on the spot**. The firm only pays for gift cards that are actually claimed.

Stack: **Next.js 16** (App Router, React 19, TypeScript), **Tailwind CSS 4**, **Supabase Postgres**,
**Tremendous** gift card API, **Mailchimp** Marketing API.

## What the brief asks for, and how this answers it

| Requirement | How it's handled |
|---|---|
| A page where clients enter a code from a postcard or digital card | Mobile-first guest page. Code field auto-formats as you type (`XMAS-XXXX-XXXX`), accepts lowercase and missing dashes. Postcard QR codes and email buttons open the page with the code already filled in. |
| The code leads to a $10 Starbucks gift card | The eGift is ordered at that moment and shown right on the page ("Open my eGift", copy link, email it to yourself). Re-entering the code on the same device shows the same gift again. |
| A unique code for each of ~4,000 clients | Random 8-character codes from a 32-letter alphabet with no look-alikes (no 0/O, 1/I): about 1 trillion combinations. Import a client CSV or pull straight from Mailchimp; codes are created automatically. |
| Don't pay for gift cards upfront | Nothing is bought in advance. Each card is ordered from the provider only when a code is redeemed. The dashboard shows spend vs. what buying upfront would have cost. A budget cap stops redemptions automatically. |
| Works with Mailchimp | Import the audience, push every code into a `GIFTCODE` field in batches, copy the ready-made button link `?code=*\|GIFTCODE\|*`. Redeemed contacts get tagged so reminders go only to people who haven't claimed. CSV export for manual import too. |
| Handles a large number of codes efficiently | Indexed Postgres table, one-query stats, paginated admin, batched Mailchimp writes (500 per batch), imports up to 20,000 rows per file. |
| A simple way to manage codes and see which are used | Admin: search by code/name/email/city, filter by status, cancel or restore codes, copy a client's personal link, open their QR, export everything. |

Things the brief doesn't say but the job needs:

- **Postcard printing**: a mail-merge CSV (name, address, code, QR link, QR image URL) and a live postcard preview.
- **Which channel works**: every redemption is tagged email link / postcard QR / typed code.
- **Fraud and cost control**: one-time codes with an atomic database update (two people can't redeem the same code), wrong-code rate limit per device, a code found by someone else shows "already claimed", campaign end date and pause switch.
- **Provider hiccups**: if the gift card API fails, the code is held as *pending* and can be retried from the admin. The retry reuses the same order ID, so a card is never bought twice.
- **Clients without email**: postcard-only clients work too, since the gift is shown on screen.

## Run it locally (no accounts needed)

```bash
npm install
npm run dev
```

- Guest page: http://localhost:3000
- Admin: http://localhost:3000/admin (open in demo mode; set `ADMIN_PASSWORD` to lock it)

With no keys, the app runs on 4,000 sample clients, a demo gift card provider and a simulated
Mailchimp. Data resets on restart (or with **Settings → Reset demo data**).

| Demo code | What it shows |
|---|---|
| `XMAS-JOLY-2026`, `XMAS-SNOW-2026`, `XMAS-GIFT-2026`, `XMAS-MINT-2026`, `XMAS-STAR-2026` | Normal redemption and gift reveal |
| `XMAS-POST-2026` | Postcard-only client (no email on file) |
| `XMAS-USED-2026` | Already claimed by someone else |
| `XMAS-VOID-2026` | Cancelled by an admin |

The floating **Demo** bar has "Try a code", which fills in a random unused code.

## Project layout

```
app/
  page.tsx                 guest page (hero, steps, note from the firm, FAQ)
  gift/[id]/               demo eGift page (stands in for the provider's page)
  admin/(console)/         overview, codes, import, mailchimp, postcards, gift-cards, settings
  api/claim                redemption: rate limit → atomic claim → order gift card
  api/admin/*              import, export, generate, void, retry, settings, mailchimp, reset
  api/qr/[code]            QR image (SVG or PNG) for postcards
lib/
  store/                   Store interface + Supabase and in-memory implementations
  giftcards.ts             Tremendous client (LINK delivery, idempotent external_id)
  mailchimp.ts             audience import, batched GIFTCODE sync, "redeemed" tag
supabase/schema.sql        tables, indexes, RLS, stats functions
public/images/             Unsplash photos (see CREDITS.md)
```

## Use Supabase (needed for a hosted demo)

In-memory data doesn't survive serverless hosting, so a deployed copy needs a database.

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local`, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
3. `npm run seed` loads the 4,000 sample clients (`npm run seed -- --force` to reload).

## Connect the real services

- **Tremendous**: create an API key (sandbox first), find the Starbucks product ID in the catalog,
  set `TREMENDOUS_API_KEY`, `TREMENDOUS_ENV` and `TREMENDOUS_PRODUCT_ID`. Fund the balance as you go.
- **Mailchimp**: set `MAILCHIMP_API_KEY` and `MAILCHIMP_AUDIENCE_ID`. The `GIFTCODE` field is created
  on the first push.

## Before going live

- `DEMO_MODE=false` and a strong `ADMIN_PASSWORD` (or swap in Supabase Auth for per-person logins)
- `TREMENDOUS_ENV=production` with a funded balance, Starbucks product confirmed
- `PUBLIC_BASE_URL` set to the real domain before exporting the print file
- Budget cap and last redemption day set in **Settings**

## Credits

Photos from [Unsplash](https://unsplash.com) under the Unsplash License, listed in
`public/images/CREDITS.md`. Starbucks is a trademark of its owner, which is not affiliated
with this project.
