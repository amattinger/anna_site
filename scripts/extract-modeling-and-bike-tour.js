#!/usr/bin/env node
/**
 * Extracts Modeling portfolio images (SFW + Nude) and Bike Tour blog posts from Squarespace XML export.
 * Run: node scripts/extract-modeling-and-bike-tour.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const XML_PATH = '/Users/anna/Downloads/Squarespace-Wordpress-Export-12-30-2025.xml';
const OUTPUT_DIR = path.join(__dirname, '..', 'extracted-content');

async function extractSection(xmlContent, linkPattern) {
  const regex = new RegExp(`<link>${linkPattern}<\\/link>[\\s\\S]*?<\\/item>`, 'i');
  return xmlContent.match(regex)?.[0] || '';
}

function extractImages(html) {
  const regex = /data-image="(https:\/\/images\.squarespace-cdn\.com[^"]+)"/g;
  const images = [];
  const seen = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[1].split('?')[0];
    if (seen.has(url)) continue;
    seen.add(url);
    const filename = url.split('/').pop() || `img-${images.length}.jpg`;
    images.push({ url, filename });
  }
  return images;
}

function extractItemByLink(xmlContent, linkPath) {
  const escaped = linkPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = xmlContent.split(/<item>\s*/);
  for (let i = 1; i < parts.length; i++) {
    if (new RegExp(`<link>${escaped}<\\/link>`, 'i').test(parts[i])) {
      return parts[i];
    }
  }
  return '';
}

function extractProloguePages(xmlContent) {
  const pages = [];
  const paths = ['/what', '/where', '/how'];
  for (const linkPath of paths) {
    const item = extractItemByLink(xmlContent, linkPath);
    if (!item) continue;
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/);
    const rawTitle = titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? '').trim() : '';
    const title = rawTitle || linkPath.replace(/^\//, '').replace(/^./, (c) => c.toUpperCase());
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    const content = contentMatch ? contentMatch[1] : '';
    const slug = linkPath.replace(/^\//, '');
    pages.push({ slug, title, content });
  }
  return pages;
}

function extractBlogPosts(xmlContent) {
  const items = xmlContent.split(/<item>\s*/).slice(1);
  const posts = [];
  for (const item of items) {
    const linkMatch = item.match(/<link>(\/blog\/[^<]+)<\/link>/);
    if (!linkMatch) continue;
    const link = linkMatch[1];
    // Support both CDATA (e.g. <title><![CDATA[Foo [Bar]]]></title>) and plain text titles
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/);
    const rawTitle = titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? '').trim() : '';
    const title = rawTitle || 'Untitled';
    const pubMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
    const pubDate = pubMatch ? pubMatch[1] : '';
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    const content = contentMatch ? contentMatch[1] : '';
    const slug = link.replace('/blog/', '').replace(/\//g, '-');
    posts.push({ link, title, pubDate, content, slug });
  }
  return posts;
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  const xml = fs.readFileSync(XML_PATH, 'utf-8');
  
  // Extract modeling galleries
  const portfolioNude = await extractSection(xml, '/portfolio');
  const portfolioSfw = await extractSection(xml, '/portfolio-sfw');
  
  const nudeImages = extractImages(portfolioNude);
  const sfwImages = extractImages(portfolioSfw);
  const modelingImagesRaw = [...nudeImages, ...sfwImages];
  const modelingImages = modelingImagesRaw.map((img, i) => {
    const ext = (img.url.match(/\.(jpe?g|png|gif|webp)$/i) || ['', 'jpg'])[1] || 'jpg';
    return { ...img, filename: `modeling-${String(i + 1).padStart(3, '0')}.${ext}` };
  });
  
  // Extract bike tour posts and prologue pages (What, Where, How)
  const blogPosts = extractBlogPosts(xml);
  blogPosts.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate)); // Oldest first
  const prologuePages = extractProloguePages(xml);

  const modelingDir = path.join(OUTPUT_DIR, 'modeling');
  const modelingImgDir = path.join(modelingDir, 'images');
  fs.mkdirSync(modelingImgDir, { recursive: true });
  
  console.log(`Found ${modelingImages.length} modeling images (${nudeImages.length} nude + ${sfwImages.length} SFW)`);
  console.log(`Found ${blogPosts.length} blog posts`);
  console.log(`Found ${prologuePages.length} prologue pages (What, Where, How)`);
  
  // Download modeling images with unique filenames
  for (let i = 0; i < modelingImages.length; i++) {
    const img = modelingImages[i];
    const filepath = path.join(modelingImgDir, img.filename);
    try {
      process.stdout.write(`\rDownloading modeling ${i + 1}/${modelingImages.length}`);
      await downloadImage(img.url, filepath);
    } catch (e) {
      console.error(`\nFailed: ${img.filename}`);
    }
  }
  console.log('\nModeling images done.');
  
  // Copy modeling images to public/img/modeling for serving
  const publicModelingDir = path.join(__dirname, '..', 'public', 'img', 'modeling');
  fs.mkdirSync(publicModelingDir, { recursive: true });
  for (const img of modelingImages) {
    fs.copyFileSync(
      path.join(modelingImgDir, img.filename),
      path.join(publicModelingDir, img.filename)
    );
  }
  console.log(`Copied ${modelingImages.length} modeling images to public/img/modeling/`);
  
  // Save modeling images manifest (also copy to src/data for build)
  const modelingManifest = JSON.stringify(modelingImages.map((img, i) => ({
    src: `/img/modeling/${img.filename}`,
    alt: `Modeling ${i + 1}`,
  })), null, 2);
  fs.writeFileSync(path.join(modelingDir, 'images.json'), modelingManifest);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'modeling-images.json'), modelingManifest);
  
  // Extract images from blog posts and save
  const bikeTourDir = path.join(OUTPUT_DIR, 'bike-tour');
  fs.mkdirSync(path.join(bikeTourDir, 'images'), { recursive: true });
  
  const postsData = [];
  const urlToFilename = {};
  let globalImgIndex = 0;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Extract images from prologue pages first (add to urlToFilename)
  const prologueData = prologuePages.map((page) => {
    const imgRegex = /(?:data-image|src)="(https:\/\/images\.squarespace-cdn\.com[^"]+)"|src="(https:\/\/images\.squarespace-cdn\.com[^"]+)"/g;
    let m;
    const pageImages = [];
    while ((m = imgRegex.exec(page.content)) !== null) {
      const url = (m[1] || m[2]).split('?')[0];
      if (!urlToFilename[url]) {
        globalImgIndex++;
        const ext = (url.match(/\.(jpe?g|png|gif|webp)$/i) || ['', 'jpg'])[1] || 'jpg';
        urlToFilename[url] = `blog-${String(globalImgIndex).padStart(3, '0')}.${ext}`;
      }
      pageImages.push({ url, filename: urlToFilename[url] });
    }
    let content = page.content;
    for (const img of pageImages) {
      const urlBase = img.url.split('?')[0];
      content = content.replace(new RegExp(escapeRegExp(urlBase) + '(\\?[^"\\s]*)?', 'g'), `/img/bike-tour/${img.filename}`);
    }
    return { slug: page.slug, title: page.title, content, images: pageImages };
  });
  
  for (const post of blogPosts) {
    const imgRegex = /(?:data-image|src)="(https:\/\/images\.squarespace-cdn\.com[^"]+)"|src="(https:\/\/images\.squarespace-cdn\.com[^"]+)"/g;
    let m;
    const postImages = [];
    while ((m = imgRegex.exec(post.content)) !== null) {
      const url = (m[1] || m[2]).split('?')[0];
      if (!urlToFilename[url]) {
        globalImgIndex++;
        const ext = (url.match(/\.(jpe?g|png|gif|webp)$/i) || ['', 'jpg'])[1] || 'jpg';
        urlToFilename[url] = `blog-${String(globalImgIndex).padStart(3, '0')}.${ext}`;
      }
      postImages.push({ url, filename: urlToFilename[url] });
    }
    
    postsData.push({
      slug: post.slug,
      title: post.title,
      date: post.pubDate,
      content: post.content,
      images: postImages,
    });
  }
  
  const postsJson = JSON.stringify(postsData, null, 2);
  fs.writeFileSync(path.join(bikeTourDir, 'posts.json'), postsJson);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'bike-tour-posts.json'), postsJson);

  const prologueJson = JSON.stringify(prologueData, null, 2);
  fs.writeFileSync(path.join(bikeTourDir, 'prologue.json'), prologueJson);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'bike-tour-prologue.json'), prologueJson);
  
  // Download blog + prologue images (unique by filename)
  const allImages = [...postsData.flatMap(p => p.images), ...prologueData.flatMap(p => p.images)];
  const uniqueImages = [...new Map(allImages.map(img => [img.filename, img])).values()];
  let imgCount = 0;
  for (const img of uniqueImages) {
    const filepath = path.join(bikeTourDir, 'images', img.filename);
    try {
      imgCount++;
      process.stdout.write(`\rDownloading blog image ${imgCount}/${uniqueImages.length}`);
      await downloadImage(img.url, filepath);
    } catch (e) {
      console.error(`\nFailed: ${img.filename}`);
    }
  }
  console.log('\nBlog images done.');
  
  // Copy bike tour images to public/img/bike-tour for serving
  const publicBikeTourDir = path.join(__dirname, '..', 'public', 'img', 'bike-tour');
  fs.mkdirSync(publicBikeTourDir, { recursive: true });
  for (const f of fs.readdirSync(path.join(bikeTourDir, 'images'))) {
    fs.copyFileSync(
      path.join(bikeTourDir, 'images', f),
      path.join(publicBikeTourDir, f)
    );
  }
  console.log(`Copied ${fs.readdirSync(publicBikeTourDir).length} bike tour images to public/img/bike-tour/`);
  
  console.log('\nDone!');
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
