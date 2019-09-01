/*
資産情報取得モジュール
 */
const puppeteer = require('puppeteer');
const config = require('config');
const date_utils = require('date-utils');
const csv = require('./modules/write_to_csv.js');
const aggr = require('./modules/asset_aggregation.js');

const LAUNCH_OPTION = {
	 headless : false
	,executablePath : 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
};

/**
 * メインメソッド
 */
(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on('unhandledRejection', console.dir);

	const browser = await puppeteer.launch(LAUNCH_OPTION);
	let items = [];
	try {
		const page = await browser.newPage();
		page.on('console', console.log);	// page.evaluateで実行した関数のログも出力される

		for (let account of config.accounts) {
			let module_name = null;

			if (account.name == 'ufj') {
				// UFJ
				module_name = './modules/scrape_ufj.js';

			// } else if (account.name == 'rakuten') {
			// 	// 楽天証券
			// 	module_name = './scrape_rakuten.js';

//			} else if (account.name == 'sbi_ideco') {
//				// SBI証券(iDeco)
//				module_name = './scrape_sbiideco.js';

			// } else if (account.name == 'daiwa') {
			// 	// 大和証券
			// 	module_name = './scrape_daiwa.js';

			// } else if (account.name == 'kakeshin') {
			// 	// 掛信
			// 	module_name = './scrape_kakeshin.js';

			}

			if (module_name == null) {
				continue;
			}

			let item = await require(module_name).scrape(page, account);

			if (item == null) {
				continue;
			}

			if (Array.isArray(item)) {
				Array.prototype.push.apply(items, item);

			} else {
				items.push(item);

			}
		}

	} catch(e) {
		console.log(e);
	} finally {
		browser.close();
	}

	// 日付を追加
	let dt = (new Date()).toFormat('YYYY/MM/DD');
	for (let item of items) {
		item['date'] = dt;
	}

	// 項目を集計してcsvへ出力
	const asset = aggr.assetAggregation(items);

	csv.writeToCsv(items, asset);

	console.log('処理が完了しました');
})();
