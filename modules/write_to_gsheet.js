const {google} = require("googleapis");
const config = require("config");

let oAuth2Client = null;    // API実行に必要な認証情報

/**
 * モジュール初期化。
 * token.jsonがあればそれを読込み、無ければユーザーに認証を求める。
 */
module.exports.init = async function() {
    // 認証
    let credentialContent = fs.readFileSync(CREDENTIALS_PATH);
    let credentials = JSON.parse(credentialContent);
    oAuth2Client = new google.auth.OAuth2(
        credentials.installed.client_id
        , credentials.installed.client_secret
        , credentials.installed.redirect_uris[0]);

    if (!fs.existsSync(TOKEN_PATH)) {
        await getNewToken();
    }

    let tokenContent = fs.readFileSync(TOKEN_PATH);
    let token = JSON.parse(tokenContent);

    oAuth2Client.setCredentials(token);

};

/**
 * 今回集めた残高情報を、既存データとマージしてスプレッドシートへ書き込む
 */
module.exports.mergeDetails = async function(details) {
    if (details.length == 0) {
        return;
    }
    
    // 既存データ取得
    const exists = await getSheetData(config.spreadsheets.range);

    // 日付が一致するものを入れ替え
    const dt = details[0]["date"];

    for (let i=exists.length-1; i>=0; i--) {
        exists.splice(i, 1);
    }

    for (let i=0; i<details.length; i++) {
        exists.push(details[i]);
    }

    // スプレッドシートへ書き込み
    await writeData(config.spreadsheets.range, exists);

};

/**
 * 新しいトークンを取得する
 */
async function getNewToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES});

    console.log("このURLへアクセスしてアプリを承認してください：", authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(function(resolve, reject) {
        rl.question("承認後に表示されたコードを入力してください：", async (code) => {
            rl.close();
            let {tokens} = await oAuth2Client.getToken(code);
            // tokenを保存する
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            console.log("トークンを以下のファイルへ保存しました。", TOKEN_PATH);
        });

    });
}

/**
 * データ取得
 */
async function getSheetData(range) {
    const sheets = google.sheets({version: "v4"});
    const param = {
        spreadsheetId: config.spreadsheets.sheetId,
        range: range,
        auth : oAuth2Client
    };

    let response = await sheets.spreadsheets.values.get(param);
    return response.data.values;
}

/**
 * データ書き込み
 * @param {string} range 
 * @param {*} values 
 */
async function writeData(range, values){
    const sheets = google.sheets({version: "v4"});
    const param = {
        spreadsheetId: config.spreadsheets.sheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        auth : oAuth2Client,
        resource : {
            values : values
        }
    };

    await sheets.spreadsheets.values.update(param);
}