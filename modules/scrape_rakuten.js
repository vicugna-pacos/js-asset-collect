/**
 * 楽天証券の資産取得
 */

const scrape_utils = require("./scrape_utils.js");

const navOption = {"waitUntil":"domcontentloaded"};

module.exports.scrape = async (page, account) => {
	process.on("unhandledRejection", console.dir);
	try {
		await page.goto("https://www.rakuten-sec.co.jp/", navOption);
		await page.waitFor(1000);

		// ログイン
		await page.type("#form-login-id", account.user_id);
		await page.type("#form-login-pass", account.password);
		
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click(".s3-form-login__btn")
		]);

		await page.waitFor(1000);

		// 保有資産一覧へ移動
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("#member-top-btn-stk-possess")	// 資産合計のところにある「保有資産一覧」のリンク
		]);

		// 保有資産一覧のテーブル
		let selector_possess = "#table_possess_data > span > table";
		let selector_balance = "#table_balance_data > div > table > tbody > tr:nth-child(13) > td.T2.R1.fb";

		await page.waitForSelector(selector_possess);
		await page.waitForSelector(selector_balance);
		// 預かり金のロード終わりが分からないので、3秒待つ。
		await page.waitFor(3000);

		// 国内株式などを取得
		let raw_items = await page.evaluate(rakuten_getvalue, selector_possess, selector_balance);

		// 金額を数値へ変換する
		let result = [];
		for (let raw_item of raw_items) {
			result.push({
				"account" : account.name
				, "owner" : account.owner
				, "group" : null
				, "name" : raw_item.name
				, "amount" : scrape_utils.parsePrice(raw_item.amount)});

		}

		return result;

	} catch (err) {
		console.log("楽天証券 情報取得失敗");
		console.log(err);
		return null;
	}
};

/**
 * 楽天証券 保有商品一覧 で実行する処理
 */
function rakuten_getvalue(selector_possess, selector_balance) {
	let table = document.querySelector(selector_possess);
	let result = [];

	// 1行目はヘッダーなので飛ばす
	for(let i = 1; i < table.rows.length; i++) {
		let row = table.rows[i];

		let group = row.cells[0].innerText.trim();
		let name = null;
		let value_cell = row.cells[7];
		let value = 0;

		// 国内株式と投資信託でテーブルのレイアウトが違う
		if (group == "国内株式") {
			name = row.cells[2].innerText.trim();
			value_cell = row.cells[7];

		} else if (group == "投資信託") {
			name = row.cells[1].innerText.trim();
			value_cell = row.cells[6];

		}

		// 現在の評価額を取得
		let value_containers = value_cell.getElementsByClassName("MktValYen");

		if (value_containers.length > 0) {
			value = value_containers[0].innerText;
		}

		if (name != null) {
			result.push({
				"name" : name
				, "amount" : value});
		}

	}

	// 預かり金
	let container_balance = document.querySelector(selector_balance);
	if (container_balance == null) {
		console.log("[楽天証券][現金]預かり金 取得失敗");

	} else {
		result.push({
				"name" : "預かり金"
				, "amount" : container_balance.innerText});

	}

	return result;
}

