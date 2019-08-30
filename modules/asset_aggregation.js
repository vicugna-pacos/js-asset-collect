
const CATEGORIES = ['現金', '国内株式', '投資信託(国内)', '投資信託(海外)', 'iDeco'];

module.exports.assetAggregation = assetAggregation;

/**
 * 集めた資産の明細をカテゴリごとに集計する。
 *
 * @param items プロパティ：日付、項目、金額
 * @return プロパティ：日付、カテゴリ名
 */
function assetAggregation(items) {
	if (items == null || items.length == 0) {
		return null;
	}

	let result = {};
	let total = 0;

	result['日付'] = items[0]['日付'];

	for (let category of CATEGORIES) {
		let value = 0;
		for (let item of items) {
			if (item['項目'].startsWith(`[${category}]`)) {
				value += item['金額'];
			}
		}
		result[category] = value;
		total += value;
	}

	result['合計'] = total;

	return result;
}