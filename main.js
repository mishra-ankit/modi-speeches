import jsdom from "jsdom";
import fs from "fs";
import path from 'path';
import { CSVFile } from "./CSVFile.js";
const { JSDOM } = jsdom;

// Helper for retrying JSDOM fetches
async function fetchJSDOMWithRetry(url, retries = 3, delay = 2000) {
    const options = {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    };
    for (let i = 0; i <= retries; i++) {
        try {
            return await JSDOM.fromURL(url, options);
        } catch (error) {
            if (i === retries) throw error;
            console.log(`Error fetching ${url}: ${error.message}. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Get language from command line argument (default to 'hi')
const lang = process.argv[2] || "hi";
if (!["hi", "en"].includes(lang)) {
    console.error("Invalid language. Use 'hi' for Hindi or 'en' for English.");
    process.exit(1);
}

const dataFilePath = path.resolve('docs', `data_${lang}.csv`);
console.log(`Scraping ${lang === "hi" ? "Hindi" : "English"} speeches into ${dataFilePath}`);

// Load existing URLs into a Set for O(1) lookup
function loadExistingUrls() {
    if (!fs.existsSync(dataFilePath)) {
        return new Set();
    }
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    const urls = new Set();
    lines.forEach(line => {
        const match = line.match(/^([^,]+)/);
        if (match) {
            urls.add(match[1]);
        }
    });
    return urls;
}

(async () => {
    const existingUrls = loadExistingUrls();
    console.log(`Found ${existingUrls.size} existing speeches in database.`);
    
    const csvFile = new CSVFile({
        path: dataFilePath,
        headers: true
    });
    
    let count = 0;
    let page = 1;
    let consecutiveDuplicates = 0;
    const MAX_CONSECUTIVE_DUPLICATES = 10; // Stop after ~1 page of duplicates
    const newSpeechesBuffer = []; // Buffer to store new speeches before writing
    
    const writeStats = (count) => {
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `added_count=${count}\n`);
        }
    };

    scrapeLoop:
    while (true) {
        const url = `https://www.narendramodi.in/speech/loadspeeche?page=${page}&language=${lang}`;
        try {
            console.log(`Fetching page ${page}...`);
            const dom = await fetchJSDOMWithRetry(url);
            const document = dom.window.document;

            const speechesBox = Array.from(document.querySelectorAll(".speechesBox"));
            
            // If no speeches found, we've reached the end
            if (speechesBox.length === 0) {
                console.log("No more speeches found. Reached end of available pages.");
                break;
            }
            
            let pageProcessedCount = 0;
            const speechesToProcess = [];
            let shouldStop = false;

            for (let index = 0; index < speechesBox.length; index++) {
                const speech = speechesBox[index];
                const { href, innerHTML: title } = speech.querySelector(".speechesItemLink.left_class a");
                const { innerHTML: date } = speech.querySelector(".pwdBy");
                const imgElement = speech.querySelector("img");
                const src = imgElement ? imgElement.src : '';

                if (existingUrls.has(href)) {
                    consecutiveDuplicates++;
                    if (consecutiveDuplicates >= MAX_CONSECUTIVE_DUPLICATES) {
                        console.log(`Found ${consecutiveDuplicates} consecutive existing speeches. Assuming up-to-date. Stopping.`);
                        shouldStop = true;
                        break;
                    }
                    continue;
                }

                // Reset counter if we found a new speech
                consecutiveDuplicates = 0;
                speechesToProcess.push({ href, title, date, src });
                existingUrls.add(href); // Add to set to avoid duplicates in this run
            }

            if (speechesToProcess.length > 0) {
                console.log(`Fetching details for ${speechesToProcess.length} speeches on page ${page} in parallel...`);
                const results = await Promise.all(speechesToProcess.map(async (meta) => {
                    try {
                        const info = await getSpeechInfo(meta.href);
                        return {
                            href: meta.href,
                            title: meta.title.trim(),
                            date: meta.date.trim(),
                            img: meta.src,
                            ...info
                        };
                    } catch (speechError) {
                        console.error(`Failed to scrape speech ${meta.href}:`, speechError.message);
                        return null;
                    }
                }));

                const validResults = results.filter(r => r !== null);
                validResults.forEach(speechData => {
                    console.log(`Buffered new speech: ${speechData.title.trim().substring(0, 30)}...`);
                    newSpeechesBuffer.push(speechData);
                    count++;
                });
            }

            if (shouldStop) {
                break scrapeLoop;
            }
            
            page++;
        } catch (error) {
            console.error(`Error on page ${page}:`, error.message);
            break;
        }
    }

    if (newSpeechesBuffer.length > 0) {
        console.log(`Writing ${newSpeechesBuffer.length} new speeches to file in chronological order...`);
        // The scraping was Newest -> Oldest. 
        // We want to append to file (Oldest -> Newest).
        // So we reverse the buffer to get Oldest -> Newest order for the new chunk.
        newSpeechesBuffer.reverse();
        
        if (fs.existsSync(dataFilePath)) {
            await csvFile.append(newSpeechesBuffer);
        } else {
            console.log("File does not exist. Creating new file with headers.");
            await csvFile.create(newSpeechesBuffer);
        }
    } else {
        console.log("No new speeches to write.");
    }

    console.log(`Total new speeches added: ${count}`);
    writeStats(count);
})()

async function getSpeechInfo(url) {
    console.log("Speech info: ", url);
    const dom = await fetchJSDOMWithRetry(url);
    const document = dom.window.document;

    const articleBody = document.querySelector(".articleBody");
    const iframe = articleBody.querySelector("iframe");
    const youtubeURL = iframe ? iframe.src : "";
    const nodes = Array.from(articleBody.querySelectorAll("p"));
    const texts = [];
    nodes.forEach(p => {
        const text = p.textContent ? p.textContent.trim() : ""
        if (text.length)
            texts.push(text)
    })
    return {
        youtubeURL,
        speechText: texts.join(" "),
    }
}
