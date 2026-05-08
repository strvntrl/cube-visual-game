import { useState, useEffect, useRef } from "react"; 
import { io } from "socket.io-client";
import { questions } from "./data/questions";
import AnswerOptions from "./components/AnswerOptions";
import HomeScreen from "./components/HomeScreen";
 
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(SERVER_URL);
 
export default function App() {
  const MAX_SCORE = 45;
  const TIME_PER_SOAL = 60;
 
  const [state, setState] = useState("home");

  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");

  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const answersRef = useRef([]);
 
  const [result, setResult] = useState(null);
  const [pendingNext, setPendingNext] = useState(null);
 
  const [level, setLevel] = useState(1);
  const [questionCount, setQuestionCount] = useState(0);
  const [levelTime, setLevelTime] = useState(TIME_PER_SOAL);
 
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const [nextLevel, setNextLevel] = useState(null);

  const usernameRef = useRef("");
  const studentIdRef = useRef("");

  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { studentIdRef.current = studentId; }, [studentId]);
 
  function hasRequiredInfo() {
    return username.trim() !== "" && studentId.trim() !== "";
  }
 
  function getQuestion(lvl, count) {
    const pool = questions.filter(q => q.level === lvl);
    return pool[count % pool.length];
  }
 
  // ================= TIMER PER SOAL =================
  useEffect(() => {
    if (state !== "playing") return;
 
    setLevelTime(TIME_PER_SOAL);
    const timer = setInterval(() => {
      setLevelTime(t => t - 1);
    }, 1000);
 
    return () => clearInterval(timer);
  }, [state, level, questionCount]);
 
  useEffect(() => {
    if (result && pendingNext !== null) {
      const t = setTimeout(() => {
        nextSingle(pendingNext);
        setPendingNext(null);
        setResult(null);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [result]);
 
  // ================= TIMER SOAL HABIS =================
  useEffect(() => {
    if (levelTime !== 0) return;
    if (state !== "playing") return;

    answersRef.current.push({
      level,
      soal: questionCount + 1,
      jawaban: "-",
      benar: false,
    });

    setResult("Waktu Habis ⏱️");
    setTimeout(() => {
      setResult(null);
      nextSingle(false);
    }, 900);

  }, [levelTime]);
 
  // ================= LOG FINISH =================
  useEffect(() => {
    if (state !== "finished") return;

    socket.emit("logFinish", {
      username: usernameRef.current,
      studentId: studentIdRef.current,
      mode: "single",
      score: scoreRef.current,
      maxScore: MAX_SCORE,
      answers: answersRef.current,
    });
  }, [state]);
 
  function startLevel(lvl) {
    setLevel(lvl);
    setQuestionCount(0);
    setQuestion(getQuestion(lvl, 0));
    setState("playing");
    setShowLevelPopup(false);
  }
 
  function startSingle() {
    if (!hasRequiredInfo()) return alert("Isi nama dan Student ID dulu!");
    scoreRef.current = 0;
    answersRef.current = [];
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
 
  // ================= COMPONENT STYLE =================
  const card = "w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl flex flex-col gap-4 animate-fade";
  const input = "w-full p-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300";
  const btnPrimary = "bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-xl transition";
  const btnBack = "text-sm text-gray-500 mt-2";

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200">

      {/* HOME */}
      {state === "home" && (
        <HomeScreen onStart={() => setState("form")} />
      )}

      {/* FORM */}
      {state === "form" && (
        <div className={card}>
          <h2 className="text-xl font-semibold text-center text-purple-600">Masukkan Data</h2>
          <input placeholder="Nama" className={input}
            value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Student ID" className={input}
            value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <button onClick={startSingle} className={btnPrimary}>Start Game</button>
          <button onClick={() => setState("home")} className={btnBack}>← Back</button>
        </div>
      )}

      {/* GAME */}
      {state === "playing" && question && (
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-2 sm:px-0 animate-fade">

          {/* progress bar timer */}
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 transition-all duration-500"
              style={{ width: `${(levelTime / TIME_PER_SOAL) * 100}%` }} />
          </div>

          <div className="text-center">
            <p className="font-bold text-pink-600">Level {level}</p>
            <p className="text-sm text-gray-500">
              {questionCount + 1} / 15
            </p>
            <p className="text-sm text-gray-500">Time: {levelTime}s</p>
          </div>

          <p className="text-sm text-gray-600">{username} ({studentId})</p>
          <h2 className="font-semibold">Score: {score}</h2>

          <div className="bg-white rounded-2xl shadow-xl p-4">
            <img src={question.cubeImage} alt="Soal" className="w-64 h-64 object-contain" />
          </div>

          <AnswerOptions
            options={question.options}
            questionIndex={questionCount}
            onSelect={answerSingle}
          />
        </div>
      )}

      {/* RESULT POPUP */}
      {result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-xl font-bold animate-pop">
            {result}
          </div>
        </div>
      )}

      {/* FINISH */}
      {state === "finished" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className={card}>
            <h2 className="text-xl font-bold text-center">🎉 Game Selesai!</h2>
            <p className="text-center text-2xl font-bold text-pink-600">{score}/{MAX_SCORE}</p>
            <button onClick={() => {
              setState("home");
              setScore(0);
              scoreRef.current = 0;
              answersRef.current = [];
              setUsername("");
              setStudentId("");
            }} className={btnPrimary}>
              Kembali ke Menu
            </button>
          </div>
        </div>
      )}

      {/* LEVEL POPUP */}
      {showLevelPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-pop max-w-sm w-full">
            <h2 className="text-2xl font-bold text-pink-600 mb-3">
              {nextLevel === 1 ? "Siap Memulai?" : `Level ${nextLevel}`}
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

    </div>
  );
}