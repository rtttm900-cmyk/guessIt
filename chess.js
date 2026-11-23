/* =========================================================
   CHESS ARENA - MAIN GAME ENGINE
   Version 1.0
   ========================================================= */

"use strict";

/* =========================
   1. CONFIGURATION
========================= */

const CONFIG = {
    CHESS_LIBRARY:
        "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js",

    STORAGE_KEY: "chessArenaData",

    ROOM_LENGTH: 6,

    DEFAULT_TIME: 10 * 60,

    PIECES: {
        w: {
            k: "♔",
            q: "♕",
            r: "♖",
            b: "♗",
            n: "♘",
            p: "♙"
        },
        b: {
            k: "♚",
            q: "♛",
            r: "♜",
            b: "♝",
            n: "♞",
            p: "♟"
        }
    }
};


/* =========================
   2. GAME STATE
========================= */

let chess = null;

let gameMode = "local";

let selectedSquare = null;

let possibleMoves = [];

let playerColor = "w";

let boardFlipped = false;

let gameStarted = false;

let gameFinished = false;

let timerInterval = null;

let elapsedSeconds = 0;

let remainingSeconds = CONFIG.DEFAULT_TIME;

let currentRoomCode = null;

let aiDifficulty = "medium";

let aiThinking = false;

let moveCounter = 0;

let lastMove = null;


/* =========================
   3. DOM HELPERS
========================= */

const $ = id => document.getElementById(id);

function showElement(id) {
    const element = $(id);

    if (element) {
        element.style.display = "";
    }
}

function hideElement(id) {
    const element = $(id);

    if (element) {
        element.style.display = "none";
    }
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}

function getElement(id) {
    return $(id);
}


/* =========================
   4. LOAD CHESS LIBRARY
========================= */

function loadChessLibrary() {
    return new Promise((resolve, reject) => {

        if (typeof Chess !== "undefined") {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src = CONFIG.CHESS_LIBRARY;

        script.onload = () => {
            if (typeof Chess !== "undefined") {
                resolve();
            } else {
                reject(new Error("Chess library failed."));
            }
        };

        script.onerror = () => {
            reject(new Error("Could not load chess library."));
        };

        document.head.appendChild(script);
    });
}


/* =========================
   5. INITIALIZATION
========================= */

async function initializeChessArena() {

    try {

        await loadChessLibrary();

        chess = new Chess();

        createBoard();

        renderBoard();

        loadStatistics();

        bindEvents();

        updateInterface();

        console.log("Chess Arena initialized successfully.");

    } catch (error) {

        console.error(error);

        alert(
            "تعذر تحميل محرك الشطرنج. تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة."
        );
    }
}


/* =========================
   6. BOARD GENERATION
========================= */

function createBoard() {

    const board = $("chessboard");

    if (!board) {
        console.error("chessboard element not found.");
        return;
    }

    board.innerHTML = "";

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (let rank = 8; rank >= 1; rank--) {

        for (let file = 0; file < 8; file++) {

            const squareName = files[file] + rank;

            const square = document.createElement("div");

            const isLight = (rank + file) % 2 === 0;

            square.className =
                "square " + (isLight ? "light" : "dark");

            square.dataset.square = squareName;

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }
}


/* =========================
   7. BOARD RENDERING
========================= */

function renderBoard() {

    if (!chess) return;

    const boardElement = $("chessboard");

    if (!boardElement) return;

    const board = chess.board();

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    let squares = [];

    if (boardFlipped) {

        for (let rank = 0; rank < 8; rank++) {
            for (let file = 7; file >= 0; file--) {
                squares.push({
                    rank,
                    file
                });
            }
        }

    } else {

        for (let rank = 7; rank >= 0; rank--) {
            for (let file = 0; file < 8; file++) {
                squares.push({
                    rank,
                    file
                });
            }
        }
    }

    boardElement.innerHTML = "";

    squares.forEach(({ rank, file }) => {

        const squareName = files[file] + (rank + 1);

        const piece = board[7 - rank][file];

        const square = document.createElement("div");

        const isLight = (rank + file) % 2 === 1;

        square.className =
            "square " + (isLight ? "light" : "dark");

        square.dataset.square = squareName;

        if (piece) {

            const pieceElement = document.createElement("span");

            pieceElement.className =
                "piece " + (piece.color === "w" ? "white-piece" : "black-piece");

            pieceElement.textContent =
                CONFIG.PIECES[piece.color][piece.type];

            square.appendChild(pieceElement);
        }

        if (selectedSquare === squareName) {
            square.classList.add("selected");
        }

        if (possibleMoves.some(move => move.to === squareName)) {
            square.classList.add("legal-move");
        }

        if (
            lastMove &&
            (lastMove.from === squareName || lastMove.to === squareName)
        ) {
            square.classList.add("last-move");
        }

        square.addEventListener("click", () => {
            handleSquareClick(squareName);
        });

        boardElement.appendChild(square);
    });

    updateInterface();
}


/* =========================
   8. SQUARE INTERACTION
========================= */

function handleSquareClick(squareName) {

    if (!chess || gameFinished || aiThinking) return;

    if (!gameStarted) return;

    if (
        gameMode === "ai" &&
        chess.turn() !== playerColor
    ) {
        return;
    }

    const piece = chess.get(squareName);

    if (selectedSquare) {

        const validMove = possibleMoves.find(
            move => move.to === squareName
        );

        if (validMove) {

            makeMove(selectedSquare, squareName);

            return;
        }
    }

    if (piece && piece.color === chess.turn()) {

        selectedSquare = squareName;

        possibleMoves = chess.moves({
            square: squareName,
            verbose: true
        });

        renderBoard();

        return;
    }

    selectedSquare = null;

    possibleMoves = [];

    renderBoard();
}


/* =========================
   9. MAKE MOVE
========================= */

function makeMove(from, to) {

    if (!chess || gameFinished) return;

    const movingPiece = chess.get(from);

    if (!movingPiece) return;

    let promotion = "q";

    if (
        movingPiece.type === "p" &&
        (to.endsWith("8") || to.endsWith("1"))
    ) {

        const choice = prompt(
            "اختر الترقية:\nq = وزير\nr = قلعة\nb = فيل\nn = حصان",
            "q"
        );

        const selected = String(choice || "q").toLowerCase();

        promotion = ["q", "r", "b", "n"].includes(selected)
            ? selected
            : "q";
    }

    let move;

    try {

        move = chess.move({
            from,
            to,
            promotion
        });

    } catch (error) {

        console.error("Move error:", error);

        return;
    }

    if (!move) return;

    lastMove = move;

    moveCounter++;

    selectedSquare = null;

    possibleMoves = [];

    renderBoard();

    updateMoveHistory();

    updateStatistics();

    checkGameStatus();

    if (
        gameMode === "ai" &&
        !gameFinished &&
        chess.turn() !== playerColor
    ) {
        setTimeout(makeComputerMove, 450);
    }
}


/* =========================
   10. COMPUTER ENGINE
========================= */

function evaluateMove(move) {

    let score = 0;

    const values = {
        p: 100,
        n: 320,
        b: 330,
        r: 500,
        q: 900,
        k: 20000
    };

    if (move.captured) {
        score += values[move.captured] || 0;
    }

    if (move.promotion) {
        score += values[move.promotion] || 0;
    }

    if (move.san.includes("+")) {
        score += 40;
    }

    if (move.san.includes("#")) {
        score += 100000;
    }

    score += Math.random() * 15;

    return score;
}


function makeComputerMove() {

    if (
        !chess ||
        gameFinished ||
        gameMode !== "ai" ||
        aiThinking
    ) {
        return;
    }

    aiThinking = true;

    const legalMoves = chess.moves({
        verbose: true
    });

    if (!legalMoves.length) {

        aiThinking = false;

        checkGameStatus();

        return;
    }

    let selectedMove;

    if (aiDifficulty === "easy") {

        selectedMove =
            legalMoves[Math.floor(Math.random() * legalMoves.length)];

    } else {

        const rankedMoves = legalMoves
            .map(move => ({
                move,
                score: evaluateMove(move)
            }))
            .sort((a, b) => b.score - a.score);

        if (aiDifficulty === "hard") {

            const topMoves = rankedMoves.slice(
                0,
                Math.min(3, rankedMoves.length)
            );

            selectedMove =
                topMoves[Math.floor(Math.random() * topMoves.length)].move;

        } else {

            const topMoves = rankedMoves.slice(
                0,
                Math.min(5, rankedMoves.length)
            );

            selectedMove =
                topMoves[Math.floor(Math.random() * topMoves.length)].move;
        }
    }

    const result = chess.move({
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: "q"
    });

    lastMove = result;

    moveCounter++;

    aiThinking = false;

    renderBoard();

    updateMoveHistory();

    updateStatistics();

    checkGameStatus();
}


/* =========================
   11. GAME TIMER
========================= */

function startTimer() {

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    if (gameStarted) return;

    gameStarted = true;

    timerInterval = setInterval(() => {

        if (gameFinished) return;

        elapsedSeconds++;

        remainingSeconds--;

        updateTimer();

        if (remainingSeconds <= 0) {

            remainingSeconds = 0;

            finishGame("timeout");
        }

    }, 1000);
}


function stopTimer() {

    if (timerInterval) {
        clearInterval(timerInterval);

        timerInterval = null;
    }
}


function updateTimer() {

    const minutes = Math.floor(elapsedSeconds / 60);

    const seconds = elapsedSeconds % 60;

    const formatted =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

    setText("game-timer", formatted);
}


/* =========================
   12. MOVE HISTORY
========================= */

function updateMoveHistory() {

    const historyElement = $("move-history");

    if (!historyElement) return;

    const history = chess.history();

    historyElement.innerHTML = "";

    for (let i = 0; i < history.length; i += 2) {

        const row = document.createElement("div");

        row.className = "move-row";

        const number = document.createElement("span");

        number.textContent = (Math.floor(i / 2) + 1) + ".";

        const whiteMove = document.createElement("span");

        whiteMove.textContent = history[i] || "";

        const blackMove = document.createElement("span");

        blackMove.textContent = history[i + 1] || "";

        row.append(number, whiteMove, blackMove);

        historyElement.appendChild(row);
    }

    historyElement.scrollTop = historyElement.scrollHeight;

    moveCounter = history.length;

    setText("move-counter", moveCounter);
}


/* =========================
   13. GAME STATUS
========================= */

function checkGameStatus() {

    if (!chess) return;

    if (chess.in_checkmate()) {

        finishGame("checkmate");

        return;
    }

    if (chess.in_stalemate()) {

        finishGame("draw");

        return;
    }

    if (chess.in_threefold_repetition()) {

        finishGame("draw");

        return;
    }

    if (chess.insufficient_material()) {

        finishGame("draw");

        return;
    }

    if (chess.in_draw()) {

        finishGame("draw");

        return;
    }

    if (chess.in_check()) {

        setText("game-status", "كش!");

    } else {

        setText(
            "game-status",
            chess.turn() === "w"
                ? "دور الأبيض"
                : "دور الأسود"
        );
    }
}


/* =========================
   14. FINISH GAME
========================= */

function finishGame(reason) {

    if (gameFinished) return;

    gameFinished = true;

    stopTimer();

    let title = "";

    let message = "";

    if (reason === "checkmate") {

        title = "كش ملك!";

        message =
            chess.turn() === "w"
                ? "فاز الأسود!"
                : "فاز الأبيض!";

    } else if (reason === "timeout") {

        title = "انتهى الوقت";

        message = "انتهى الوقت المحدد للمباراة.";

    } else {

        title = "تعادل";

        message = "انتهت المباراة بالتعادل.";
    }

    setText("result-title", title);

    setText("result-message", message);

    showElement("game-result");

    setText("game-status", title);

    saveMatch(reason);
}


/* =========================
   15. NEW GAME
========================= */

function startNewGame(mode = "local") {

    if (!chess) return;

    stopTimer();

    chess = new Chess();

    gameMode = mode;

    selectedSquare = null;

    possibleMoves = [];

    lastMove = null;

    moveCounter = 0;

    elapsedSeconds = 0;

    remainingSeconds = CONFIG.DEFAULT_TIME;

    gameStarted = false;

    gameFinished = false;

    aiThinking = false;

    updateTimer();

    hideElement("game-result");

    renderBoard();

    updateMoveHistory();

    setText("game-status", "المباراة جاهزة");

    startTimer();

    if (mode === "ai" && playerColor === "b") {

        setTimeout(makeComputerMove, 500);
    }
}


/* =========================
   16. UNDO MOVE
========================= */

function undoMove() {

    if (!chess || gameFinished) return;

    if (gameMode === "ai") {

        chess.undo();

        if (chess.history().length > 0) {
            chess.undo();
        }

    } else {

        chess.undo();
    }

    lastMove = null;

    selectedSquare = null;

    possibleMoves = [];

    renderBoard();

    updateMoveHistory();

    setText("game-status", "تم التراجع عن النقلة");
}


/* =========================
   17. FLIP BOARD
========================= */

function flipBoard() {

    boardFlipped = !boardFlipped;

    renderBoard();
}


/* =========================
   18. RESTART GAME
========================= */

function restartGame() {

    if (!confirm("هل تريد إعادة المباراة؟")) {
        return;
    }

    startNewGame(gameMode);
}


/* =========================
   19. PRIVATE ROOM SYSTEM
========================= */

function generateRoomCode() {

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < CONFIG.ROOM_LENGTH; i++) {

        code += characters[
            Math.floor(Math.random() * characters.length)
        ];
    }

    return code;
}


function createRoom() {

    currentRoomCode = generateRoomCode();

    setText("room-code-display", currentRoomCode);

    setText(
        "room-status",
        "تم إنشاء رمز الغرفة. تحتاج الغرفة إلى خدمة اتصال لمزامنة اللاعبين."
    );

    showElement("room-info");

    console.log("Room code:", currentRoomCode);
}


function joinRoom() {

    const input = $("room-code");

    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (code.length !== CONFIG.ROOM_LENGTH) {

        alert("تأكد من إدخال رمز غرفة صحيح.");

        return;
    }

    currentRoomCode = code;

    setText(
        "room-status",
        "تم قبول الرمز محلياً. الاتصال بجهاز صاحب الغرفة يحتاج خدمة Realtime."
    );

    showElement("room-info");
}


async function copyRoomCode() {

    if (!currentRoomCode) return;

    try {

        await navigator.clipboard.writeText(currentRoomCode);

        setText("room-status", "تم نسخ رمز الغرفة!");

    } catch (error) {

        alert("رمز الغرفة: " + currentRoomCode);
    }
}


/* =========================
   20. LOCAL STATISTICS
========================= */

function getStatistics() {

    try {

        return JSON.parse(
            localStorage.getItem(CONFIG.STORAGE_KEY)
        ) || {
            games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMoves: 0,
            history: []
        };

    } catch (error) {

        return {
            games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMoves: 0,
            history: []
        };
    }
}


function saveStatistics(data) {

    localStorage.setItem(
        CONFIG.STORAGE_KEY,
        JSON.stringify(data)
    );
}


function updateStatistics() {

    const stats = getStatistics();

    setText("total-moves", stats.totalMoves);

    setText("total-games", stats.games);

    setText("total-wins", stats.wins);

    setText("total-losses", stats.losses);
}


function loadStatistics() {

    updateStatistics();
}


function saveMatch(reason) {

    const stats = getStatistics();

    stats.games++;

    stats.totalMoves += chess.history().length;

    if (reason === "draw") {

        stats.draws++;

    } else if (reason === "checkmate") {

        const winner = chess.turn() === "w" ? "b" : "w";

        if (winner === playerColor) {
            stats.wins++;
        } else {
            stats.losses++;
        }
    }

    stats.history.unshift({

        date: new Date().toLocaleString("ar-SA"),

        mode: gameMode,

        result: reason,

        moves: chess.history().length,

        duration: elapsedSeconds
    });

    stats.history = stats.history.slice(0, 50);

    saveStatistics(stats);

    updateStatistics();
}


/* =========================
   21. GAME INTERFACE
========================= */

function updateInterface() {

    if (!chess) return;

    const turn = chess.turn();

    if (turn === "w") {

        setText("player-label", "الأبيض");

        setText("opponent-label", "الأسود");

    } else {

        setText("player-label", "الأسود");

        setText("opponent-label", "الأبيض");
    }

    setText("move-counter", chess.history().length);
}


/* =========================
   22. EVENT BINDINGS
========================= */

function bindEvents() {

    $("ai-mode")?.addEventListener("click", () => {
        showElement("ai-settings");
        hideElement("game-menu");
    });

    $("online-mode")?.addEventListener("click", () => {
        showElement("online-settings");
        hideElement("game-menu");
    });

    $("back-from-ai")?.addEventListener("click", () => {
        hideElement("ai-settings");
        showElement("game-menu");
    });

    $("back-from-online")?.addEventListener("click", () => {
        hideElement("online-settings");
        showElement("game-menu");
    });

    $("start-ai-game")?.addEventListener("click", () => {

        aiDifficulty =
            $("ai-difficulty")?.value || "medium";

        playerColor =
            $("player-color")?.value || "w";

        hideElement("ai-settings");

        showElement("chess-game");

        startNewGame("ai");
    });

    $("create-room")?.addEventListener("click", createRoom);

    $("join-room")?.addEventListener("click", joinRoom);

    $("copy-room-code")?.addEventListener("click", copyRoomCode);

    $("undo-move")?.addEventListener("click", undoMove);

    $("flip-board")?.addEventListener("click", flipBoard);

    $("restart-game")?.addEventListener("click", restartGame);

    $("exit-game")?.addEventListener("click", () => {

        stopTimer();

        hideElement("chess-game");

        showElement("game-menu");
    });

    $("play-again")?.addEventListener("click", () => {

        hideElement("game-result");

        startNewGame(gameMode);
    });
}


/* =========================
   23. KEYBOARD SHORTCUTS
========================= */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        selectedSquare = null;

        possibleMoves = [];

        renderBoard();
    }

    if (
        event.ctrlKey &&
        event.key.toLowerCase() === "z"
    ) {

        undoMove();
    }
});


/* =========================
   24. START APPLICATION
========================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeChessArena
    );

} else {

    initializeChessArena();
}