export default function QuestionCard({ question, onAnswer }) {
  return (
    <div className="flex flex-col items-center gap-6">

      <div className="bg-white rounded-2xl shadow-xl p-4">
        <img
          src={question.cubeImage}
          alt="Gambar kubus"
          className="w-64 h-64 object-contain"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.isCorrect)}
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