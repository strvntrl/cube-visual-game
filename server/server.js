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
let auth;
try {
  auth = new google.auth.GoogleAuth({
    credentials: process.env.GOOGLE_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
      : undefined,
    keyFile: process.env.GOOGLE_CREDENTIALS
      ? undefined
      : "./server/credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  console.log("✅ Google Auth berhasil");
} catch (e) {
  console.error("❌ Google Auth gagal:", e.message);
}

const SPREADSHEET_ID = "1xsDIsqeLdNOz4yjzDUeX0EqONV1vJyZi-DddEPlMAIE";

async function appendToSheet(values) {
  if (!auth) {
    console.error("❌ Auth tidak tersedia");
    return;
  }
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

function safeRoomData(room) {
  return {
    hostId: room.hostId,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      username: p.username,
      studentId: p.studentId,
      score: p.score,
    })),
  };
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
      players: [{ id: socket.id, username, studentId, score: 0, finished: false }],
    };

    socket.join(roomId);
    socket.emit("roomJoined", { roomId, state: safeRoomData(rooms[roomId]) });
  });

  // ================= JOIN ROOM =================
  socket.on("joinRoom", ({ roomId, username, studentId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit("error", "Room tidak ditemukan");

    room.players.push({ id: socket.id, username, studentId, score: 0, finished: false });
    socket.join(roomId);
    socket.emit("roomJoined", { roomId, state: safeRoomData(room) });
    io.to(roomId).emit("updateRoom", safeRoomData(room));
  });

  // ================= START GAME =================
  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || socket.id !== room.hostId) return;

    room.status = "playing";
    room.players.forEach(p => { p.score = 0; p.finished = false; });

    io.to(roomId).emit("startSignal");
  });

  // ================= ANSWER — catat skor =================
  socket.on("answer", ({ roomId, answerIndex, correct }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    if (correct) player.score += 1;
  });

  // ================= PLAYER FINISHED — pemain selesai semua soal =================
  socket.on("playerFinished", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) player.finished = true;

    console.log(`✅ ${player?.username} selesai. Total selesai: ${room.players.filter(p => p.finished).length}/${room.players.length}`);

    if (room.players.every(p => p.finished)) {
      console.log("🎉 Semua pemain selesai!");
      io.to(roomId).emit("gameFinished", room.players.map(p => ({
        id: p.id,
        username: p.username,
        studentId: p.studentId,
        score: p.score,
      })));
    }
  });

  // ================= LOG FINISH =================
  socket.on("logFinish", async ({ username, studentId, mode, score, maxScore, answers }) => {
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

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit("updateRoom", safeRoomData(room));
          if (room.status === "playing" && room.players.every(p => p.finished)) {
            io.to(roomId).emit("gameFinished", room.players.map(p => ({
              id: p.id, username: p.username, studentId: p.studentId, score: p.score,
            })));
          }
        }
        break;
      }
    }
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});