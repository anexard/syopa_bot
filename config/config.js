module.exports = {
    botToken: process.env.BOT_TOKEN,
    spreadsheetId: process.env.SPREADSHEET_ID,
    google: {
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
}