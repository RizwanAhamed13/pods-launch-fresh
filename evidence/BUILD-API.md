# Developer repository API verification

Run on aswin, 2026-10-02 UTC (2026-10-03 in India). This is the server preparation stage of the active combined goal.

- **28 automated tests passed**, including queue serialization, repeat submission handling, account limits across sessions, browser ownership/CSRF, immutable publication, rejection of corrupt and mismatched output, bounded file imports, cleanup after worker failure, cleanup failure disabling further work, and OAuth return to a selected version. Raw output: `build-manager-tests.txt`.
- A real LXD initialization checked the base configuration and rejected a second manager trying to acquire the same host lock. No third-party project directories were used.
- The deployed API validated a real GitHub account connection and accepted `https://github.com/mdn/beginner-html-site-scripted`. It cloned commit `570260b392cc15a0b2ecd579071b0fc6384bbe98`, automatically prepared the static application, started its artifact in the disposable container, checked its HTML product document, and published the result.
- **Preparation took 7,831 ms.** The artifact was 87,081 bytes. Its SHA-256 is `8d76347af27ec9d68fa048e1f699072db4f6b27c8f7b6c58bd21dee4e2f5d93b`.
- A different HTTP session could see the prepared application but received 404 when requesting the developer's build job. The versioned public HTTPS launch page returned 200. No disposable build container remained after publication, and the test account connection was removed.
- Machine-readable live evidence: `build-api-live.json`.

The probe submitted and polled HTTP requests against the actual deployed control plane; it did not exercise a browser submission form. The launch page still needs frontend URL selection and automatic navigation. This stage did not provision Codespaces or Cloud Shell, render their native preview, or measure browser-visible launch timing. It does not prove the 20-second target or complete the combined goal.
