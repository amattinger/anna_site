// extract-photography-portfolio.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const xmlPath = '/Users/anna/Downloads/Squarespace-Wordpress-Export-12-30-2025.xml';
const outputDir = path.join(__dirname, 'photography-portfolio');
const imagesDir = path.join(outputDir, 'images');
const markdownDir = path.join(outputDir, 'markdown');

// Portfolio image filenames from the website
const portfolioImageNames = [
  '_DSC6851.jpg',
  '_DSC8192.png',
  '_DSC3316-Enhanced-NR-2.png',
  '_DSC9461-2.jpg',
  '_DSC3365-Enhanced-NR.png',
  '_DSC8352-2.jpg',
  '_DSC9183.jpg',
  '_DSC8673-2.jpg',
  '_DSC8856.jpg',
  '_DSC0006-2.jpg',
  '_DSC7723.jpg',
  '_DSC6701-2.jpg',
  '_DSC4461-2.jpg',
  '_DSC4475-5.jpg',
  '_DSC8780.jpg',
  '_DSC8077.jpg',
  '_DSC7180.jpg',
  '_DSC6484.jpg',
  '_DSC6567.jpg',
  '_DSC7240.jpg',
  '_DSC6549.jpg',
  'NUDE Web —Commision for G Streng — Sumana Front.jpg',
  'image.jpg',
  '2020Party-Final.jpg',
  '_DSC7135.jpg',
  '_DSC8267.jpg',
  '_DSC7942.jpg',
  '_DSC8303.jpg',
  '_DSC8241.jpg',
  '_DSC3426-Enhanced-NR.png',
  '_DSC2170.png'
];

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

// Extract images that match portfolio filenames
const portfolioImages = [];
portfolioImageNames.forEach((filename, index) => {
  // Escape special regex characters in filename
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`data-image="(https://images\\.squarespace-cdn\\.com[^"]*${escapedFilename}[^"]*)"`, 'i');
  const match = photographySection.match(regex);
  
  if (match) {
    const imageUrl = match[1]; // Keep full URL with query params for downloading
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    portfolioImages.push({
      url: imageUrl,
      originalFilename: filename,
      filename: cleanFilename,
      localPath: `/img/photography-${cleanFilename}`,
      index: index + 1
    });
  } else {
    console.warn(`⚠️  Image not found: ${filename}`);
  }
});

console.log(`Found ${portfolioImages.length} of ${portfolioImageNames.length} portfolio images\n`);

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
  
  for (const img of portfolioImages) {
    const imagePath = path.join(imagesDir, img.filename);
    
    try {
      console.log(`Downloading ${img.index}/${portfolioImages.length}: ${img.filename}`);
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
title: ${img.originalFilename.replace(/\.(jpg|jpeg|png)$/i, '')}
description: Photography portfolio work.
---

## ${img.originalFilename.replace(/\.(jpg|jpeg|png)$/i, '')}

Photography portfolio image.
`;
      
      fs.writeFileSync(
        path.join(markdownDir, `${slug}.md`),
        markdownContent
      );
      
      imageList.push({
        slug,
        thumbnail: img.localPath,
        title: img.originalFilename.replace(/\.(jpg|jpeg|png)$/i, ''),
        filename: img.filename
      });
      
    } catch (error) {
      console.error(`❌ Error downloading ${img.filename}:`, error.message);
    }
  }
  
  // Create summary JSON
  fs.writeFileSync(
    path.join(outputDir, 'portfolio-images.json'),
    JSON.stringify(imageList, null, 2)
  );
  
  console.log(`\n✅ Complete!`);
  console.log(`- Downloaded ${imageList.length} images to: ${imagesDir}`);
  console.log(`- Created ${imageList.length} markdown files in: ${markdownDir}`);
  
  return imageList;
}

processImages().catch(console.error);

