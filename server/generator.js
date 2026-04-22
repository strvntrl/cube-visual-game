// ================= SYMBOL POOL =================
const SYMBOLS = ["A","B","C","D","X","O","*","#","△","+","1","2","3","4"];

// ================= UTIL =================
function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomSymbols(){
  return shuffle(SYMBOLS).slice(0,6);
}

// ================= CUBE =================
function createCube(){
  const [top,bottom,left,right,front,back] = getRandomSymbols();
  return { top, bottom, left, right, front, back };
}

// ================= NET =================
function correctNet(c){
  return {
    center: c.front,
    up: c.top,
    down: c.bottom,
    left: c.left,
    right: c.right,
    extra: c.back
  };
}

// ================= MUTATION =================
function mutate(net, level){
  const n = { ...net };

  const basicKeys = ["up","down","left","right"];
  const hardKeys = ["up","down","left","right","extra"];

  // helper swap
  const swap = (arrKeys) => {
    const a = arrKeys[Math.floor(Math.random() * arrKeys.length)];
    let b = arrKeys[Math.floor(Math.random() * arrKeys.length)];

    // pastikan tidak swap dengan diri sendiri
    while(b === a){
      b = arrKeys[Math.floor(Math.random() * arrKeys.length)];
    }

    [n[a], n[b]] = [n[b], n[a]];
  };

  if(level === 1){
    swap(basicKeys);
  }

  else if(level === 2){
    swap(basicKeys);
    swap(basicKeys);
  }

  else {
    // 🔥 HARD
    swap(hardKeys);
    swap(hardKeys);
    swap(hardKeys);
  }

  return n;
}

// ================= VISIBILITY =================
function getVisibleSides(level){
  if(level === 1){
    return ["front","top","right"];
  }
  else if(level === 2){
    return ["front","top","left"];
  }
  else{
    return ["front","top"]; // 🔥 cuma 2 sisi
  }
}

// ================= COMPARISON =================
function isSameNet(a, b){
  return JSON.stringify(a) === JSON.stringify(b);
}

// ================= MAIN =================
export function generateQuestion(level = 1){

  const cube = createCube();
  const correct = correctNet(cube);

  const options = [correct];

  let safety = 0; // 🔥 anti infinite loop

  while(options.length < 4 && safety < 50){
    const fake = mutate(correct, level);

    // pastikan tidak sama dengan jawaban
    if(!options.some(o => isSameNet(o, fake))){
      options.push(fake);
    }

    safety++;
  }

  const shuffled = shuffle(options);

  const answer = shuffled.findIndex(o => isSameNet(o, correct));

  return {
    cube,
    options: shuffled,
    answer,
    visible: getVisibleSides(level),
    level
  };
}