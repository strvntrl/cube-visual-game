export default function NetCard({ net, layoutIndex = 0, onClick }) {

  const layouts = [
    {
      cols: 3,
      rows: 4,
      positions: [
        { face: net.up, x: 2, y: 1 },
        { face: net.center, x: 2, y: 2 },
        { face: net.down, x: 2, y: 3 },
        { face: net.left, x: 1, y: 2 },
        { face: net.right, x: 3, y: 2 },
        { face: net.extra, x: 2, y: 4 }
      ]
    },
    {
      cols: 4,
      rows: 3,
      positions: [
        { face: net.left, x: 1, y: 2 },
        { face: net.center, x: 2, y: 2 },
        { face: net.right, x: 3, y: 2 },
        { face: net.extra, x: 4, y: 2 },
        { face: net.up, x: 4, y: 1 },
        { face: net.down, x: 2, y: 3 }
      ]
    },
    {
      cols: 4,
      rows: 4,
      positions: [
        { face: net.left, x: 1, y: 1 },
        { face: net.center, x: 2, y: 1 },
        { face: net.right, x: 3, y: 4 },
        { face: net.extra, x: 2, y: 2 },
        { face: net.up, x: 2, y: 3 },
        { face: net.down, x: 2, y: 4 }
      ]
    },
    {
      cols: 4,
      rows: 4,
      positions: [
        { face: net.up, x: 2, y: 1 },
        { face: net.center, x: 2, y: 2 },
        { face: net.left, x: 1, y: 2 },
        { face: net.extra, x: 3, y: 2 },
        { face: net.right, x: 4, y: 2 },
        { face: net.down, x: 3, y: 3 }
      ]
    }
  ];

  const layout = layouts[layoutIndex % layouts.length];

  return (
    <div
      onClick={onClick}
      className="option-card p-3 bg-white/70 backdrop-blur rounded-2xl cursor-pointer hover:scale-105 transition"
    >
      <div
        className="ml-24 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, minmax(40px, 40px))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(40px, 40px))`
        }}
      >
        {layout.positions.map((cell, index) => {
          if (!cell.face) return null;
          return (
            <div
              key={`${cell.x}-${cell.y}-${index}`}
              style={{ gridColumnStart: cell.x, gridRowStart: cell.y }}
              className={`cell ${cell.face === net.center ? "bg-pink-500 text-white font-bold" : "bg-white"}`}
            >
              {cell.face}
            </div>
          );
        })}
      </div>
    </div>
  );
} 