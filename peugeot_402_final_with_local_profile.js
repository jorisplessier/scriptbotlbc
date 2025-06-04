const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    // Dossier de profil local (dans le projet)
    const userDataDir = path.join(__dirname, 'playwright-user-data');

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--start-maximized'
        ]
    });

    const page = await context.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    const searchUrl = 'https://www.leboncoin.fr/recherche?category=2&text=peugeot%20402&price=0-5000';
    await page.goto(searchUrl, { waitUntil: 'networkidle' });

    // Pause manuelle : laisse le temps de passer le CAPTCHA si besoin
    console.log("🛑 Le navigateur est ouvert. Connecte-toi et passe le CAPTCHA si nécessaire.");
    console.log("✅ Appuie sur Entrée dans le terminal quand c'est prêt pour continuer...");

    process.stdin.once('data', async () => {
        // Scroll lent
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 400 + Math.random() * 200);
            await page.waitForTimeout(1000 + Math.random() * 2000);
        }

        await page.waitForTimeout(3000);

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

        fs.writeFileSync('peugeot_402_final.json', JSON.stringify(results, null, 2), 'utf-8');
        console.log(`✅ ${results.length} annonces enregistrées dans 'peugeot_402_final.json'`);
        process.exit(0);
    });
})();
