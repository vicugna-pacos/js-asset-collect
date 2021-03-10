/*
資産情報取得モジュール
 */
const puppeteer = require("puppeteer-core");
const config = require("config");
const aggr = require("./src/asset_aggregation.js");
const writer = require("./src/write_to_gsheet.js");
require("date-utils");

const LAUNCH_OPTION = {
	 headless : false
	,executablePath : "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
};

/**
 * メインメソッド
 */
(async () => {

	// スクレイパー定義
	const scrapers = new Map();
	scrapers.set("UFJ", "scrape_ufj");
	scrapers.set("イオン銀行", "scrape_aeon");
	scrapers.set("大和証券", "scrape_daiwa");
	scrapers.set("掛信", "scrape_kakeshin");
	scrapers.set("楽天証券", "scrape_rakuten");
	scrapers.set("みずほ", "scrape_mizuho");
	scrapers.set("SBI", "scrape_sbi");
	
	// キャッチされなかったPromiseのエラー詳細を出してくれる
	//process.on("unhandledRejection", console.dir);

	const browser = await puppeteer.launch(LAUNCH_OPTION);
	let items = [];
	try {
		const page = await browser.newPage();
		await page.setViewport({"width":1010, "height":816});

		//page.on("console", console.log);	// page.evaluateで実行した関数のログも出力される

		for (let account of config.accounts) {

			const filename = scrapers.get(account.name);
			if (filename == null) {
				continue;
			}

			const scraper = require("./src/" + filename + ".js");
			let details = await scraper.scrape(page, account);

			if (details == null) {
				continue;
			}

			details = await aggr.setGroup(details);
			Array.prototype.push.apply(items, details);
		}

	} catch(e) {
		console.log(e);
	} finally {
		browser.close();
	}

	// 日付を追加
	let dt = (new Date()).toFormat("YYYY/MM/DD");
	for (let item of items) {
		item["date"] = dt;
	}

	// スプレッドシートへ書き込み
	writer.mergeDetails(items);

	console.log("処理が完了しました");
})();
