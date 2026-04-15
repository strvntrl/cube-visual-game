export default function QuestionCard({ cube }) {
  return (
    <div className="card text-center">
      <div className="grid grid-cols-3 gap-2 justify-items-center">
        <div></div><div className="cell">{cube.top}</div><div></div>
        <div className="cell">{cube.left}</div>
        <div className="cell bg-pink-500">{cube.front}</div>
        <div className="cell">{cube.right}</div>
        <div></div><div className="cell">{cube.bottom}</div><div></div>
      </div>
    </div>
  );
}