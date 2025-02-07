const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

// Hardcoded URLs
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

async function getDebtRates() {
    const browser = await puppeteer.launch({ headless: true });
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

            results.push({ url, rate });
            console.log(`Fetched rate for ${url}: ${rate}`);
        } catch (error) {
            console.error(`Error fetching data for URL ${url}: ${error}`);
            results.push({ url, rate: 'Error' });
        }
    }

    await browser.close();
    return results;
}

async function updateCsv() {
    const rates = await getDebtRates();

    // Check if the CSV file exists
    if (fs.existsSync(csvPath)) {
        // Read the existing CSV file
        const existingData = await fs.promises.readFile(csvPath, 'utf8');
        const lines = existingData.split('\n');
        const updatedLines = [lines[0]]; // Keep the header line

        // Update the CSV data with new rates
        for (const line of lines.slice(1)) {
            if (line.trim() === '') continue;
            const [url, oldRate] = line.split(',');
            const updatedRate = rates.find(r => r.url === url)?.rate || oldRate;
            updatedLines.push(`${url},${updatedRate}`);
        }

        // Write the updated lines back to the CSV file
        await fs.promises.writeFile(csvPath, updatedLines.join('\n'), 'utf8');
    } else {
        // If the CSV file doesn't exist, create it
        await csvWriter.writeRecords(rates);
    }

    console.log('Updated CSV: debt_rates.csv');
}

setInterval(updateCsv, 30000);  // Run every 30 seconds
