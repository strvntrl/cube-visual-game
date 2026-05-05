export default function AnswerOptions({ options, questionIndex = 0, onSelect }) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-center mb-4">
        Soal {questionIndex + 1}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => onSelect(i)}
            className="bg-white rounded-xl shadow-md p-3 hover:ring-2 hover:ring-pink-400 transition"
          >
            <img
              src={opt.image}
              alt={`Opsi ${opt.id}`}
              className="w-full h-32 object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}