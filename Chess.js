/* =========================================================
   ROYAL CHESS
   Main JavaScript Engine
   Version: 1.0
   Chess.js: 0.10.3
   ========================================================= */

"use strict";

/* =========================================================
   01. CONFIGURATION
   ========================================================= */

const ROYAL_CONFIG = {
    defaultTime: 600,
    aiDepth: {
        1: 1,
        2: 2,
        3: 3,
        4: 3
    },
    aiDelay: 450,
    storageKey: "ROYAL_CHESS_DATA"
};

const PIECES = {
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
};

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};


/* =========================================================
   02. GAME STATE
   ========================================================= */

let game = new Chess();

let selectedSquare = null;
let legalMoves = [];
let lastMove = null;

let currentMode = "local";
let gameFinished = false;
let aiThinking = false;

let aiTimer = null;
let clockInterval = null;

let soundEnabled = true;
let flipped = false;

let difficulty = 2;
let playerColor = "w";

let clocks = {
    w: ROYAL_CONFIG.defaultTime,
    b: ROYAL_CONFIG.defaultTime
};

let statistics = {
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rating: 1000,
    level: 1,
    history: []
};

let moveHistory = [];


/* =========================================================
   03. DOM ELEMENTS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);

const boardElement = $("#board");
const gameStatus = $("#gameStatus");
const moveHistoryElement = $("#moveHistory");

const blackClock = $("#blackClock");
const whiteClock = $("#whiteClock");

const statGames = $("#statGames");
const statWins = $("#statWins");
const statRating = $("#statRating");
const statLevel = $("#statLevel");

const matchType = $("#matchType");
const matchState = $("#matchState");
const currentTurn = $("#currentTurn");
const moveCount = $("#moveCount");
const lastMoveElement = $("#lastMove");

const soundToggle = $("#soundToggle");
const fullscreenBtn = $("#fullscreenBtn");

const startBtn = $("#startBtn");
const computerBtn = $("#computerBtn");
const exitGameView = $("#exitGameView");

const undoBtn = $("#undoBtn");
const restartBtn = $("#restartBtn");
const flipBoardBtn = $("#flipBoardBtn");
const resignBtn = $("#resignBtn");

const computerModal = $("#computerModal");
const friendModal = $("#friendModal");

const difficultySelect = $("#difficulty");
const playerColorSelect = $("#playerColor");
const confirmComputer = $("#confirmComputer");

const roomCode = $("#roomCode");
const joinRoomBtn = $("#joinRoomBtn");
const createRoomBtn = $("#createRoomBtn");

const toast = $("#royal-toast");
const toastMessage = $("#toastMessage");


/* =========================================================
   04. STORAGE
   ========================================================= */

function loadStatistics() {
    try {
        const saved = localStorage.getItem(ROYAL_CONFIG.storageKey);

        if (saved) {
            const data = JSON.parse(saved);

            statistics = {
                ...statistics,
                ...data
            };
        }
    } catch (error) {
        console.warn("Could not load saved data:", error);
    }

    updateStatisticsUI();
}

function saveStatistics() {
    try {
        localStorage.setItem(
            ROYAL_CONFIG.storageKey,
            JSON.stringify(statistics)
        );
    } catch (error) {
        console.warn("Could not save statistics:", error);
    }
}

function updateStatisticsUI() {
    if (statGames) statGames.textContent = statistics.games;
    if (statWins) statWins.textContent = statistics.wins;
    if (statRating) statRating.textContent = statistics.rating;
    if (statLevel) statLevel.textContent = statistics.level;

    const detailGames = $("#detailGames");
    const detailWins = $("#detailWins");
    const detailLosses = $("#detailLosses");
    const detailDraws = $("#detailDraws");

    if (detailGames) detailGames.textContent = statistics.games;
    if (detailWins) detailWins.textContent = statistics.wins;
    if (detailLosses) detailLosses.textContent = statistics.losses;
    if (detailDraws) detailDraws.textContent = statistics.draws;

    const profileRating = $("#profileRating");

    if (profileRating) {
        profileRating.textContent = `Rating: ${statistics.rating}`;
    }
}


/* =========================================================
   05. NOTIFICATIONS
   ========================================================= */

let toastTimeout = null;

function showToast(message, type = "info") {
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    toast.dataset.type = type;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   06. SOUND SYSTEM
   ========================================================= */

let audioContext = null;

function playSound(type = "move") {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        const sounds = {
            move: [440, 0.07],
            capture: [260, 0.12],
            check: [620, 0.16],
            win: [780, 0.25],
            error: [180, 0.12]
        };

        const [frequency, duration] = sounds[type] || sounds.move;

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.08, audioContext.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);

    } catch (error) {
        console.warn("Audio error:", error);
    }
}


/* =========================================================
   07. PAGE NAVIGATION
   ========================================================= */

const pageTitles = {
    home: "الرئيسية",
    play: "ساحة الشطرنج",
    computer: "ضد الكمبيوتر",
    friend: "اللعب مع صديق",
    profile: "الملف الشخصي",
    statistics: "الإحصائيات",
    history: "سجل المباريات",
    openings: "الافتتاحيات",
    settings: "الإعدادات"
};

function showPage(pageName) {
    const page = $(`#${pageName}Page`);

    if (!page) return;

    $$(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    $$(".nav-item[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const title = $("#pageTitle");

    if (title) {
        title.textContent = pageTitles[pageName] || "ROYAL CHESS";
    }

    if (pageName === "history") {
        renderFullHistory();
    }

    if (pageName === "profile" || pageName === "statistics") {
        updateStatisticsUI();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function enterGameView() {
    showPage("play");
    renderBoard();
    updateGameUI();
}

function exitGame() {
    if (aiThinking) {
        clearTimeout(aiTimer);
        aiThinking = false;
    }

    stopClock();

    showPage("home");
}


/* =========================================================
   08. MODAL SYSTEM
   ========================================================= */

function openModal(modal) {
    if (!modal) return;

    modal.classList.add("active");
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("active");
}

function closeAllModals() {
    closeModal(computerModal);
    closeModal(friendModal);
}


/* =========================================================
   09. BOARD GENERATION
   ========================================================= */

function renderBoard() {
    if (!boardElement) return;

    boardElement.innerHTML = "";

    const board = game.board();

    const files = flipped
        ? ["h", "g", "f", "e", "d", "c", "b", "a"]
        : ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks = flipped
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [8, 7, 6, 5, 4, 3, 2, 1];

    ranks.forEach((rank, rowIndex) => {
        files.forEach((file, columnIndex) => {
            const square = `${file}${rank}`;

            const piece = board[8 - rank][
                file.charCodeAt(0) - 97
            ];

            const element = document.createElement("button");

            element.type = "button";
            element.className = "square";

            element.dataset.square = square;

            const isLight =
                (file.charCodeAt(0) - 97 + rank) % 2 === 1;

            element.classList.add(
                isLight ? "light" : "dark"
            );

            if (selectedSquare === square) {
                element.classList.add("selected");
            }

            if (
                lastMove &&
                (lastMove.from === square || lastMove.to === square)
            ) {
                element.classList.add("last-move");
            }

            if (
                game.isCheck() &&
                piece &&
                piece.type === "k" &&
                piece.color === game.turn()
            ) {
                element.classList.add("in-check");
            }

            const availableMove = legalMoves.find(
                move => move.to === square
            );

            if (availableMove) {
                element.classList.add(
                    availableMove.captured
                        ? "legal-capture"
                        : "legal-move"
                );
            }

            if (piece) {
                const pieceElement = document.createElement("span");

                pieceElement.className =
                    `piece piece-${piece.color}`;

                pieceElement.textContent =
                    PIECES[piece.color][piece.type];

                pieceElement.setAttribute("aria-hidden", "true");

                element.appendChild(pieceElement);
            }

            if (columnIndex === 0) {
                const coordinate = document.createElement("span");

                coordinate.className = "coordinate rank-coordinate";
                coordinate.textContent = rank;

                element.appendChild(coordinate);
            }

            if (rowIndex === 7) {
                const coordinate = document.createElement("span");

                coordinate.className = "coordinate file-coordinate";
                coordinate.textContent = file;

                element.appendChild(coordinate);
            }

            element.addEventListener("click", () => {
                handleSquareClick(square);
            });

            boardElement.appendChild(element);
        });
    });
}


/* =========================================================
   10. SQUARE SELECTION
   ========================================================= */

function handleSquareClick(square) {
    if (gameFinished || aiThinking) return;

    if (
        currentMode === "computer" &&
        game.turn() !== playerColor
    ) {
        return;
    }

    const piece = game.get(square);

    if (selectedSquare) {
        const possibleMove = legalMoves.find(
            move => move.to === square
        );

        if (possibleMove) {
            executeMove(selectedSquare, square);
            return;
        }
    }

    if (piece && piece.color === game.turn()) {
        selectedSquare = square;

        legalMoves = game.moves({
            square,
            verbose: true
        });

        renderBoard();

        return;
    }

    selectedSquare = null;
    legalMoves = [];

    renderBoard();
}


/* =========================================================
   11. MOVE EXECUTION
   ========================================================= */

function executeMove(from, to, promotion = "q") {
    if (gameFinished) return;

    const piece = game.get(from);

    if (!piece) return;

    let move;

    try {
        move = game.move({
            from,
            to,
            promotion
        });
    } catch (error) {
        move = null;
    }

    if (!move) {
        showToast("هذه النقلة غير قانونية", "error");
        playSound("error");
        return;
    }

    lastMove = {
        from: move.from,
        to: move.to
    };

    moveHistory.push(move);

    selectedSquare = null;
    legalMoves = [];

    playSound(move.captured ? "capture" : "move");

    if (game.isCheck()) {
        playSound("check");
    }

    renderBoard();
    updateGameUI();

    if (game.game_over()) {
        finishGame();
        return;
    }

    if (
        currentMode === "computer" &&
        game.turn() !== playerColor
    ) {
        scheduleAI();
    }
}


/* =========================================================
   12. GAME INFORMATION
   ========================================================= */

function updateGameUI() {
    if (!game) return;

    if (currentTurn) {
        currentTurn.textContent =
            game.turn() === "w" ? "الأبيض" : "الأسود";
    }

    if (moveCount) {
        moveCount.textContent = game.history().length;
    }

    if (lastMoveElement) {
        const history = game.history();

        lastMoveElement.textContent =
            history.length ? history[history.length - 1] : "—";
    }

    if (matchState) {
        matchState.textContent = gameFinished
            ? "انتهت المباراة"
            : "قيد اللعب";
    }

    updateStatus();
    updateMoveHistory();
    updateClocksUI();
    updateControlButtons();
}

function updateStatus() {
    if (!gameStatus) return;

    let message = "";

    if (gameFinished) {
        message = "انتهت المباراة";
    } else if (game.isCheckmate()) {
        message = "كش مات!";
    } else if (game.isCheck()) {
        message = "كش!";
    } else if (game.in_draw()) {
        message = "تعادل";
    } else {
        message = game.turn() === "w"
            ? "دور الأبيض"
            : "دور الأسود";
    }

    gameStatus.innerHTML = `
        <span class="status-dot"></span>
        <span>${message}</span>
    `;
}

function updateMoveHistory() {
    if (!moveHistoryElement) return;

    const history = game.history();

    if (!history.length) {
        moveHistoryElement.innerHTML = `
            <div class="empty-state compact">
                <i class="fa-solid fa-chess-pawn"></i>
                <p>ستظهر النقلات هنا</p>
            </div>
        `;

        return;
    }

    const rows = [];

    for (let i = 0; i < history.length; i += 2) {
        const number = Math.floor(i / 2) + 1;
        const white = history[i] || "";
        const black = history[i + 1] || "";

        rows.push(`
            <div class="move-row">
                <span class="move-number">${number}.</span>
                <span class="white-move">${white}</span>
                <span class="black-move">${black}</span>
            </div>
        `);
    }

    moveHistoryElement.innerHTML = rows.join("");

    moveHistoryElement.scrollTop =
        moveHistoryElement.scrollHeight;
}

function updateControlButtons() {
    if (undoBtn) {
        undoBtn.disabled = moveHistory.length === 0;
    }

    if (resignBtn) {
        resignBtn.disabled = gameFinished;
    }
}


/* =========================================================
   13. CLOCK SYSTEM
   ========================================================= */

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

function startClock() {
    stopClock();

    if (gameFinished) return;

    clockInterval = setInterval(() => {
        const turn = game.turn();

        clocks[turn]--;

        if (clocks[turn] <= 0) {
            clocks[turn] = 0;

            stopClock();

            finishGame(
                turn === "w" ? "b" : "w",
                "timeout"
            );

            return;
        }

        updateClocksUI();

    }, 1000);
}

function updateClocksUI() {
    if (whiteClock) {
        whiteClock.textContent = formatTime(clocks.w);

        whiteClock.classList.toggle(
            "active-clock",
            !gameFinished && game.turn() === "w"
        );
    }

    if (blackClock) {
        blackClock.textContent = formatTime(clocks.b);

        blackClock.classList.toggle(
            "active-clock",
            !gameFinished && game.turn() === "b"
        );
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}


/* =========================================================
   14. AI ENGINE
   ========================================================= */

function evaluateBoard() {
    if (game.isCheckmate()) {
        return game.turn() === "w"
            ? -100000
            : 100000;
    }

    if (game.game_over()) return 0;

    let score = 0;

    const board = game.board();

    board.forEach((row, rank) => {
        row.forEach((piece, file) => {
            if (!piece) return;

            const value = PIECE_VALUES[piece.type];

            const advancement =
                piece.type === "p"
                    ? (piece.color === "w" ? 6 - rank : rank - 1) * 8
                    : 0;

            const centerBonus =
                (3.5 - Math.abs(3.5 - file)) * 3 +
                (3.5 - Math.abs(3.5 - rank)) * 3;

            const pieceScore =
                value + advancement + centerBonus;

            score += piece.color === "w"
                ? pieceScore
                : -pieceScore;
        });
    });

    return score;
}

function minimax(depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || game.game_over()) {
        return evaluateBoard();
    }

    const moves = game.moves({
        verbose: true
    });

    if (maximizingPlayer) {
        let bestScore = -Infinity;

        for (const move of moves) {
            game.move(move);

            const score = minimax(
                depth - 1,
                alpha,
                beta,
                false
            );

            game.undo();

            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);

            if (beta <= alpha) break;
        }

        return bestScore;
    }

    let bestScore = Infinity;

    for (const move of moves) {
        game.move(move);

        const score = minimax(
            depth - 1,
            alpha,
            beta,
            true
        );

        game.undo();

        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);

        if (beta <= alpha) break;
    }

    return bestScore;
}

function getBestMove() {
    const moves = game.moves({
        verbose: true
    });

    if (!moves.length) return null;

    const depth = ROYAL_CONFIG.aiDepth[difficulty] || 2;

    let bestMove = null;

    const maximizingPlayer = game.turn() === "w";

    let bestScore = maximizingPlayer
        ? -Infinity
        : Infinity;

    for (const move of moves) {
        game.move(move);

        const score = minimax(
            depth - 1,
            -Infinity,
            Infinity,
            !maximizingPlayer
        );

        game.undo();

        if (
            maximizingPlayer
                ? score > bestScore
                : score < bestScore
        ) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function scheduleAI() {
    if (gameFinished || currentMode !== "computer") return;

    aiThinking = true;

    updateStatus();

    aiTimer = setTimeout(() => {
        if (gameFinished) {
            aiThinking = false;
            return;
        }

        const move = getBestMove();

        aiThinking = false;

        if (!move) {
            finishGame();
            return;
        }

        executeMove(move.from, move.to, move.promotion || "q");

    }, ROYAL_CONFIG.aiDelay);
}


/* =========================================================
   15. GAME MODES
   ========================================================= */

function startLocalGame() {
    resetGameState();

    currentMode = "local";

    if (matchType) {
        matchType.textContent = "لعب محلي";
    }

    if ($("#whitePlayer")) {
        $("#whitePlayer").textContent = "White Player";
    }

    if ($("#blackPlayer")) {
        $("#blackPlayer").textContent = "Black Player";
    }

    enterGameView();
    startClock();

    showToast("بدأت المباراة");
}

function startComputerGame() {
    difficulty = Number(difficultySelect?.value || 2);

    playerColor = playerColorSelect?.value || "w";

    if (playerColor === "random") {
        playerColor = Math.random() < 0.5 ? "w" : "b";
    }

    resetGameState();

    currentMode = "computer";

    if (matchType) {
        matchType.textContent = "ضد الكمبيوتر";
    }

    if ($("#whitePlayer")) {
        $("#whitePlayer").textContent =
            playerColor === "w" ? "You" : "Royal AI";
    }

    if ($("#blackPlayer")) {
        $("#blackPlayer").textContent =
            playerColor === "b" ? "You" : "Royal AI";
    }

    closeModal(computerModal);

    enterGameView();
    startClock();

    showToast("بدأ التحدي ضد الكمبيوتر");

    if (game.turn() !== playerColor) {
        scheduleAI();
    }
}


/* =========================================================
   16. GAME RESET
   ========================================================= */

function resetGameState() {
    stopClock();

    clearTimeout(aiTimer);

    game = new Chess();

    selectedSquare = null;
    legalMoves = [];
    lastMove = null;

    moveHistory = [];

    gameFinished = false;
    aiThinking = false;

    flipped = false;

    clocks = {
        w: ROYAL_CONFIG.defaultTime,
        b: ROYAL_CONFIG.defaultTime
    };

    renderBoard();
    updateGameUI();
}

function restartGame() {
    if (currentMode === "computer") {
        startComputerGame();
        return;
    }

    startLocalGame();
}


/* =========================================================
   17. UNDO MOVE
   ========================================================= */

function undoMove() {
    if (!moveHistory.length || gameFinished) return;

    clearTimeout(aiTimer);
    aiThinking = false;

    if (currentMode === "computer") {
        if (game.turn() === playerColor) {
            game.undo();
            moveHistory.pop();
        }

        if (game.history().length) {
            game.undo();
            moveHistory.pop();
        }
    } else {
        game.undo();
        moveHistory.pop();
    }

    selectedSquare = null;
    legalMoves = [];

    const history = game.history({
        verbose: true
    });

    lastMove = history.length
        ? {
            from: history[history.length - 1].from,
            to: history[history.length - 1].to
        }
        : null;

    renderBoard();
    updateGameUI();

    if (
        currentMode === "computer" &&
        game.turn() !== playerColor
    ) {
        scheduleAI();
    }
}


/* =========================================================
   18. FLIP BOARD
   ========================================================= */

function flipBoard() {
    flipped = !flipped;
    renderBoard();
}


/* =========================================================
   19. GAME FINISH
   ========================================================= */

function finishGame(winner = null, reason = "normal") {
    if (gameFinished) return;

    gameFinished = true;

    stopClock();
    clearTimeout(aiTimer);

    aiThinking = false;

    let result = "draw";

    if (winner) {
        result = winner;
    } else if (game.isCheckmate()) {
        result = game.turn() === "w" ? "b" : "w";
    } else if (game.in_draw()) {
        result = "draw";
    }

    if (reason === "resign") {
        result = winner;
    }

    recordResult(result, reason);

    updateGameUI();
    renderBoard();

    if (result === "draw") {
        showToast("انتهت المباراة بالتعادل");
    } else {
        const message = result === "w"
            ? "الأبيض فاز!"
            : "الأسود فاز!";

        showToast(message, "success");
        playSound("win");
    }
}

function recordResult(result, reason) {
    statistics.games++;

    if (result === "draw") {
        statistics.draws++;
    } else {
        const playerWon =
            currentMode === "computer"
                ? result === playerColor
                : result === "w";

        if (playerWon) {
            statistics.wins++;
            statistics.rating += 10;
        } else {
            statistics.losses++;
            statistics.rating = Math.max(
                100,
                statistics.rating - 8
            );
        }
    }

    statistics.level = Math.max(
        1,
        Math.floor(statistics.rating / 1000)
    );

    statistics.history.unshift({
        mode: currentMode,
        result,
        reason,
        date: new Date().toISOString(),
        moves: game.history(),
        pgn: game.pgn()
    });

    statistics.history = statistics.history.slice(0, 50);

    saveStatistics();

    updateStatisticsUI();
    renderRecentMatches();
}


/* =========================================================
   20. RESIGN
   ========================================================= */

function resignGame() {
    if (gameFinished) return;

    const confirmed = confirm("هل أنت متأكد من الاستسلام؟");

    if (!confirmed) return;

    const winner = game.turn() === "w" ? "b" : "w";

    finishGame(winner, "resign");
}


/* =========================================================
   21. MATCH HISTORY
   ========================================================= */

function renderRecentMatches() {
    const container = $("#recentMatches");

    if (!container) return;

    if (!statistics.history.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chess"></i>
                <h3>لا توجد مباريات حتى الآن</h3>
                <p>ابدأ أول مباراة لك لتظهر هنا.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = statistics.history
        .slice(0, 5)
        .map((match, index) => {
            const resultText =
                match.result === "draw"
                    ? "تعادل"
                    : match.result === "w"
                        ? "فوز الأبيض"
                        : "فوز الأسود";

            return `
                <div class="history-item">
                    <div class="history-item-icon">
                        <i class="fa-solid fa-chess"></i>
                    </div>

                    <div class="history-item-details">
                        <strong>مباراة ${index + 1}</strong>
                        <span>${match.mode} · ${resultText}</span>
                    </div>

                    <span class="history-date">
                        ${new Date(match.date).toLocaleDateString("ar-SA")}
                    </span>
                </div>
            `;
        })
        .join("");
}

function renderFullHistory() {
    const container = $("#fullMatchHistory");

    if (!container) return;

    if (!statistics.history.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>الأرشيف فارغ</h3>
                <p>ستظهر مبارياتك السابقة هنا.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = statistics.history
        .map((match, index) => `
            <div class="history-item">
                <div class="history-item-icon">
                    <i class="fa-solid fa-chess"></i>
                </div>

                <div class="history-item-details">
                    <strong>المباراة ${index + 1}</strong>
                    <span>${match.mode}</span>
                    <span>${match.moves.length} نقلة</span>
                </div>

                <span class="history-date">
                    ${new Date(match.date).toLocaleDateString("ar-SA")}
                </span>
            </div>
        `)
        .join("");
}


/* =========================================================
   22. ROOM SYSTEM PLACEHOLDER
   ========================================================= */

function createRoom() {
    showToast(
        "نظام الغرف يحتاج ربط Backend قبل تفعيله",
        "info"
    );
}

function joinRoom() {
    const code = roomCode?.value.trim();

    if (!code) {
        showToast("أدخل رمز الغرفة أولاً", "error");
        return;
    }

    showToast(
        "الانضمام للغرف غير متاح حتى ربط الخادم",
        "info"
    );
}


/* =========================================================
   23. FULLSCREEN
   ========================================================= */

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.()
            .catch(() => {
                showToast("تعذر تفعيل ملء الشاشة");
            });
    } else {
        document.exitFullscreen?.();
    }
}


/* =========================================================
   24. SETTINGS
   ========================================================= */

function toggleSound() {
    soundEnabled = !soundEnabled;

    if (soundToggle) {
        soundToggle.innerHTML = soundEnabled
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
    }

    const soundSetting = $("#soundSetting");

    if (soundSetting) {
        soundSetting.checked = soundEnabled;
    }

    showToast(
        soundEnabled ? "تم تشغيل الصوت" : "تم إيقاف الصوت"
    );
}

function updateSettings() {
    const soundSetting = $("#soundSetting");
    const animationSetting = $("#animationSetting");

    if (soundSetting) {
        soundEnabled = soundSetting.checked;
    }

    if (animationSetting) {
        document.body.classList.toggle(
            "reduced-motion",
            !animationSetting.checked
        );
    }
}


/* =========================================================
   25. EVENT LISTENERS
   ========================================================= */

// Navigation

$$("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});


// Start buttons

startBtn?.addEventListener("click", () => {
    startLocalGame();
});

computerBtn?.addEventListener("click", () => {
    openModal(computerModal);
});


// Mode buttons

$$("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
        const modal = $(`#${button.dataset.open}`);
        openModal(modal);
    });
});

$$("[data-action='local']").forEach(button => {
    button.addEventListener("click", startLocalGame);
});


// Modal close buttons

$$("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        const modal = $(`#${button.dataset.close}`);
        closeModal(modal);
    });
});


// Click outside modal

$$(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});


// Computer game

confirmComputer?.addEventListener("click", startComputerGame);


// Friend rooms

createRoomBtn?.addEventListener("click", createRoom);
joinRoomBtn?.addEventListener("click", joinRoom);


// Game controls

exitGameView?.addEventListener("click", exitGame);

undoBtn?.addEventListener("click", undoMove);

restartBtn?.addEventListener("click", restartGame);

flipBoardBtn?.addEventListener("click", flipBoard);

resignBtn?.addEventListener("click", resignGame);


// Sound

soundToggle?.addEventListener("click", toggleSound);


// Fullscreen

fullscreenBtn?.addEventListener("click", toggleFullscreen);


// Settings

$("#soundSetting")?.addEventListener("change", updateSettings);

$("#animationSetting")?.addEventListener("change", updateSettings);


// Keyboard shortcuts

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAllModals();
    }

    if (
        event.key.toLowerCase() === "f" &&
        !event.target.matches("input, textarea, select")
    ) {
        toggleFullscreen();
    }
});


/* =========================================================
   26. INITIALIZATION
   ========================================================= */

function initializeRoyalChess() {
    if (typeof Chess !== "function") {
        showToast("تعذر تحميل محرك الشطرنج", "error");
        console.error("Chess.js is not available.");
        return;
    }

    loadStatistics();

    renderBoard();

    updateGameUI();

    renderRecentMatches();

    renderFullHistory();

    showPage("home");

    console.log(
        "%c ROYAL CHESS ",
        "background:#111827;color:#d8b56f;font-size:20px;font-weight:bold;padding:10px;"
    );

    console.log("Royal Chess initialized successfully.");
}

initializeRoyalChess();


/* =========================================================
   END OF ROYAL CHESS JAVASCRIPT
   ========================================================= */
