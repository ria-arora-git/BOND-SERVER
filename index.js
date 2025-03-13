const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

// URLs to scrape
const urls = [
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/532922/937803/",
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/532922/937495/",
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/533398/938011/",
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/532636/937453/",
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/938642/938642/",
    "https://www.bseindia.com/stock-share-price/debt-other/scripcode/938005/938005/"
];

const csvPath = 'debt_rates.csv';

const csvWriter = createCsvWriter({
    path: csvPath,
    header: [
        { id: 'url', title: 'URL' },
        { id: 'rate', title: 'Rate' }
    ]
});

// Puppeteer launch configuration for M3 Macs
async function getDebtRates() {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Path to your local Chrome
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some macOS environments
    });

    const page = await browser.newPage();
    const results = [];

    for (const url of urls) {
        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            const rate = await page.evaluate(() => {
                const rateDivs = document.querySelectorAll('#idcrval');
                if (rateDivs.length > 1) {
                    return rateDivs[1].textContent.trim();
                }
                return null;
            });

            results.push({ url, rate: rate || 'Not Found' });
            console.log(`Fetched rate for ${url}: ${rate}`);
        } catch (error) {
            console.error(`Error fetching data for URL ${url}: ${error}`);
            results.push({ url, rate: 'Error' });
        }
    }

    await browser.close();
    return results;
}

// Update CSV logic
async function updateCsv() {
    const rates = await getDebtRates();

    if (fs.existsSync(csvPath)) {
        const existingData = await fs.promises.readFile(csvPath, 'utf8');
        const lines = existingData.split('\n');
        const updatedLines = [lines[0]]; // Keep the header line

        for (const line of lines.slice(1)) {
            if (line.trim() === '') continue;
            const [url, oldRate] = line.split(',');
            const updatedRate = rates.find(r => r.url === url)?.rate || oldRate;
            updatedLines.push(`${url},${updatedRate}`);
        }

        await fs.promises.writeFile(csvPath, updatedLines.join('\n'), 'utf8');
    } else {
        await csvWriter.writeRecords(rates);
    }

    console.log('Updated CSV: debt_rates.csv');
}

// Schedule the script to run every 30 seconds
setInterval(updateCsv, 60000); // Runs every 30 seconds
