/**
 * 大和証券の資産取得
 */

const scrape_utils = require('./scrape_utils.js');

const navOption = {'waitUntil':'domcontentloaded'};

module.exports.scrape = async (page, account) => {
	try {
		await page.goto('https://www.daiwa.co.jp/PCC/HomeTrade/Account/m8301.html');

		// ログイン
		await page.type('#putbox1', account.branch);
		await page.type('#putbox2', account.user_id);
		await page.type('#putbox3', account.password);
		await scrape_utils.clickLink(page, '#CONTENT > div.login_l > div.login_frm > form > div.login_btn > input[type="submit"]');
		await page.waitForNavigation(navOption);

		// トップページ  預かり金一覧へのリンク
		await scrape_utils.clickLink(page, '#topSide > div:nth-child(2) > div > a:nth-child(5)');
		await page.waitForNavigation(navOption);

		let raw_items = await page.evaluate(getCash);
		let result = [];

		for (let raw_item of raw_items) {
			result.push({
				'account' : account.name
				, "owner" : account.owner
				, 'group' : null
				, 'name' : raw_item.name
				, 'amount' : scrape_utils.parsePrice(raw_item.amount)
			});
		}

		return result;

	} catch (err) {
		console.log('大和証券 情報取得失敗');
		console.log(err);
		return null;
	}
};

/**
 * 大和証券  預かり金などの値を取得する
 */
function getCash() {
	let selector_mrf = '#cTable > tbody > tr:nth-child(1) > td > table.tblcol.tbltp1.tblmgn1 > tbody > tr:nth-child(1) > td';
	let selector_cash = '#cTable > tbody > tr:nth-child(1) > td > table.tblcol.tbltp1.tblmgn1 > tbody > tr:nth-child(2) > td';

	let container_mrf = document.querySelector(selector_mrf);
	let container_cash = document.querySelector(selector_cash);

	let result = [
		 {'name' : 'MRF', 'amount' : container_mrf.innerText}
		,{'name' : '現金', 'amount' : container_cash.innerText}
	];

	return result;
}
