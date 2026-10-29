import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require.resolve('typescript/bin/tsc');
execFileSync(process.execPath, [ts, '-p', path.join(root, 'sdk/tsconfig.json')], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
await cp(path.join(root, 'sdk/src/generated.d.ts'), path.join(root, 'sdk/dist/generated.d.ts'));
await mkdir(path.join(root, 'docs/downloads'), { recursive: true });
// The public browser module has no runtime dependencies. It works as an ordinary local ESM file.
await cp(path.join(root, 'sdk/dist/external.js'), path.join(root, 'docs/downloads/sdk.js'));
for (const file of ['external.d.ts', 'types.d.ts', 'generated.d.ts'])
  await cp(path.join(root, 'sdk/dist', file), path.join(root, 'docs/downloads', file));
const output = await readFile(path.join(root, 'sdk/dist/external.js'), 'utf8');
if (/from ['"]@pbt\//.test(output)) throw new Error('SDK contains an internal runtime dependency');
process.stdout.write('Public SDK built without the terminal repository.\n');
