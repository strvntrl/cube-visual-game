import { useState, useEffect, useRef } from "react"; 
import { io } from "socket.io-client";
import { questions } from "./data/questions";
import AnswerOptions from "./components/AnswerOptions";
import HomeScreen from "./components/HomeScreen";
 
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(SERVER_URL);
 
export default function App() {
  const MAX_SCORE = 45;
  const TIME_PER_SOAL = 60; // ← 60 detik per soal
 
  const [state, setState] = useState("home");
  const [mode, setMode] = useState(null);
 
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");
 
  const [room, setRoom] = useState(null);
  const roomRef = useRef(null);
  const [question, setQuestion] = useState(null);
 
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const answersRef = useRef([]);
 
  const [result, setResult] = useState(null);
  const [pendingNext, setPendingNext] = useState(null);
 
  // single
  const [level, setLevel] = useState(1);
  const [questionCount, setQuestionCount] = useState(0);
  const [levelTime, setLevelTime] = useState(TIME_PER_SOAL);
 
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const [nextLevel, setNextLevel] = useState(null);
 
  // multi
  const [multiLevel, setMultiLevel] = useState(1);
  const multiLevelRef = useRef(1);
  const [multiQuestionCount, setMultiQuestionCount] = useState(0);
  const multiQuestionCountRef = useRef(0);
  const [multiSoalTime, setMultiSoalTime] = useState(TIME_PER_SOAL); // ← timer per soal
  const multiSoalTimerRef = useRef(null); // ← ref untuk interval timer soal
  const [showMultiLevelPopup, setShowMultiLevelPopup] = useState(false);
  const [multiNextLevel, setMultiNextLevel] = useState(null);

  const [isHost, setIsHost] = useState(false);

  const usernameRef = useRef("");
  const studentIdRef = useRef("");
  const modeRef = useRef(null);

  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { studentIdRef.current = studentId; }, [studentId]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { roomRef.current = room; }, [room]);
 
  function hasRequiredInfo() {
    return username.trim() !== "" && studentId.trim() !== "";
  }
 
  function getQuestion(lvl, count) {
    const pool = questions.filter(q => q.level === lvl);
    return pool[count % pool.length];
  }

  // ================= MULTI SOAL TIMER =================
  function startMultiSoalTimer() {
    // clear timer lama
    if (multiSoalTimerRef.current) clearInterval(multiSoalTimerRef.current);

    setMultiSoalTime(TIME_PER_SOAL);

    multiSoalTimerRef.current = setInterval(() => {
      setMultiSoalTime(t => {
        if (t <= 1) {
          // waktu habis — skip soal ini (tidak jawab)
          clearInterval(multiSoalTimerRef.current);
          handleMultiNextSoal(false, true); // skip = true
          return TIME_PER_SOAL;
        }
        return t - 1;
      });
    }, 1000);
  }

  function stopMultiSoalTimer() {
    if (multiSoalTimerRef.current) clearInterval(multiSoalTimerRef.current);
  }

  // ================= MULTI: logika ganti soal =================
  function handleMultiNextSoal(correct, skipped = false) {
    const currentCount = multiQuestionCountRef.current;
    const currentLevel = multiLevelRef.current;
    const next = currentCount + 1;

    if (next < 15) {
      // lanjut soal berikutnya di level ini
      multiQuestionCountRef.current = next;
      setMultiQuestionCount(next);
      const nextQ = getQuestion(currentLevel, next);
      setRoom(prev => {
        const updated = { ...prev, question: nextQ };
        roomRef.current = updated;
        return updated;
      });
      startMultiSoalTimer(); // ← reset timer soal
    } else {
      // selesai 15 soal di level ini
      stopMultiSoalTimer();
      multiQuestionCountRef.current = 0;
      setMultiQuestionCount(0);

      if (currentLevel < 3) {
        // tampilkan popup level berikutnya
        const nl = currentLevel + 1;
        setMultiNextLevel(nl);
        setShowMultiLevelPopup(true);
        setState("paused");
      } else {
        // selesai semua level
        socket.emit("playerFinished", { roomId });
        setState("waiting"); // tunggu pemain lain
      }
    }
  }
 
  // ================= SOCKET =================
  useEffect(() => {
    socket.off();
 
    socket.on("roomJoined", (data) => {
      setRoomId(data.roomId);
      setRoom({ ...data.state });
      roomRef.current = { ...data.state };
      setIsHost(socket.id === data.state.hostId);
      setMode("multi");
      modeRef.current = "multi";
      setState("lobby");
    });
 
    socket.on("updateRoom", (updatedRoom) => {
      setRoom(prev => {
        const updated = { ...prev, players: updatedRoom.players };
        roomRef.current = updated;
        return updated;
      });
    });

    // server bilang semua pemain selesai
    socket.on("gameFinished", (players) => {
      stopMultiSoalTimer();
      setRoom(prev => {
        const updated = { ...prev, players };
        roomRef.current = updated;
        return updated;
      });
      setState("finished");
    });

    // server suruh mulai (dari host)
    socket.on("startSignal", () => {
      // mulai level 1
      answersRef.current = [];
      multiLevelRef.current = 1;
      setMultiLevel(1);
      multiQuestionCountRef.current = 0;
      setMultiQuestionCount(0);
      const firstQ = getQuestion(1, 0);
      setRoom(prev => {
        const updated = { ...prev, question: firstQ };
        roomRef.current = updated;
        return updated;
      });
      setShowMultiLevelPopup(false);
      setState("playing");
      startMultiSoalTimer();
    });
 
  }, []);
 
  // ================= TIMER SINGLE (per soal) =================
  useEffect(() => {
    if (state !== "playing" || mode !== "single") return;
 
    setLevelTime(TIME_PER_SOAL);
    const timer = setInterval(() => {
      setLevelTime(t => t - 1);
    }, 1000);
 
    return () => clearInterval(timer);
  }, [state, mode, level, questionCount]); // ← reset saat soal berganti
 
  useEffect(() => {
    if (result && mode === "single" && pendingNext !== null) {
      const t = setTimeout(() => {
        nextSingle(pendingNext);
        setPendingNext(null);
        setResult(null);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [result]);
 
  // ================= SINGLE TIMER SOAL HABIS =================
  useEffect(() => {
    if (levelTime !== 0) return;
    if (mode !== "single") return;

    // skip soal — tidak jawab
    answersRef.current.push({
      level,
      soal: questionCount + 1,
      jawaban: "-",
      benar: false,
    });

    setResult("Waktu Habis ⏱️");
    setTimeout(() => {
      setResult(null);
      nextSingle(false); // skip, tidak benar
    }, 900);

  }, [levelTime]);
 
  // ================= LOG FINISH =================
  useEffect(() => {
    if (state !== "finished") return;

    const currentMode = modeRef.current;
    const currentRoom = roomRef.current;

    if (currentMode === "single") {
      socket.emit("logFinish", {
        username: usernameRef.current,
        studentId: studentIdRef.current,
        mode: "single",
        score: scoreRef.current,
        maxScore: MAX_SCORE,
        answers: answersRef.current,
      });
    }

    if (currentMode === "multi") {
      const myScore = currentRoom?.players?.find(
        p => p.username === usernameRef.current && p.studentId === studentIdRef.current
      )?.score ?? 0;

      socket.emit("logFinish", {
        username: usernameRef.current,
        studentId: studentIdRef.current,
        mode: "multi",
        score: myScore,
        maxScore: MAX_SCORE,
        answers: answersRef.current,
      });
    }
  }, [state]);
 
  function startLevel(lvl) {
    setLevel(lvl);
    setQuestionCount(0);
    setQuestion(getQuestion(lvl, 0));
    setState("playing");
    setShowLevelPopup(false);
  }
 
  // ================= SINGLE =================
  function startSingle() {
    if (!hasRequiredInfo()) return alert("Isi data dulu!");
    scoreRef.current = 0;
    answersRef.current = [];
    setMode("single");
    modeRef.current = "single";
    setLevel(1);
    setQuestionCount(0);
    setScore(0);
    setNextLevel(1);
    setShowLevelPopup(true);
    setState("paused");
  }
 
  function answerSingle(i) {
    const correct = question.options[i].isCorrect;
    answersRef.current.push({
      level,
      soal: questionCount + 1,
      jawaban: question.options[i].id,
      benar: correct,
    });
    setResult(correct ? "Benar 💖" : "Salah 😢");
    setPendingNext(correct);
  }
 
  function nextSingle(correct) {
    if (correct) {
      setScore(s => {
        const next = s + 1;
        scoreRef.current = next;
        return next;
      });
    }
 
    if (questionCount + 1 < 15) {
      const next = questionCount + 1;
      setQuestionCount(next);
      setQuestion(getQuestion(level, next));
    } else {
      if (level < 3) {
        setNextLevel(level + 1);
        setShowLevelPopup(true);
        setState("paused");
      } else {
        setState("finished");
      }
    }
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
    if (multiQuestionCountRef.current >= 15) return;
    if (state !== "playing") return;

    const correct = room.question.options[i].isCorrect;
    socket.emit("answer", { roomId, answerIndex: i, correct });

    answersRef.current.push({
      level: multiLevelRef.current,
      soal: multiQuestionCountRef.current + 1,
      jawaban: room.question.options[i].id,
      benar: correct,
    });

    if (correct) {
      setScore(s => {
        const next = s + 1;
        scoreRef.current = next;
        return next;
      });
    }

    stopMultiSoalTimer();
    setResult(correct ? "Benar 💖" : "Salah 😢");

    setTimeout(() => {
      setResult(null);
      handleMultiNextSoal(correct);
    }, 900);
  }

  function startMultiLevel(lvl) {
    multiLevelRef.current = lvl;
    setMultiLevel(lvl);
    multiQuestionCountRef.current = 0;
    setMultiQuestionCount(0);
    const firstQ = getQuestion(lvl, 0);
    setRoom(prev => {
      const updated = { ...prev, question: firstQ };
      roomRef.current = updated;
      return updated;
    });
    setShowMultiLevelPopup(false);
    setState("playing");
    startMultiSoalTimer();
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
              style={{
                width: `${mode === "single"
                  ? (levelTime / TIME_PER_SOAL) * 100
                  : (multiSoalTime / TIME_PER_SOAL) * 100
                }%`
              }} />
          </div>

          <div className="text-center">
            <p className="font-bold text-pink-600">
              Level {mode === "single" ? level : multiLevel}
            </p>
            <p className="text-sm text-gray-500">
              Soal {(mode === "single" ? questionCount : multiQuestionCount) + 1} / 15
            </p>
            <p className="text-sm text-gray-500">
              Time: {mode === "single" ? levelTime : multiSoalTime}s
            </p>
          </div>

          <p className="text-sm text-gray-600">{username} ({studentId})</p>

          {mode === "single" && question && (
            <>
              <h2 className="font-semibold">Score: {score}</h2>
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <img src={question.cubeImage} alt="Soal" className="w-64 h-64 object-contain" />
              </div>
              <AnswerOptions options={question.options} questionIndex={questionCount} onSelect={answerSingle} />
            </>
          )}

          {mode === "multi" && room && room.question && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <img src={room.question.cubeImage} alt="Soal" className="w-64 h-64 object-contain" />
              </div>
              <AnswerOptions options={room.question.options} questionIndex={multiQuestionCount} onSelect={answerMulti} />
            </>
          )}
        </div>
      )}

      {/* WAITING — selesai duluan, tunggu pemain lain */}
      {state === "waiting" && (
        <div className={card}>
          <h2 className="text-xl font-bold text-center text-pink-600">🎉 Kamu Selesai!</h2>
          <p className="text-center text-gray-500">Menunggu pemain lain selesai...</p>
          <p className="text-center font-semibold">Score: {score}/{MAX_SCORE}</p>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setState("menu");
            setScore(0);
            scoreRef.current = 0;
            answersRef.current = [];
            setRoom(null);
            roomRef.current = null;
            setMode(null);
            modeRef.current = null;
            setUsername("");
            setStudentId("");
            setRoomId("");
            stopMultiSoalTimer();
          }}>
          <div className={card} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-center">🎉 Game Selesai!</h2>
            {mode === "single" && <p className="text-center">{score}/{MAX_SCORE}</p>}
            {mode === "multi" && room && (
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div key={p.id} className="flex justify-between bg-white/80 p-3 rounded-xl">
                      <span>{i + 1}. {p.username} ({p.studentId})</span>
                      <span className="font-semibold text-pink-600">{p.score}/{MAX_SCORE}</span>
                    </div>
                  ))}
              </div>
            )}
            <button onClick={() => {
              setState("menu");
              setScore(0);
              scoreRef.current = 0;
              answersRef.current = [];
              setRoom(null);
              roomRef.current = null;
              setMode(null);
              modeRef.current = null;
              setUsername("");
              setStudentId("");
              setRoomId("");
              stopMultiSoalTimer();
            }} className={btnPrimary}>
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* LEVEL POPUP SINGLE */}
      {showLevelPopup && mode === "single" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-pop max-w-sm w-full">
            <h2 className="text-2xl font-bold text-pink-600 mb-3">
              {nextLevel === 1 ? "Siap Memulai Game?" : `Level ${nextLevel}`}
            </h2>
            <p className="text-gray-600 mb-6">
              {nextLevel === 1 ? "Game akan dimulai. Fokus ya!" : "Siap lanjut ke level berikutnya?"}
            </p>
            <button onClick={() => startLevel(nextLevel)} className={btnPrimary}>
              {nextLevel === 1 ? "Mulai 🚀" : "Lanjut ➡️"}
            </button>
          </div>
        </div>
      )}

      {/* LEVEL POPUP MULTI — muncul saat player selesai level */}
      {showMultiLevelPopup && mode === "multi" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-pop max-w-sm w-full">
            <h2 className="text-2xl font-bold text-pink-600 mb-3">Level {multiNextLevel}</h2>
            <p className="text-gray-600 mb-2">Kamu selesai level {multiNextLevel - 1}!</p>
            <p className="text-gray-600 mb-6">Siap lanjut ke level berikutnya?</p>
            <button onClick={() => startMultiLevel(multiNextLevel)} className={btnPrimary}>
              Lanjut ➡️
            </button>
          </div>
        </div>
      )}

      {/* LOBBY */}
      {state === "lobby" && room && (
        <div className={card}>
          <h2 className="text-xl font-bold text-center text-pink-600">Room: {roomId}</h2>
          <p className="text-center text-sm text-gray-500 mb-2">Menunggu pemain...</p>
          <div className="space-y-2">
            {room.players.map(p => (
              <div key={p.id} className="flex justify-between bg-white/80 p-3 rounded-xl">
                <span>{p.username} ({p.studentId})</span>
                {p.id === room.hostId && <span className="text-xs text-pink-500">HOST</span>}
              </div>
            ))}
          </div>
          {isHost && (
            <button
              disabled={room.players.length < 2}
              onClick={() => socket.emit("startGame", { roomId })}
              className="bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-xl mt-4 disabled:opacity-50"
            >
              Start Game 🚀
            </button>
          )}
          <button onClick={() => setState("menu")} className={btnBack}>← Back</button>
        </div>
      )}

    </div>
  );
}