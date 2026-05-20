import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();

app.use(cors());
app.use(express.json());

// ================= GOOGLE SHEETS =================
const auth = new google.auth.GoogleAuth({
  keyFile: "./server/credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1xsDIsqeLdNOz4yjzDUeX0EqONV1vJyZi-DddEPlMAIE";

async function appendToSheet(values) {
  try {
    const client = await auth.getClient();

    const sheets = google.sheets({
      version: "v4",
      auth: client,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:DM",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    console.log("✅ Data tersimpan");
  } catch (err) {
    console.error(err);
  }
}

// ================= API =================
app.post("/logFinish", async (req, res) => {
  try {
    const {
      username,
      studentId,
      score,
      maxScore,
      answers,
      durasi,
    } = req.body;

    const row = [
      new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
      username,
      studentId,
      durasi ?? "-",
    ];

    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let soal = 1; soal <= 15; soal++) {
        const found = answers.find(
          a => a.level === lvl && a.soal === soal
        );

        row.push(found ? found.jawaban : "-");
        row.push(found ? (found.benar ? "TRUE" : "FALSE") : "-");
      }
    }

    row.push(`${score}/${maxScore}`);

    await appendToSheet(row);

    res.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
});

// ================= START =================
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});