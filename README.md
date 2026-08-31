# Brand My Tesla

Live sticker auction on Robert Scoble's white 2018 Tesla Model 3.

Made by [Asher Weisberger](https://x.com/AsherWeisberger). Talent: [Robert Scoble](https://x.com/scobleizer) / UNALIGNED.

Not affiliated with Tesla, Inc.

## Run

Install dependencies, then start the Next.js dev server and open http://localhost:3000

## Env

ADMIN_KEY — shared secret for /admin logo approval
AUCTION_END — ISO timestamp. Default is 2026-09-14 23:59 America/Los_Angeles
STRIPE keys are optional. Without them, bids still record and deposits stay pending.

## Auction

Ten vinyl spots around the Tesla badge on the trunk. Opening bids $250 / $500 / $750-$1,000. Minimum raise $50. 20% deposit. Logos go on the car only after a hand check at /admin.

Bids persist in data/bids.json.
