/* =========================================================
   CHESS ARENA
   ADVANCED GAME ENGINE
   Compatible with chess.html
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION
========================================================= */

const CONFIG = {
    STORAGE_KEY: "chessArenaData",
    ROOM_LENGTH: 6,
    DEFAULT_TIME: 5 * 60,

    PIECES: {
        w: {
            k: "♔", q: "♕", r: "♖",
            b: "♗", n: "♘", p: "♙"
        },
        b: {
            k: "♚", q: "♛", r: "♜",
            b: "♝", n: "♞", p: "♟"
        }
    }
};


/* =========================================================
   2. GAME STATE
========================================================= */

let chess = null;

let gameMode = "local";

let selectedSquare = null;

let possibleMoves = [];

let playerColor = "w";

let boardFlipped = false;

let gameStarted = false;

let gameFinished = false;

let aiThinking = false;

let timerInterval = null;

let aiTimeout = null;

let elapsedSeconds = 0;

let initialTime = CONFIG.DEFAULT_TIME;

let whiteTime = CONFIG.DEFAULT_TIME;

let blackTime = CONFIG.DEFAULT_TIME;

let aiDifficulty = "medium";

let moveCounter = 0;

let lastMove = null;

let currentRoomCode = null;

let pendingPromotion = null;

let matchSaved = false;

let soundEnabled = true;

let settings = {
    sound: true,
    highlights: true,
    lastMove: true,
    coordinates: true
};


/* =========================================================
   3. DOM HELPERS
========================================================= */

const $ = id => document.getElementById(id);

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}

function showElement(id) {
    const element = $(id);

    if (!element) return;

    element.classList.remove("hidden");
    element.style.display = "";
}

function hideElement(id) {
    const element = $(id);

    if (!element) return;

    element.classList.add("hidden");
}

function formatTime(seconds) {
    seconds = Math.max(0, seconds);

    const minutes = Math.floor(seconds / 60);

    const remaining = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}

function showToast(message, type = "success") {
    const container = $("toastContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = "toast toast-" + type;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showModal(id) {
    showElement(id);
}

function closeModal(id) {
    hideElement(id);
}


/* =========================================================
   4. INITIALIZATION
========================================================= */

async function initializeChessArena() {

    try {

        if (typeof Chess === "undefined") {
            throw new Error("Chess.js library is unavailable.");
        }

        chess = new Chess();

        createBoard();

        loadStatistics();

        bindEvents();

        updateInterface();

        updateTimer();

        updateMoveHistory();

        console.log("CHESS ARENA initialized.");

    } catch (error) {

        console.error(error);

        alert("تعذر تشغيل محرك الشطرنج. تحقق من اتصال الإنترنت.");
    }
}


/* =========================================================
   5. NAVIGATION
========================================================= */

function navigateTo(page) {

    document.querySelectorAll(".app-page").forEach(section => {
        section.classList.remove("active");
    });

    const target = $("page-" + page);

    if (!target) return;

    target.classList.add("active");

    document.querySelectorAll("[data-page]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });

    if (page === "stats") {
        updateStatistics();
        renderRecentGames();
    }

    if (page === "history") {
        renderFullHistory();
    }

    if (page === "play") {
        updateInterface();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   6. BOARD GENERATION
========================================================= */

function createBoard() {

    const board = $("chessBoard");

    if (!board) {
        console.error("chessBoard not found.");
        return;
    }

    renderBoard();
}


function renderBoard() {

    if (!chess) return;

    const boardElement = $("chessBoard");

    if (!boardElement) return;

    boardElement.innerHTML = "";

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks = boardFlipped
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [8, 7, 6, 5, 4, 3, 2, 1];

    const orderedFiles = boardFlipped
        ? [...files].reverse()
        : files;

    ranks.forEach(rank => {

        orderedFiles.forEach(file => {

            const squareName = file + rank;

            const piece = chess.get(squareName);

            const fileIndex = files.indexOf(file);

            const isLight = (fileIndex + rank) % 2 === 0;

            const square = document.createElement("div");

            square.className =
                "square " + (isLight ? "light" : "dark");

            square.dataset.square = squareName;

            square.setAttribute("role", "gridcell");

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (
                settings.highlights &&
                possibleMoves.some(move => move.to === squareName)
            ) {
                square.classList.add("legal-move");
            }

            if (
                settings.lastMove &&
                lastMove &&
                (
                    lastMove.from === squareName ||
                    lastMove.to === squareName
                )
            ) {
                square.classList.add("last-move");
            }

            if (piece) {

                const pieceElement = document.createElement("span");

                pieceElement.className =
                    "piece " +
                    (piece.color === "w"
                        ? "white-piece"
                        : "black-piece");

                pieceElement.textContent =
                    CONFIG.PIECES[piece.color][piece.type];

                square.appendChild(pieceElement);
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            boardElement.appendChild(square);
        });

    });

    updateInterface();
    updateKingStatus();
}


/* =========================================================
   7. SQUARE INTERACTION
========================================================= */

function handleSquareClick(squareName) {

    if (!chess || !gameStarted || gameFinished || aiThinking) {
        return;
    }

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

            if (validMove.promotion) {
                openPromotionModal(selectedSquare, squareName);
            } else {
                makeMove(selectedSquare, squareName);
            }

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


/* =========================================================
   8. PAWN PROMOTION
========================================================= */

function openPromotionModal(from, to) {

    pendingPromotion = { from, to };

    showModal("promotionModal");
}


function completePromotion(type) {

    if (!pendingPromotion) return;

    const { from, to } = pendingPromotion;

    pendingPromotion = null;

    closeModal("promotionModal");

    makeMove(from, to, type);
}


/* =========================================================
   9. MAKE MOVE
========================================================= */

function makeMove(from, to, promotion = "q") {

    if (!chess || gameFinished || !gameStarted) return;

    let move;

    try {

        move = chess.move({
            from,
            to,
            promotion
        });

    } catch (error) {

        console.error(error);

        return;
    }

    if (!move) return;

    lastMove = move;

    moveCounter = chess.history().length;

    selectedSquare = null;

    possibleMoves = [];

    playMoveSound();

    renderBoard();

    updateMoveHistory();

    updateTimer();

    checkGameStatus();

    if (
        gameMode === "ai" &&
        !gameFinished &&
        chess.turn() !== playerColor
    ) {

        aiTimeout = setTimeout(() => {
            makeComputerMove();
        }, 500);
    }
}


/* =========================================================
   10. COMPUTER ENGINE
========================================================= */

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};


function evaluateMove(move) {

    let score = Math.random() * 10;

    if (move.captured) {
        score += PIECE_VALUES[move.captured] || 0;
    }

    if (move.promotion) {
        score += PIECE_VALUES[move.promotion] || 0;
    }

    if (move.san.includes("+")) {
        score += 50;
    }

    if (move.san.includes("#")) {
        score += 100000;
    }

    return score;
}


function makeComputerMove() {

    if (
        !chess ||
        gameFinished ||
        !gameStarted ||
        gameMode !== "ai" ||
        aiThinking
    ) {
        return;
    }

    if (chess.turn() === playerColor) return;

    aiThinking = true;

    const legalMoves = chess.moves({
        verbose: true
    });

    if (!legalMoves.length) {

        aiThinking = false;

        checkGameStatus();

        return;
    }

    const rankedMoves = legalMoves
        .map(move => ({
            move,
            score: evaluateMove(move)
        }))
        .sort((a, b) => b.score - a.score);

    let selectedMove;

    if (aiDifficulty === "easy") {

        selectedMove =
            legalMoves[Math.floor(Math.random() * legalMoves.length)];

    } else if (aiDifficulty === "medium") {

        const candidates = rankedMoves.slice(
            0,
            Math.min(8, rankedMoves.length)
        );

        selectedMove =
            candidates[Math.floor(Math.random() * candidates.length)].move;

    } else if (aiDifficulty === "hard") {

        const candidates = rankedMoves.slice(
            0,
            Math.min(4, rankedMoves.length)
        );

        selectedMove =
            candidates[Math.floor(Math.random() * candidates.length)].move;

    } else {

        selectedMove = rankedMoves[0].move;
    }

    const result = chess.move({
        from: selectedMove.from,
        to: selectedMove.to,
        promotion: "q"
    });

    if (result) {

        lastMove = result;

        moveCounter = chess.history().length;

        playMoveSound();

        renderBoard();

        updateMoveHistory();

        checkGameStatus();
    }

    aiThinking = false;

    updateInterface();
}


/* =========================================================
   11. TIMER SYSTEM
========================================================= */

function startTimer() {

    stopTimer();

    if (!gameStarted || gameFinished) return;

    timerInterval = setInterval(() => {

        if (gameFinished) return;

        elapsedSeconds++;

        if (chess.turn() === "w") {
            whiteTime--;
        } else {
            blackTime--;
        }

        updateTimer();

        if (whiteTime <= 0) {

            whiteTime = 0;

            finishGame("timeout", "b");

            return;
        }

        if (blackTime <= 0) {

            blackTime = 0;

            finishGame("timeout", "w");
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

    setText("gameDuration", formatTime(elapsedSeconds));

    setText("whiteClock", formatTime(whiteTime));

    setText("blackClock", formatTime(blackTime));

    setText("moveCounter", chess ? chess.history().length : 0);

    const whiteClock = $("whiteClock");

    const blackClock = $("blackClock");

    if (whiteClock && blackClock && chess) {

        whiteClock.classList.toggle(
            "active-clock",
            gameStarted && chess.turn() === "w" && !gameFinished
        );

        blackClock.classList.toggle(
            "active-clock",
            gameStarted && chess.turn() === "b" && !gameFinished
        );
    }
}


/* =========================================================
   12. MOVE HISTORY
========================================================= */

function updateMoveHistory() {

    const container = $("moveHistory");

    if (!container || !chess) return;

    const history = chess.history();

    container.innerHTML = "";

    if (history.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty-history";

        empty.innerHTML =
            "<span>♟</span><p>لم تبدأ أي نقلة بعد</p>";

        container.appendChild(empty);

    } else {

        for (let i = 0; i < history.length; i += 2) {

            const row = document.createElement("div");

            row.className = "move-row";

            const number = document.createElement("span");

            number.textContent = (Math.floor(i / 2) + 1) + ".";

            const white = document.createElement("span");

            white.textContent = history[i] || "";

            const black = document.createElement("span");

            black.textContent = history[i + 1] || "";

            row.append(number, white, black);

            container.appendChild(row);
        }
    }

    container.scrollTop = container.scrollHeight;

    moveCounter = history.length;

    setText("historyCount", history.length);

    setText("moveCounter", history.length);
}


/* =========================================================
   13. GAME STATUS
========================================================= */

function checkGameStatus() {

    if (!chess) return;

    if (chess.in_checkmate()) {

        const winner = chess.turn() === "w" ? "b" : "w";

        finishGame("checkmate", winner);

        return;
    }

    if (
        chess.in_stalemate() ||
        chess.in_threefold_repetition() ||
        chess.insufficient_material() ||
        chess.in_draw()
    ) {

        finishGame("draw");

        return;
    }

    if (chess.in_check()) {

        setText("gameStatus", "كش!");

    } else {

        setText(
            "gameStatus",
            chess.turn() === "w"
                ? "دور الأبيض"
                : "دور الأسود"
        );
    }

    updateKingStatus();
}


function updateKingStatus() {

    if (!chess) return;

    setText(
        "kingStatus",
        chess.in_check() ? "الملك في كش!" : "آمن"
    );

    setText(
        "currentTurn",
        chess.turn() === "w" ? "الأبيض" : "الأسود"
    );

    if (lastMove) {

        setText(
            "lastMove",
            lastMove.from + " → " + lastMove.to
        );

    } else {

        setText("lastMove", "—");
    }
}


/* =========================================================
   14. FINISH GAME
========================================================= */

function finishGame(reason, winner = null) {

    if (gameFinished) return;

    gameFinished = true;

    stopTimer();

    if (aiTimeout) {
        clearTimeout(aiTimeout);
        aiTimeout = null;
    }

    aiThinking = false;

    let title = "انتهت المباراة";

    let description = "";

    if (reason === "checkmate") {

        title = "كش ملك!";

        description =
            winner === "w"
                ? "فاز الأبيض!"
                : "فاز الأسود!";

    } else if (reason === "timeout") {

        title = "انتهى الوقت";

        description =
            winner === "w"
                ? "فاز الأبيض بالوقت!"
                : "فاز الأسود بالوقت!";

    } else if (reason === "resign") {

        title = "استسلام";

        description =
            winner === "w"
                ? "فاز الأبيض!"
                : "فاز الأسود!";

    } else {

        title = "تعادل";

        description = "انتهت المباراة بالتعادل.";
    }

    setText("resultTitle", title);

    setText("resultDescription", description);

    setText("resultDuration", formatTime(elapsedSeconds));

    setText("resultMoves", chess.history().length);

    setText("gameStatus", title);

    setText("resultIcon", reason === "draw" ? "＝" : "♔");

    showModal("resultModal");

    saveMatch(reason, winner);

    renderBoard();
}


/* =========================================================
   15. NEW GAME
========================================================= */

function startNewGame(mode = "local", options = {}) {

    if (!chess) return;

    stopTimer();

    if (aiTimeout) {
        clearTimeout(aiTimeout);
        aiTimeout = null;
    }

    closeModal("resultModal");

    closeModal("newGameModal");

    chess = new Chess();

    gameMode = mode;

    selectedSquare = null;

    possibleMoves = [];

    lastMove = null;

    moveCounter = 0;

    elapsedSeconds = 0;

    gameStarted = true;

    gameFinished = false;

    aiThinking = false;

    matchSaved = false;

    boardFlipped = playerColor === "b" && mode === "ai";

    initialTime = options.time || CONFIG.DEFAULT_TIME;

    whiteTime = initialTime;

    blackTime = initialTime;

    if (mode === "ai") {

        setText("currentGameMode", "ضد الكمبيوتر");

        setText(
            "whitePlayerName",
            playerColor === "w" ? "أنت" : "الكمبيوتر"
        );

        setText(
            "blackPlayerName",
            playerColor === "b" ? "أنت" : "الكمبيوتر"
        );

    } else if (mode === "room") {

        setText("currentGameMode", "غرفة خاصة");

    } else {

        setText("currentGameMode", "لاعب ضد لاعب");
    }

    navigateTo("play");

    setText("gameStatus", "المباراة بدأت");

    renderBoard();

    updateMoveHistory();

    updateTimer();

    startTimer();

    if (mode === "ai" && playerColor === "b") {

        aiTimeout = setTimeout(() => {
            makeComputerMove();
        }, 500);
    }
}


/* =========================================================
   16. UNDO MOVE
========================================================= */

function undoMove() {

    if (!chess || gameFinished || !gameStarted) return;

    if (aiThinking) return;

    if (chess.history().length === 0) {

        showToast("لا توجد نقلات للتراجع عنها.", "error");

        return;
    }

    if (gameMode === "ai") {

        chess.undo();

        if (chess.history().length > 0) {
            chess.undo();
        }

    } else {

        chess.undo();
    }

    selectedSquare = null;

    possibleMoves = [];

    lastMove = chess.history({
        verbose: true
    }).slice(-1)[0] || null;

    moveCounter = chess.history().length;

    renderBoard();

    updateMoveHistory();

    updateInterface();

    checkGameStatus();

    showToast("تم التراجع عن النقلة.");
}


/* =========================================================
   17. FLIP BOARD
========================================================= */

function flipBoard() {

    boardFlipped = !boardFlipped;

    renderBoard();

    showToast("تم قلب الرقعة.");
}


/* =========================================================
   18. RESTART GAME
========================================================= */

function restartGame() {

    if (!confirm("هل تريد إعادة المباراة؟")) return;

    startNewGame(gameMode, {
        time: initialTime
    });
}


/* =========================================================
   19. RESIGN
========================================================= */

function resignGame() {

    if (!gameStarted || gameFinished) return;

    if (!confirm("هل أنت متأكد أنك تريد الاستسلام؟")) return;

    const winner = chess.turn() === "w" ? "b" : "w";

    finishGame("resign", winner);
}


/* =========================================================
   20. COMPUTER SETTINGS
========================================================= */

function configureComputerGame() {

    const level = document.querySelector(
        ".difficulty-card.active"
    );

    const color = document.querySelector(
        ".color-option.active"
    );

    const time = document.querySelector(
        ".time-option.active"
    );

    const difficultyMap = {
        "1": "easy",
        "2": "medium",
        "3": "hard",
        "4": "expert"
    };

    aiDifficulty = difficultyMap[
        level?.dataset.level || "2"
    ];

    let selectedColor = color?.dataset.color || "white";

    if (selectedColor === "random") {
        playerColor = Math.random() < 0.5 ? "w" : "b";
    } else {
        playerColor = selectedColor === "black" ? "b" : "w";
    }

    const minutes = Number(time?.dataset.time || 5);

    startNewGame("ai", {
        time: minutes * 60
    });
}


/* =========================================================
   21. PRIVATE ROOMS
========================================================= */

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

    setText("generatedRoomCode", currentRoomCode);

    showElement("createdRoomCard");

    showToast("تم إنشاء رمز الغرفة.");

}


async function copyRoomCode() {

    if (!currentRoomCode) return;

    try {

        await navigator.clipboard.writeText(currentRoomCode);

        showToast("تم نسخ رمز الغرفة!");

    } catch (error) {

        showToast("تعذر النسخ. الرمز: " + currentRoomCode, "error");
    }
}


function joinRoom() {

    const input = $("roomCodeInput");

    if (!input) return;

    const code = input.value.trim().toUpperCase();

    if (code.length !== CONFIG.ROOM_LENGTH) {

        showToast("رمز الغرفة يجب أن يتكون من 6 أحرف.", "error");

        return;
    }

    currentRoomCode = code;

    showToast(
        "تم التحقق من صيغة الرمز. اللعب مع صديق يحتاج خادم اتصال مشترك.",
        "error"
    );
}


/* =========================================================
   22. STATISTICS
========================================================= */

function getStatistics() {

    const defaults = {
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalMoves: 0,
        history: []
    };

    try {

        const saved = JSON.parse(
            localStorage.getItem(CONFIG.STORAGE_KEY)
        );

        return {
            ...defaults,
            ...(saved || {}),
            history: saved?.history || []
        };

    } catch (error) {

        return defaults;
    }
}


function saveStatistics(data) {

    try {

        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error("Could not save statistics:", error);
    }
}


function updateStatistics() {

    const stats = getStatistics();

    const elements = {
        totalGames: stats.games,
        totalWins: stats.wins,
        totalLosses: stats.losses,
        totalDraws: stats.draws,

        statsGames: stats.games,
        statsWins: stats.wins,
        statsLosses: stats.losses,
        statsDraws: stats.draws
    };

    Object.entries(elements).forEach(([id, value]) => {
        setText(id, value);
    });
}


function loadStatistics() {
    updateStatistics();
}


function saveMatch(reason, winner = null) {

    if (matchSaved) return;

    matchSaved = true;

    const stats = getStatistics();

    stats.games++;

    stats.totalMoves += chess.history().length;

    let result = "draw";

    if (reason === "draw") {

        stats.draws++;

    } else {

        if (winner === playerColor || (
            gameMode === "local" && winner === "w"
        )) {

            stats.wins++;

            result = "win";

        } else {

            stats.losses++;

            result = "loss";
        }
    }

    stats.history.unshift({

        date: new Date().toLocaleString("ar-SA"),

        mode: gameMode,

        result,

        moves: chess.history().length,

        duration: elapsedSeconds
    });

    stats.history = stats.history.slice(0, 50);

    saveStatistics(stats);

    updateStatistics();

    renderRecentGames();
}


/* =========================================================
   23. MATCH HISTORY
========================================================= */

function renderRecentGames() {

    const container = $("recentGamesList");

    if (!container) return;

    const stats = getStatistics();

    container.innerHTML = "";

    if (!stats.history.length) {

        container.innerHTML =
            '<div class="empty-history">لا توجد مباريات مسجلة حالياً.</div>';

        return;
    }

    stats.history.slice(0, 5).forEach(game => {

        const row = document.createElement("div");

        row.className = "move-row";

        const date = document.createElement("span");

        date.textContent = game.date;

        const result = document.createElement("strong");

        result.textContent =
            game.result === "win"
                ? "فوز"
                : game.result === "loss"
                    ? "خسارة"
                    : "تعادل";

        const moves = document.createElement("span");

        moves.textContent = game.moves + " نقلة";

        row.append(date, result, moves);

        container.appendChild(row);
    });
}


function renderFullHistory() {

    const container = $("fullMatchHistory");

    if (!container) return;

    const stats = getStatistics();

    container.innerHTML = "";

    if (!stats.history.length) {

        container.innerHTML =
            '<div class="empty-history">لا توجد مباريات سابقة.</div>';

        return;
    }

    stats.history.forEach(game => {

        const row = document.createElement("div");

        row.className = "move-row";

        const date = document.createElement("span");

        date.textContent = game.date;

        const result = document.createElement("strong");

        result.textContent =
            game.result === "win"
                ? "فوز"
                : game.result === "loss"
                    ? "خسارة"
                    : "تعادل";

        const details = document.createElement("span");

        details.textContent =
            game.moves + " نقلة | " + formatTime(game.duration);

        row.append(date, result, details);

        container.appendChild(row);
    });
}


/* =========================================================
   24. PGN EXPORT
========================================================= */

async function copyPGN() {

    if (!chess) return;

    const pgn = chess.pgn();

    if (!pgn) {

        showToast("لا توجد نقلات لنسخها.", "error");

        return;
    }

    try {

        await navigator.clipboard.writeText(pgn);

        showToast("تم نسخ سجل المباراة!");

    } catch (error) {

        showToast("تعذر نسخ سجل المباراة.", "error");
    }
}


/* =========================================================
   25. SOUND
========================================================= */

function playMoveSound() {

    if (!soundEnabled || !settings.sound) return;

    try {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const context = new AudioContextClass();

        const oscillator = context.createOscillator();

        const gain = context.createGain();

        oscillator.connect(gain);

        gain.connect(context.destination);

        oscillator.frequency.value = 420;

        gain.gain.value = 0.035;

        oscillator.start();

        oscillator.stop(context.currentTime + 0.07);

        oscillator.onended = () => {
            context.close();
        };

    } catch (error) {

        console.warn("Audio unavailable.");
    }
}


/* =========================================================
   26. SETTINGS
========================================================= */

function openSettings() {

    const sound = $("pieceSoundSetting");

    const highlights = $("highlightSetting");

    const last = $("lastMoveSetting");

    const coordinates = $("coordinatesSetting");

    if (sound) sound.checked = settings.sound;

    if (highlights) highlights.checked = settings.highlights;

    if (last) last.checked = settings.lastMove;

    if (coordinates) coordinates.checked = settings.coordinates;

    showModal("settingsModal");
}


function saveSettings() {

    settings.sound = $("pieceSoundSetting")?.checked ?? true;

    settings.highlights = $("highlightSetting")?.checked ?? true;

    settings.lastMove = $("lastMoveSetting")?.checked ?? true;

    settings.coordinates = $("coordinatesSetting")?.checked ?? true;

    soundEnabled = settings.sound;

    document.querySelectorAll(".board-coordinates").forEach(element => {
        element.style.display = settings.coordinates ? "" : "none";
    });

    renderBoard();

    closeModal("settingsModal");

    showToast("تم حفظ الإعدادات.");
}


/* =========================================================
   27. INTERFACE
========================================================= */

function updateInterface() {

    if (!chess) return;

    setText(
        "currentTurn",
        chess.turn() === "w" ? "الأبيض" : "الأسود"
    );

    setText("moveCounter", chess.history().length);

    setText(
        "gameStatus",
        gameFinished
            ? "انتهت المباراة"
            : gameStarted
                ? (chess.turn() === "w" ? "دور الأبيض" : "دور الأسود")
                : "جاهز"
    );

    if (gameMode === "ai") {

        setText(
            "whitePlayerName",
            playerColor === "w" ? "أنت" : "الكمبيوتر"
        );

        setText(
            "blackPlayerName",
            playerColor === "b" ? "أنت" : "الكمبيوتر"
        );
    }

    updateTimer();

    updateKingStatus();
}


/* =========================================================
   28. EVENT BINDINGS
========================================================= */

function bindEvents() {

    /* Navigation */

    document.querySelectorAll("[data-page]").forEach(button => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            navigateTo(page);

            if (page === "play" && !gameStarted) {
                startNewGame("local");
            }
        });
    });


    /* Home */

    $("homePlayButton")?.addEventListener("click", () => {

        startNewGame("local");

    });


    /* Computer game */

    $("startComputerGame")?.addEventListener("click", () => {

        configureComputerGame();

    });


    /* Difficulty selection */

    document.querySelectorAll(".difficulty-card").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".difficulty-card").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
        });
    });


    /* Color selection */

    document.querySelectorAll(".color-option").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".color-option").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
        });
    });


    /* Time selection */

    document.querySelectorAll(".time-option").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".time-option").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
        });
    });


    /* Board controls */

    $("undoMoveButton")?.addEventListener("click", undoMove);

    $("flipBoardButton")?.addEventListener("click", flipBoard);

    $("restartGameButton")?.addEventListener("click", restartGame);

    $("resignButton")?.addEventListener("click", resignGame);


    /* New game */

    $("newGameButton")?.addEventListener("click", () => {
        showModal("newGameModal");
    });

    $("confirmNewGame")?.addEventListener("click", () => {
        startNewGame(gameMode, {
            time: initialTime
        });
    });


    /* Result modal */

    $("resultRestartButton")?.addEventListener("click", () => {

        startNewGame(gameMode, {
            time: initialTime
        });
    });

    $("resultHomeButton")?.addEventListener("click", () => {

        closeModal("resultModal");

        navigateTo("home");
    });


    /* Rooms */

    $("createRoomButton")?.addEventListener("click", createRoom);

    $("joinRoomButton")?.addEventListener("click", joinRoom);

    $("copyRoomCodeButton")?.addEventListener("click", copyRoomCode);


    /* PGN */

    $("copyPGNButton")?.addEventListener("click", copyPGN);


    /* Settings */

    $("settingsButton")?.addEventListener("click", openSettings);

    $("saveSettingsButton")?.addEventListener("click", saveSettings);


    /* Sound */

    $("soundToggle")?.addEventListener("click", () => {

        soundEnabled = !soundEnabled;

        settings.sound = soundEnabled;

        showToast(
            soundEnabled ? "تم تشغيل الصوت." : "تم إيقاف الصوت."
        );
    });


    /* Promotion */

    document.querySelectorAll("[data-promotion]").forEach(button => {

        button.addEventListener("click", () => {

            completePromotion(button.dataset.promotion);
        });
    });


    /* Modal closing */

    document.querySelectorAll("[data-close-modal]").forEach(button => {

        button.addEventListener("click", () => {

            const modal = button.closest(".modal-overlay");

            if (modal) {
                modal.classList.add("hidden");
            }
        });
    });


    /* Keyboard */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            selectedSquare = null;

            possibleMoves = [];

            renderBoard();

            document.querySelectorAll(".modal-overlay").forEach(modal => {
                modal.classList.add("hidden");
            });
        }

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            undoMove();
        }
    });

}


/* =========================================================
   29. APPLICATION START
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeChessArena
    );

} else {

    initializeChessArena();
}
