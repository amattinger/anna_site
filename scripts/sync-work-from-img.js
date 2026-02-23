#!/usr/bin/env node
/**
 * One-time script: sync Work page with public/img.
 * - Deletes all existing src/content/work/*.md
 * - Creates a new work entry for each image in public/img (except Clay template and replaced images)
 */
const fs = require('fs');
const path = require('path');

const publicImg = path.join(__dirname, '..', 'public', 'img');
const workDir = path.join(__dirname, '..', 'src', 'content', 'work');

const EXCLUDE_PREFIXES = ['clay-image', 'clay-images', 'clay_astro'];
const EXCLUDE_FILES = ['MonicaBlueDELETE.png', 'MonicaDoloresBlue.png', 'IngridTdaddyLightpaintGoated.jpg'];

function filenameToSlug(name) {
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function filenameToTitle(name) {
  const base = name.replace(/\.[^.]+$/, '');
  return base.replace(/([A-Z])/g, ' $1').replace(/^\s/, '');
}

// 1. List images in public/img
const files = fs.readdirSync(publicImg);
const images = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
const toInclude = images.filter((f) => {
  if (EXCLUDE_FILES.includes(f)) return false;
  if (EXCLUDE_PREFIXES.some((p) => f.startsWith(p))) return false;
  return true;
});

// 2. Delete existing work .md files
const existing = fs.readdirSync(workDir).filter((f) => f.endsWith('.md'));
existing.forEach((f) => fs.unlinkSync(path.join(workDir, f)));

// 3. Create new work entry for each image
const now = new Date().toISOString();
toInclude.forEach((imgFile) => {
  const slug = filenameToSlug(imgFile);
  const title = filenameToTitle(imgFile);
  const thumb = '/img/' + imgFile;
  const md = `---
templateKey: work-sub-page
thumbnail: ${thumb}
date: ${now}
title: ${title}
description: Photography portfolio work.
---

## ${title}

Photography portfolio image.
`;
  const outPath = path.join(workDir, slug + '.md');
  fs.writeFileSync(outPath, md, 'utf8');
});

console.log('Deleted', existing.length, 'old work entries. Created', toInclude.length, 'new entries.');
