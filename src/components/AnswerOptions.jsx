import NetCard from "./NetCard";

function seededRandom(seed) {
  let x = seed;
  return function() {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function shuffleArray(array, rand) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function AnswerOptions({ options, questionIndex = 0, onSelect }) {
  const seed = typeof questionIndex === 'string'
    ? questionIndex.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    : questionIndex;

  const rand = seededRandom(seed + 1);
  const layoutIndices = shuffleArray([0, 1, 2, 3], rand);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-center mb-4">Soal {questionIndex + 1}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((n, i) => (
          <NetCard key={i} net={n} layoutIndex={layoutIndices[i]} onClick={() => onSelect(i)} />
        ))}
      </div>
    </div>
  );
}
