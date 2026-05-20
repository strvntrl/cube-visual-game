import { google } from "googleapis";

export default async function handler(req, res) {
  // allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, studentId, score, maxScore, answers, durasi } = req.body;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const row = [
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      username,
      studentId,
      durasi ?? "-",
    ];

    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let soal = 1; soal <= 15; soal++) {
        const found = answers.find(a => a.level === lvl && a.soal === soal);
        row.push(found ? found.jawaban : "-");
        row.push(found ? (found.benar ? "TRUE" : "FALSE") : "-");
      }
    }
    row.push(`${score}/${maxScore}`);

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: "1xsDIsqeLdNOz4yjzDUeX0EqONV1vJyZi-DddEPlMAIE",
      range: "Sheet1!A:DM",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    console.log("✅ Data tersimpan ke Sheets");
    res.status(200).json({ success: true });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}