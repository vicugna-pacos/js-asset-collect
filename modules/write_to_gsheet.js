const config = require("config");
const spreadsheet = require("./spreadsheet.js");

/**
 * 今回集めた残高情報を、既存データとマージしてスプレッドシートへ書き込む
 */
module.exports.mergeDetails = async function(details) {
    if (details.length == 0) {
        return;
    }

    // 明細データの整形
    const detailsFormatted = [];
    for (let i=0; i<details.length; i++) {
        detailsFormatted.push([
            details[i]["date"]
            , details[i]["owner"]
            , details[i]["group"]
            , details[i]["account"]
            , details[i]["name"]
            , details[i]["amount"]
        ]);
    }
    
    // 既存データ取得
    const exists = await spreadsheet.getSheetData(config.spreadsheets.range);

    // 日付が一致するものを入れ替え
    const dt = detailsFormatted[0][0];
    let deletedCount = 0;
    for (let i=exists.length-1; i>=0; i--) {
        if (exists[i][0] == dt) {
            exists.splice(i, 1);
            deletedCount++;
        }
    }

    Array.prototype.push.apply(exists, detailsFormatted);

    if (deletedCount > detailsFormatted.length) {
        // 削除件数が追加された行数より多い場合は、末尾に空白を加える。
        // (既存が減った分空白でセルを上書きする)
        for (let i=(deletedCount-detailsFormatted.length); i>0; i--) {
            exists.push(["","","","","",""]);
        }
    }

    // スプレッドシートへ書き込み
    await spreadsheet.writeData(config.spreadsheets.range, exists);

};
