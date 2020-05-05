const config = require("config");
const spreadsheet = require("./spreadsheet.js");

let patterns = null;

/**
 * 資産明細のカテゴリを求める
 */
module.exports.setGroup = async function(details) {
	if (patterns == null) {
		patterns = await spreadsheet.getSheetData(config.spreadsheets.patterns_range);
	}

	for (let detail of details) {
		detail.group = null;
		for (let i=1; i<patterns.length; i++) { // 1行目はヘッダーなので飛ばす
			let pattern = patterns[i];
			let reg = new RegExp(pattern[1]);
			if (reg.test(detail.name)) {
				detail.group = pattern[0];
				break;
			}
		}

		if (detail.group == null) {
			detail.group = "不明";
		}
	}
	return details;
};

