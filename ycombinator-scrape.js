const puppeteer = require("puppeteer");
const chalk = require("chalk");
const fs = require("fs");

// Add some color for debugging purposes
const error = chalk.bold.red;
const success = chalk.keyword("green");

// This at a later time can be turned into an async function so we can call it inside an endpoint when we want new data. We can also add this to a cron job to run weekly for new jsons
(async () => {
    try {
      // open the headless browser
      const browser = await puppeteer.launch({ headless: true });
      // open a new page
      const page = await browser.newPage();
      // enter url in page
      await page.goto(`https://news.ycombinator.com/`);
      await page.waitForSelector("a.storylink");

      const results = await page.evaluate(() => {
        let titleNodeList = document.querySelectorAll(`a.storylink`);
        let ageList = document.querySelectorAll(`span.age`);
        let scoreList = document.querySelectorAll(`span.score`);
        let titleLinkArray = [];
        for (let i = 0; i < titleNodeList.length; i++) {
          titleLinkArray[i] = {
            title: titleNodeList[i].innerText.trim(),
            link: titleNodeList[i].getAttribute("href"),
            age: ageList[i].innerText.trim(),
            score: scoreList[i].innerText.trim()
          };
        }
        return titleLinkArray;
      });
      // console.log(news);
      await browser.close();
      // Writing the news inside a json file
      fs.writeFile("hackernews.json", JSON.stringify(results), function(err) {
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