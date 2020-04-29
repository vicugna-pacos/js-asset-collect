/**
 * UFJの残高取得
 */
const scrape_utils = require("./scrape_utils.js");

module.exports.scrape = async (page, account) => {
	try {
		await page.goto("https://entry11.bk.mufg.jp/ibg/dfw/APLIN/loginib/login?_TRANID=AA000_001", {"waitUntil":"domcontentloaded"});

		// ログイン
		await page.waitForSelector("#tx-contract-number", {"visible":true});
		await page.type("#tx-contract-number", account.user_id);
		await page.type("#tx-ib-password", account.password);

		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("button.gonext")
		]);

		// 「ほかの口座残高をみる」をクリック
		await page.click("section.see-others > div.open-text");
		await page.waitFor(1000);
		
		// 口座一覧のページへ移動
		let kouzalinks = await page.$x("//div[@class='show-more']//a[contains(text(), '口座一覧')]");
		if (kouzalinks == null || kouzalinks.length == 0) {
			console.log("口座一覧のリンクなし");
			return null;
		}

		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			kouzalinks[0].click()
		]);

		// 残高取得
		let selector = "#remainder_info table.yen_kouza_001 td.number > strong";
		await page.waitForSelector(selector, {"visible":true});
		const zandaka_ele = await page.$(selector);

		let value = await page.evaluate((ele) => {return ele.textContent}, zandaka_ele);

		if (value == null) {
			console.log("UFJ残高取得失敗");
			value = 0;
		}
		return [{"account" : account.name
				, "owner" : account.owner
				, "group" : account.aggregate[0].group
				, "name" : "残高"
				, "amount" : scrape_utils.parsePrice(value)}];

	} catch (err) {
		console.log("UFJ残高取得失敗");
		console.log(err);
		return null;
	}
};
