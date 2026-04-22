import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { generateQuestion } from "./generator.js";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let rooms = {};

// ================= CONNECTION =================
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ================= CREATE ROOM =================
  socket.on("createRoom", ({ username, studentId }) => {
    const roomId = Math.random().toString(36).substring(2, 7);

    rooms[roomId] = {
      hostId: socket.id, // 🔥 penting
      status: "lobby",   // 🔥 lobby dulu
      players: [{ id: socket.id, username, studentId, score: 0 }],
      level: 1,
      time: 60,
      question: null,
      interval: null
    };

    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      state: rooms[roomId]
    });
  });

  // ================= JOIN ROOM =================
  socket.on("joinRoom", ({ roomId, username, studentId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.push({
      id: socket.id,
      username,
      studentId,
      score: 0
    });

    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      state: room
    });

    io.to(roomId).emit("updateRoom", room);
  });

  // ================= START GAME =================
  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 🔥 hanya host boleh start
    if (socket.id !== room.hostId) return;

    room.status = "playing";
    room.level = 1;

    startLevel(roomId);
  });

  // ================= START LEVEL =================
  socket.on("startLevel", ({ roomId }) => {
  const room = rooms[roomId];
  if (!room) return;

  if (socket.id !== room.hostId) return; // 🔥 penting

  startLevel(roomId);
});

  // ================= ANSWER =================
  socket.on("answer", ({ roomId, answerIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const correct = room.question.answer === answerIndex;

    if (correct) player.score += 1;

    io.to(roomId).emit("updateRoom", room);

    io.to(roomId).emit("answerResult", {
      playerId: socket.id,
      correct
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


// ================= LEVEL SYSTEM =================
function startLevel(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // clear interval lama
  if (room.interval) clearInterval(room.interval);

  room.time = 60;
  room.question = generateQuestion(room.level);

  // kirim ke semua player
  io.to(roomId).emit("levelStart", {
    level: room.level,
    time: room.time,
    question: room.question
  });

  // timer level
  room.interval = setInterval(() => {
    room.time--;

    io.to(roomId).emit("timer", room.time);

    if (room.time <= 0) {
      clearInterval(room.interval);

      room.level++;

      if (room.level > 3) {
        io.to(roomId).emit("gameFinished", room.players);
      } else {
        io.to(roomId).emit("levelFinished", {
          nextLevel: room.level
        });
      }
    }
  }, 1000);
}


// ================= START SERVER =================
server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});