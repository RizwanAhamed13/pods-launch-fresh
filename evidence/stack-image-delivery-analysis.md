# Recent native image delivery cost

Four recent single-image fixtures, first observation only, with both image and archive caches absent. Historical observations, not a controlled network benchmark or a provider comparison. Effective MB/s uses decimal megabytes and includes HTTP, hashing and disk writes. Image load includes Docker load and identity inspection. Nested timings must not be added to serverHealthyMs or runtimeReadyMs. This analysis adds no native acceptance or latency guarantee.

| Fixture | Provider / initial compute | Image MB | Download | Effective MB/s | Docker load/check | Server healthy |
| --- | --- | --- | --- | --- | --- | --- |
| gradio | google / RUNNING | 151.999 | 27.511s | 5.525 | 8.113s | 51.038s |
| gradio | codespaces / Shutdown | 151.999 | 27.484s | 5.530 | 11.996s | 86.579s |
| ktor | google / RUNNING | 138.947 | 25.084s | 5.539 | 6.205s | 41.186s |
| ktor | codespaces / Shutdown | 138.947 | 25.088s | 5.538 | 9.647s | 74.982s |
| micronaut | google / RUNNING | 125.123 | 22.541s | 5.551 | 2.805s | 37.183s |
| micronaut | codespaces / Shutdown | 125.123 | 22.525s | 5.555 | 3.987s | 70.406s |
| phoenix | google / RUNNING | 166.072 | 30.117s | 5.514 | 10.047s | 52.891s |
| phoenix | codespaces / Shutdown | 166.072 | 30.094s | 5.518 | 9.855s | 87.260s |

Image download alone exceeded the 20-second target in all eight observations. Improving only runtime startup cannot bring those observed first launches within 20 seconds. Smaller images or faster artifact delivery require a measured follow-up; these data do not establish which network segment limits throughput.

[Input hashes and observations](stack-image-delivery-analysis.json). Regenerate with `python3 evidence/stack-image-delivery-analysis.py`.
