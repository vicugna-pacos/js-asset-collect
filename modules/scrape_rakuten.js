/**
 * 楽天証券の資産取得
 */

const puppeteer = require('puppeteer');
const scrape_utils = require('./scrape_utils.js');

const navOption = {'waitUntil':'load'};

module.exports.scrape = async (page, account) => {
	process.on('unhandledRejection', console.dir);
	try {
		await page.goto('https://www.rakuten-sec.co.jp/');

		// ログイン
		await page.type('#form-login-id', account.user_id);
		await page.type('#form-login-pass', account.password);
		await scrape_utils.clickLink(page, '.s1-form-login__btn');
		await page.waitForNavigation(navOption);

		// 保有資産一覧へ移動
		await scrape_utils.clickLink(page, '#member-top-btn-stk-possess');	// 資産合計のところにある「保有資産一覧」のリンク
		await page.waitForNavigation(navOption);

		// 保有資産一覧のテーブル
		let selector_possess = '#table_possess_data > span > table';
		let selector_balance = '#table_balance_data > div > table > tbody > tr:nth-child(13) > td.T2.R1.fb';

		await page.waitForSelector(selector_possess);
		await page.waitForSelector(selector_balance);
		// 預かり金のロード終わりが分からないので、3秒待つ。
		await page.waitFor(3000);

		// 国内株式などを取得
		let raw_items = await page.evaluate(rakuten_getvalue, selector_possess, selector_balance);

		// 未加工のデータを変換する
		let result = [];
		for (let raw_item of raw_items) {

			result.push({
				 '項目' : raw_item['項目']
				,'金額' : scrape_utils.parsePrice(raw_item['金額'])
			});

		}

		return result;

	} catch (err) {
		console.log('楽天証券 情報取得失敗');
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
		if (group == '国内株式') {
			name = row.cells[2].innerText.trim();
			value_cell = row.cells[7];

		} else if (group == '投資信託') {
			name = row.cells[1].innerText.trim();
			value_cell = row.cells[6];

			// 投資信託の国内海外を判定
			if (name.includes('日経') || name.includes('ＴＯＰＩＸ') || name.includes('ひふみ')) {
				group += '(国内)';

			} else if(name.includes('外国') || name.includes('先進国') || name.includes('米国') || name.includes('全米')) {
				group += '(海外)';

			}
		}

		// 現在の評価額を取得
		let value_containers = value_cell.getElementsByClassName('MktValYen');

		if (value_containers.length > 0) {
			value = value_containers[0].innerText;
		}

		if (name != null) {
			result.push({
				'項目' : '[' + group + ']' + name
				,'金額' : value
			});
		}

	}

	// 預かり金
	let container_balance = document.querySelector(selector_balance);
	if (container_balance == null) {
		console.log('[現金][楽天証券]預かり金 取得失敗');

	} else {
		result.push({'項目' : '[現金][楽天証券]預かり金', '金額' : container_balance.innerText});
	}

	return result;
}

