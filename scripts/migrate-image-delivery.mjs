import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { Store } from '../src/store.mjs';
import { GitHubImageDelivery } from '../src/image-delivery.mjs';
import { migratePreparedImages } from '../src/image-migration.mjs';

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('Usage: node --env-file=.env scripts/migrate-image-delivery.mjs --app APP_ID [--publish]\nDry-run verifies existing prepared bytes. --publish enables private image delivery without rebuilding or changing launch links. Rerun the same command after interruption; verified assets are reused.');
} else {
  let store;
  try {
    if (![2,3].includes(args.length) || args[0] !== '--app' || (args.length === 3 && args[2] !== '--publish')) throw new Error('usage');
    const data = resolve(process.env.PODS_DATA || '.data'), publish = args.length === 3;
    let delivery;
    if (publish) {
      await access(resolve(data, 'pods.sqlite')); // Never create a new control-plane database by accident.
      store = new Store(data, process.env.PODS_SECRET);
      store.db.exec('PRAGMA busy_timeout=5000');
      delivery = GitHubImageDelivery.fromEnv({data, store});
    }
    const result = await migratePreparedImages({data, appId:args[1], delivery, publish,
      onProgress:progress => console.log(JSON.stringify({event:'image-mapped', ...progress}))});
    console.log(JSON.stringify({event:'complete', ...result}));
  } catch {
    console.error('Prepared image migration failed. Check --help, the selected artifact, and private delivery configuration. Existing artifacts are preserved; rerun the same selection after correcting the cause.');
    process.exitCode = 1;
  } finally { store?.close(); }
}
