/**
 * UFJの資産取得
 */

const scrape_utils = require("./scrape_utils.js");

const navOption = {"waitUntil":"domcontentloaded"};

module.exports.scrape = async (page, account) => {
	try {
		await page.goto("https://entry11.bk.mufg.jp/ibg/dfw/APLIN/loginib/login?_TRANID=AA000_001", navOption);

		// ログイン
		await page.type("#account_id", account.user_id);
		await page.type("#ib_password", account.password);

		await scrape_utils.clickLink(page, "div.admb_m a");
		await page.waitForNavigation(navOption);

		// 口座一覧のページへ移動
		await scrape_utils.clickLink(page, "#list > li:first-child > a");
		await page.waitForNavigation(navOption);

		// 残高取得
		let selector = "#remainder_info > div > div > div > div.flat_unit.head_info > div.fleft > div > div > table > tbody > tr > td.number";
		await page.waitForSelector(selector);

		let value = await page.evaluate(getCash, selector);

		if (value == null) {
			console.log("UFJ残高取得失敗");
			value = 0;
		}
		return [{"account" : account.name
				, "group" : account.aggregate[0].group
				, "name" : "残高"
				, "amount" : scrape_utils.parsePrice(value)}];

	} catch (err) {
		console.log("UFJ残高取得失敗");
		console.log(err);
		return null;
	}
};

/**
 * evaluate用関数：UFJの口座一覧から値を取得する
 */
function getCash(selector) {
	let container = document.querySelector(selector);
	if (container == null) {
		return null;
	}

	return container.innerText;
}
