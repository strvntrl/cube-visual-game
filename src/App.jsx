import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { generateQuestion } from "./logic/generator";
import { isCorrect } from "./logic/validator";
import Cube3D from "./components/Cube3D";
// import QuestionCard from "./components/QuestionCard";
import AnswerOptions from "./components/AnswerOptions";
import HomeScreen from "./components/HomeScreen";

const socket = io("http://localhost:3001");

export default function App() {
  const MAX = 3;

  const [state, setState] = useState("home");
  const [mode, setMode] = useState(null);

  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");

  const [room, setRoom] = useState(null);
  const [question, setQuestion] = useState(null);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [time, setTime] = useState(100);
  const [singleTime, setSingleTime] = useState(100);
  const [result, setResult] = useState(null);
  const [pendingNext, setPendingNext] = useState(null);

  function hasRequiredInfo() {
    return username.trim() !== "" && studentId.trim() !== "";
  }

  // ================= SOCKET =================
  useEffect(() => {
    socket.off();

    socket.on("roomJoined", (data) => {
      setRoomId(data.roomId);
      setRoom({ ...data.state });
      setMode("multi");
      setState("playing");
    });

    socket.on("updateRoom", (room) => setRoom({ ...room }));

    socket.on("nextQuestion", (room) => {
      setRoom({ ...room });
      setResult(null);
    });

    socket.on("timer", (t) => setTime((t / 15) * 100));

    socket.on("answerResult", ({ playerId, correct }) => {
      if (socket.id === playerId) {
        setResult(correct ? "Benar 💖" : "Salah 😢");
      }
    });

    socket.on("gameFinished", (players) => {
      setRoom(prev => ({ ...prev, players }));
      setState("finished");
    });

  }, []);

  // ================= RESULT ANIMATION =================
  useEffect(() => {
    if (result && mode === "single" && pendingNext !== null) {
      const t = setTimeout(() => {
        nextSingle(pendingNext);
        setPendingNext(null);
        setResult(null);
      }, 900);
      return () => clearTimeout(t);
    }

    if (result && mode === "multi") {
      const t = setTimeout(() => setResult(null), 900);
      return () => clearTimeout(t);
    }
  }, [result]);

  // ================= SINGLE TIMER =================
  useEffect(() => {
    if (mode === "single" && state === "playing" && singleTime > 0) {
      const timer = setTimeout(() => setSingleTime(t => Math.max(0, t - 1)), 150);
      return () => clearTimeout(timer);
    } else if (mode === "single" && singleTime <= 0 && !result) {
      setResult("Waktu Habis 😢");
      setPendingNext(false);
    }
  }, [singleTime, mode, state, result]);

  // ================= SINGLE =================
  function startSingle() {
    if (!hasRequiredInfo()) return alert("Isi data dulu!");

    setMode("single");
    setState("playing");
    setIndex(0);
    setScore(0);
    setSingleTime(100);
    setQuestion(generateQuestion());
  }

  function nextSingle(correct) {
    if (correct) setScore(s => s + 1);

    if (index + 1 < MAX) {
      setIndex(i => i + 1);
      setQuestion(generateQuestion());
      setSingleTime(100);
    } else {
      setState("finished");
    }
  }

  function answerSingle(i) {
    const correct = isCorrect(question, i);
    setResult(correct ? "Benar 💖" : "Salah 😢");
    setPendingNext(correct);
  }

  // ================= MULTI =================
  function createRoom() {
    if (!hasRequiredInfo()) return alert("Isi data dulu!");
    socket.emit("createRoom", { username, studentId });
  }

  function joinRoom() {
    if (!hasRequiredInfo() || !roomId) return alert("Lengkapi data!");
    socket.emit("joinRoom", { roomId, username, studentId });
  }

  function answerMulti(i) {
    socket.emit("answer", { roomId, answerIndex: i });
  }

  // ================= COMPONENT STYLE =================
  const card = "w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl flex flex-col gap-4 animate-fade";

  const input = "w-full p-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300";

  const btnPrimary = "bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-xl transition";
  const btnSecondary = "bg-purple-400 hover:bg-purple-500 text-white py-2 rounded-xl transition";
  const btnBack = "text-sm text-gray-500 mt-2";

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200">

      {/* HOME */}
      {state === "home" && (
        <HomeScreen onStart={() => setState("menu")} />
      )}

      {/* MENU */}
      {state === "menu" && (
        <div className={`${card} animate-fade`}>
          <h1 className="text-3xl font-bold text-center text-pink-600 mb-4">Cube Visual Game</h1>

          <button onClick={() => setState("single-form")} className={btnPrimary}>
            Single Player 🎮
          </button>

          <button onClick={() => setState("multiplayer")} className={btnSecondary}>
            Multiplayer 👥
          </button>

          <button onClick={() => setState("home")} className={btnBack}>← Back</button>
        </div>
      )}

      {/* FORM */}
      {(state === "single-form" || state === "multiplayer") && (
        <div className={card}>
          <h2 className="text-xl font-semibold text-center text-purple-600">
            {state === "single-form" ? "Single Player" : "Multiplayer"}
          </h2>

          <input placeholder="Nama" className={input}
            value={username} onChange={(e) => setUsername(e.target.value)} />

          <input placeholder="Student ID" className={input}
            value={studentId} onChange={(e) => setStudentId(e.target.value)} />

          {state === "multiplayer" && (
            <input placeholder="Room ID" className={input}
              value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          )}

          {state === "single-form" ? (
            <button onClick={startSingle} className={btnPrimary}>Start Game</button>
          ) : (
            <>
              <button onClick={createRoom} className={btnPrimary}>Create Room</button>
              <button onClick={joinRoom} className={btnSecondary}>Join Room</button>
            </>
          )}

          <button onClick={() => setState("menu")} className={btnBack}>← Back</button>
        </div>
      )}

      {/* GAME */}
      {state === "playing" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-2 sm:px-0 animate-fade">

          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 transition-all duration-500"
              style={{ width: `${mode === "multi" ? time : singleTime}%` }} />
          </div>

          <p className="text-sm text-gray-600">{username} ({studentId})</p>

          {mode === "single" && question && (
            <>
              <h2 className="font-semibold">Score: {score}</h2>
              <Cube3D cube={question.cube} />
              {/* <QuestionCard cube={question.cube} /> */}
              <AnswerOptions options={question.options} questionIndex={index} onSelect={answerSingle} />
            </>
          )}

          {mode === "multi" && room && room.question && (
            <>
              <h2 className="font-semibold">Room: {roomId}</h2>

              <div className="bg-white/60 rounded-xl p-3 w-full text-sm space-y-2">
                {room.players.map(p => (
                  <div key={p.id} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center bg-white/80 rounded-xl p-3">
                    <span className="text-sm font-medium text-gray-700">{p.username} ({p.studentId})</span>
                    <span className="text-sm font-semibold text-pink-600">{p.score}</span>
                  </div>
                ))}
              </div>

              <Cube3D cube={room.question.cube} />
              {/* <QuestionCard cube={room.question.cube} /> */}
              <AnswerOptions options={room.question.options} questionIndex={room.index ?? 0} onSelect={answerMulti} />
            </>
          )}
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-xl font-bold animate-pop">
            {result}
          </div>
        </div>
      )}

      {/* FINISH */}
      {state === "finished" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => {
          setState("menu");
          setScore(0);
          setIndex(0);
          setRoom(null);
          setMode(null);
          setUsername("");
          setStudentId("");
          setRoomId("");
        }}>
          <div className={card} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-center">🎉 Finished</h2>

            {mode === "single" && (
              <p className="text-center">{score}/{MAX}</p>
            )}

            {mode === "multi" && room && (
              <div>
                {room.players.map(p => (
                  <div key={p.id} className="flex justify-between">
                    <span>{p.username} ({p.studentId})</span>
                    <span>{p.score}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => {
              setState("menu");
              setScore(0);
              setIndex(0);
              setRoom(null);
              setMode(null);
              setUsername("");
              setStudentId("");
              setRoomId("");
            }} className={btnPrimary}>
              Back to Menu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}