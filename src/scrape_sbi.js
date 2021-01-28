/**
 * SBI証券の残高取得
 */
const scrape_utils = require("./scrape_utils.js");

module.exports.scrape = async (page, account) => {
	try {
		// ログインページへ移動
		await page.goto("https://www.sbisec.co.jp/ETGate", {"waitUntil":"domcontentloaded"});
		await page.waitForTimeout(2000);

		// ログイン情報入力
		await page.type("input[name=user_id]", account.user_id);
		await page.type("input[name=user_password]", account.password);
		
		await Promise.all([
			page.click("input[type=image][name=ACT_login]")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		// 「ホーム」をクリック
		await Promise.all([
			page.click("#navi01P img[title=ホーム]")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		// 戻り値
		const result = [];

		// 買付余力を探す
		const genkin_containers = await page.$x("//th[contains(text(), '買付余力')]/following-sibling::td[1]");
		let value = null;
		
		if (genkin_containers.length > 0) {
			value = await page.evaluate((ele) => {return ele.textContent}, genkin_containers[0]);
		}

		if (value == null) {
			console.log("SBI証券 買付余力取得失敗");
			value = 0;
		}

		result.push({
			"account" : account.name
			, "owner" : account.owner
			, "group" : "現金"
			, "name" : "残高"
			, "amount" : scrape_utils.parsePrice(value)});

		// 「ポートフォリオ」をクリック
		const port_imgs = await page.$x("//img[@title='ポートフォリオ']");

		if (port_imgs.length == 0) {
			console.log("ポートフォリオへのリンクが押せない");
			return result;
		}

		await Promise.all([
			port_imgs[0].click()
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		// ポートフォリオのページ
		// 投資信託(NISA)
		const raw投資信託NISA = await get投資信託NISA(page);
		if (raw投資信託NISA != null) {
			for (let i = 0; i < raw投資信託NISA.length; i++) {
				raw投資信託NISA[i].account = account.name;
				raw投資信託NISA[i].owner = account.owner;
				// 金額を整形する
				raw投資信託NISA[i].amount = scrape_utils.parsePrice(raw投資信託NISA[i].amount);

				result.push(raw投資信託NISA[i]);
			}
		}

		// ログアウト
		await Promise.all([
			page.click("img[alt=ログアウト]")
			, page.waitForNavigation({"waitUntil":"domcontentloaded"})
		]);
		await page.waitForTimeout(2000);

		return result;

	} catch(err) {
		console.log("SBI証券残高取得失敗");
		console.log(err);
		return null;
	}

};

async function get投資信託NISA(page) {
	const tables = await page.$x("//b[contains(text(), '投資信託（金額/NISA預り）')]/following::table[1]");
	if (tables.length == 0) {
		console.log("投資信託(NISA) の表が取得できない");
		return null;
	}

	const result = await page.evaluate(table => {
		const result2 = [];
		for (let i = 1; i < table.rows.length; i++) {
			let row = table.rows[i];
			const name = row.cells[1].innerText;
			const amount = row.cells[10].innerText;
			result2.push({
				"account" : null
				, "owner" : null
				, "group" : null
				, "name" : name
				, "amount" : amount
			});
		}
		return result2;
	}, tables[0]);

	return result;
}