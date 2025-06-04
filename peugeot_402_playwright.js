const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const userDataDir = '\Users\pless\AppData\Local\Google\Chrome\User Data\Default'; // <-- à modifier

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null,
    });

    const page = await context.newPage();

    const searchUrl = 'https://www.leboncoin.fr/recherche?category=2&text=peugeot%20402&price=0-5000';

    await page.goto(searchUrl, { waitUntil: 'networkidle' });

    // Attendre que les annonces soient visibles
    await page.waitForSelector('ul li[data-qa-id="aditem_container"]', { timeout: 15000 });

    const results = await page.evaluate(() => {
        const ads = [];
        const adElements = document.querySelectorAll('ul li[data-qa-id="aditem_container"]');

        adElements.forEach(ad => {
            const title = ad.querySelector('p[data-qa-id="aditem_title"]')?.innerText || '';
            const price = ad.querySelector('span[data-qa-id="aditem_price"]')?.innerText || '';
            const link = ad.querySelector('a')?.href || '';
            const location = ad.querySelector('p[data-qa-id="aditem_location"]')?.innerText || '';
            const date = ad.querySelector('p[data-qa-id="aditem_date"]')?.innerText || '';
            const description = ad.querySelector('p[data-qa-id="aditem_description"]')?.innerText || '';

            if (title && link) {
                ads.push({ title, price, link, location, date, description });
            }
        });

        return ads;
    });

    await context.close();

    fs.writeFileSync('peugeot_402_playwright.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log(`✅ ${results.length} annonces sauvegardées dans 'peugeot_402_playwright.json'`);
})();
