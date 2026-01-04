import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.resolve(__dirname, '../dist');

try {
    fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
    console.log('✅ Copied index.html to 404.html for GitHub Pages SPA support');
} catch (e) {
    if (fs.existsSync(dist)) {
        console.error('Failed to copy 404.html:', e);
        process.exit(1);
    } else {
        console.log('Dist folder not found, skipping 404 copy (pre-build check?)');
    }
}
