# Recorded native launch timings

Historical acceptance observations with explicit initial compute state and a first/repeat pair. Different fixtures, artifacts and implementation revisions; not a controlled benchmark, universal SLA or comparison between providers. First/repeat does not imply uncached/cached; raw cache fields remain separate. Browser measurements are observed upper bounds. Missing or unaligned timing is unknown, never zero or a pass.

110 classified observations; 49 provider/fixture pairs excluded by the explicit-state/pair requirement. Acceptance coverage remains 52 fixtures on each native path. Exclusions here do not revoke their separately recorded functional acceptance.

| Provider | Compute | Observation | Healthy within 20s | Median healthy | Visible within 20s | Median visible |
| --- | --- | --- | --- | --- | --- | --- |
| codespaces | cold | first observation | 0/25 | 53.678s | Unknown | Unknown |
| codespaces | ready | first observation | 1/3 | 27.278s | Unknown | Unknown |
| codespaces | ready | repeat observation | 28/28 | 8.810s | Unknown | Unknown |
| google | cold | first observation | 0/1 | 47.775s | 0/1 | 49.890s |
| google | ready | first observation | 10/26 | 23.985s | 8/24 | 25.481s |
| google | ready | repeat observation | 27/27 | 6.683s | 25/25 | 7.820s |

Codespaces browser interaction remains pending. Server health is a separate metric from a usable product. These medians describe only the included historical observations; do not use them to rank providers or predict an arbitrary application.

[Per-observation values, input hashes, cache fields and exclusions](stack-native-timings.json). Regenerate with python3 evidence/stack-native-timing-report.py.
