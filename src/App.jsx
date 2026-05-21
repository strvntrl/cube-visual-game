import { useState, useEffect, useRef } from "react";
import { questions } from "./data/questions";
import AnswerOptions from "./components/AnswerOptions";
import HomeScreen from "./components/HomeScreen";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

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

  const [state, setState] = useState("home");
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [question, setQuestion] = useState(null);
  const scoreRef = useRef(0);
  const answersRef = useRef([]);
  const [pendingNext, setPendingNext] = useState(null);
  const [level, setLevel] = useState(1);
  const [questionCount, setQuestionCount] = useState(0);
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const [nextLevel, setNextLevel] = useState(null);
  const [durasi, setDurasi] = useState("");
  const [showWarningPopup, setShowWarningPopup] = useState(false);

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

  // ================= AUTO NEXT setelah jawab =================
  useEffect(() => {
    if (pendingNext === null) return;
    const t = setTimeout(() => {
      nextSingle(pendingNext);
      setPendingNext(null);
    }, 400);
    return () => clearTimeout(t);
  }, [pendingNext]);

  // ================= LOG FINISH =================
  useEffect(() => {
    if (state !== "finished") return;

    const detikTotal = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const menit = Math.floor(detikTotal / 60);
    const detik = detikTotal % 60;
    const durasiStr = `${menit}m ${String(detik).padStart(2, "0")}s`;
    setDurasi(durasiStr);

    // kirim ke server via REST
    fetch("/api/logFinish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameRef.current,
        studentId: studentIdRef.current,
        score: scoreRef.current,
        maxScore: MAX_SCORE,
        answers: answersRef.current,
        durasi: durasiStr,
      }),
    }).catch(err => console.error("Gagal kirim data:", err));
  }, [state]);

  function startLevel(lvl) {
    setLevel(lvl);
    setQuestionCount(0);
    setQuestion(getQuestion(lvl, 0));
    setState("playing");
    setShowLevelPopup(false);
  }

  function startSingle() {
    if (!hasRequiredInfo()) {
      setShowWarningPopup(true);
      return;
    }

    scoreRef.current = 0;
    answersRef.current = [];
    startTimeRef.current = Date.now();

    setLevel(1);
    setQuestionCount(0);
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

    if (correct) scoreRef.current += 1;

    setPendingNext(correct);
  }

  function nextSingle(correct) {
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
    scoreRef.current = 0;
    answersRef.current = [];
    startTimeRef.current = null;
    setDurasi("");
    setUsername("");
    setStudentId("");
  }

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
        <div className="relative w-full max-w-md mx-auto px-4">

          {/* Glow */}
          <div
            className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{ background: "#f9a8d4" }}
          />
          <div
            className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full blur-3xl opacity-30"
            style={{ background: "#c084fc" }}
          />

          {/* Card */}
          <div
            className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 10px 50px rgba(236,72,153,0.18)"
            }}
          >

            {/* Decorative */}
            <div className="absolute top-5 left-5 text-pink-300 text-xl animate-pulse">
              ✦
            </div>
            <div className="absolute top-6 right-6 text-purple-300 text-lg animate-pulse">
              ✧
            </div>

            {/* Header */}
            <div className="text-center mb-7">
              <div className="mb-4 flex justify-center">
                <img
                  src="/icon.png"
                  alt="Foldables"
                  className="w-24 object-contain scale-110"
                />
              </div>
              <h2
                className="text-4xl font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "Georgia, serif"
                }}
              >
                Foldables!
              </h2>
              <p className="text-sm text-pink-400 mt-3">
                Isi dulu sebelum main ya!
              </p>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <input
                placeholder="✏️ Nama kamu"
                className="w-full px-5 py-4 rounded-2xl text-gray-700 outline-none transition-all"
                style={{
                  background: "#fff",
                  border: "2px solid #fbcfe8",
                  boxShadow: "0 4px 12px rgba(236,72,153,0.05)"
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#ec4899";
                  e.target.style.boxShadow =
                    "0 0 0 4px rgba(236,72,153,0.12)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#fbcfe8";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(236,72,153,0.05)";
                }}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />

              <input
                placeholder="🏫 Asal instansi"
                className="w-full px-5 py-4 rounded-2xl text-gray-700 outline-none transition-all"
                style={{
                  background: "#fff",
                  border: "2px solid #fbcfe8",
                  boxShadow: "0 4px 12px rgba(236,72,153,0.05)"
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#ec4899";
                  e.target.style.boxShadow =
                    "0 0 0 4px rgba(236,72,153,0.12)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#fbcfe8";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(236,72,153,0.05)";
                }}
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
            </div>

            {/* Button */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={startSingle}
                className="group relative mt-6 w-full overflow-hidden rounded-2xl py-4 text-white font-bold text-lg transition-all duration-300 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow:
                    "0 8px 25px rgba(236,72,153,0.35)"
                }}
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  Selanjutnya
                </span>
              </button>

              {/* Back */}
              <button
                onClick={() => setState("home")}
                className="w-full py-3 rounded-2xl font-semibold text-sm sm:text-base border-2 transition-all"
                      style={{
                        borderColor: "#f9a8d4",
                        color: "#ec4899",
                        background: "rgba(255,255,255,0.9)"
                      }}
              >
                ← Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME — tidak ada timer UI, tidak ada skor */}
      {state === "playing" && question && (
      <div
        className="relative w-full max-w-2xl rounded-[2rem] p-6 sm:p-8 flex flex-col items-center gap-5"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 10px 50px rgba(236,72,153,0.12)"
        }}
      >
          {/* hanya tampilkan level */}
          <div className="w-full flex items-center justify-center px-2">
            <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
              Level {level}
            </span>
          </div>

          {/* gambar kubus */}
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
            Pilih jaring-jaring yang paling tepat!
          </p>

          <AnswerOptions
            options={question.options}
            questionIndex={questionCount}
            onSelect={answerSingle}
          />
        </div>
      )}

      {/* FINISH — tidak tampilkan skor, hanya ucapan terima kasih */}
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
              <div>
                <h2 className="text-2xl font-bold text-pink-600" style={{ fontFamily: "Georgia, serif" }}>
                  Finish!
                </h2>
                <p className="text-sm text-pink-400 mt-1">
                  Semua soal sudah terselesaikan~
                </p>
              </div>

              <div className="py-5 px-4 rounded-2xl flex flex-col gap-2"
                style={{ background: "linear-gradient(135deg, #fce7f3, #f3e8ff)" }}>
                {/* <p className="text-sm text-pink-500 font-medium">
                  Jawaban kamu sudah kami catat ✨
                </p> */}
                <p className="text-sm text-pink-500 font-medium">
                  Terima kasih sudah meluangkan waktu untuk bermain!
                </p>
                {/* <p className="text-xs text-pink-400 leading-relaxed">
                  Terima kasih sudah meluangkan waktu untuk bermain. Jawabanmu sangat berarti untuk penelitian ini!
                </p> */}
              </div>

              <button
                onClick={resetGame}
                className="w-full py-3 rounded-2xl text-white font-bold transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
                }}>
                Selesai 🎀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL POPUP */}
      {showLevelPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: "rgba(253,242,248,0.8)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div className="relative w-full max-w-sm mx-4">
            <div className="absolute -top-2 -right-2 w-full h-full rounded-3xl bg-pink-200 opacity-40" />

            <div
              className="relative rounded-3xl p-8 text-center flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 40px rgba(236,72,153,0.25)"
              }}
            >
              <div className="text-4xl">
                {nextLevel === 1 ? "🌸" : nextLevel === 2 ? "💫" : "🌟"}
              </div>

              <h2
                className="text-2xl font-bold text-pink-600"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {nextLevel === 1
                  ? "Siap Main?"
                  : nextLevel === 2
                  ? "Naik level, nih!"
                  : "Level terakhir, nih!"}
              </h2>

              <p className="text-sm text-gray-500 leading-relaxed">
                {nextLevel === 1
                  ? "Perhatikan bentuk kubus dan pilih jaring-jaring yang benar. Good Luck! 💖"
                  : nextLevel === 2
                  ? "Soal mulai menantang!"
                  : "Semangat!"}
              </p>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3 mt-2">

                {/* START */}
                <button
                  onClick={() => startLevel(nextLevel)}
                  className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #ec4899, #a855f7)",
                    boxShadow:
                      "0 4px 20px rgba(236,72,153,0.4)"
                  }}
                >
                  {nextLevel === 1 ? "Yuk, mulai!" : "Lanjut"}
                </button>

                {/* BACK */}
                {nextLevel === 1 && (
                  <button
                    onClick={() => {
                      setShowLevelPopup(false);
                      setState("form");
                    }}
                    className="w-full py-3 rounded-2xl font-semibold text-sm sm:text-base border-2 transition-all"
                    style={{
                      borderColor: "#f9a8d4",
                      color: "#ec4899",
                      background: "rgba(255,255,255,0.9)"
                    }}
                  >
                    ← Kembali mengisi data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WARNING POPUP */}
      {showWarningPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[999]"
          style={{
            background: "rgba(253,242,248,0.75)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div className="relative w-full max-w-xs mx-4">
            <div
              className="absolute -top-2 -left-2 w-full h-full rounded-3xl opacity-40"
              style={{
                background: "linear-gradient(135deg, #f9a8d4, #c084fc)"
              }}
            />
            <div
              className="relative rounded-3xl p-7 text-center flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 8px 40px rgba(236,72,153,0.25)"
              }}
            >
              <div className="text-5xl">⚠️</div>
              <div>
                <h2
                  className="text-2xl font-bold text-pink-600"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Data belum lengkap
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Isi nama dan asal instansi terlebih dahulu sebelum mulai main ya~
                </p>
              </div>
              <button
                onClick={() => setShowWarningPopup(false)}
                className="w-full py-3 rounded-2xl text-white font-bold transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
                }}
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}