"""Summarize recorded native acceptance timings without inferring missing state."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import statistics

root = Path(__file__).resolve().parent
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
coverage = json.loads((root / 'stack-coverage.json').read_text())
accepted = [row for row in coverage['fixtures'] if row.get('serverPassed')
            and row.get('browserPassed')
            and row.get('nativeAcceptance', {}).get('googleBrowser')
            and row.get('nativeAcceptance', {}).get('codespacesProtocol')]
states = {'google': {'RUNNING': 'ready', 'SUSPENDED': 'cold'},
          'codespaces': {'Available': 'ready', 'Shutdown': 'cold'}}
observations, excluded, sources, seen = [], [], {}, set()
for row in accepted:
    fixture = row['fixture']
    for provider in states:
        name = f'stack-{fixture}-{provider}.json'
        path = root / name
        reason = None
        if name not in row['nativeProviderEvidence'] or not path.exists():
            reason = 'No linked canonical timing pair; acceptance uses other evidence.'
        else:
            data = json.loads(path.read_text())
            sources[name] = digest(path)
            runs = data.get('results')
            if not isinstance(runs, list) or len(runs) != 2:
                reason = 'No canonical pair of first/repeat observations.'
            elif not all(isinstance(run.get('totalMs'), (int, float)) and
                         run.get('compute', {}).get('initialState') in states[provider]
                         for run in runs):
                reason = 'Initial compute state or complete timing is not recorded for both observations.'
        if reason:
            excluded.append({'fixture': fixture, 'provider': provider, 'reason': reason})
            continue
        for index, run in enumerate(runs):
            assert run['provider'] == ('github' if provider == 'codespaces' else 'google')
            assert run['status'] in ('ready', 'stopped') and run['totalMs'] >= 0
            assert run['readyAt'] - run['createdAt'] == run['totalMs']
            identity = (provider, run['id'])
            assert identity not in seen, 'A launch cannot count twice'
            seen.add(identity)
            initial = run['compute']['initialState']
            item = {'fixture': fixture, 'provider': provider,
                    'phase': 'first observation' if index == 0 else 'repeat observation',
                    'initialComputeState': initial, 'computeClass': states[provider][initial],
                    'serverHealthyMs': run['totalMs'], 'deliveryMs': run.get('deliveryMs'),
                    'artifactCacheHit': run.get('timings', {}).get('cacheHit'),
                    'imageCacheHits': run.get('timings', {}).get('imageCacheHits'),
                    'source': name, 'resultIndex': index,
                    'observedAt': run['createdAt'], 'productVisibleMs': None,
                    'productInteractionMs': None,
                    'browserTimingScope': 'Native browser timing unavailable for this observation.'}
            checks = data.get('browserChecks')
            if provider == 'google' and isinstance(checks, list) and len(checks) == 2:
                check = checks[index]
                if check.get('passed') and check.get('startedAt'):
                    start = datetime.datetime.fromisoformat(check['startedAt'].replace('Z', '+00:00')).timestamp() * 1000
                    visible, interaction = check.get('visibleMs'), check.get('interactionMs')
                    if (isinstance(visible, (int, float)) and isinstance(interaction, (int, float))
                            and -1000 <= run['createdAt'] - start <= 30000
                            and visible >= run['readyAt'] - start - 1000
                            and interaction >= visible):
                        item['productVisibleMs'], item['productInteractionMs'] = visible, interaction
                        item['browserTimingScope'] = 'Observed browser upper bounds; see source timing notes and corrections.'
                    else:
                        item['browserTimingScope'] = 'Timing fields are not comparable under the stated timestamp checks; see original evidence.'
            observations.append(item)

groups = collections.defaultdict(list)
for item in observations:
    groups[(item['provider'], item['computeClass'], item['phase'])].append(item)
summary = []
for (provider, compute, phase), items in sorted(groups.items()):
    health = [x['serverHealthyMs'] for x in items]
    visible = [x['productVisibleMs'] for x in items if x['productVisibleMs'] is not None]
    summary.append({'provider': provider, 'computeClass': compute, 'phase': phase,
                    'observations': len(items), 'serverHealthyWithin20s': sum(x <= 20000 for x in health),
                    'medianServerHealthyMs': statistics.median(health),
                    'browserTimingObservations': len(visible),
                    'productVisibleWithin20s': sum(x <= 20000 for x in visible),
                    'medianProductVisibleMs': statistics.median(visible) if visible else None})
report = {'recordedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Historical acceptance observations with explicit initial compute state and a first/repeat pair. Different fixtures, artifacts and implementation revisions; not a controlled benchmark, universal SLA or comparison between providers. First/repeat does not imply uncached/cached; raw cache fields remain separate. Browser measurements are observed upper bounds. Missing or unaligned timing is unknown, never zero or a pass.',
          'acceptedFixtures': len(accepted), 'sourceHashes': sources,
          'coverageSha256': digest(root / 'stack-coverage.json'),
          'generatorSha256': digest(Path(__file__)), 'summary': summary,
          'observations': observations, 'excludedPairs': excluded}
(root / 'stack-native-timings.json').write_text(json.dumps(report, indent=2) + '\n')
lines = ['# Recorded native launch timings', '', report['scope'], '',
         f"{len(observations)} classified observations; {len(excluded)} provider/fixture pairs excluded by the explicit-state/pair requirement. Acceptance coverage remains {len(accepted)} fixtures on each native path. Exclusions here do not revoke their separately recorded functional acceptance.", '',
         '| Provider | Compute | Observation | Healthy within 20s | Median healthy | Visible within 20s | Median visible |',
         '| --- | --- | --- | --- | --- | --- | --- |']
for row in summary:
    visible = f"{row['productVisibleWithin20s']}/{row['browserTimingObservations']}" if row['browserTimingObservations'] else 'Unknown'
    median = f"{row['medianProductVisibleMs']/1000:.3f}s" if row['medianProductVisibleMs'] is not None else 'Unknown'
    lines.append(f"| {row['provider']} | {row['computeClass']} | {row['phase']} | {row['serverHealthyWithin20s']}/{row['observations']} | {row['medianServerHealthyMs']/1000:.3f}s | {visible} | {median} |")
lines += ['', 'Codespaces browser interaction remains pending. Server health is a separate metric from a usable product. These medians describe only the included historical observations; do not use them to rank providers or predict an arbitrary application.', '',
          '[Per-observation values, input hashes, cache fields and exclusions](stack-native-timings.json). Regenerate with python3 evidence/stack-native-timing-report.py.', '']
(root / 'stack-native-timings.md').write_text('\n'.join(lines))
print(json.dumps({'acceptedFixtures': len(accepted), 'observations': len(observations),
                  'excludedPairs': len(excluded), 'summary': summary}))
