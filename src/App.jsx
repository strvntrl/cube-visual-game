import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { questions } from "./data/questions";
import AnswerOptions from "./components/AnswerOptions";
import HomeScreen from "./components/HomeScreen";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(SERVER_URL);

// ================= DOM PRELOADER =================
function ImagePreloader() {
  return (
    <div style={{ position: "fixed", opacity: 0, pointerEvents: "none", width: 1, height: 1, overflow: "hidden" }}
      aria-hidden="true">
      {questions.map(q => (
        <span key={`${q.level}-${q.id}`}>
          <img src={q.cubeImage} alt="" width="1" height="1" />
          {q.options.map(o => (
            <img key={o.id} src={o.image} alt="" width="1" height="1" />
          ))}
        </span>
      ))}
    </div>
  );
}

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
  const [durasi, setDurasi] = useState("");

  const usernameRef = useRef("");
  const studentIdRef = useRef("");
  const startTimeRef = useRef(null); 

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

  // ================= TIMER HABIS =================
  useEffect(() => {
    if (levelTime !== 0) return;
    if (state !== "playing") return;
    answersRef.current.push({ level, soal: questionCount + 1, jawaban: "-", benar: false });
    setResult("Waktu Habis ⏱️");
    setTimeout(() => {
      setResult(null);
      nextSingle(false);
    }, 900);
  }, [levelTime]);

  // ================= LOG FINISH =================
  useEffect(() => {
    if (state !== "finished") return;

    // hitung durasi
    const detikTotal = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const menit = Math.floor(detikTotal / 60);
    const detik = detikTotal % 60;
    const durasiStr = `${menit}m ${String(detik).padStart(2, "0")}s`;
    setDurasi(durasiStr);

    socket.emit("logFinish", {
      username: usernameRef.current,
      studentId: studentIdRef.current,
      score: scoreRef.current,
      maxScore: MAX_SCORE,
      answers: answersRef.current,
      durasi: durasiStr,
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
    startTimeRef.current = Date.now(); 
    setLevel(1);
    setQuestionCount(0);
    setScore(0);
    setDurasi("");
    setNextLevel(1);
    setShowLevelPopup(true);
    setState("paused");
  }

  function answerSingle(i) {
    const correct = question.options[i].isCorrect;
    answersRef.current.push({
      level, soal: questionCount + 1,
      jawaban: question.options[i].id, benar: correct,
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

  function resetGame() {
    setState("home");
    setScore(0);
    scoreRef.current = 0;
    answersRef.current = [];
    startTimeRef.current = null;
    setDurasi("");
    setUsername("");
    setStudentId("");
  }

  const timerPct = (levelTime / TIME_PER_SOAL) * 100;
  const timerColor = timerPct > 50 ? "#ec4899" : timerPct > 25 ? "#f97316" : "#ef4444";

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 40%, #f3e8ff 70%, #fce7f3 100%)" }}>

      <ImagePreloader />

      {/* dekorasi background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #f9a8d4, transparent)" }} />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #c084fc, transparent)" }} />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #f472b6, transparent)" }} />
        {["top-16 left-12", "top-24 right-16", "bottom-32 left-8", "bottom-16 right-24", "top-1/2 left-6"].map((pos, i) => (
          <div key={i} className={`absolute ${pos} text-pink-300 opacity-40 text-2xl`}
            style={{ animation: `pulse ${2 + i * 0.4}s ease-in-out infinite` }}>✦</div>
        ))}
      </div>

      {/* HOME */}
      {state === "home" && (
        <HomeScreen onStart={() => setState("form")} />
      )}

      {/* FORM */}
      {state === "form" && (
        <div className="relative w-full max-w-sm">
          <div className="absolute -top-3 -left-3 w-full h-full rounded-3xl bg-pink-200 opacity-50" />
          <div className="relative rounded-3xl p-8 flex flex-col gap-5"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(236,72,153,0.15)"
            }}>
            <div className="text-center">
              <div className="text-4xl mb-2">🎀</div>
              <h2 className="text-2xl font-bold text-pink-600" style={{ fontFamily: "Georgia, serif" }}>
                Halo, Siapa Kamu?
              </h2>
              <p className="text-sm text-pink-400 mt-1">Isi dulu sebelum main ya~</p>
            </div>
            <input
              placeholder="✏️ Nama kamu"
              className="w-full px-4 py-3 rounded-2xl text-gray-700 text-sm outline-none"
              style={{ background: "#fdf2f8", border: "2px solid #fbcfe8", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#ec4899"}
              onBlur={e => e.target.style.borderColor = "#fbcfe8"}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <input
              placeholder="🎓 Student ID"
              className="w-full px-4 py-3 rounded-2xl text-gray-700 text-sm outline-none"
              style={{ background: "#fdf2f8", border: "2px solid #fbcfe8", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#ec4899"}
              onBlur={e => e.target.style.borderColor = "#fbcfe8"}
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
            />
            <button
              onClick={startSingle}
              className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
              }}>
              Mulai Game 🚀
            </button>
            <button onClick={() => setState("home")}
              className="text-sm text-pink-400 text-center hover:text-pink-600 transition-colors">
              ← Kembali
            </button>
          </div>
        </div>
      )}

      {/* GAME */}
      {state === "playing" && question && (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl px-2">

          <div className="w-full flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                Level {level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-full"
                style={{ color: timerColor, background: `${timerColor}18` }}>
                {levelTime}s
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#fce7f3" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                boxShadow: `0 0 8px ${timerColor}60`
              }} />
          </div>

          <div className="relative w-full max-w-[280px]">
            <div className="absolute inset-0 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, #fbcfe8, #e9d5ff)",
                transform: "rotate(-2deg)",
                opacity: 0.6
              }} />
            <div className="relative rounded-3xl p-3"
              style={{
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 32px rgba(236,72,153,0.2)"
              }}>
              <img
                src={question.cubeImage}
                alt="Soal"
                className="w-full object-contain"
                style={{ height: "14rem" }}
              />
            </div>
          </div>

          <p className="text-center text-xs text-pink-400 font-medium">
            Pilih jaring-jaring yang tepat!
          </p>

          <AnswerOptions
            options={question.options}
            questionIndex={questionCount}
            onSelect={answerSingle}
          />
        </div>
      )}

      {/* RESULT POPUP */}
      {result && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(253,242,248,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="px-10 py-6 rounded-3xl text-2xl font-bold text-center"
            style={{
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 8px 40px rgba(236,72,153,0.3)"
            }}>
            {result}
          </div>
        </div>
      )}

      {/* FINISH */}
      {state === "finished" && (
        <div className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(253,242,248,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="relative w-full max-w-sm mx-4">
            <div className="absolute -top-3 -left-3 w-full h-full rounded-3xl bg-purple-200 opacity-40" />
            <div className="relative rounded-3xl p-8 text-center flex flex-col gap-5"
              style={{
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 40px rgba(168,85,247,0.2)"
              }}>
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-pink-600" style={{ fontFamily: "Georgia, serif" }}>
                Selesai!
              </h2>
              <div className="py-4 rounded-2xl flex flex-col gap-3"
                style={{ background: "linear-gradient(135deg, #fce7f3, #f3e8ff)" }}>
                <div>
                  <p className="text-sm text-pink-400 mb-1">Skor kamu</p>
                  <p className="text-5xl font-bold text-pink-600">{score}</p>
                  <p className="text-sm text-pink-400">dari {MAX_SCORE}</p>
                </div>
                {durasi && (
                  <div className="border-t border-pink-200 pt-3">
                    <p className="text-sm text-pink-400 mb-1">Durasi bermain</p>
                    <p className="text-xl font-bold text-purple-500">⏱️ {durasi}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {score >= 40 ? "Luar biasa! Kamu hebat banget~ 🌟" :
                  score >= 30 ? "Bagus! Terus semangat ya! 💪" :
                    score >= 15 ? "Lumayan! Latihan lagi yuk~ ✨" :
                      "Jangan menyerah, coba lagi! 🌸"}
              </p>
              <button
                onClick={resetGame}
                className="w-full py-3 rounded-2xl text-white font-bold transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
                }}>
                Main Lagi 🎀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL POPUP */}
      {showLevelPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(253,242,248,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="relative w-full max-w-sm mx-4">
            <div className="absolute -top-2 -right-2 w-full h-full rounded-3xl bg-pink-200 opacity-40" />
            <div className="relative rounded-3xl p-8 text-center flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 40px rgba(236,72,153,0.25)"
              }}>
              <div className="text-4xl">
                {nextLevel === 1 ? "🌸" : nextLevel === 2 ? "💫" : "🌟"}
              </div>
              <h2 className="text-2xl font-bold text-pink-600" style={{ fontFamily: "Georgia, serif" }}>
                {nextLevel === 1 ? "Siap Main?" : `Level ${nextLevel}`}
              </h2>
              <p className="text-sm text-gray-500">
                {nextLevel === 1
                  ? "Perhatikan bentuk kubus dan pilih jaring-jaring yang benar. Semangat! 💖"
                  : nextLevel === 2
                    ? "Memasuki level 2! Soal mulai lebih menantang~"
                    : "Level terakhir! Tunjukkan kemampuan terbaikmu!"}
              </p>
              <button
                onClick={() => startLevel(nextLevel)}
                className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
                }}>
                {nextLevel === 1 ? "Mulai! 🚀" : "Lanjut ➡️"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}