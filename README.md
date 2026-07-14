# Longest Mile Wrapped

A Spotify-Wrapped-style swipeable results experience for Harry's Longest Mile
athletes. One static page, deployed as its own Cloudflare Pages project
(separate from the main website). $0 hosting.

## How it works
- `index.html` is the whole app. It reads the athlete from the URL and pulls
  their row from `data/results.csv`, then computes every stat client-side.
- URL: `wrapped.hardcoreharrys.com.au/147` (clean) or `?bib=147` (query).
- `_redirects` routes every path to index.html so clean URLs work on Pages.

## The data file
`data/results.csv` is the "spreadsheet" the site draws from. Columns:
`bib,name,gender,age,miles,finish_position,is_winner`.
`generate-results.js` makes a fake 100-athlete version for testing:
`node generate-results.js`. On event day, replace it with the real results
export (same columns) and redeploy.

## Preview locally
Fetch needs a server (not file://). From this folder:
`python3 -m http.server 8080` then open `http://localhost:8080/?bib=1`
