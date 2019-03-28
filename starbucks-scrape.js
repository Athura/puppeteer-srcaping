const puppeteer = require("puppeteer");
const chalk = require("chalk");
const fs = require("fs");

// Add some color for debugging purposes
const error = chalk.bold.red;
const success = chalk.keyword("green");

// Helper function to make xpaths available for targeting
// https://stackoverflow.com/questions/48476356/is-there-a-way-to-add-script-to-add-new-functions-in-evaluate-context-of-chrom
const helperFunctions = () => {
  window.$x = xPath => document
    .evaluate(
      xPath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    .singleNodeValue;
};

// This at a later time can be turned into an async function so we can call it inside an endpoint when we want new data. We can also add this to a cron job to run weekly for new jsons
(async () => {
    try {
      // open the headless browser
      const browser = await puppeteer.launch({ headless: true });
      // open a new page
      const page = await browser.newPage();
      console.log(success("Browser Created"));
      // enter url in page
      await page.goto(`https://athome.starbucks.com/blonde-roast-coffees/`);
      console.log(success("We have arrived"));
      // https://github.com/GoogleChrome/puppeteer/issues/2917
      // We have to craft our own idle detector
      // await page.waitForSelector("div.sub-hero-title");
      let inflightImageRequests = 0;
      page.on('request', request => {
        if (request.resourceType() !== 'image')
          return;
        ++inflightImageRequests;
      });
      console.log(success("All image requests are beginning!"));
      page.on('requestfinished', requestFinished);
      page.on('requestfailed', requestFinished);
      function requestFinished(request) {
        if (request.resourceType() !== 'image')
         return;
        inflightImageRequests = Math.max(inflightImageRequests - 1, 0);
        if (inflightImageRequests)
          return;
        console.log(success("All image requests are complete!"));
      }
      console.log(success("hero found"));

      const results = await page.evaluate(() => {
        console.log(success("enter eval"));
        let titleNodeList = $x("//div[2]/div/a/h3");
        let coffeeNodeLinkList = $x("//div[2]/div/a");
        let descNodeList = $x("//div[4]/div/p[2]");
        let coffeeImgList = $("//div[1]/div/a/img");
        let titleLinkArray = [];
        for (let i = 0; i < titleNodeList.length; i++) {
          titleLinkArray[i] = {
            title: titleNodeList[i].innerText.trim(),
            link: coffeeNodeLinkList[i].getAttribute("href"),
            age: descNodeList[i].innerText.trim(),
            score: coffeeImgList[i].getAttribute("src")
          };
        }
        return titleLinkArray;
      });

      await browser.close();
      // Writing the news inside a json file
      fs.writeFile("starbucks.json", JSON.stringify(results), function(err) {
        if (err) throw err;
        console.log("Saved!");
      });
      console.log(success("Browser Closed"));
    } catch (err) {
      // Catch and display errors
      console.log(error(err));
      await browser.close();
      console.log(error("Browser Closed"));
    }
  })();