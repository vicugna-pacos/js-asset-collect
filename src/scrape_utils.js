/**
 * スクレイピング用ユーティリティクラス
 */

/**
 * 金額の文字列を数値へ変換する
 */
module.exports.parsePrice = (str) => {
	let before = str;
	let after = str;

	do {
		before = after;
		after = before.replace(',', '');
	} while(before != after);

	let newStr = after;
	newStr = newStr.replace('円', '');
	newStr = newStr.replace('口', '');

	let result = Number(newStr);

	if (isNaN(result)) {
		console.log('数値変換失敗　値=' + str + ', newStr=' + newStr);
		return 0;
	}
	return result;
};

/**
 * 指定したセレクタをクリックするだけの関数
 *
 * @param selector
 * @returns
 */
module.exports.clickLink = async (page, selector) => {
	if (typeof selector == 'string') {
		await page.evaluate((selector) => {
			let btn = document.querySelector(selector);
			if (!btn) {
				console.log('クリックする場所が見つかりません。セレクタ：' + selector);
				return;
			}
			btn.click();

		}, selector);

	}
};

/**
 * ページの描画が終わるのを待つ
 * @param {*} page 
 * @param {*} timeout 
 */
module.exports.waitTillHTMLRendered = async (page, timeout = 30000) => {
	const checkDurationMsecs = 1000;  // チェックする間隔(ミリ秒)
	const minStableSizeIterations = 2;  // ○回チェックしてサイズに変化がなければOKとする
	const maxChecks = timeout / checkDurationMsecs;
	let lastHTMLSize = 0;
	let checkCounts = 1;
	let countStableSizeIterations = 0;

	await page.waitForSelector("body", {"visible":true});
  
	while (checkCounts++ <= maxChecks){
		let html = await page.content();
		let currentHTMLSize = html.length; 

		let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

		if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) {
			countStableSizeIterations++;
		} else {
			countStableSizeIterations = 0; //reset the counter
		}

		if (countStableSizeIterations >= minStableSizeIterations) {
			break;
		}

		  lastHTMLSize = currentHTMLSize;
		  await page.waitForTimeout(checkDurationMsecs);
	}
};
