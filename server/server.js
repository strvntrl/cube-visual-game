import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

// ================= GOOGLE SHEETS =================
const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : undefined,
  keyFile: process.env.GOOGLE_CREDENTIALS
    ? undefined
    : "./credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1xsDIsqeLdNOz4yjzDUeX0EqONV1vJyZi-DddEPlMAIE";

async function appendToSheet(values) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:DM", 
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    console.log("✅ Data tersimpan ke Sheets");
  } catch (e) {
    console.error("❌ Gagal simpan ke Sheets:", e.message);
  }
}

// ================= CONNECTION =================
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ================= CREATE ROOM =================
  socket.on("createRoom", ({ username, studentId }) => {
    const roomId = Math.random().toString(36).substring(2, 7);

    rooms[roomId] = {
      hostId: socket.id,
      status: "lobby",
      players: [{ id: socket.id, username, studentId, score: 0 }],
      level: 1,
      time: 60,
      question: null,
      interval: null
    };

    socket.join(roomId);
    socket.emit("roomJoined", { roomId, state: rooms[roomId] });
  });

  // ================= JOIN ROOM =================
  socket.on("joinRoom", ({ roomId, username, studentId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.push({ id: socket.id, username, studentId, score: 0 });
    socket.join(roomId);
    socket.emit("roomJoined", { roomId, state: room });
    io.to(roomId).emit("updateRoom", room);
  });

  // ================= START GAME =================
  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;

    room.status = "playing";
    room.level = 1;
    startLevel(roomId);
  });

  // ================= START LEVEL =================
  socket.on("startLevel", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;
    startLevel(roomId);
  });

  // ================= ANSWER (MULTI) =================
  socket.on("answer", ({ roomId, answerIndex, correct }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (correct) player.score += 1;

    io.to(roomId).emit("updateRoom", room);
    io.to(roomId).emit("answerResult", {
      playerId: socket.id,
      correct
    });
  });

  // ================= LOG FINISH — format horizontal =================
  socket.on("logFinish", async ({ username, studentId, mode, score, maxScore, answers }) => {
    // Susun 1 baris: timestamp | nama | student_id | mode | [L1S1 jawaban, L1S1 status, ...] | skor_akhir
    const row = [
      new Date().toLocaleString("id-ID"),
      username,
      studentId,
      mode,
    ];

    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let soal = 1; soal <= 15; soal++) {
        const found = answers.find(a => a.level === lvl && a.soal === soal);
        row.push(found ? found.jawaban : "-");                   
        row.push(found ? (found.benar ? "TRUE" : "FALSE") : "-"); 
      }
    }

    row.push(`${score}/${maxScore}`); 

    await appendToSheet(row);
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ================= LEVEL SYSTEM (MULTI) =================
function startLevel(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.interval) clearInterval(room.interval);

  room.time = 60;

  io.to(roomId).emit("levelStart", {
    level: room.level,
    time: room.time,
  });

  room.interval = setInterval(() => {
    room.time--;
    io.to(roomId).emit("timer", room.time);

    if (room.time <= 0) {
      clearInterval(room.interval);
      room.level++;

      if (room.level > 3) {
        io.to(roomId).emit("gameFinished", room.players);
      } else {
        io.to(roomId).emit("levelFinished", { nextLevel: room.level });
      }
    }
  }, 1000);
}

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});