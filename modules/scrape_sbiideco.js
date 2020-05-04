/**
 * SBI証券 iDecoの資産取得
 */

const scrape_utils = require('./scrape_utils.js');

const navOption = {'waitUntil':'domcontentloaded'};

module.exports.scrape = async (page, account) => {
	try {
		await page.goto('https://www.benefit401k.com/customer/RkDCMember/Common/JP_D_BFKLogin.aspx');

		// ログイン
		await page.type('#txtUserID', account.user_id);
		await page.type('#txtPassword', account.password);
		await scrape_utils.clickLink(page, '#btnLogin');
		await page.waitForNavigation(navOption);

		// パスワード変更を促す画面
		let page_title = await page.evaluate(() => {
			let container = document.querySelector('#contentArea > div.headLv2-txt > h2');
			if (container == null) {
				return null;
			}
			return container.innerText;
		});

		if (page_title.includes('パスワード変更のお願い')) {
			await scrape_utils.clickLink(page, '#btnHome');
			await page.waitForNavigation(navOption);
		}

		// ログイン後のページ
		// 資産状況のテーブル
		let selector = '#pnlShisanJyoukyou > div > div:nth-child(1) > div > table > tbody > tr > td:nth-child(1) > div:nth-child(3) > table';
		await page.waitForSelector(selector);

		let raw_items = await page.evaluate(sbi_ideco_getvalue, selector);
		let result = [];

		for (let raw_item of raw_items) {
			result.push({
				 '項目' : raw_item['項目']
				,'金額' : scrape_utils.parsePrice(raw_item['金額'])
			});
		}

		return result;

	} catch (err) {
		console.log('SBIベネフィットシステムズ 情報取得失敗');
		console.log(err);
		return null;
	}
};

/**
 * SBI証券(iDeco)のトップページで実行する処理
 */
function sbi_ideco_getvalue(selector) {
	let table = document.querySelector(selector);
	let result = [];

	// 1行目と最終行は飛ばす
	for (let i = 1; i < table.rows.length - 1; i++) {
		let row = table.rows[i];

		if (row.className == 'tableHeader' || row.cells.length < 3) {
			// ヘッダー行
			continue;
		}

		// タイプごとに合計する
		let group = row.cells[0].innerText.trim();
		let name = row.cells[1].innerText.trim();
		let value = row.cells[2].innerText.trim();

		result.push({
			 '項目' : '[iDeco][' + group + ']' + name
			,'金額' : value
		});

	}

	return result;
}