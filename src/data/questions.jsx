export const questions = [
  {
    cube: {
      top: "A", bottom: "B", left: "C", right: "D", front: "E", back: "F"
    },
    options: [
      { center: "E", up: "A", down: "B", left: "C", right: "D", extra: "F" },
      { center: "E", up: "B", down: "A", left: "C", right: "D", extra: "F" },
      { center: "C", up: "A", down: "B", left: "E", right: "D", extra: "F" },
      { center: "E", up: "A", down: "B", left: "D", right: "C", extra: "F" }
    ],
    answer: 0
  },
  {
    cube: {
      top: "X", bottom: "O", left: "*", right: "#", front: "△", back: "+"
    },
    options: [
      { center: "△", up: "X", down: "O", left: "*", right: "#", extra: "+" },
      { center: "△", up: "O", down: "X", left: "*", right: "#", extra: "+" },
      { center: "*", up: "X", down: "O", left: "△", right: "#", extra: "+" },
      { center: "△", up: "X", down: "O", left: "#", right: "*", extra: "+" }
    ],
    answer: 0
  },
  {
    cube: {
      top: "1", bottom: "2", left: "3", right: "4", front: "5", back: "6"
    },
    options: [
      { center: "5", up: "1", down: "2", left: "3", right: "4", extra: "6" },
      { center: "5", up: "2", down: "1", left: "3", right: "4", extra: "6" },
      { center: "3", up: "1", down: "2", left: "5", right: "4", extra: "6" },
      { center: "5", up: "1", down: "2", left: "4", right: "3", extra: "6" }
    ],
    answer: 0
  }
];