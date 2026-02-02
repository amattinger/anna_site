// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://clay-astro-theme.netlify.app',
    integrations: [
        react(),
        sitemap({
            filter: (page) => !page.includes('/private'),
        }),
    ],
});
