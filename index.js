/*
資産情報取得モジュール
 */
const puppeteer = require("puppeteer-core");
const config = require("config");
const date_utils = require("date-utils");
const aggr = require("./modules/asset_aggregation.js");
const writer = require("./modules/write_to_gsheet.js");

const LAUNCH_OPTION = {
	 headless : false
	,executablePath : "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
};

/**
 * メインメソッド
 */
(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on("unhandledRejection", console.dir);

	const browser = await puppeteer.launch(LAUNCH_OPTION);
	let items = [];
	try {
		const page = await browser.newPage();
		page.on("console", console.log);	// page.evaluateで実行した関数のログも出力される

		for (let account of config.accounts) {
			let module_name = null;

			if (account.name == "UFJ") {
				module_name = "./modules/scrape_ufj.js";

			} else if (account.name == "楽天証券") {
				module_name = "./modules/scrape_rakuten.js";

			} else if (account.name == "大和証券") {
				module_name = "./modules/scrape_daiwa.js";

			} else if (account.name == "掛信") {
				module_name = "./modules/scrape_kakeshin.js";

			} else if (account.name == "イオン銀行") {
				module_name = "./modules/scrape_aeon.js";

			}

			if (module_name == null) {
				continue;
			}

			let details = await require(module_name).scrape(page, account);

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
