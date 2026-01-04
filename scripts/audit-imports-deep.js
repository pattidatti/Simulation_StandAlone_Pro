
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../src');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (file === 'node_modules' || file.startsWith('.')) return;
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            if (/\.(ts|tsx|css)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function checkImport(filePath, importPath) {
    if (!importPath.startsWith('.')) return;

    const dir = path.dirname(filePath);
    let resolvedPath = path.resolve(dir, importPath);

    // Check if it exists with extensions
    const extensions = ['.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx', '.css', ''];
    let exists = false;
    let truePath = '';

    for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            exists = true;
            truePath = testPath;
            break;
        }
    }

    if (!exists) return; // tsc/vite would catch missing files

    // CHECK FULL SCALAR PATH WALKING
    // We walk up from the file found to the root dir, checking each segment
    let currentCheck = truePath;
    while (currentCheck.length > rootDir.length) {
        const parent = path.dirname(currentCheck);
        const segment = path.basename(currentCheck);

        const siblings = fs.readdirSync(parent);
        if (!siblings.includes(segment)) {
            const looseMatch = siblings.find(s => s.toLowerCase() === segment.toLowerCase());
            console.error(`🚨 CASING ERROR: ${path.relative(rootDir, filePath)} imports '${importPath}'`);
            console.error(`   Segment mismatch: '${segment}' not found in '${path.relative(rootDir, parent)}'`);
            if (looseMatch) console.error(`   Did you mean: '${looseMatch}'?`);
            return;
        }
        currentCheck = parent;
    }
}

const files = getAllFiles(rootDir);
console.log(`Scanning ${files.length} files for directory casing issues...`);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Check static imports
    const regex = /from ['"](\..+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        checkImport(file, match[1]);
    }
    // Check css imports
    const cssRegex = /@import ['"](\..+)['"]/g;
    while ((match = cssRegex.exec(content)) !== null) {
        checkImport(file, match[1]);
    }
    // Check dynamic imports
    const dynamicRegex = /import\(['"](\..+)['"]\)/g;
    while ((match = dynamicRegex.exec(content)) !== null) {
        checkImport(file, match[1]);
    }
});

console.log("Deep audit complete.");
