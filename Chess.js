/* =========================================================
   ROYAL CHESS — BEYOND THE BOARD
   Main JavaScript Engine
   Requires chess.js 0.10.3 loaded before this file.
   ========================================================= */

"use strict";

/* ================= CONFIGURATION ================= */

const CONFIG = {
    initialTime: 600,
    aiDepth: 2,
    animationDuration: 250
};

const PIECES = {
    w: {
        k: "♔", q: "♕", r: "♖",
        b: "♗", n: "♘", p: "♙"
    },
    b: {
        k: "♚", q: "♛", r: "♜",
        b: "♝", n: "♞", p: "♟"
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

/* ================= GAME STATE ================= */

let game = new Chess();

let selectedSquare = null;
let legalMoves = [];
let lastMove = null;

let playerColor = "w";
let gameMode = "computer";
let gameStarted = false;
let boardFlipped = false;
let aiThinking = false;
let gameFinished = false;

let difficulty = 2;

let moveHistory = [];
let roomCode = null;

/* ================= DOM HELPERS ================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => Array.from(
    document.querySelectorAll(selector)
);

function get(id) {
    return document.getElementById(id);
}

function exists(id) {
    return !!get(id);
}

function toast(message, type = "info") {
    const box = get("royal-toast");
    const text = get("toastMessage");

    if (!box || !text) {
        console.log(message);
        return;
    }

    text.textContent = message;

    box.classList.remove("show", "success", "error");
    box.classList.add("show");

    if (type === "success") box.classList.add("success");
    if (type === "error") box.classList.add("error");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        box.classList.remove("show", "success", "error");
    }, 3000);
}

/* ================= LOADING SCREEN ================= */

window.addEventListener("load", () => {
    const loader =
        get("loadingScreen") ||
        get("royal-loader");

    if (!loader) return;

    setTimeout(() => {
        loader.classList.add("hidden");

        setTimeout(() => {
            loader.style.display = "none";
        }, 650);

    }, 4000);
});

/* ================= NAVIGATION ================= */

function showPage(pageName) {
    const page = get(pageName + "Page");

    if (!page) {
        toast("هذه الصفحة غير موجودة.", "error");
        return;
    }

    $$(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    $$(".royal-nav [data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const title = get("pageTitle");

    if (title) {
        const activeButton = $(
            `.royal-nav [data-page="${pageName}"]`
        );

        title.textContent =
            activeButton?.textContent.trim() || pageName;
    }

    closeSidebar();
}

$$(".royal-nav [data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

/* ================= SIDEBAR ================= */

function openSidebar() {
    get("sidebar")?.classList.add("open");
}

function closeSidebar() {
    get("sidebar")?.classList.remove("open");
}

function toggleSidebar() {
    get("sidebar")?.classList.toggle("open");
}

get("sidebarToggle")?.addEventListener("click", toggleSidebar);
get("menuButton")?.addEventListener("click", toggleSidebar);

document.addEventListener("click", event => {
    const sidebar = get("sidebar");

    if (
        window.innerWidth <= 850 &&
        sidebar?.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !event.target.closest("#menuButton") &&
        !event.target.closest("#sidebarToggle")
    ) {
        closeSidebar();
    }
});

/* ================= MODALS ================= */

function openModal(id) {
    const modal = get(id);

    if (!modal) return;

    modal.classList.add("active");
    modal.classList.add("show");
}

function closeModal(id) {
    const modal = get(id);

    if (!modal) return;

    modal.classList.remove("active");
    modal.classList.remove("show");
}

$$("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        const modal = button.closest(".modal, .royal-modal");

        if (modal) {
            modal.classList.remove("active", "show");
        }
    });
});

$$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("active", "show");
        }
    });
});

/* ================= BOARD ================= */

function renderBoard() {
    const board = get("board");

    if (!board) return;

    board.innerHTML = "";

    const files = boardFlipped
        ? ["h", "g", "f", "e", "d", "c", "b", "a"]
        : ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks = boardFlipped
        ? [1, 2, 3, 4, 5, 6, 7, 8]
        : [8, 7, 6, 5, 4, 3, 2, 1];

    const boardState = game.board();

    ranks.forEach(rank => {
        files.forEach(file => {
            const squareName = file + rank;

            const piece = game.get(squareName);

            const square = document.createElement("div");

            const fileIndex = file.charCodeAt(0) - 97;

            square.className =
                (fileIndex + rank) % 2 === 0
                    ? "square light"
                    : "square dark";

            square.dataset.square = squareName;

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (
                lastMove &&
                (lastMove.from === squareName ||
                 lastMove.to === squareName)
            ) {
                square.classList.add("last-move");
            }

            const move = legalMoves.find(
                item => item.to === squareName
            );

            if (selectedSquare && move) {
                square.classList.add(
                    piece ? "legal-capture" : "legal-move"
                );
            }

            if (
                piece &&
                piece.type === "k" &&
                piece.color === game.turn() &&
                game.in_check()
            ) {
                square.classList.add("in-check");
            }

            if (piece) {
                const pieceElement = document.createElement("span");

                pieceElement.className =
                    piece.color === "w"
                        ? "piece-w"
                        : "piece-b";

                pieceElement.textContent =
                    PIECES[piece.color][piece.type];

                pieceElement.draggable = true;

                square.appendChild(pieceElement);
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            square.addEventListener("dragstart", event => {
                if (!piece || piece.color !== game.turn()) {
                    event.preventDefault();
                    return;
                }

                event.dataTransfer.setData(
                    "text/plain",
                    squareName
                );
            });

            square.addEventListener("dragover", event => {
                event.preventDefault();
            });

            square.addEventListener("drop", event => {
                event.preventDefault();

                const from = event.dataTransfer.getData(
                    "text/plain"
                );

                if (from) {
                    makeMove(from, squareName);
                }
            });

            board.appendChild(square);
        });
    });

    updateGameInformation();
}

/* ================= MOVE SELECTION ================= */

function handleSquareClick(square) {
    if (!gameStarted || gameFinished || aiThinking) return;

    if (
        gameMode === "computer" &&
        game.turn() !== playerColor
    ) {
        return;
    }

    const piece = game.get(square);

    if (!selectedSquare) {
        if (piece && piece.color === game.turn()) {
            selectSquare(square);
        }

        return;
    }

    if (selectedSquare === square) {
        clearSelection();
        return;
    }

    if (piece && piece.color === game.turn()) {
        selectSquare(square);
        return;
    }

    makeMove(selectedSquare, square);
}

function selectSquare(square) {
    selectedSquare = square;

    legalMoves = game.moves({
        square: square,
        verbose: true
    });

    renderBoard();
}

function clearSelection() {
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
}

/* ================= MAKE MOVE ================= */

function makeMove(from, to, promotion = "q") {
    if (!gameStarted || gameFinished || aiThinking) return false;

    if (
        gameMode === "computer" &&
        game.turn() !== playerColor
    ) {
        return false;
    }

    let move;

    try {
        move = game.move({
            from: from,
            to: to,
            promotion: promotion
        });
    } catch (error) {
        move = null;
    }

    if (!move) {
        toast("هذه النقلة غير قانونية.", "error");
        return false;
    }

    lastMove = {
        from: move.from,
        to: move.to
    };

    moveHistory = game.history({
        verbose: true
    });

    selectedSquare = null;
    legalMoves = [];

    renderBoard();
    updateMoveHistory();
    updateGameInformation();
    checkGameOver();

    if (
        gameStarted &&
        !gameFinished &&
        gameMode === "computer" &&
        game.turn() !== playerColor
    ) {
        setTimeout(computerMove, 350);
    }

    return true;
}

/* ================= MOVE HISTORY ================= */

function updateMoveHistory() {
    const history = get("moveHistory");

    if (!history) return;

    history.innerHTML = "";

    for (let i = 0; i < moveHistory.length; i += 2) {
        const row = document.createElement("div");

        const number = document.createElement("span");
        const white = document.createElement("span");
        const black = document.createElement("span");

        number.textContent = `${Math.floor(i / 2) + 1}.`;

        white.textContent = moveHistory[i].san;

        black.textContent =
            moveHistory[i + 1]?.san || "";

        row.append(number, white, black);
        history.appendChild(row);
    }

    history.scrollTop = history.scrollHeight;
}

/* ================= GAME INFORMATION ================= */

function updateGameInformation() {
    const turn = game.turn() === "w" ? "الأبيض" : "الأسود";

    if (get("currentTurn")) {
        get("currentTurn").textContent = turn;
    }

    if (get("moveCount")) {
        get("moveCount").textContent =
            Math.ceil(game.history().length / 2);
    }

    if (get("lastMove")) {
        get("lastMove").textContent = lastMove
            ? `${lastMove.from} → ${lastMove.to}`
            : "لا توجد نقلات";
    }

    if (get("matchState")) {
        get("matchState").textContent =
            gameStarted ? "جارية" : "لم تبدأ";
    }

    if (get("matchType")) {
        get("matchType").textContent =
            gameMode === "computer"
                ? "ضد الكمبيوتر"
                : gameMode === "local"
                ? "لاعبان محليًا"
                : "لعبة صديق";
    }

    if (get("gameStatus")) {
        if (!gameStarted) {
            get("gameStatus").textContent =
                "ابدأ مباراة جديدة للعب.";
        } else if (game.in_check()) {
            get("gameStatus").textContent =
                `كش! ${turn} في خطر.`;
        } else {
            get("gameStatus").textContent =
                `${turn} عليه الدور.`;
        }
    }
}

/* ================= GAME OVER ================= */

function checkGameOver() {
    if (!game.game_over()) return;

    gameFinished = true;
    gameStarted = false;

    let message = "انتهت المباراة.";

    if (game.in_checkmate()) {
        message =
            game.turn() === "w"
                ? "كش مات! الأسود فاز."
                : "كش مات! الأبيض فاز.";
    } else if (game.in_stalemate()) {
        message = "تعادل بسبب الجمود.";
    } else if (game.in_threefold_repetition()) {
        message = "تعادل بسبب تكرار الوضعية.";
    } else if (game.insufficient_material()) {
        message = "تعادل بسبب عدم كفاية القطع.";
    } else if (game.in_draw()) {
        message = "انتهت المباراة بالتعادل.";
    }

    if (get("gameStatus")) {
        get("gameStatus").textContent = message;
    }

    toast(message, "success");
}

/* ================= START GAME ================= */

function startNewGame(mode = "computer", color = "w") {
    game = new Chess();

    selectedSquare = null;
    legalMoves = [];
    lastMove = null;
    moveHistory = [];

    gameMode = mode;
    playerColor = color;

    gameStarted = true;
    gameFinished = false;
    aiThinking = false;

    boardFlipped = mode === "computer" && color === "b";

    renderBoard();
    updateMoveHistory();
    updateGameInformation();

    if (
        mode === "computer" &&
        playerColor === "b"
    ) {
        setTimeout(computerMove, 400);
    }

    if (get("gameView")) {
        get("gameView").classList.add("active");
    }

    $$(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    closeModal("computerModal");
    closeModal("friendModal");

    toast("بدأت المباراة بنجاح.", "success");
}

/* ================= COMPUTER ENGINE ================= */

function evaluateBoard() {
    if (game.in_checkmate()) {
        return game.turn() === "w" ? -100000 : 100000;
    }

    if (game.in_draw()) return 0;

    let score = 0;

    const board = game.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];

            if (!piece) continue;

            const value = PIECE_VALUES[piece.type];

            score += piece.color === "w"
                ? value
                : -value;
        }
    }

    return score;
}

function minimax(depth, alpha, beta, maximizing) {
    if (depth === 0 || game.game_over()) {
        return evaluateBoard();
    }

    const moves = game.moves({
        verbose: true
    });

    if (maximizing) {
        let best = -Infinity;

        for (const move of moves) {
            game.move(move);

            const score = minimax(
                depth - 1,
                alpha,
                beta,
                false
            );

            game.undo();

            best = Math.max(best, score);
            alpha = Math.max(alpha, best);

            if (beta <= alpha) break;
        }

        return best;
    }

    let best = Infinity;

    for (const move of moves) {
        game.move(move);

        const score = minimax(
            depth - 1,
            alpha,
            beta,
            true
        );

        game.undo();

        best = Math.min(best, score);
        beta = Math.min(beta, best);

        if (beta <= alpha) break;
    }

    return best;
}

function chooseComputerMove() {
    const moves = game.moves({
        verbose: true
    });

    if (!moves.length) return null;

    let bestMove = null;
    let bestScore = game.turn() === "w"
        ? -Infinity
        : Infinity;

    const maximizing = game.turn() === "w";

    for (const move of moves) {
        game.move(move);

        const score = minimax(
            Math.max(0, difficulty - 1),
            -Infinity,
            Infinity,
            !maximizing
        );

        game.undo();

        if (
            maximizing && score > bestScore ||
            !maximizing && score < bestScore
        ) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function computerMove() {
    if (
        !gameStarted ||
        gameFinished ||
        game.game_over() ||
        game.turn() === playerColor
    ) {
        return;
    }

    aiThinking = true;

    if (get("gameStatus")) {
        get("gameStatus").textContent =
            "الكمبيوتر يفكر...";
    }

    setTimeout(() => {
        const move = chooseComputerMove();

        if (move) {
            game.move(move);

            lastMove = {
                from: move.from,
                to: move.to
            };

            moveHistory = game.history({
                verbose: true
            });
        }

        aiThinking = false;

        selectedSquare = null;
        legalMoves = [];

        renderBoard();
        updateMoveHistory();
        updateGameInformation();
        checkGameOver();

    }, 100);
}

/* ================= GAME CONTROLS ================= */

get("undoBtn")?.addEventListener("click", () => {
    if (!gameStarted || aiThinking) return;

    if (game.history().length === 0) return;

    game.undo();

    if (
        gameMode === "computer" &&
        game.turn() !== playerColor &&
        game.history().length > 0
    ) {
        game.undo();
    }

    lastMove = null;

    const history = game.history({
        verbose: true
    });

    if (history.length) {
        const previous = history[history.length - 1];

        lastMove = {
            from: previous.from,
            to: previous.to
        };
    }

    moveHistory = history;

    gameFinished = false;
    gameStarted = true;

    clearSelection();
    updateMoveHistory();
    updateGameInformation();

    toast("تم التراجع عن النقلة.");
});

get("restartBtn")?.addEventListener("click", () => {
    if (!gameStarted && game.history().length === 0) return;

    startNewGame(gameMode, playerColor);
});

get("flipBoardBtn")?.addEventListener("click", () => {
    boardFlipped = !boardFlipped;
    renderBoard();
});

get("resignBtn")?.addEventListener("click", () => {
    if (!gameStarted || gameFinished) return;

    gameStarted = false;
    gameFinished = true;

    const message = "استسلم اللاعب. انتهت المباراة.";

    if (get("gameStatus")) {
        get("gameStatus").textContent = message;
    }

    toast(message);
});

get("exitGameView")?.addEventListener("click", () => {
    get("gameView")?.classList.remove("active");
    showPage("home");
});

/* ================= COMPUTER MODAL ================= */

get("computerBtn")?.addEventListener("click", () => {
    openModal("computerModal");
});

get("startBtn")?.addEventListener("click", () => {
    openModal("computerModal");
});

get("confirmComputer")?.addEventListener("click", () => {
    const selectedDifficulty = get("difficulty")?.value || "2";
    const selectedColor = get("playerColor")?.value || "w";

    difficulty = Math.max(
        1,
        Math.min(3, Number(selectedDifficulty))
    );

    startNewGame("computer", selectedColor);
});

/* ================= LOCAL GAME ================= */

$$("[data-mode='local']").forEach(button => {
    button.addEventListener("click", () => {
        startNewGame("local", "w");
    });
});

/* ================= FRIEND ROOMS ================= */

function generateRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters[
            Math.floor(Math.random() * characters.length)
        ];
    }

    return code;
}

get("friendBtn")?.addEventListener("click", () => {
    openModal("friendModal");
});

get("createRoomBtn")?.addEventListener("click", () => {
    roomCode = generateRoomCode();

    if (get("roomCode")) {
        get("roomCode").textContent = roomCode;
    }

    toast("تم إنشاء رمز الغرفة محليًا: " + roomCode, "success");
});

get("joinRoomBtn")?.addEventListener("click", () => {
    const input = get("joinRoomCode");

    const code = input?.value.trim().toUpperCase();

    if (!code || code.length !== 6) {
        toast("أدخل رمزًا صحيحًا مكونًا من 6 أحرف.", "error");
        return;
    }

    toast(
        "واجهة الانضمام جاهزة، لكن اللعب بين جهازين يحتاج خادمًا مشتركًا.",
        "info"
    );
});

/* ================= HOME MODE BUTTONS ================= */

$$("[data-mode='computer']").forEach(button => {
    button.addEventListener("click", () => {
        openModal("computerModal");
    });
});

$$("[data-mode='friend']").forEach(button => {
    button.addEventListener("click", () => {
        openModal("friendModal");
    });
});

/* ================= SETTINGS ================= */

function saveSetting(key, value) {
    try {
        localStorage.setItem(
            "royal-chess-" + key,
            String(value)
        );
    } catch (error) {
        console.warn("Could not save setting:", error);
    }
}

function readSetting(key, fallback) {
    try {
        return localStorage.getItem(
            "royal-chess-" + key
        ) ?? fallback;
    } catch (error) {
        return fallback;
    }
}

const boardThemes = {
    green: ["#e8dfc9", "#789078"],
    brown: ["#f0d9b5", "#b58863"],
    blue: ["#dee8f5", "#6686aa"],
    purple: ["#e7dff2", "#8874a8"]
};

function applyBoardTheme(theme) {
    const colors = boardThemes[theme];

    if (!colors) return;

    const style = document.createElement("style");

    style.id = "royal-board-theme";

    style.textContent = `
        #board .square.light { background: ${colors[0]} !important; }
        #board .square.dark { background: ${colors[1]} !important; }
    `;

    get("royal-board-theme")?.remove();

    document.head.appendChild(style);
}

const savedBoardTheme = readSetting("boardTheme", "green");

if (get("boardTheme")) {
    get("boardTheme").value = savedBoardTheme;
}

applyBoardTheme(savedBoardTheme);

get("boardTheme")?.addEventListener("change", event => {
    applyBoardTheme(event.target.value);
    saveSetting("boardTheme", event.target.value);
    renderBoard();
});

get("showLegalMoves")?.addEventListener("change", event => {
    saveSetting("showLegalMoves", event.target.checked);
});

get("showLastMove")?.addEventListener("change", event => {
    saveSetting("showLastMove", event.target.checked);
});

get("autoFlipBoard")?.addEventListener("change", event => {
    saveSetting("autoFlipBoard", event.target.checked);
});

get("soundSetting")?.addEventListener("change", event => {
    saveSetting("soundSetting", event.target.checked);
});

get("effectsSetting")?.addEventListener("change", event => {
    saveSetting("effectsSetting", event.target.checked);
});

get("languageSetting")?.addEventListener("change", event => {
    saveSetting("languageSetting", event.target.value);
});

get("animationSetting")?.addEventListener("change", event => {
    saveSetting("animationSetting", event.target.value);
});

/* ================= RESTORE SETTINGS ================= */

function restoreCheckbox(id, key, fallback = true) {
    const element = get(id);

    if (!element) return;

    element.checked =
        readSetting(key, String(fallback)) === "true";
}

restoreCheckbox("showLegalMoves", "showLegalMoves");
restoreCheckbox("showLastMove", "showLastMove");
restoreCheckbox("autoFlipBoard", "autoFlipBoard");
restoreCheckbox("soundSetting", "soundSetting");
restoreCheckbox("effectsSetting", "effectsSetting");

if (get("languageSetting")) {
    get("languageSetting").value =
        readSetting("languageSetting", "ar");
}

if (get("animationSetting")) {
    get("animationSetting").value =
        readSetting("animationSetting", "normal");
}

/* ================= RESET SETTINGS ================= */

get("resetSettingsBtn")?.addEventListener("click", () => {
    const confirmed = confirm(
        "هل تريد إعادة جميع الإعدادات إلى الوضع الافتراضي؟"
    );

    if (!confirmed) return;

    Object.keys(localStorage)
        .filter(key => key.startsWith("royal-chess-"))
        .forEach(key => localStorage.removeItem(key));

    location.reload();
});

/* ================= INITIALIZATION ================= */

function initializeRoyalChess() {
    if (typeof Chess !== "function") {
        console.error(
            "Chess.js library is missing. Load chess.js 0.10.3 first."
        );

        toast("تعذر تحميل محرك الشطرنج.", "error");
        return;
    }

    renderBoard();
    updateMoveHistory();
    updateGameInformation();

    if (get("homePage")) {
        showPage("home");
    }

    console.log(
        "%c ROYAL CHESS ",
        "background:#17243b;color:#f2d99b;padding:10px;font-weight:bold;"
    );

    console.log("Royal Chess initialized successfully.");
}

document.addEventListener(
    "DOMContentLoaded",
    initializeRoyalChess
);
