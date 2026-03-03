const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 90;
const CENTER_OFFSET = 45;

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

    const row = getAvailableRow(col);
    if (row === -1) return;

    board[row][col] = currentPlayer;
    animateDrop(row, col, currentPlayer);
}

function animateDrop(row, col, player) {
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

    setTimeout(() => {
        disk.style.transform = "translateY(0)";
    }, 20);

    setTimeout(() => {
        isAnimating = false;

        const winCells = checkWin(row, col);
        if (winCells) {
            drawWinLine(winCells);
            endGame();
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateTurnIndicator();
        }
    }, 400);
}

function getAvailableRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) return r;
    }
    return -1;
}

function updateTurnIndicator() {
    const indicator = document.getElementById("turnIndicator");
    const text = document.getElementById("turnText");

    if (currentPlayer === 1) {
        indicator.className = "turn red";
        text.textContent = "Player 1";
    } else {
        indicator.className = "turn yellow";
        text.textContent = "Player 2";
    }
}

function checkWin(row, col) {
    const player = board[row][col];

    function collect(dx, dy) {
        let r = row;
        let c = col;
        let cells = [[r, c]];

        while (true) {
            r += dx;
            c += dy;
            if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
            cells.push([r,c]);
        }

        r = row;
        c = col;

        while (true) {
            r -= dx;
            c -= dy;
            if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
            cells.unshift([r,c]);
        }

        return cells.length >= 4 ? cells.slice(0,4) : null;
    }

    const dirs = [[0,1],[1,0],[1,1],[1,-1]];

    for (let [dx,dy] of dirs) {
        const result = collect(dx,dy);
        if (result) return result;
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

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "white");
    line.setAttribute("stroke-width", "10");
    line.setAttribute("stroke-linecap", "round");

    svg.appendChild(line);
}

function endGame() {
    gameOver = true;
    document.getElementById("winnerText").textContent =
        `Player ${currentPlayer} Won!`;
    document.getElementById("modal").classList.remove("hidden");
}

function resetGame() {
    gameOver = false;
    currentPlayer = 1;
    isAnimating = false;

    document.getElementById("modal").classList.add("hidden");
    document.getElementById("winLine").innerHTML = "";

    initBoard();
    renderBoard();
    updateTurnIndicator();
}

initBoard();
renderBoard();
updateTurnIndicator();