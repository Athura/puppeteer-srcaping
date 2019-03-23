const puppeteer = require("puppeteer");
const chalk = require("chalk");
const fs = require("fs");

// Add some color for debugging purposes
const error = chalk.bold.red;
const success = chalk.keyword("green");

// This at a later time can be turned into an async function so we can call it inside an endpoint when we want new data. We can also add this to a cron job to run weekly for new jsons
(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false
        })
        const page = await browser.newPage()
        await page.goto(`https://athome.starbucks.com/blonde-roast-coffees/`);
        await page.waitForSelector('#post-1172 > div > div:nth-child(3) > div > div > div:nth-child(3) > div > h2')

        await page.click('#default > div > div > div > div > section > div:nth-child(2) > ol > li:nth-child(1) > article > div.image_container > a > img')

        getBlondeRoasts(browser, page)

        const result = await page.evaluate(() => {
            let title = document.querySelector('h1').innerText;
            let price = document.querySelector('.price_color').innerText;

            return {
                title,
                price
            }
        });

        await browser.close()
        fs.writeFile("starbucks.json", JSON.stringify(result), function(err) {
            if (err) throw err;
            console.log(success("Saved!"));
        })

    } catch (err) {
        console.log(error(err))
        await browser.close();
        console.log(error("Browser Closed!"));
    }
}) ();

async function getBlondeRoasts(browser, page) {

}