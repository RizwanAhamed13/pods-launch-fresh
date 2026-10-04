"""Explain the measured first-image delivery cost for four recent native fixtures."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
source_hashes = {}
def read(name):
    data = (root / name).read_bytes()
    source_hashes[name] = hashlib.sha256(data).hexdigest()
    return json.loads(data)

canonical = read('stack-native-timings.json')
rows = []
for fixture in ('gradio', 'ktor', 'micronaut', 'phoenix'):
    prepared = read(f'stack-{fixture}-url.json')['attempts'][0]['app']
    assert len(prepared['images']) == 1
    size = prepared['images'][0]['bytes']
    for provider in ('google', 'codespaces'):
        name = f'stack-{fixture}-{provider}.json'
        run = read(name)['results'][0]
        observation = next(x for x in canonical['observations'] if x['fixture'] == fixture
                           and x['provider'] == provider and x['resultIndex'] == 0)
        assert observation['source'] == name and observation['phase'] == 'first observation'
        assert observation['serverHealthyMs'] == run['totalMs'] and run['appId'] == prepared['id']
        timings = run['timings']
        assert timings['imageCacheHits'] == timings['imageArchiveCacheHits'] == 0
        download = timings['imageDownloadMs']
        assert download > 0 and timings['imageLoadMs'] > 0
        rows.append({'fixture': fixture, 'provider': provider,
                     'initialComputeState': observation['initialComputeState'],
                     'imageBytes': size, 'imageDownloadMs': download,
                     'effectiveDeliveryMBps': round(size / download / 1000, 3),
                     'imageLoadMs': timings['imageLoadMs'], 'imagesMs': timings['imagesMs'],
                     'serverHealthyMs': run['totalMs'], 'source': name, 'resultIndex': 0})

assert len(rows) == 8
scope = ('Four recent single-image fixtures, first observation only, with both image and archive caches absent. '
         'Historical observations, not a controlled network benchmark or a provider comparison. '
         'Effective MB/s uses decimal megabytes and includes HTTP, hashing and disk writes. '
         'Image load includes Docker load and identity inspection. Nested timings must not be added '
         'to serverHealthyMs or runtimeReadyMs. This analysis adds no native acceptance or latency guarantee.')
record = {'scope': scope, 'sourceHashes': source_hashes,
          'generatorSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'observations': rows,
          'finding': 'Image download alone exceeded the 20-second target in all eight observations. '
                     'Improving only runtime startup cannot bring those observed first launches within 20 seconds. '
                     'Smaller images or faster artifact delivery require a measured follow-up; '
                     'these data do not establish which network segment limits throughput.'}
(root / 'stack-image-delivery-analysis.json').write_text(json.dumps(record, indent=2) + '\n')
lines = ['# Recent native image delivery cost', '', scope, '',
         '| Fixture | Provider / initial compute | Image MB | Download | Effective MB/s | Docker load/check | Server healthy |',
         '| --- | --- | --- | --- | --- | --- | --- |']
for x in rows:
    lines.append(f"| {x['fixture']} | {x['provider']} / {x['initialComputeState']} | {x['imageBytes']/1e6:.3f} | "
                 f"{x['imageDownloadMs']/1000:.3f}s | {x['effectiveDeliveryMBps']:.3f} | "
                 f"{x['imageLoadMs']/1000:.3f}s | {x['serverHealthyMs']/1000:.3f}s |")
lines.extend(['', record['finding'], '',
              '[Input hashes and observations](stack-image-delivery-analysis.json). Regenerate with '
              '`python3 evidence/stack-image-delivery-analysis.py`.', ''])
(root / 'stack-image-delivery-analysis.md').write_text('\n'.join(lines))
print(json.dumps({'observations': len(rows), 'downloadRangeMs': [min(x['imageDownloadMs'] for x in rows), max(x['imageDownloadMs'] for x in rows)],
                  'effectiveDeliveryRangeMBps': [min(x['effectiveDeliveryMBps'] for x in rows), max(x['effectiveDeliveryMBps'] for x in rows)]}))
