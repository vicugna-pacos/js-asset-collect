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
		
		// 場合によっては合言葉の入力が必要
		await inputQnA(page);

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

/**
 * 合言葉の入力
 * @param {*} page 
 */
async function inputQnA(page) {
	let queryArea = await page.$("#txtQuery");
	let answerArea = await page.$("input[type=text][name=txbTestWord]");
	let nextButton = await page.$("input[type=button][value=次へ]");

	if (queryArea == null || answerArea == null || nextButton == null) {
		return;
	}

	// 合言葉の入力
	let query = await page.evaluate(elm => elm.textContent, queryArea);

	for (const qna of account.qnas) {
		if (query == qna.q) {
			await answerArea.type(qna.a);
			break;
		}
	}

	await Promise.all([
		nextButton.click()
		, page.waitForNavigation({"waitUntil":"domcontentloaded"})
	]);
	await page.waitForTimeout(2000);

	// 複数回入力を求められることがあるので、再帰する
	await inputQnA(page);
}
