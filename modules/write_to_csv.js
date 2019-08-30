
const fs = require('fs');
const readline = require('readline');

const FILENAME_ITEMS = 'output/資産一覧.csv';
const FILENAME_ASSETS = 'output/資産まとめ.csv';
const HEADER_ITEMS = ['日付', '項目', '金額'];
const HEADER_ASSETS = ['日付', '現金', '国内株式', '投資信託(国内)', '投資信託(海外)', 'iDeco', '合計'];

module.exports.writeToCsv = writeToCsv;

/**
 * 資産明細とまとめをCSVファイルに出力する
 *
 * @param items プロパティ：日付、項目、金額
 * @param asset プロパティ：日付、カテゴリごとの金額
 */
function writeToCsv(items, asset) {

	if (items.length == 0) {
		return;
	}

	const dt = items[0]['日付'];

	write(FILENAME_ITEMS, HEADER_ITEMS, items, dt);
	write(FILENAME_ASSETS, HEADER_ASSETS, asset, dt);

}

/**
 * データをファイルへ書き込む
 */
function write(filename, header, source, dt) {

	if (fs.existsSync(filename)) {
		// 既存ファイルありの場合は、同日付のデータを削除する
		checkExistsFile(filename, dt);

	} else {
		// 既存ファイルなしの場合は、ヘッダーを出力する
		let header_str = '';
		for (let str of header) {
			if (header_str != '') {
				header_str += ',';
			}
			header_str += str;
		}
		header_str += '\r\n';

		fs.appendFileSync(filename, header_str);

	}

	let data = '';

	// データをcsv形式へ変換
	if (Array.isArray(source)) {
		// 配列の場合
		for (let row of source) {
			for (let i = 0; i < header.length; i++) {
				if (i > 0) {
					data += ',';
				}
				data += row[header[i]];
			}
			data += '\r\n';
		}

	} else {
		for (let i = 0; i < header.length; i++) {
			if (i > 0) {
				data += ',';
			}
			data += source[header[i]];
		}
		data += '\r\n';

	}

	// ファイルに書き込む
	fs.appendFileSync(filename, data);

}


/**
 * 既存のファイルがある場合、同日付のデータをファイル内から削除する
 */
function checkExistsFile(filename, dt) {

	const input_data = fs.readFileSync(filename, {'encoding':'utf8'});
	const lines = input_data.split('\r\n');
	let output_data = '';

	for (let line of lines) {
		if (line == '') {
			continue;
		}
		if (line.startsWith(dt)) {
			continue;
		}
		output_data += line + '\r\n';
	}

	fs.writeFileSync(filename, output_data);

}
