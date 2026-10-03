# Google Cloud Shell native browser validation

Observed 2026-10-03T06:34:04.895075+00:00. [Machine-readable evidence](google-native-browser.json); [product screenshot](browser/google-native-product.png).

The real PODS launch page completed Google web OAuth using the browser's configured test account, automatically launched the immutable MDN application artifact on that account's Cloud Shell, and opened its native `cloudshell.dev` product URL. Clicking the Firefox image changed its source from `images/firefox-icon.png` to `images/firefox2.png`, on both the first and repeated launch. No application compilation or terminal command was required from the end user.

The artifact came from the prior real server build of `mdn/beginner-html-site-scripted` at revision `570260b392cc15a0b2ecd579071b0fc6384bbe98`. This validates the end-user flow for that prepared version. It does not claim the developer submitted the repository through the browser in this run.

| Measurement | Result |
| --- | --- |
| First observed launch, accepted request to healthy callback | 12,857 ms |
| Repeat launch, accepted request to healthy callback | 4,597 ms |
| Repeat button click to browser-visible product, upper bound | 13,049 ms |
| Real product interaction after each launch | Passed: image switched |
| Automated suite after recovery fix | 35 passed, 0 failed |

The repeat was on ready compute with a cached prepared artifact. The browser measurement includes observation overhead and proves only that this sample was visible within 13.049 seconds. Initial login/consent time is excluded. The first launch was not a controlled cold-compute experiment, and its first browser observation was delayed while code was inspected. These results do not establish a universal 20-second cold-start guarantee.

## Authorization expiry and recovery

The initial human consent completed after the ten-minute OAuth state window, so the old callback correctly refused to exchange the code but incorrectly displayed raw JSON. A fresh authorization succeeded. The server now remembers only the browser's safe return page per provider independently of its short-lived OAuth state. Expired, swept, missing, replayed, wrong-browser and wrong-provider callbacks never exchange credentials; they return to a normal PODS page with a reconnect message. A user's remembered product is never disclosed to another browser. The ten-minute limit, PKCE and single-use authorization checks remain enforced.

Regression tests cover expired and swept state, original-product/developer-page recovery, provider selection metadata, code non-disclosure, browser ownership and provider mismatch. A live browser check deliberately sent an invalid state and verified the original product page, reconnect message and selected Google provider. The application remained available after deploying the fix.

Provider access tokens expire from use after at most one hour. The existing five-second cleanup loop removes expired encrypted connection records automatically. The earlier statement that records remain until manual disconnect was incorrect. Google's account authorization grant itself remains until the user revokes it.

The repeated application is left available for the user until its normal 30-minute runner expiry. Cloud Shell has no API stop operation. Full developer browser submission, a second independent user, controlled cold visibility timing and the GitHub native browser journey remain outstanding.
