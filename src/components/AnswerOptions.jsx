import { useState } from "react";

export default function AnswerOptions({ options, questionIndex = 0, onSelect }) {
  const [selected, setSelected] = useState(null);

  if (selected !== null && questionIndex !== undefined) {
  }

  function handleSelect(i) {
    if (selected !== null) return; 
    setSelected(i);
    setTimeout(() => {
      onSelect(i);
      setSelected(null);
    }, 150);
  }

  return (
    <div className="w-full grid grid-cols-2 gap-3">
      {options.map((opt, i) => (
        <button
          key={`${questionIndex}-${opt.id}`}
          onClick={() => handleSelect(i)}
          disabled={selected !== null}
          className="relative overflow-hidden rounded-2xl transition-all duration-150 active:scale-95"
          style={{
            background: selected === i
              ? "linear-gradient(135deg, #fce7f3, #f3e8ff)"
              : "rgba(255,255,255,0.9)",
            boxShadow: selected === i
              ? "0 4px 20px rgba(236,72,153,0.25), inset 0 0 0 2px #ec4899"
              : "0 2px 12px rgba(236,72,153,0.08)",
            transform: selected === i ? "scale(0.97)" : "scale(1)",
          }}
        >
          <div className="p-2">
            <img
              src={opt.image}
              alt={`Opsi ${opt.id}`}
              className="w-full object-contain"
              style={{ height: "7rem" }}
              loading="eager"
            />
          </div>
          <span className="absolute top-2 left-2 text-xs font-bold text-pink-300 opacity-60">
            {opt.id}
          </span>
        </button>
      ))}
    </div>
  );
}