const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 90;
const CENTER_OFFSET = 45;
const AI_DEPTH = 4;

let board = [];
let currentPlayer = 1;
let gameOver = false;
let isAnimating = false;

function initBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.addEventListener("mouseenter", () => showPreview(c));
            cell.addEventListener("mouseleave", removePreview);
            cell.addEventListener("click", () => handleMove(c));
            boardDiv.appendChild(cell);
        }
    }
}

function showPreview(col) {
    if (gameOver || isAnimating) return;
    if (currentPlayer === 2 && getMode() !== "pvp") return;

    removePreview();

    const cells = document.querySelectorAll(".cell");
    const cell = cells[col];

    const preview = document.createElement("div");
    preview.classList.add("disk", "preview");

    if (currentPlayer === 2) preview.classList.add("yellow");
    preview.style.opacity = "0.4";

    cell.appendChild(preview);
}

function removePreview() {
    document.querySelectorAll(".preview").forEach(p => p.remove());
}

function handleMove(col) {
    if (gameOver || isAnimating) return;
    if (currentPlayer === 2 && getMode() !== "pvp") return;

    const row = getAvailableRow(col);
    if (row === -1) return;

    board[row][col] = currentPlayer;
    animateDrop(row, col, currentPlayer, () => {
        if (!postMove(row, col)) {
            if (getMode() !== "pvp") aiMove();
        }
    });
}

function aiMove() {
    let col;

    if (getMode() === "minimax")
        col = minimaxRoot(AI_DEPTH);
    else
        col = alphaBetaRoot(AI_DEPTH);

    const row = getAvailableRow(col);
    if (row === -1) return;

    board[row][col] = 2;
    animateDrop(row, col, 2, () => postMove(row, col));
}

function animateDrop(row, col, player, callback) {
    isAnimating = true;
    removePreview();

    const cells = document.querySelectorAll(".cell");
    const index = row * COLS + col;
    const cell = cells[index];

    const disk = document.createElement("div");
    disk.classList.add("disk");
    if (player === 2) disk.classList.add("yellow");

    disk.style.transform = "translateY(-600px)";
    cell.appendChild(disk);

    setTimeout(() => disk.style.transform = "translateY(0)", 20);

    setTimeout(() => {
        isAnimating = false;
        callback();
    }, 400);
}

function postMove(row, col) {
    const winCells = checkWin(row, col);
    if (winCells) {
        drawWinLine(winCells);
        endGame();
        return true;
    }
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator();
    return false;
}

function getAvailableRow(col) {
    for (let r = ROWS - 1; r >= 0; r--)
        if (board[r][col] === 0) return r;
    return -1;
}

function getMode() {
    return document.getElementById("modeSelect").value;
}

function updateTurnIndicator() {
    const indicator = document.getElementById("turnIndicator");
    const text = document.getElementById("turnText");

    if (currentPlayer === 1) {
        indicator.className = "turn red";
        text.textContent = "Player 1";
    } else {
        indicator.className = "turn yellow";
        text.textContent = getMode() === "pvp" ? "Player 2" : "AI";
    }
}

/* ---------- WIN CHECK ---------- */

function checkWin(row, col) {
    const player = board[row][col];

    function collect(dx, dy) {
        let r = row, c = col;
        let cells = [[r, c]];

        while (true) {
            r += dx; c += dy;
            if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
            cells.push([r,c]);
        }

        r = row; c = col;
        while (true) {
            r -= dx; c -= dy;
            if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
            cells.unshift([r,c]);
        }

        return cells.length >= 4 ? cells.slice(0,4) : null;
    }

    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let [dx,dy] of dirs) {
        const res = collect(dx,dy);
        if (res) return res;
    }
    return null;
}

function drawWinLine(cells) {
    const svg = document.getElementById("winLine");
    svg.innerHTML = "";

    const [r1,c1] = cells[0];
    const [r2,c2] = cells[3];

    const x1 = c1*CELL_SIZE + CENTER_OFFSET;
    const y1 = r1*CELL_SIZE + CENTER_OFFSET;
    const x2 = c2*CELL_SIZE + CENTER_OFFSET;
    const y2 = r2*CELL_SIZE + CENTER_OFFSET;

    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",x1);
    line.setAttribute("y1",y1);
    line.setAttribute("x2",x2);
    line.setAttribute("y2",y2);
    line.setAttribute("stroke","white");
    line.setAttribute("stroke-width","10");
    line.setAttribute("stroke-linecap","round");

    svg.appendChild(line);
}

function endGame() {
    gameOver = true;
    document.getElementById("winnerText").textContent =
        currentPlayer === 1 ? "Player 1 Won!" :
        getMode() === "pvp" ? "Player 2 Won!" : "AI Won!";
    document.getElementById("modal").classList.remove("hidden");
}

/* ---------- MINIMAX ---------- */

function minimaxRoot(depth) {
    let bestScore = -Infinity;
    let bestMove = 0;

    for (let c = 0; c < COLS; c++) {
        const r = getAvailableRow(c);
        if (r === -1) continue;

        board[r][c] = 2;
        let score = minimax(depth-1,false);
        board[r][c] = 0;

        if (score > bestScore) {
            bestScore = score;
            bestMove = c;
        }
    }
    return bestMove;
}

function minimax(depth,isMax) {
    if (depth===0) return evaluate();

    if (isMax) {
        let max=-Infinity;
        for (let c=0;c<COLS;c++){
            const r=getAvailableRow(c);
            if(r===-1)continue;
            board[r][c]=2;
            max=Math.max(max,minimax(depth-1,false));
            board[r][c]=0;
        }
        return max;
    } else {
        let min=Infinity;
        for (let c=0;c<COLS;c++){
            const r=getAvailableRow(c);
            if(r===-1)continue;
            board[r][c]=1;
            min=Math.min(min,minimax(depth-1,true));
            board[r][c]=0;
        }
        return min;
    }
}

/* ---------- ALPHA BETA ---------- */

function alphaBetaRoot(depth){
    let bestScore=-Infinity;
    let bestMove=0;

    for(let c=0;c<COLS;c++){
        const r=getAvailableRow(c);
        if(r===-1)continue;
        board[r][c]=2;
        let score=alphaBeta(depth-1,-Infinity,Infinity,false);
        board[r][c]=0;

        if(score>bestScore){
            bestScore=score;
            bestMove=c;
        }
    }
    return bestMove;
}

function alphaBeta(depth,alpha,beta,isMax){
    if(depth===0)return evaluate();

    if(isMax){
        let value=-Infinity;
        for(let c=0;c<COLS;c++){
            const r=getAvailableRow(c);
            if(r===-1)continue;
            board[r][c]=2;
            value=Math.max(value,alphaBeta(depth-1,alpha,beta,false));
            board[r][c]=0;
            alpha=Math.max(alpha,value);
            if(alpha>=beta)break;
        }
        return value;
    }else{
        let value=Infinity;
        for(let c=0;c<COLS;c++){
            const r=getAvailableRow(c);
            if(r===-1)continue;
            board[r][c]=1;
            value=Math.min(value,alphaBeta(depth-1,alpha,beta,true));
            board[r][c]=0;
            beta=Math.min(beta,value);
            if(beta<=alpha)break;
        }
        return value;
    }
}

function evaluate() {
    let score = 0;

    // Center column preference
    const centerCol = Math.floor(COLS / 2);
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
        if (board[r][centerCol] === 2) centerCount++;
    }
    score += centerCount * 6;

    // Score all windows of 4
    function evaluateWindow(window) {
        let aiCount = window.filter(v => v === 2).length;
        let playerCount = window.filter(v => v === 1).length;
        let emptyCount = window.filter(v => v === 0).length;

        if (aiCount === 4) score += 100000;
        else if (aiCount === 3 && emptyCount === 1) score += 100;
        else if (aiCount === 2 && emptyCount === 2) score += 10;

        if (playerCount === 4) score -= 100000;
        else if (playerCount === 3 && emptyCount === 1) score -= 120;
    }

    // Horizontal windows
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            evaluateWindow([
                board[r][c],
                board[r][c+1],
                board[r][c+2],
                board[r][c+3]
            ]);
        }
    }

    // Vertical windows
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            evaluateWindow([
                board[r][c],
                board[r+1][c],
                board[r+2][c],
                board[r+3][c]
            ]);
        }
    }

    // Positive diagonal
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            evaluateWindow([
                board[r][c],
                board[r+1][c+1],
                board[r+2][c+2],
                board[r+3][c+3]
            ]);
        }
    }

    // Negative diagonal
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            evaluateWindow([
                board[r][c],
                board[r-1][c+1],
                board[r-2][c+2],
                board[r-3][c+3]
            ]);
        }
    }

    return score;
}

function resetGame(){
    gameOver=false;
    currentPlayer=1;
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("winLine").innerHTML="";
    initBoard();
    renderBoard();
    updateTurnIndicator();
}

initBoard();
renderBoard();
updateTurnIndicator();