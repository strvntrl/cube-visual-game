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
  // Tidak ada result popup, langsung lanjut setelah 400ms
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
    if (!hasRequiredInfo()) return alert("Ups! Nama dan asal instansi belum diisi nih~");
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

    // simpan jawaban — data tetap dicatat meski tidak ditampilkan ke pemain
    answersRef.current.push({
      level, soal: questionCount + 1,
      jawaban: question.options[i].id, benar: correct,
    });

    // hitung skor di background
    if (correct) scoreRef.current += 1;

    // langsung lanjut tanpa popup benar/salah
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
              <p className="text-sm text-pink-400 mt-1">Kenalin diri dulu sebelum mulai main ya~</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                placeholder="✏️ Nama lengkap kamu"
                className="w-full px-4 py-3 rounded-2xl text-gray-700 text-sm outline-none"
                style={{ background: "#fdf2f8", border: "2px solid #fbcfe8", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "#ec4899"}
                onBlur={e => e.target.style.borderColor = "#fbcfe8"}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <input
                placeholder="🏫 Asal instansi"
                className="w-full px-4 py-3 rounded-2xl text-gray-700 text-sm outline-none"
                style={{ background: "#fdf2f8", border: "2px solid #fbcfe8", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "#ec4899"}
                onBlur={e => e.target.style.borderColor = "#fbcfe8"}
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
            </div>
            <button
              onClick={startSingle}
              className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
              }}>
              Ayo Mulai! 🚀
            </button>
            <button onClick={() => setState("home")}
              className="text-sm text-pink-400 text-center hover:text-pink-600 transition-colors">
              ← Balik ke halaman awal
            </button>
          </div>
        </div>
      )}

      {/* GAME — tidak ada timer UI, tidak ada skor */}
      {state === "playing" && question && (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl px-2">

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
                  Kamu berhasil!
                </h2>
                <p className="text-sm text-pink-400 mt-1">
                  Semua soal sudah kamu selesaikan~
                </p>
              </div>

              <div className="py-5 px-4 rounded-2xl flex flex-col gap-2"
                style={{ background: "linear-gradient(135deg, #fce7f3, #f3e8ff)" }}>
                <p className="text-sm text-pink-500 font-medium">
                  Jawaban kamu sudah kami catat ✨
                </p>
                <p className="text-xs text-pink-400 leading-relaxed">
                  Terima kasih sudah meluangkan waktu untuk ikut bermain. Jawabanmu sangat berarti untuk penelitian ini!
                </p>
                {durasi && (
                  <div className="mt-2 border-t border-pink-200 pt-3">
                    <p className="text-xs text-pink-400 mb-1">Waktu yang kamu habiskan</p>
                    <p className="text-lg font-bold text-purple-500">⏱️ {durasi}</p>
                  </div>
                )}
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
                {nextLevel === 1
                  ? "Siap mulai petualangan?"
                  : nextLevel === 2
                    ? "Naik level, nih!"
                    : "Ini dia tantangan terakhir!"}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {nextLevel === 1
                  ? "Perhatikan gambar kubus, lalu pilih jaring-jaring yang paling tepat. Tidak ada benar atau salah yang ditampilkan — cukup percaya instingmu! 💖"
                  : nextLevel === 2
                    ? "Level 1 sudah selesai! Soal berikutnya sedikit lebih menantang, tapi kamu pasti bisa~ 🔥"
                    : "Ini level terakhir! Sebentar lagi selesai — berikan yang terbaik ya! ⭐"}
              </p>
              <button
                onClick={() => startLevel(nextLevel)}
                className="w-full py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  boxShadow: "0 4px 20px rgba(236,72,153,0.4)"
                }}>
                {nextLevel === 1 ? "Yuk, mulai! 🚀" : "Lanjut ➡️"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}