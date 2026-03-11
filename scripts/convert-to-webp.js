#!/usr/bin/env node
/**
 * Converts all PNG/JPEG images in public/img and public/img/events to WebP.
 * Updates references in src/data/events-images.ts and src/content .md files.
 * Run: node scripts/convert-to-webp.js
 * Requires: npm install sharp (devDependency)
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  console.error('Missing dependency. Run: npm install sharp --save-dev');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const IMG_DIRS = [
  path.join(ROOT, 'public', 'img'),
  path.join(ROOT, 'public', 'img', 'events'),
];

function* walkImages(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkImages(full);
    else if (EXTENSIONS.includes(path.extname(e.name).toLowerCase())) yield full;
  }
}

function toWebpPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return filePath.slice(0, -ext.length) + '.webp';
}

async function convertOne(inputPath, outputPath) {
  await sharp(inputPath)
    .webp({ quality: 85 })
    .toFile(outputPath);
}

async function convertAll() {
  let count = 0;
  for (const dir of IMG_DIRS) {
    for (const imgPath of walkImages(dir)) {
      const outPath = toWebpPath(imgPath);
      if (imgPath === outPath) continue;
      try {
        await convertOne(imgPath, outPath);
        console.log('Converted:', path.relative(ROOT, imgPath), '->', path.relative(ROOT, outPath));
        count++;
      } catch (err) {
        console.error('Error converting', imgPath, err.message);
      }
    }
  }
  return count;
}

function updateEventsImages() {
  const file = path.join(ROOT, 'src', 'data', 'events-images.ts');
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/\.(png|jpe?g)(['"])/gi, '.webp$2');
  fs.writeFileSync(file, s);
  console.log('Updated src/data/events-images.ts');
}

function updateContentMd() {
  const contentDir = path.join(ROOT, 'src', 'content');
  const imageKeys = ['thumbnail:', 'image:', 'featuredimage:'];
  function updateFile(filePath) {
    let s = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const lines = s.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const key of imageKeys) {
        if (line.includes(key) && (line.includes('.png') || line.includes('.jpg') || line.includes('.jpeg'))) {
          lines[i] = line.replace(/\.(png|jpe?g)(\s|$)/gi, '.webp$2');
          changed = true;
          break;
        }
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log('Updated', path.relative(ROOT, filePath));
    }
  }
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith('.md')) updateFile(full);
    }
  }
  walk(contentDir);
}

async function main() {
  console.log('Converting images to WebP...');
  const n = await convertAll();
  console.log('Converted', n, 'images.');
  console.log('Updating references...');
  updateEventsImages();
  updateContentMd();
  console.log('Done. You can remove original .png/.jpg files from public/img if desired.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
