
module.exports.assetAggregation = assetAggregation;

/**
 * 集めた資産の明細をカテゴリごとに集計する。
 *
 * @param details 資産明細
 * @return 分類別集計
 */
function assetAggregation(details) {
	if (details == null || details.length == 0) {
		return null;
	}

	let result = {};
	let total = 0;

	// 分類ごとに集計
	for (let detail of details) {
		if (result[detail.group]) {
			// 新しい分類
			result[detail.group] = detail.amount;

		} else {
			result[detail.group] += detail.amount;
		}

		total += detail.amount;
	}

	// 全体に対する割合を求める
	for (let group of result) {
		let amount = result[group];
		let percentage = Math.floor(amount / total * 1000) / 10;	// 小数第1位を残して切り捨て
		result[group + "(%)"] = percentage;
	}

	result["date"] = details[0]["date"];
	result["total"] = total;

	return result;
}