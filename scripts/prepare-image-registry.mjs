import {resolve} from 'node:path';
import {access} from 'node:fs/promises';
import {Store} from '../src/store.mjs';
import {GitHubImageDelivery} from '../src/image-delivery.mjs';
import {prepareRegistryForApp} from '../src/image-registry.mjs';
import {migratePreparedImages} from '../src/image-migration.mjs';
import {IMAGE_TOTAL_LIMIT} from '../src/containers.mjs';

const args=process.argv.slice(2);
if(args.length===1 && args[0]==='--help') {
  console.log('Usage: node --env-file=.env scripts/prepare-image-registry.mjs --app APP_ID [--index | --publish]\nDefault: verify existing artifacts only. --index adds verified OCI blob/index files within PODS_IMAGE_STORAGE_BYTES. --publish also uploads blobs to the configured private release. Original artifacts and launch links remain unchanged. Python 3 is required for indexing. The experimental read-only registry requires PODS_IMAGE_REGISTRY_ENABLED=1; current runners still use full archives.');
} else {
  let store;
  try {
    if(![2,3].includes(args.length)||args[0]!=='--app'||(args.length===3&&!['--index','--publish'].includes(args[2])))throw Error('usage');
    const data=resolve(process.env.PODS_DATA || '.data'),appId=args[1];
    if(args.length===2)console.log(JSON.stringify(await migratePreparedImages({data,appId})));
    else {
      let delivery;
      if(args[2]==='--publish') {
        await access(resolve(data,'pods.sqlite'));
        store=new Store(data,process.env.PODS_SECRET);store.db.exec('PRAGMA busy_timeout=5000');
        delivery=GitHubImageDelivery.fromEnv({data,store});
        if(!delivery)throw Error('Private image delivery is not configured');
      }
      const budget=Number(process.env.PODS_IMAGE_STORAGE_BYTES ?? 5*IMAGE_TOTAL_LIMIT);
      console.log(JSON.stringify(await prepareRegistryForApp({data,appId,budget,delivery})));
    }
  } catch {
    console.error('Prepared OCI indexing failed. Check the selected archive, available storage and --help. Existing artifacts remain intact; completed blobs are reusable on retry.');
    process.exitCode=1;
  } finally {store?.close();}
}
