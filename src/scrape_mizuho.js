/**
 * みずほ銀行の残高取得
 */
const scrape_utils = require("./scrape_utils.js");

module.exports.scrape = async (page, account) => {
	try {
		// ログインページへ移動
		await page.goto("https://www.mizuhobank.co.jp/direct/start.html", {"waitUntil":"domcontentloaded"});
		await page.waitForTimeout(2000);

		// お客様番号入力
		await page.type("#txbCustNo", account.user_id);
		await Promise.all([
			page.click("input[type=submit][name=N00000-next]")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);
		
		// TODO 場合によっては合言葉の入力が必要

		// パスワード入力
		const pwarea = await page.$("#PASSWD_LoginPwdInput");
		if (pwarea == null) {
			throw "パスワード入力できない";
		}
		await page.type("#PASSWD_LoginPwdInput", account.password);
		await Promise.all([
			page.click("#btn_login")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		// 残高取得
		let value = await page.evaluate(() => {return document.querySelector("#txtCrntBal").textContent});

		if (value == null) {
			console.log("みずほ銀行残高取得失敗");
			value = 0;
		}

		// ログアウト
		await Promise.all([
			page.click("img[alt=ログアウト]")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		return [{"account" : account.name
				, "owner" : account.owner
				, "group" : "現金"
				, "name" : "残高"
				, "amount" : scrape_utils.parsePrice(value)}];

	} catch(err) {
		console.log("みずほ銀行残高取得失敗");
		console.log(err);
		return null;
	}

};

