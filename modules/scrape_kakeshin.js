/**
 * 掛川信用金庫 WEBバンキングで残高取得
 */

const puppeteer = require("puppeteer");
const scrape_utils = require("./scrape_utils.js");

const navOption = {"waitUntil":"load"};

module.exports.scrape = async (page, account) => {
	process.on("unhandledRejection", console.dir);
	try {
		await page.goto("https://www11.ib.shinkin-ib.jp/webbk/login/b-prelogin.do?bankcode=MTUxMw==", navOption);
		// 上記URLからリダイレクトが発生するので、数秒待つ。
		await page.waitFor(5000);

		// ラポートのインストールを促すダイアログを消す
		await page.evaluate(() => {
			let close = document.querySelector("#splash-78561-close-button");
			if (close != null) {
				close.click();
			}
		});

		// ユーザーIDとパスワードを入力してログイン
		await page.evaluate((account) => {
			document.querySelector("input[name=userId]").value = account.user_id;
			document.querySelector("input[name=loginPwd]").value = account.password;

			document.querySelector("input[type=submit][value=ログイン]").click();
		}, account);

		await page.waitFor(3000);

		// 残高を表示ボタンを押す
		await page.evaluate(() => {
			let button = document.querySelector("input[value=残高を表示]");
			button.click();
		});

		await page.waitFor(3000);

		// 残高取得
		let value = await page.evaluate(() => {
			let container = document.querySelector("span.fsB4XL.balance");
			if (container == null) {
				return null;
			}
			return container.innerText;
		});

		// ログアウトしないと、次回スムーズにログインできない
		await page.evaluate(() => {
			let links = document.querySelectorAll("a");
			let target = null;

			for (let link of links) {
				if (link.innerText.includes("ログアウト")) {
					target = link;
					break;
				}
			}

			if (target == null) {
				console.log("ログアウトボタンが見つからない");
				return;
			}

			target.click();
		});
		await page.waitFor(3000);

		if (value == null) {
			console.log("掛信残高取得失敗");
			value = 0;
		}
		return [{"account" : account.name
		, "owner" : account.owner
		, "name" : "残高" 
		, "group" : "現金"
		, "amount" : scrape_utils.parsePrice(value)}];

	} catch (err) {
		console.log("掛信残高取得失敗");
		console.log(err);
		return null;
	}
};


