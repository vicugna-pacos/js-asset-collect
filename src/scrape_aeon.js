/**
 * イオン銀行の残高取得
 */
const scrape_utils = require("./scrape_utils.js");

module.exports.scrape = async (page, account) => {
	try {
		// ログインページへ移動
		await page.goto("https://www.aeonbank.co.jp/login/ib_02.html", {"waitUntil":"domcontentloaded"});
		await page.waitFor(1000);

		// ログイン
		await page.type("#cntrId", account.user_id);
		await page.type("#scndPinNmbr", account.password);
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("#btn_lgon")
		]);
		await page.waitFor(1000);

		// 秘密の質問
		await secretQuestion(page, account);

		// パスワード変更を勧める画面をスルー
		if ((await page.$("body#KBC11BN004B")) != null) {
			await Promise.all([
				page.waitForNavigation({"waitUntil":"domcontentloaded"}),
				page.click("#btnNext")
			]);
			await page.waitFor(1000);
		}

		// 残高取得
		let value = await page.evaluate(() => {return document.querySelector("#balnAmount2").textContent});

		if (value == null) {
			console.log("イオン銀行残高取得失敗");
			value = 0;
		}

		// ログアウト
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("#KBA_CLOSE_BTN_SPAN > input[type=button]")
		]);
		await page.waitFor(1000);

		// 確認されるのでもう一度ログアウトを押す
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("#KBC21BN001B001")
		]);
		await page.waitFor(1000);

		// 閉じるボタンを押すとダイアログが出るので、OKを押す処理を入れておく
		page.once("dialog", async (dialog)=>{
			console.log("dialog message : " + dialog.message());
			await dialog.accept();
		});

		// 閉じる
		await Promise.all([
			page.waitForNavigation({"waitUntil":"domcontentloaded"}),
			page.click("#btn_close")
		]);
		await page.waitFor(1000);
		
		return [{"account" : account.name
				, "owner" : account.owner
				, "group" : "現金"
				, "name" : "残高"
				, "amount" : scrape_utils.parsePrice(value)}];

	} catch(err) {
		console.log("イオン銀行残高取得失敗");
		console.log(err);
		return null;
	}

};

/**
 * 秘密の質問を入力する
 * @param {} page 
 * @param {*} account 
 */
async function secretQuestion(page, account) {
	if ((await page.$("body#KBC11BN010B")) == null) {
		return;
	}

	const question = await page.$("#KBC11BN010B > form > div.ContentsArea > div.Subsection > div:nth-child(1) > div > table > tbody > tr:nth-child(1) > td");
	const questionText = await page.evaluate(function(ele){
		return ele.textContent;
	}, question);

	let answerText = "";

	for (let qna of account.qnas) {
		if (questionText == qna.q) {
			answerText = qna.a;
			break;
		}
	}

	if (answerText == "") {
		throw "秘密の質問の答えなし";
	}

	// 答えを入力
	await page.type("#wcwdAskRspo", answerText);

	// 利用端末として登録しない
	await page.click("#actvTmnlMsge2");

	// 次へを押す
	await Promise.all([
		page.waitForNavigation({"waitUntil":"domcontentloaded"}),
		page.click("#butn01")
	]);
	await page.waitFor(1000);
}