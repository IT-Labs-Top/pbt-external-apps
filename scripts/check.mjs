import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const read = (file) => readFile(path.join(root, file), 'utf8');
const normalize = (text) => text.replaceAll('\r\n', '\n');
const hash = (text) => createHash('sha256').update(normalize(text)).digest('hex');
const lock = JSON.parse(await read('docs/compatibility.json'));
for (const [file, expected] of Object.entries(lock.artifacts))
  assert.equal(hash(await read(file)), expected, `Frozen contract changed: ${file}`);
const sdkSource = await read('sdk/src/external.ts');
assert.equal(hash(sdkSource.replaceAll("'./types.js'", "'@pbt/contracts'")),
  lock.provenance.platformSdkSourceSha256, 'Executable SDK logic differs from its platform source');
assert.ok(!sdkSource.includes("from '@pbt/contracts'"));
const configFile = path.join(root, 'sdk/tsconfig.json');
const config = ts.readConfigFile(configFile, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configFile));
const sdkFile = path.join(root, 'sdk/src/external.ts');
const program = ts.createProgram([sdkFile], parsed.options);
assert.equal(ts.getPreEmitDiagnostics(program).length, 0, 'Public SDK has TypeScript errors');
const checker = program.getTypeChecker();
const source = program.getSourceFile(sdkFile);
const client = source.statements.find((item) => ts.isClassDeclaration(item) && item.name?.text === 'ExternalClient');
const members = {};
for (const member of client.members) {
  if (!ts.isMethodDeclaration(member) && !ts.isGetAccessor(member)) continue;
  if (member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)) continue;
  const name = member.name.getText(source);
  if (name.startsWith('#')) continue;
  const type = checker.getTypeAtLocation(member.name);
  members[name] = ts.isGetAccessor(member) ? `readonly ${name}: ${checker.typeToString(type)}`
    : name + checker.signatureToString(type.getCallSignatures()[0], member, ts.TypeFormatFlags.NoTruncation);
}
assert.deepEqual(members, lock.publicMembers, 'Public SDK signature differs from the reviewed contract');
const markdown = await read('docs/API.md');
for (const name of Object.keys(members))
  assert.ok(markdown.includes(`### ${name}${name === 'diagnosticsDropped' ? '' : '('}`), `Missing SDK reference: ${name}`);
const openapi = JSON.parse(await read('docs/openapi.json'));
assert.ok(Object.keys(openapi.paths).every((route) => route.startsWith('/api/v1/external/runtime/')));
for (const name of ['CapturePhotoResponse','PrintJobResponse','ExternalAppCommand','ErrorResponse'])
  assert.ok(openapi.components.schemas[name], `Missing public result schema: ${name}`);
const routeCount = Object.keys(openapi.paths).length;
assert.equal(routeCount, lock.runtimeRoutes.length);
const htmlFiles = (await readdir(docs)).filter((file) => file.endsWith('.html'));
const documents = new Map();
for (const file of htmlFiles) documents.set(path.join(docs, file), parseHTML(await readFile(path.join(docs, file), 'utf8')).document);
let checkedLinks = 0;
for (const [file, document] of documents) {
  assert.equal(document.documentElement.lang, 'ru');
  assert.ok(document.querySelector('main h1'), `No content in ${file}`);
  const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
  assert.equal(ids.length, new Set(ids).size, `Duplicate anchors in ${file}`);
  for (const element of document.querySelectorAll('[href],[src]')) {
    const href = element.getAttribute('href') ?? element.getAttribute('src');
    if (!href || /^(?:https?:|mailto:|data:)/i.test(href)) continue;
    assert.ok(!/^[a-z][a-z\d+.-]*:/i.test(href), `Unsupported URL ${href}`);
    const [relative, fragment] = href.split('#');
    assert.ok(!relative.endsWith('.md') || element.classList.contains('source-link') || element.closest('footer'), `Unconverted document link: ${href}`);
    const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : file;
    assert.ok(target.startsWith(docs + path.sep), `Published site points outside docs/: ${href}`);
    assert.ok((await stat(target)).isFile(), `Missing link target: ${href}`);
    if (fragment && target.endsWith('.html')) {
      const targetDocument = documents.get(target);
      assert.ok(targetDocument.getElementById(decodeURIComponent(fragment)), `Missing anchor: ${href}`);
    }
    checkedLinks++;
  }
}
const browserSdk = await read('docs/downloads/sdk.js');
assert.equal(browserSdk, await read('sdk/dist/external.js'));
process.stdout.write(`Checked ${Object.keys(members).length} SDK members, ${routeCount} routes, ${htmlFiles.length} HTML pages and ${checkedLinks} local links.\n`);
