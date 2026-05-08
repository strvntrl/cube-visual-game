export default function AnswerOptions({ options, questionIndex = 0, onSelect }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => onSelect(i)}
            className="bg-white rounded-xl shadow-md p-3 transition active:scale-95"
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