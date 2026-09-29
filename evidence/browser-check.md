# Browser verification

The UI was inspected at desktop and 390px mobile widths. No horizontal overflow was observed. Provider selection and the missing-OAuth access-token guidance worked.

The final prepared Field Notes artifact was launched from aswin into Google Cloud Shell. An authenticated Google CLI SSH tunnel exposed the remote app on localhost for browser QA. The page displayed the Cloud Shell hostname and the temporary-storage warning. A note was entered and saved through the UI, then the page was reloaded; the note remained listed. `browser-note.json` records the app API response after this action.

This verifies the live application's browser behavior on user compute. It does not prove the Google-native preview authentication flow. The first direct visit to the native Cloud Shell preview URL returned a Google JWT endpoint HTTP 500; browser account/session setup is being checked separately.

The Cloud Shell browser account chooser confirmed a different signed-in account from the Google CLI account used for this test. Browser Cloud Shell's request to pass credentials to processes was rejected: the sample app does not need Google Cloud API credentials. The native preview flow remains unverified until the browser is signed into the matching Google account. The authenticated SSH browser test passed and is deliberately reported separately.
