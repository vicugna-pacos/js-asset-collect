
const fs = require("fs");
const config = require("config");

const HEADER_DETAILS = ["日付", "分類", "口座", "項目名", "金額"];
const COLUMNS_DETAILS = ["date", "group", "account", "name", "amount"];

module.exports.writeToCsv = writeToCsv;

/**
 * 資産明細とまとめをCSVファイルに出力する
 *
 * @param details 残高明細
 * @param total 分類別合計
 */
function writeToCsv(details, total) {

	if (details.length == 0) {
		return;
	}

	const dt = details[0]["date"];

	// ---------- 明細 ----------
	// 明細から既存データ削除
	deleteExistsData(config["destination_detail"], dt);

	// 明細を出力用の配列へ変換しつつ、csvファイルへ出力する
	for (let detail of details) {
		let output = [];
		for (let key of COLUMNS_DETAILS) {
			output.push(detail[key]);
		}

		// csv出力
		write(config["destination_detail"], HEADER_DETAILS, output);
	}

	// ---------- 合計 ----------
	// 既存データ削除
	deleteExistsData(config["destination_total"], dt);

	// 合計を出力用へ変換する
	let output = [dt];
	let header_total = ["日付"];

	for (let key of config.groups) {
		output.push(total[key]);
		header_total.push(key);
	}

	output.push(total["total"]);
	header_total.push("合計");

	for (let key of config.groups) {
		output.push(total[key + "(%)"]);
		header_total.push(key + "(%)");
	}
	write(config["destination_total"], header_total, output);

}


/**
 * データをファイルへ書き込む
 * 
 * @param {string} filename 出力先ファイル名
 * @param {Array} header ヘッダー行
 * @param {Array} source 書き込み内容
 */
function write(filename, header, source) {

	let func = function(err, output) {
		fs.appendFileSync(filename, output);
	};

	if (!fs.existsSync(filename)) {
		// 既存ファイルなしの場合は、ヘッダーを出力する
		fs.appendFileSync(filename, header.join(",") + "\r\n");
	}

	fs.appendFileSync(filename, source.join(",") + "\r\n");
}


/**
 * 既存のファイルがある場合、同日付のデータをファイル内から削除する
 */
function deleteExistsData(filename, dt) {
	if (!fs.existsSync(filename)) {
		return;
	}

	const input_data = fs.readFileSync(filename, {"encoding":"utf8"});
	const lines = input_data.split("\r\n");
	let output_data = "";

	for (let line of lines) {
		if (line == "") {
			continue;
		}
		if (line.startsWith(dt)) {
			continue;
		}
		output_data += line + "\r\n";
	}

	fs.writeFileSync(filename, output_data);

}
