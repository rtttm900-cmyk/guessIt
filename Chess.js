/* ============================================================
   ROYAL CHESS — ULTIMATE GAME ENGINE
   VERSION: 3.1
   ENGINE: CHESS.JS 0.10.3
   ============================================================ */

"use strict";

/* ============================================================
01 — CONFIGURATION
============================================================ */

const ROYAL_CONFIG = {
    animationDelay: 350,
    aiDelay: 450,
    aiDepth: 2,
    maxSearchDepth: 3,
    storageKey: "ROYAL_CHESS_DATA_V3",
    soundEnabled: false,
    playerColor: "w",
    aiEnabled: false,
    aiDifficulty: 2,
    boardFlipped: false
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

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

/* ============================================================
02 — GLOBAL GAME STATE
============================================================ */

let game = new Chess();

let selectedSquare = null;
let possibleMoves = [];
let lastMove = null;

let gameFinished = false;
let aiThinking = false;
let soundContext = null;

let currentMode = "local";
let toastTimeout = null;

let playerClock = {
    white: Infinity,
    black: Infinity
};

let matchStatistics = loadStatistics();

/* ============================================================
03 — DOM ELEMENTS
============================================================ */

const DOM = {
    board: document.getElementById("board"),

    status: document.getElementById("gameStatus"),
    history: document.getElementById("moveHistory"),

    currentTurn: document.getElementById("currentTurn"),
    moveCount: document.getElementById("moveCount"),
    lastMove: document.getElementById("lastMove"),

    matchType: document.getElementById("matchType"),
    matchState: document.getElementById("matchState"),

    whiteClock: document.getElementById("whiteClock"),
    blackClock: document.getElementById("blackClock"),

    statGames: document.getElementById("statGames"),
    statWins: document.getElementById("statWins"),
    statRating: document.getElementById("statRating"),
    statLevel: document.getElementById("statLevel"),

    startBtn: document.getElementById("startBtn"),
    computerBtn: document.getElementById("computerBtn"),

    undoBtn: document.getElementById("undoBtn"),
    restartBtn: document.getElementById("restartBtn"),
    flipBoardBtn: document.getElementById("flipBoardBtn"),
    resignBtn: document.getElementById("resignBtn"),

    soundToggle: document.getElementById("soundToggle"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),

    computerModal: document.getElementById("computerModal"),
    friendModal: document.getElementById("friendModal"),

    difficulty: document.getElementById("difficulty"),
    playerColor: document.getElementById("playerColor"),

    confirmComputer: document.getElementById("confirmComputer"),
    joinRoomBtn: document.getElementById("joinRoomBtn"),
    roomCode: document.getElementById("roomCode"),

    exitGameView: document.getElementById("exitGameView"),

    toast: document.getElementById("royal-toast")
};

/* ============================================================
04 — GAME VIEW MANAGEMENT
============================================================ */

function enterGameView() {
    document.body.classList.add("royal-game-mode");

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}

function exitGameView() {
    document.body.classList.remove("royal-game-mode");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

if (DOM.exitGameView) {
    DOM.exitGameView.addEventListener(
        "click",
        exitGameView
    );
}

/* ============================================================
05 — STORAGE SYSTEM
============================================================ */

function loadStatistics() {
    const defaultData = {
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        level: 1
    };

    try {
        const saved = localStorage.getItem(
            ROYAL_CONFIG.storageKey
        );

        if (!saved) return defaultData;

        const parsed = JSON.parse(saved);

        return {
            ...defaultData,
            ...parsed
        };

    } catch (error) {
        console.warn("ROYAL STORAGE ERROR:", error);
        return defaultData;
    }
}

function saveStatistics() {
    try {
        localStorage.setItem(
            ROYAL_CONFIG.storageKey,
            JSON.stringify(matchStatistics)
        );
    } catch (error) {
        console.warn("Unable to save statistics:", error);
    }
}

function updateStatisticsUI() {
    if (DOM.statGames) {
        DOM.statGames.textContent = matchStatistics.games;
    }

    if (DOM.statWins) {
        DOM.statWins.textContent = matchStatistics.wins;
    }

    if (DOM.statRating) {
        DOM.statRating.textContent = "—";
    }

    if (DOM.statLevel) {
        DOM.statLevel.textContent = String(
            matchStatistics.level
        ).padStart(2, "0");
    }
}

/* ============================================================
06 — NOTIFICATION SYSTEM
============================================================ */

function showToast(message, duration = 2600) {
    if (!DOM.toast) return;

    DOM.toast.textContent = message;
    DOM.toast.classList.add("visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        DOM.toast.classList.remove("visible");
    }, duration);
}

/* ============================================================
07 — SOUND ENGINE
============================================================ */

function playSound(type = "move") {
    if (!ROYAL_CONFIG.soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!soundContext) {
            soundContext = new AudioContextClass();
        }

        if (soundContext.state === "suspended") {
            soundContext.resume();
        }

        const oscillator = soundContext.createOscillator();
        const gain = soundContext.createGain();

        const frequencies = {
            move: 420,
            capture: 260,
            check: 620,
            finish: 780
        };

        oscillator.type = "sine";

        oscillator.frequency.value =
            frequencies[type] || 420;

        gain.gain.setValueAtTime(
            0.0001,
            soundContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.06,
            soundContext.currentTime + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            soundContext.currentTime + 0.18
        );

        oscillator.connect(gain);
        gain.connect(soundContext.destination);

        oscillator.start();
        oscillator.stop(soundContext.currentTime + 0.2);

    } catch (error) {
        console.warn("ROYAL AUDIO ERROR:", error);
    }
}

/* ============================================================
08 — BOARD GENERATION
============================================================ */

function createBoard() {
    if (!DOM.board) return;

    DOM.board.innerHTML = "";

    const ranks = ROYAL_CONFIG.boardFlipped
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [8, 7, 6, 5, 4, 3, 2, 1];

    const files = ROYAL_CONFIG.boardFlipped
        ? [...FILES].reverse()
        : [...FILES];

    ranks.forEach((rank, rowIndex) => {
        files.forEach((file, columnIndex) => {

            const square = `${file}${rank}`;

            const squareElement =
                document.createElement("button");

            const isLight =
                (FILES.indexOf(file) + rank) % 2 === 0;

            squareElement.type = "button";

            squareElement.className =
                `square ${isLight ? "light" : "dark"}`;

            squareElement.dataset.square = square;

            squareElement.setAttribute(
                "aria-label",
                `مربع ${square}`
            );

            squareElement.addEventListener(
                "click",
                () => handleSquareClick(square)
            );

            const piece = game.get(square);

            if (piece) {
                squareElement.textContent =
                    PIECES[piece.color][piece.type];

                squareElement.classList.add(
                    `piece-${piece.color}`
                );
            }

            const showRank =
                ROYAL_CONFIG.boardFlipped
                    ? columnIndex === 0
                    : columnIndex === 7;

            const showFile = rowIndex === 7;

            if (showRank || showFile) {
                const coordinate =
                    document.createElement("span");

                coordinate.className = "coordinate";

                coordinate.textContent =
                    showRank && showFile
                        ? `${rank}${file}`
                        : showRank
                            ? rank
                            : file;

                squareElement.appendChild(coordinate);
            }

            DOM.board.appendChild(squareElement);
        });
    });

    updateBoardHighlights();
}

/* ============================================================
09 — BOARD HIGHLIGHTS
============================================================ */

function updateBoardHighlights() {
    if (!DOM.board) return;

    const squares = DOM.board.querySelectorAll(
        "[data-square]"
    );

    squares.forEach(element => {
        const square = element.dataset.square;

        element.classList.remove(
            "selected",
            "legal-move",
            "legal-capture",
            "last-move",
            "in-check"
        );

        if (selectedSquare === square) {
            element.classList.add("selected");
        }

        if (
            lastMove &&
            (
                lastMove.from === square ||
                lastMove.to === square
            )
        ) {
            element.classList.add("last-move");
        }

        const possibleMove = possibleMoves.find(
            move => move.to === square
        );

        if (possibleMove) {
            if (possibleMove.captured) {
                element.classList.add("legal-capture");
            } else {
                element.classList.add("legal-move");
            }
        }
    });

    if (game.in_check()) {
        const turn = game.turn();
        const boardState = game.board();

        boardState.forEach((row, rowIndex) => {
            row.forEach((piece, columnIndex) => {
                if (
                    piece &&
                    piece.type === "k" &&
                    piece.color === turn
                ) {
                    const file = FILES[columnIndex];
                    const rank = 8 - rowIndex;

                    const kingSquare = `${file}${rank}`;

                    const kingElement =
                        DOM.board.querySelector(
                            `[data-square="${kingSquare}"]`
                        );

                    if (kingElement) {
                        kingElement.classList.add("in-check");
                    }
                }
            });
        });
    }
}

/* ============================================================
10 — SQUARE INTERACTION
============================================================ */

function handleSquareClick(square) {
    if (gameFinished || aiThinking) return;

    if (
        ROYAL_CONFIG.aiEnabled &&
        game.turn() !== ROYAL_CONFIG.playerColor
    ) {
        return;
    }

    const piece = game.get(square);

    if (selectedSquare) {
        const matchingMove = possibleMoves.find(
            move => move.to === square
        );

        if (matchingMove) {
            executeMove(
                selectedSquare,
                square,
                matchingMove
            );

            return;
        }

        if (
            piece &&
            piece.color === game.turn()
        ) {
            selectSquare(square);
            return;
        }

        clearSelection();
        return;
    }

    if (
        piece &&
        piece.color === game.turn()
    ) {
        selectSquare(square);
    }
}

function selectSquare(square) {
    const piece = game.get(square);

    if (!piece) return;
    if (piece.color !== game.turn()) return;

    selectedSquare = square;

    possibleMoves = game.moves({
        square,
        verbose: true
    });

    updateBoardHighlights();
}

function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];

    updateBoardHighlights();
}

/* ============================================================
11 — MOVE EXECUTION
============================================================ */

function executeMove(from, to, selectedMove = null) {
    if (gameFinished) return false;

    const piece = game.get(from);

    if (!piece) return false;

    const moveOptions = {
        from,
        to
    };

    if (piece.type === "p") {
        const destinationRank = Number(to[1]);

        if (
            destinationRank === 8 ||
            destinationRank === 1
        ) {
            moveOptions.promotion = choosePromotion();
        }
    }

    let move = null;

    try {
        move = game.move(moveOptions);
    } catch (error) {
        console.warn("Invalid move:", error);
        return false;
    }

    if (!move) return false;

    lastMove = {
        from: move.from,
        to: move.to
    };

    clearSelection();

    playSound(
        move.captured ? "capture" : "move"
    );

    refreshGame();

    if (game.in_check() && !game.game_over()) {
        playSound("check");
    }

    if (game.game_over()) {
        finishGame();
        return true;
    }

    if (
        ROYAL_CONFIG.aiEnabled &&
        game.turn() !== ROYAL_CONFIG.playerColor
    ) {
        scheduleComputerMove();
    }

    return true;
}

function choosePromotion() {
    const answer = window.prompt(
        "اختر نوع الترقية:\n" +
        "q = وزير\n" +
        "r = قلعة\n" +
        "b = فيل\n" +
        "n = حصان",
        "q"
    );

    const choice = String(answer || "q")
        .trim()
        .toLowerCase();

    return ["q", "r", "b", "n"].includes(choice)
        ? choice
        : "q";
}

/* ============================================================
12 — GAME REFRESH
============================================================ */

function refreshGame() {
    createBoard();
    updateHistory();
    updateMatchInformation();
    updateGameStatus();
}

function updateMatchInformation() {
    const history = game.history();

    if (DOM.currentTurn) {
        DOM.currentTurn.textContent =
            game.turn() === "w"
                ? "الأبيض"
                : "الأسود";
    }

    if (DOM.moveCount) {
        DOM.moveCount.textContent = history.length;
    }

    if (DOM.lastMove) {
        DOM.lastMove.textContent =
            history.length
                ? history[history.length - 1]
                : "—";
    }

    if (DOM.matchType) {
        DOM.matchType.textContent =
            currentMode === "computer"
                ? "ضد الكمبيوتر"
                : "محلية";
    }

    if (DOM.matchState) {
        DOM.matchState.textContent =
            gameFinished
                ? "منتهية"
                : history.length
                    ? "قيد اللعب"
                    : "جاهزة";
    }

    if (DOM.whiteClock) {
        DOM.whiteClock.classList.toggle(
            "active",
            game.turn() === "w" && !gameFinished
        );
    }

    if (DOM.blackClock) {
        DOM.blackClock.classList.toggle(
            "active",
            game.turn() === "b" && !gameFinished
        );
    }
}

/* ============================================================
13 — MOVE HISTORY
============================================================ */

function updateHistory() {
    if (!DOM.history) return;

    const history = game.history();

    if (history.length === 0) {
        DOM.history.innerHTML = `
            <div class="royal-history-empty">
                لا توجد نقلات حتى الآن.
            </div>
        `;

        return;
    }

    DOM.history.innerHTML = "";

    for (
        let index = 0;
        index < history.length;
        index += 2
    ) {
        const row = document.createElement("div");

        row.className = "royal-move-row";

        const number = document.createElement("span");

        number.className = "royal-move-number";

        number.textContent =
            `${Math.floor(index / 2) + 1}.`;

        const whiteMove = document.createElement("span");

        whiteMove.textContent =
            history[index] || "—";

        const blackMove = document.createElement("span");

        blackMove.textContent =
            history[index + 1] || "—";

        row.append(
            number,
            whiteMove,
            blackMove
        );

        DOM.history.appendChild(row);
    }

    DOM.history.scrollTop = DOM.history.scrollHeight;
}

/* ============================================================
14 — GAME STATUS
============================================================ */

function updateGameStatus() {
    if (!DOM.status) return;

    DOM.status.classList.remove(
        "check",
        "finished"
    );

    if (game.in_checkmate()) {
        const winner =
            game.turn() === "w"
                ? "الأسود"
                : "الأبيض";

        DOM.status.textContent =
            `كش مات! الفائز هو ${winner}.`;

        DOM.status.classList.add("finished");

        return;
    }

    if (game.in_stalemate()) {
        DOM.status.textContent =
            "تعادل بسبب الجمود.";

        DOM.status.classList.add("finished");

        return;
    }

    if (game.in_draw()) {
        DOM.status.textContent =
            "انتهت المباراة بالتعادل.";

        DOM.status.classList.add("finished");

        return;
    }

    if (game.in_check()) {
        DOM.status.textContent =
            game.turn() === "w"
                ? "الأبيض في حالة كش!"
                : "الأسود في حالة كش!";

        DOM.status.classList.add("check");

        return;
    }

    DOM.status.textContent =
        game.turn() === "w"
            ? "دور الأبيض — اختر قطعة للعب."
            : "دور الأسود — اختر قطعة للعب.";
}

/* ============================================================
15 — GAME FINISH
============================================================ */

function finishGame() {
    if (gameFinished) return;

    gameFinished = true;
    aiThinking = false;

    let result = "draw";

    if (game.in_checkmate()) {
        result =
            game.turn() === "w"
                ? "black"
                : "white";
    }

    matchStatistics.games++;

    if (result === "draw") {
        matchStatistics.draws++;
    } else if (
        currentMode === "computer" &&
        result === ROYAL_CONFIG.playerColor
    ) {
        matchStatistics.wins++;
    } else if (
        currentMode === "computer"
    ) {
        matchStatistics.losses++;
    } else if (result === "white") {
        matchStatistics.wins++;
    } else {
        matchStatistics.losses++;
    }

    matchStatistics.level =
        Math.max(
            1,
            Math.floor(matchStatistics.wins / 3) + 1
        );

    saveStatistics();
    updateStatisticsUI();
    updateMatchInformation();

    playSound("finish");

    if (result === "draw") {
        showToast("انتهت المباراة بالتعادل.");
    } else {
        const winner =
            result === "white"
                ? "الأبيض"
                : "الأسود";

        showToast(`انتهت المباراة! الفائز: ${winner}`);
    }

    updateGameStatus();
}

/* ============================================================
16 — RESTART GAME
============================================================ */

function restartGame() {
    const confirmed = window.confirm(
        "هل تريد بدء مباراة جديدة؟"
    );

    if (!confirmed) return;

    game.reset();

    selectedSquare = null;
    possibleMoves = [];
    lastMove = null;

    gameFinished = false;
    aiThinking = false;

    clearSelection();
    refreshGame();

    showToast("تم إنشاء مباراة جديدة.");

    if (
        ROYAL_CONFIG.aiEnabled &&
        ROYAL_CONFIG.playerColor === "b"
    ) {
        scheduleComputerMove();
    }
}

/* ============================================================
17 — UNDO SYSTEM
============================================================ */

function undoMove() {
    if (aiThinking) return;

    const history = game.history();

    if (history.length === 0) {
        showToast("لا توجد نقلات للتراجع عنها.");
        return;
    }

    if (currentMode === "computer") {
        game.undo();

        if (game.history().length > 0) {
            game.undo();
        }
    } else {
        game.undo();
    }

    gameFinished = false;
    selectedSquare = null;
    possibleMoves = [];

    const remainingHistory = game.history();

    lastMove = null;

    if (remainingHistory.length > 0) {
        const moves = game.history({
            verbose: true
        });

        const last = moves[moves.length - 1];

        if (last) {
            lastMove = {
                from: last.from,
                to: last.to
            };
        }
    }

    refreshGame();

    showToast("تم التراجع عن النقلة.");
}

/* ============================================================
18 — BOARD ROTATION
============================================================ */

function flipBoard() {
    ROYAL_CONFIG.boardFlipped =
        !ROYAL_CONFIG.boardFlipped;

    createBoard();

    showToast(
        ROYAL_CONFIG.boardFlipped
            ? "تم قلب الرقعة."
            : "تمت إعادة اتجاه الرقعة."
    );
}

/* ============================================================
19 — AI POSITION EVALUATION
============================================================ */

function evaluatePosition(color) {
    const board = game.board();

    let score = 0;

    board.forEach((row, rowIndex) => {
        row.forEach((piece, columnIndex) => {
            if (!piece) return;

            let value =
                PIECE_VALUES[piece.type] || 0;

            const centerDistance =
                Math.abs(3.5 - columnIndex) +
                Math.abs(3.5 - rowIndex);

            const centralBonus =
                Math.max(0, 7 - centerDistance * 1.2);

            if (piece.type === "n" || piece.type === "b") {
                value += centralBonus * 4;
            }

            if (piece.type === "p") {
                const advancement =
                    piece.color === "w"
                        ? 6 - rowIndex
                        : rowIndex - 1;

                value += Math.max(0, advancement) * 8;
            }

            if (piece.type === "q") {
                value += centralBonus * 2;
            }

            score +=
                piece.color === color
                    ? value
                    : -value;
        });
    });

    if (game.in_check()) {
        score -= 25;
    }

    return score;
}

/* ============================================================
20 — AI SEARCH ENGINE
============================================================ */

function minimax(depth, alpha, beta, maximizingColor) {
    if (depth <= 0 || game.game_over()) {
        if (game.in_checkmate()) {
            return game.turn() === maximizingColor
                ? -100000 - depth
                : 100000 + depth;
        }

        if (game.in_draw()) {
            return 0;
        }

        return evaluatePosition(maximizingColor);
    }

    const moves = game.moves({
        verbose: true
    });

    if (moves.length === 0) {
        return evaluatePosition(maximizingColor);
    }

    const maximizing =
        game.turn() === maximizingColor;

    if (maximizing) {
        let bestScore = -Infinity;

        for (const move of moves) {
            game.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || "q"
            });

            const score = minimax(
                depth - 1,
                alpha,
                beta,
                maximizingColor
            );

            game.undo();

            bestScore = Math.max(
                bestScore,
                score
            );

            alpha = Math.max(alpha, score);

            if (beta <= alpha) break;
        }

        return bestScore;

    } else {
        let bestScore = Infinity;

        for (const move of moves) {
            game.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || "q"
            });

            const score = minimax(
                depth - 1,
                alpha,
                beta,
                maximizingColor
            );

            game.undo();

            bestScore = Math.min(
                bestScore,
                score
            );

            beta = Math.min(beta, score);

            if (beta <= alpha) break;
        }

        return bestScore;
    }
}

/* ============================================================
21 — AI MOVE SELECTION
============================================================ */

function getBestComputerMove() {
    const moves = game.moves({
        verbose: true
    });

    if (!moves.length) return null;

    const depth = Math.min(
        ROYAL_CONFIG.aiDepth,
        ROYAL_CONFIG.maxSearchDepth
    );

    let bestMove = null;
    let bestScore = -Infinity;

    const aiColor = game.turn();

    const shuffledMoves = [...moves].sort(
        () => Math.random() - 0.5
    );

    for (const move of shuffledMoves) {
        game.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion || "q"
        });

        const score = minimax(
            depth - 1,
            -Infinity,
            Infinity,
            aiColor
        );

        game.undo();

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

/* ============================================================
22 — COMPUTER MOVE EXECUTION
============================================================ */

function scheduleComputerMove() {
    if (
        !ROYAL_CONFIG.aiEnabled ||
        gameFinished ||
        game.game_over() ||
        aiThinking
    ) {
        return;
    }

    aiThinking = true;

    showToast("الكمبيوتر يفكر في نقلته...");

    setTimeout(() => {
        if (
            gameFinished ||
            game.game_over() ||
            game.turn() === ROYAL_CONFIG.playerColor
        ) {
            aiThinking = false;
            return;
        }

        const bestMove = getBestComputerMove();

        aiThinking = false;

        if (!bestMove) {
            if (game.game_over()) {
                finishGame();
            }

            return;
        }

        const result = game.move({
            from: bestMove.from,
            to: bestMove.to,
            promotion: bestMove.promotion || "q"
        });

        if (result) {
            lastMove = {
                from: result.from,
                to: result.to
            };

            playSound(
                result.captured
                    ? "capture"
                    : "move"
            );

            refreshGame();

            if (game.game_over()) {
                finishGame();
            } else if (game.in_check()) {
                playSound("check");
            }
        }

    }, ROYAL_CONFIG.aiDelay);
}

/* ============================================================
23 — COMPUTER DIFFICULTY
============================================================ */

function setDifficulty(level) {
    const difficulty = Number(level);

    const difficultyMap = {
        1: 1,
        2: 1,
        3: 2,
        4: 2,
        5: 3
    };

    ROYAL_CONFIG.aiDifficulty = difficulty;

    ROYAL_CONFIG.aiDepth =
        difficultyMap[difficulty] || 1;
}

/* ============================================================
24 — GAME MODES
============================================================ */

function startLocalGame() {
    currentMode = "local";

    ROYAL_CONFIG.aiEnabled = false;

    resetBoardState();

    enterGameView();

    showToast("بدأت مباراة محلية جديدة.");
}

function startComputerGame() {
    currentMode = "computer";

    ROYAL_CONFIG.aiEnabled = true;

    ROYAL_CONFIG.playerColor =
        DOM.playerColor
            ? DOM.playerColor.value
            : "w";

    setDifficulty(
        DOM.difficulty
            ? DOM.difficulty.value
            : 2
    );

    resetBoardState();

    enterGameView();

    showToast("تم إنشاء مباراة ضد الكمبيوتر.");

    if (ROYAL_CONFIG.playerColor === "b") {
        scheduleComputerMove();
    }
}

function resetBoardState() {
    game.reset();

    selectedSquare = null;
    possibleMoves = [];
    lastMove = null;

    gameFinished = false;
    aiThinking = false;

    playerClock.white = Infinity;
    playerClock.black = Infinity;

    refreshGame();
}

/* ============================================================
25 — MODAL MANAGEMENT
============================================================ */

function openModal(modal) {
    if (!modal) return;

    modal.classList.add("open");
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("open");
}

function closeAllModals() {
    closeModal(DOM.computerModal);
    closeModal(DOM.friendModal);
}

document.querySelectorAll("[data-close]").forEach(
    button => {
        button.addEventListener("click", () => {
            const modalId = button.dataset.close;

            closeModal(
                document.getElementById(modalId)
            );
        });
    }
);

document.querySelectorAll(".royal-modal").forEach(
    modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    }
);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAllModals();
    }
});

/* ============================================================
26 — SIDEBAR NAVIGATION
============================================================ */

function handleNavigation(page) {
    if (page === "friend") {
        showToast("اللعب مع الأصدقاء — قريباً.");
        return;
    }

    document.querySelectorAll(".royal-nav").forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        }
    );

    switch (page) {
        case "play":
            exitGameView();
            showToast("أنت في ساحة اللعب الملكية.");
            break;

        case "local":
            startLocalGame();
            break;

        case "computer":
            openModal(DOM.computerModal);
            break;

        case "profile":
            showToast("قسم الملف الشخصي قيد التطوير.");
            break;

        case "stats":
            showToast(
                `المباريات: ${matchStatistics.games} | الانتصارات: ${matchStatistics.wins}`
            );
            break;

        case "settings":
            showToast("إعدادات اللعبة الأساسية متاحة من الأزرار.");
            break;

        default:
            showToast("هذا القسم غير متاح حالياً.");
    }
}

document.querySelectorAll(".royal-nav").forEach(
    button => {
        button.addEventListener("click", () => {
            if (button.disabled) return;

            handleNavigation(button.dataset.page);
        });
    }
);

/* ============================================================
27 — BUTTON EVENTS
============================================================ */

if (DOM.startBtn) {
    DOM.startBtn.addEventListener(
        "click",
        startLocalGame
    );
}

if (DOM.computerBtn) {
    DOM.computerBtn.addEventListener(
        "click",
        () => openModal(DOM.computerModal)
    );
}

if (DOM.confirmComputer) {
    DOM.confirmComputer.addEventListener(
        "click",
        () => {
            startComputerGame();
            closeModal(DOM.computerModal);
        }
    );
}

if (DOM.undoBtn) {
    DOM.undoBtn.addEventListener(
        "click",
        undoMove
    );
}

if (DOM.restartBtn) {
    DOM.restartBtn.addEventListener(
        "click",
        restartGame
    );
}

if (DOM.flipBoardBtn) {
    DOM.flipBoardBtn.addEventListener(
        "click",
        flipBoard
    );
}

if (DOM.resignBtn) {
    DOM.resignBtn.addEventListener(
        "click",
        () => {
            if (gameFinished) return;

            const confirmed = window.confirm(
                "هل تريد الاستسلام وإنهاء المباراة؟"
            );

            if (!confirmed) return;

            if (game.history().length === 0) {
                showToast("ابدأ المباراة أولاً.");
                return;
            }

            gameFinished = true;

            const winner =
                game.turn() === "w"
                    ? "الأسود"
                    : "الأبيض";

            matchStatistics.games++;
            matchStatistics.losses++;

            saveStatistics();
            updateStatisticsUI();
            updateMatchInformation();

            if (DOM.status) {
                DOM.status.textContent =
                    `استسلم اللاعب. الفائز: ${winner}.`;

                DOM.status.classList.add("finished");
            }

            showToast("انتهت المباراة بالاستسلام.");
        }
    );
}

/* ============================================================
28 — SOUND CONTROL
============================================================ */

if (DOM.soundToggle) {
    DOM.soundToggle.addEventListener(
        "click",
        () => {
            ROYAL_CONFIG.soundEnabled =
                !ROYAL_CONFIG.soundEnabled;

            DOM.soundToggle.textContent =
                ROYAL_CONFIG.soundEnabled
                    ? "♫"
                    : "♪";

            showToast(
                ROYAL_CONFIG.soundEnabled
                    ? "تم تفعيل الأصوات."
                    : "تم إيقاف الأصوات."
            );

            if (ROYAL_CONFIG.soundEnabled) {
                playSound("move");
            }
        }
    );
}

/* ============================================================
29 — FULLSCREEN
============================================================ */

if (DOM.fullscreenBtn) {
    DOM.fullscreenBtn.addEventListener(
        "click",
        async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                } else {
                    await document.exitFullscreen();
                }
            } catch (error) {
                showToast("تعذر تفعيل وضع ملء الشاشة.");
            }
        }
    );
}

/* ============================================================
30 — FRIEND ROOM INTERFACE
============================================================ */

// اللعب عبر الإنترنت غير مفعّل حالياً.
// نحتفظ بعناصر الغرف للتطوير المستقبلي.

if (DOM.joinRoomBtn) {
    DOM.joinRoomBtn.disabled = true;
}

if (DOM.roomCode) {
    DOM.roomCode.disabled = true;
}

const friendNavigationButton =
    document.querySelector('[data-page="friend"]');

if (friendNavigationButton) {
    friendNavigationButton.disabled = true;
    friendNavigationButton.setAttribute(
        "aria-disabled",
        "true"
    );

    const tag =
        friendNavigationButton.querySelector(".nav-tag");

    if (tag) {
        tag.textContent = "قريباً";
    }
}

/* ============================================================
31 — KEYBOARD SHORTCUTS
============================================================ */

document.addEventListener("keydown", event => {
    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "SELECT" ||
        event.target.tagName === "TEXTAREA"
    ) {
        return;
    }

    if (
        event.ctrlKey &&
        event.key.toLowerCase() === "z"
    ) {
        event.preventDefault();
        undoMove();
    }

    if (
        event.key.toLowerCase() === "f"
    ) {
        flipBoard();
    }

    if (event.key === "Escape") {
        clearSelection();
    }
});

/* ============================================================
32 — GAME INITIALIZATION
============================================================ */

function initializeRoyalChess() {
    if (typeof Chess !== "function") {
        console.error(
            "ROYAL CHESS ERROR: Chess.js library not loaded."
        );

        showToast(
            "تعذر تحميل محرك الشطرنج. تحقق من اتصال الإنترنت."
        );

        return;
    }

    updateStatisticsUI();

    createBoard();

    updateHistory();

    updateMatchInformation();

    updateGameStatus();

    if (DOM.whiteClock) {
        DOM.whiteClock.textContent = "∞";
    }

    if (DOM.blackClock) {
        DOM.blackClock.textContent = "∞";
    }

    setTimeout(() => {
        const loader =
            document.getElementById("royal-loader");

        if (loader) {
            loader.classList.add("hidden");
        }
    }, 650);

    console.log(
        "%c ROYAL CHESS ",
        "background:#111e31;color:#e4c58a;font-size:20px;font-weight:bold;padding:12px;"
    );

    console.log(
        "%c Ultimate Game Engine Initialized ",
        "color:#52c98b;font-size:12px;"
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeRoyalChess
    );
} else {
    initializeRoyalChess();
}

/* ============================================================
END OF ROYAL CHESS ENGINE
============================================================ */
