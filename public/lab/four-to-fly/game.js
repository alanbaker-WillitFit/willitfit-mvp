(() => {
  "use strict";
  const ROWS=6,COLS=7,EMPTY=0,P1=1,P2=2;
  const boardEl=document.getElementById("board"),columnsEl=document.getElementById("columnButtons"),statusEl=document.getElementById("status"),p2Label=document.getElementById("p2Label"),difficultyEl=document.getElementById("difficulty"),scoreP1El=document.getElementById("scoreP1"),scoreP2El=document.getElementById("scoreP2");
  const tokenSrc=window.WILLIT_BAG_BOUNCE_ASSETS?.approvalToken||null;
  let board=[],current=P1,locked=false,gameOver=false,mode="cpu",selectedColumn=3;
  let scores={p1:Number(localStorage.getItem("willit-four-to-fly-p1")||0),p2:Number(localStorage.getItem("willit-four-to-fly-p2")||0)};

  const freshBoard=()=>Array.from({length:ROWS},()=>Array(COLS).fill(EMPTY));
  const validColumns=(state)=>Array.from({length:COLS},(_,c)=>c).filter(c=>state[0][c]===EMPTY);
  const landingRow=(state,col)=>{for(let r=ROWS-1;r>=0;r--)if(state[r][col]===EMPTY)return r;return -1};
  const clone=(state)=>state.map(row=>row.slice());
  const winCells=(state,player)=>{
    const dirs=[[0,1],[1,0],[1,1],[1,-1]];
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(state[r][c]===player){for(const[dr,dc]of dirs){const cells=[];for(let i=0;i<4;i++){const rr=r+dr*i,cc=c+dc*i;if(rr<0||rr>=ROWS||cc<0||cc>=COLS||state[rr][cc]!==player)break;cells.push([rr,cc])}if(cells.length===4)return cells}}
    return null;
  };
  const isDraw=(state)=>validColumns(state).length===0;
  const scoreWindow=(values,player)=>{const foe=player===P1?P2:P1,p=values.filter(v=>v===player).length,f=values.filter(v=>v===foe).length,e=values.filter(v=>v===EMPTY).length;let s=0;if(p===4)s+=10000;else if(p===3&&e===1)s+=90;else if(p===2&&e===2)s+=14;if(f===3&&e===1)s-=110;if(f===4)s-=10000;return s};
  const evaluate=(state,player)=>{
    let score=state.map(row=>row[3]).filter(v=>v===player).length*8;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-3;c++)score+=scoreWindow([state[r][c],state[r][c+1],state[r][c+2],state[r][c+3]],player);
    for(let c=0;c<COLS;c++)for(let r=0;r<ROWS-3;r++)score+=scoreWindow([state[r][c],state[r+1][c],state[r+2][c],state[r+3][c]],player);
    for(let r=0;r<ROWS-3;r++)for(let c=0;c<COLS-3;c++)score+=scoreWindow([state[r][c],state[r+1][c+1],state[r+2][c+2],state[r+3][c+3]],player);
    for(let r=0;r<ROWS-3;r++)for(let c=3;c<COLS;c++)score+=scoreWindow([state[r][c],state[r+1][c-1],state[r+2][c-2],state[r+3][c-3]],player);
    return score;
  };
  const simulate=(state,col,player)=>{const next=clone(state),row=landingRow(next,col);if(row>=0)next[row][col]=player;return next};
  const immediateMove=(state,player)=>validColumns(state).find(c=>winCells(simulate(state,c,player),player));
  const minimax=(state,depth,maximizing,alpha,beta)=>{
    if(winCells(state,P2))return 100000+depth;if(winCells(state,P1))return -100000-depth;if(depth===0||isDraw(state))return evaluate(state,P2);
    const cols=validColumns(state).sort((a,b)=>Math.abs(3-a)-Math.abs(3-b));
    if(maximizing){let best=-Infinity;for(const c of cols){best=Math.max(best,minimax(simulate(state,c,P2),depth-1,false,alpha,beta));alpha=Math.max(alpha,best);if(beta<=alpha)break}return best}
    let best=Infinity;for(const c of cols){best=Math.min(best,minimax(simulate(state,c,P1),depth-1,true,alpha,beta));beta=Math.min(beta,best);if(beta<=alpha)break}return best;
  };
  const chooseCpuColumn=()=>{
    const cols=validColumns(board);if(!cols.length)return -1;
    const win=immediateMove(board,P2);if(win!==undefined)return win;
    const block=immediateMove(board,P1);if(block!==undefined)return block;
    if(difficultyEl.value==="easy")return cols[Math.floor(Math.random()*cols.length)];
    if(difficultyEl.value==="standard")return cols.slice().sort((a,b)=>evaluate(simulate(board,b,P2),P2)-evaluate(simulate(board,a,P2),P2))[0];
    let best=cols[0],bestScore=-Infinity;for(const c of cols){const score=minimax(simulate(board,c,P2),4,false,-Infinity,Infinity);if(score>bestScore){bestScore=score;best=c}}return best;
  };
  const tokenNode=(player)=>{const token=document.createElement("div");token.className=`token ${player===P1?"p1":"p2"}`;if(player===P1&&tokenSrc){const img=document.createElement("img");img.src=tokenSrc;img.alt="";img.draggable=false;token.appendChild(img)}else if(player===P2){token.textContent="it"}return token};
  const render=()=>{
    boardEl.innerHTML="";for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const cell=document.createElement("div");cell.className="cell";cell.setAttribute("role","gridcell");cell.dataset.row=String(r);cell.dataset.col=String(c);if(board[r][c])cell.appendChild(tokenNode(board[r][c]));boardEl.appendChild(cell)}
    [...columnsEl.children].forEach((btn,c)=>{btn.disabled=locked||gameOver||landingRow(board,c)<0;btn.classList.toggle("selected",c===selectedColumn)});
    scoreP1El.textContent=String(scores.p1);scoreP2El.textContent=String(scores.p2);
  };
  const announceTurn=()=>{if(gameOver)return;statusEl.textContent=current===P1?(mode==="cpu"?"Your turn":"Player 1"):mode==="cpu"?"CPU thinking…":"Player 2"};
  const saveScores=()=>{localStorage.setItem("willit-four-to-fly-p1",String(scores.p1));localStorage.setItem("willit-four-to-fly-p2",String(scores.p2))};
  const finish=(player,cells)=>{gameOver=true;locked=true;scores[player===P1?"p1":"p2"]++;saveScores();statusEl.textContent=player===P1?(mode==="cpu"?"Four to Fly — you win!":"Player 1 wins!"):(mode==="cpu"?"CPU connects four":"Player 2 wins!");render();for(const[r,c]of cells){boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"] .token`)?.classList.add("win")}};
  const drop=(col)=>{
    if(locked||gameOver)return;const row=landingRow(board,col);if(row<0)return;board[row][col]=current;const winner=winCells(board,current);if(winner){finish(current,winner);return}if(isDraw(board)){gameOver=true;locked=true;statusEl.textContent="Gate full — draw";render();return}
    current=current===P1?P2:P1;render();announceTurn();if(mode==="cpu"&&current===P2){locked=true;render();setTimeout(()=>{const cpu=chooseCpuColumn();locked=false;if(cpu>=0)drop(cpu)},380)};
  };
  const resetRound=()=>{board=freshBoard();current=P1;locked=false;gameOver=false;selectedColumn=3;statusEl.textContent=mode==="cpu"?"Your turn":"Player 1";render()};
  const resetMatch=()=>{scores={p1:0,p2:0};saveScores();resetRound()};
  const buildColumns=()=>{columnsEl.innerHTML="";for(let c=0;c<COLS;c++){const b=document.createElement("button");b.type="button";b.textContent="▼";b.setAttribute("aria-label",`Drop token in column ${c+1}`);b.addEventListener("click",()=>{selectedColumn=c;drop(c)});columnsEl.appendChild(b)}};
  document.querySelectorAll(".mode").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".mode").forEach(b=>b.classList.remove("active"));button.classList.add("active");mode=button.dataset.mode;p2Label.textContent=mode==="cpu"?"CPU":"Player 2";difficultyEl.disabled=mode!=="cpu";resetRound()}));
  document.getElementById("newMatch").addEventListener("click",resetMatch);document.getElementById("playAgain").addEventListener("click",resetRound);
  window.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"){e.preventDefault();selectedColumn=(selectedColumn+COLS-1)%COLS;render()}else if(e.key==="ArrowRight"){e.preventDefault();selectedColumn=(selectedColumn+1)%COLS;render()}else if(e.key==="Enter"||e.key===" "){e.preventDefault();drop(selectedColumn)}});
  buildColumns();resetRound();
  window.WILLIT_FOUR_TO_FLY_TEST={ROWS,COLS,freshBoard,landingRow,validColumns,winCells,simulate,evaluate};
})();
