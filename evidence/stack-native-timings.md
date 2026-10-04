# Recorded native launch timings

Historical acceptance observations with explicit initial compute state and a first/repeat pair. Different fixtures, artifacts and implementation revisions; not a controlled benchmark, universal SLA or comparison between providers. First/repeat does not imply uncached/cached; raw cache fields remain separate. Browser measurements are observed upper bounds. Missing or unaligned timing is unknown, never zero or a pass.

90 classified observations; 49 provider/fixture pairs excluded by the explicit-state/pair requirement. Acceptance coverage remains 47 fixtures on each native path. Exclusions here do not revoke their separately recorded functional acceptance.

| Provider | Compute | Observation | Healthy within 20s | Median healthy | Visible within 20s | Median visible |
| --- | --- | --- | --- | --- | --- | --- |
| codespaces | cold | first observation | 0/20 | 52.190s | Unknown | Unknown |
| codespaces | ready | first observation | 1/3 | 27.278s | Unknown | Unknown |
| codespaces | ready | repeat observation | 23/23 | 8.407s | Unknown | Unknown |
| google | cold | first observation | 0/1 | 47.775s | 0/1 | 49.890s |
| google | ready | first observation | 10/21 | 21.348s | 8/19 | 23.248s |
| google | ready | repeat observation | 22/22 | 6.399s | 20/20 | 7.769s |

Codespaces browser interaction remains pending. Server health is a separate metric from a usable product. These medians describe only the included historical observations; do not use them to rank providers or predict an arbitrary application.

[Per-observation values, input hashes, cache fields and exclusions](stack-native-timings.json). Regenerate with python3 evidence/stack-native-timing-report.py.
