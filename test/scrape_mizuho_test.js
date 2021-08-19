const puppeteer = require("puppeteer-core");
const config = require("config");
const date_utils = require("date-utils");
const aeon = require("../src/scrape_mizuho.js");

const LAUNCH_OPTION = {
	 headless : false
	,executablePath : "C:/Program Files/Google/Chrome/Application/chrome.exe"
};

/**
 * メインメソッド
 */
(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on("unhandledRejection", console.dir);

	const browser = await puppeteer.launch(LAUNCH_OPTION);
	try {
		const page = await browser.newPage();
		page.on("console", console.log);	// page.evaluateで実行した関数のログも出力される

		const details = await aeon.scrape(page, config.accounts[5]);

		console.log(details);
		
	} catch(e) {
		console.log(e);
	} finally {
		browser.close();
	}

})();
