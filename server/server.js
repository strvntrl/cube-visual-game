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

const QUESTION_TIME = 15;

let rooms = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ================= CREATE ROOM =================
  socket.on("createRoom", ({ username, studentId }) => {
    console.log("🔥 CREATE ROOM FROM:", username);

    const roomId = Math.random().toString(36).substring(2, 7);

    const room = {
      players: [{ id: socket.id, username, studentId, score: 0 }],
      question: generateQuestion(),
      index: 0,
      time: QUESTION_TIME
    };

    rooms[roomId] = room;

    socket.join(roomId);

    socket.emit("roomJoined", {
      roomId,
      state: room
    });
  });

  // ================= JOIN ROOM =================
  socket.on("joinRoom", ({ roomId, username, studentId }) => {
    console.log("🔥 JOIN ROOM:", roomId, username);

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


// ================= TIMER =================
setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    if (!room || room.finished) return;

    room.time--;

    if (room.time <= 0) {
      room.index++;

      if (room.index >= 3) {
        room.finished = true;
        io.to(roomId).emit("gameFinished", room.players);
      } else {
        room.question = generateQuestion();
        room.time = QUESTION_TIME;

        io.to(roomId).emit("nextQuestion", room);
      }
    }

    io.to(roomId).emit("timer", room.time);
  });
}, 1000);

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});