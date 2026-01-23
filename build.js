import fs from 'fs';
import path from 'path';
import readline from 'readline';

const DOCS_DIR = path.resolve('docs');
const README_PATH = path.resolve('Readme.md');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Count lines in CSV file (subtracting header)
function countCSVRows(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`${filePath} not found, skipping...`);
            return resolve(0);
        }
        
        let lineCount = 0;
        const stream = fs.createReadStream(filePath);
        const reader = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });
        
        reader.on('line', () => {
            lineCount++;
        });
        
        reader.on('close', () => {
            // Subtract 1 for header if file is not empty
            resolve(lineCount > 0 ? lineCount - 1 : 0);
        });
        
        stream.on('error', error => {
            console.error(`Error reading ${filePath}:`, error.message);
            resolve(0);
        });
    });
}

// Main build process
(async () => {
    console.log('Updating stats...');
    
    // Count lines in both CSV files
    const hindiSpeechesLength = await countCSVRows(path.join(DOCS_DIR, 'data_hi.csv'));
    const englishSpeechesLength = await countCSVRows(path.join(DOCS_DIR, 'data_en.csv'));
    
    // Calculate totals
    const totalCount = hindiSpeechesLength + englishSpeechesLength;
    
    // Create metadata
    const metadata = {
        totalSpeeches: totalCount,
        hindiSpeeches: hindiSpeechesLength,
        englishSpeeches: englishSpeechesLength,
        lastUpdated: new Date().toISOString().split('T')[0],
        generatedAt: new Date().toISOString()
    };
    
    console.log(`✓ Stats computed: ${totalCount} speeches`);
    console.log(`  - Hindi: ${hindiSpeechesLength}`);
    console.log(`  - English: ${englishSpeechesLength}`);
    
    // Update README with speech count
    if (fs.existsSync(README_PATH)) {
        let readme = fs.readFileSync(README_PATH, 'utf-8');
        
        // Update patterns
        let updated = false;

        // Update "1889 speeches" etc
        readme = readme.replace(/(\d+)\s+speeches\s+speeches/g, `$1 speeches`); // Fix typo
        readme = readme.replace(/(Contains over\s+)\d+(\s+speeches)/i, `$1${totalCount}$2`);
        readme = readme.replace(/(\d+)\s+speeches\s+(across|in)/i, `${totalCount} speeches $2`);
        
        // Update detailed stats if present
        // Regex to find the stats line we added previously
        // "1889 speeches (1889 Hindi + 0 English)"
        const statsLineRegex = /\d+\s+speeches\s+\(\d+\s+Hindi\s+\+\s+\d+\s+English\)/;
        if (statsLineRegex.test(readme)) {
             readme = readme.replace(statsLineRegex, `${totalCount} speeches (${hindiSpeechesLength} Hindi + ${englishSpeechesLength} English)`);
             updated = true;
        } else if (readme.includes('modi-speeches')) {
            // Fallback: If not found, try to ensure it's there? 
            // Actually, let's just rely on the main "X speeches" updates if that fails.
             updated = true;
        }

        if (updated) {
            fs.writeFileSync(README_PATH, readme);
            console.log(`✓ Updated README.md with speech count`);
        } else {
             console.log('⚠ Could not find pattern to update in README.md');
        }
    }
    
    // Save minimal stats file
    fs.writeFileSync(
        path.join(DOCS_DIR, 'stats.json'),
        JSON.stringify(metadata, null, 2)
    );
    
    console.log('✓ Build complete!');
})();
