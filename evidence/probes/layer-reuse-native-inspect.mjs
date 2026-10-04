import {execFileSync} from 'node:child_process';
const target={"id": "sha256:9846cdb84ce20ba80a2d4c4baf5bab0fe4a382646c8280ac8055742c76ad262f", "sha256": "3f34e12c187fe7d2bdd50bb5910b72381a3b5d4d7c83633fa680fedea91d2032", "bytes": 54898173};
const docker=args=>execFileSync('docker',['--host','unix:///var/run/docker.sock',...args],{encoding:'utf8',timeout:15000,maxBuffer:262144,stdio:['ignore','pipe','pipe']}).trim();
const info=JSON.parse(docker(['info','--format','{{json .}}']));
const image=JSON.parse(docker(['image','inspect',target.id,'--format','{"id":{{json .Id}},"layers":{{json .RootFS.Layers}}}']));
if(image.id!==target.id||!Array.isArray(image.layers))throw Error('Cached image identity mismatch');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),readOnly:true,engine:{version:info.ServerVersion,driver:info.Driver,driverStatus:info.DriverStatus},cachedFastapi:{...target,...image}}));
