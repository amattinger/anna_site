// extract-all-photography-images.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const xmlPath = '/Users/anna/Downloads/Squarespace-Wordpress-Export-12-30-2025.xml';
const outputDir = path.join(__dirname, 'photography-all');
const imagesDir = path.join(outputDir, 'images');
const markdownDir = path.join(outputDir, 'markdown');

// Create directories
[outputDir, imagesDir, markdownDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Read XML file
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Find photography section
const photographyMatch = xmlContent.match(/<link>\/photography<\/link>[\s\S]*?<\/item>/);
if (!photographyMatch) {
  console.error('Photography section not found');
  process.exit(1);
}

const photographySection = photographyMatch[0];

// Extract ALL images from gallery-masonry-item sections
const imageRegex = /data-image="(https:\/\/images\.squarespace-cdn\.com[^"]+)"/g;
const images = [];
const seenUrls = new Set();
let match;
let index = 0;

while ((match = imageRegex.exec(photographySection)) !== null) {
  const imageUrl = match[1].split('?')[0]; // Remove query params
  
  // Skip duplicates
  if (seenUrls.has(imageUrl)) continue;
  seenUrls.add(imageUrl);
  
  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  let filename = urlParts[urlParts.length - 1];
  
  // Handle cases where filename might be empty or generic
  if (!filename || filename === 'image-asset.jpeg' || filename === 'image-asset.png') {
    // Use a hash of the URL or index
    const urlHash = imageUrl.split('/').slice(-2).join('-').replace(/[^a-zA-Z0-9.-]/g, '_');
    filename = `photo-${index + 1}-${urlHash.substring(0, 20)}.jpg`;
  }
  
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  images.push({
    url: imageUrl,
    filename: cleanFilename,
    localPath: `/img/${cleanFilename}`,
    index: index + 1
  });
  
  index++;
}

console.log(`Found ${images.length} unique images in photography gallery\n`);

// Download image function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Generate markdown files and download images
async function processImages() {
  const imageList = [];
  
  for (const img of images) {
    const imagePath = path.join(imagesDir, img.filename);
    
    // Skip if already exists
    if (fs.existsSync(imagePath)) {
      console.log(`Skipping ${img.index}/${images.length}: ${img.filename} (already exists)`);
      
      // Still create markdown if it doesn't exist
      const slug = img.filename
        .replace(/\.(jpg|jpeg|png)$/i, '')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .toLowerCase()
        .substring(0, 50);
      
      const markdownPath = path.join(markdownDir, `${slug}.md`);
      if (!fs.existsSync(markdownPath)) {
        const markdownContent = `---
templateKey: work-sub-page
thumbnail: ${img.localPath}
date: ${new Date().toISOString()}
title: Photo ${img.index}
description: Photography portfolio work.
---

## Photo ${img.index}

Photography portfolio image.
`;
        fs.writeFileSync(markdownPath, markdownContent);
      }
      
      imageList.push({
        slug,
        thumbnail: img.localPath,
        title: `Photo ${img.index}`,
        filename: img.filename
      });
      continue;
    }
    
    try {
      console.log(`Downloading ${img.index}/${images.length}: ${img.filename}`);
      await downloadImage(img.url, imagePath);
      
      // Create slug from filename
      const slug = img.filename
        .replace(/\.(jpg|jpeg|png)$/i, '')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .toLowerCase()
        .substring(0, 50);
      
      // Create markdown file
      const markdownContent = `---
templateKey: work-sub-page
thumbnail: ${img.localPath}
date: ${new Date().toISOString()}
title: Photo ${img.index}
description: Photography portfolio work.
---

## Photo ${img.index}

Photography portfolio image.
`;
      
      fs.writeFileSync(
        path.join(markdownDir, `${slug}.md`),
        markdownContent
      );
      
      imageList.push({
        slug,
        thumbnail: img.localPath,
        title: `Photo ${img.index}`,
        filename: img.filename
      });
      
    } catch (error) {
      console.error(`❌ Error downloading ${img.filename}:`, error.message);
    }
  }
  
  // Create summary JSON
  fs.writeFileSync(
    path.join(outputDir, 'all-images-list.json'),
    JSON.stringify(imageList, null, 2)
  );
  
  console.log(`\n✅ Complete!`);
  console.log(`- Processed ${imageList.length} images`);
  console.log(`- Images in: ${imagesDir}`);
  console.log(`- Markdown files in: ${markdownDir}`);
  
  return imageList;
}

processImages().catch(console.error);


