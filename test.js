const puppeteer = require('puppeteer');
const LAUNCH_OPTION = {
    headless : false
   ,executablePath : 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
};
const navOption = {"waitUntil":"load"};

(async () => {

    const browser = await puppeteer.launch(LAUNCH_OPTION);
    const page = await browser.newPage();

    await page.goto("https://entry11.bk.mufg.jp/ibg/dfw/APLIN/loginib/login?_TRANID=AA000_001", navOption);

    // ログイン
    await page.type("#account_id", "aaaaa");
    await page.type("#ib_password", "bbbbb");

})();
