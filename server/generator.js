const SYMBOLS = ["A","B","C","D","X","O","*","#","△","+","1","2","3","4"];

function shuffle(arr){
  return [...arr].sort(()=>Math.random()-0.5);
}

function getRandomSymbols(){
  return shuffle(SYMBOLS).slice(0,6);
}

function createCube(){
  const [top,bottom,left,right,front,back] = getRandomSymbols();
  return {top,bottom,left,right,front,back};
}

function correctNet(c){
  return {
    center:c.front, up:c.top, down:c.bottom,
    left:c.left, right:c.right, extra:c.back
  };
}

function mutate(net){
  const n = {...net};
  const keys=["up","down","left","right"];
  const a = keys[Math.floor(Math.random()*4)];
  const b = keys[Math.floor(Math.random()*4)];
  [n[a],n[b]]=[n[b],n[a]];
  return n;
}

export function generateQuestion(){
  const cube = createCube();
  const correct = correctNet(cube);

  const options=[correct];

  while(options.length<4){
    const fake = mutate(correct);
    if(!options.some(o=>JSON.stringify(o)===JSON.stringify(fake))){
      options.push(fake);
    }
  }

  const shuffled = shuffle(options);

  const answer = shuffled.findIndex(
    o=>JSON.stringify(o)===JSON.stringify(correct)
  );

  return { cube, options: shuffled, answer };
}