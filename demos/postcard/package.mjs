/** Dependency-free, deterministic packaging for this example. Run after updating service.json's version. */
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  await readFile(path.join(root, 'service.json'), 'utf8'),
);
if (
  !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.version) ||
  manifest.entry !== 'index.html' ||
  !/^([a-z][a-z0-9-]{0,39}\.){1,3}[a-z][a-z0-9-]{0,39}$/.test(manifest.id)
)
  throw new Error('Check service.json id, entry and MAJOR.MINOR.PATCH version');
const files = [
  'service.json',
  'index.html',
  'style.css',
  'assets/cover.svg',
  'vendor/sdk.js',
  'src/app.js',
  'src/operations.js',
  'src/postcard.js',
  'src/weather.js',
];
const table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = (data) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const local = [],
  central = [];
const hashes = {};
let offset = 0;
for (const name of files) {
  const filename = await realpath(path.join(root, name));
  if (!filename.startsWith(root + path.sep))
    throw new Error('A package file escapes the project directory');
  const data = Buffer.from(
    (await readFile(filename, 'utf8')).replaceAll('\r\n', '\n'),
  );
  const encoded = Buffer.from(name);
  const crc = crc32(data);
  if (data.length > 32 * 1024 * 1024)
    throw new Error('A package file exceeds 32 MiB');
  hashes[name] = createHash('sha256').update(data).digest('hex');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(encoded.length, 26);
  local.push(header, encoded, data);
  const directory = Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50);
  directory.writeUInt16LE(20, 4);
  directory.writeUInt16LE(20, 6);
  directory.writeUInt16LE(0x800, 8);
  directory.writeUInt16LE(33, 14);
  directory.writeUInt32LE(crc, 16);
  directory.writeUInt32LE(data.length, 20);
  directory.writeUInt32LE(data.length, 24);
  directory.writeUInt16LE(encoded.length, 28);
  directory.writeUInt32LE(offset, 42);
  central.push(directory, encoded);
  offset += header.length + encoded.length + data.length;
}
const directories = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directories.length, 12);
end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...local, directories, end]);
const sha256 = createHash('sha256').update(archive).digest('hex');
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
const filename = 'photo-postcard-' + manifest.version + '.zip';
try {
  const previous = await readFile(path.join(output, filename));
  if (!previous.equals(archive))
    throw new Error(
      'This version already has different files. Increase version in service.json before packaging.',
    );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await writeFile(path.join(output, filename), archive);
await writeFile(
  path.join(output, filename + '.sha256'),
  sha256 + '  ' + filename + '\n',
);
await writeFile(
  path.join(output, 'package-info.json'),
  JSON.stringify(
    {
      appId: manifest.id,
      version: manifest.version,
      archive: filename,
      sha256,
      files: hashes,
    },
    null,
    2,
  ) + '\n',
);
process.stdout.write(
  'Ready: ' + path.join(output, filename) + '\nSHA256: ' + sha256 + '\n',
);
