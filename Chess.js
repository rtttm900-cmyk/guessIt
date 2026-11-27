/* =========================================================
   CHESS ARENA V2.0
   Main Game Controller
   Chess.js + Stockfish
========================================================= */

"use strict";

/* ================= CONFIG ================= */

const CONFIG = {
    STORAGE_KEY: "chessArenaData",
    SETTINGS_KEY: "chessArenaSettings",

    STOCKFISH_URL:
        "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js",

    DIFFICULTY_DEPTH: {
        1: 3,
        2: 7,
        3: 11,
        4: 15
    },

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


/* ================= STATE ================= */

let game = null;
let engine = null;
let engineReady = false;
let engineLoading = false;
let engineFailed = false;

let playerColor = "w";
let difficulty = 1;

let selectedSquare = null;
let legalMoves = [];
let lastMove = null;

let gameStarted = false;
let gameFinished = false;
let gameSaved = false;

let startTimestamp = null;
let durationInterval = null;

let boardFlipped = false;
let pendingPromotion = null;

let confirmMoves = false;
let showLegalMoves = true;

let lastCompletedGame = null;

let statistics = {
    total: 0,
    wins: 0,
    losses: 0,
    draws: 0
};

let gameHistory = [];


/* ================= DOM HELPERS ================= */

const $ = id => document.getElementById(id);

function showToast(message, type = "") {
    const container = $("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function formatDuration(seconds) {
    seconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
    ].join(":");
}

function getDuration() {
    if (!startTimestamp) return 0;

    return Math.floor(
        (Date.now() - startTimestamp) / 1000
    );
}


/* ================= STORAGE ================= */

function loadData() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(CONFIG.STORAGE_KEY)
        );

        if (saved) {
            statistics = {
                ...statistics,
                ...(saved.statistics || {})
            };

            gameHistory = Array.isArray(saved.history)
                ? saved.history
                : [];
        }
    } catch (error) {
        console.warn("Could not load saved data:", error);
    }

    try {
        const settings = JSON.parse(
            localStorage.getItem(CONFIG.SETTINGS_KEY)
        );

        if (settings) {
            confirmMoves = !!settings.confirmMoves;
            showLegalMoves = settings.showLegalMoves !== false;

            const theme = settings.theme === "light"
                ? "light"
                : "dark";

            document.body.classList.toggle(
                "light-theme",
                theme === "light"
            );

            if ($("confirmMoves")) {
                $("confirmMoves").checked = confirmMoves;
            }

            if ($("showLegalMoves")) {
                $("showLegalMoves").checked = showLegalMoves;
            }

            document.querySelectorAll("[data-theme]").forEach(btn => {
                btn.classList.toggle(
                    "active",
                    btn.dataset.theme === theme
                );
            });
        }
    } catch (error) {
        console.warn("Could not load settings:", error);
    }
}

function saveData() {
    try {
        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify({
                statistics,
                history: gameHistory
            })
        );
    } catch (error) {
        showToast("تعذر حفظ البيانات في المتصفح.", "error");
    }
}

function saveSettings() {
    const theme = document.body.classList.contains("light-theme")
        ? "light"
        : "dark";

    try {
        localStorage.setItem(
            CONFIG.SETTINGS_KEY,
            JSON.stringify({
                confirmMoves,
                showLegalMoves,
                theme
            })
        );
    } catch (error) {
        console.warn("Could not save settings:", error);
    }
}


/* ================= NAVIGATION ================= */

const pageNames = {
    home: "الرئيسية",
    play: "ساحة اللعب",
    computer: "ضد الكمبيوتر",
    history: "سجل المباريات",
    analysis: "تحليل المباريات",
    stats: "الإحصائيات",
    settings: "الإعدادات"
};

function navigateTo(page) {
    if (!pageNames[page]) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle(
            "active",
            section.id === "page-" + page
        );
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.page === page
        );
    });

    setText("pageTitle", pageNames[page]);

    const sidebar = $("sidebar");
    if (sidebar) sidebar.classList.remove("open");

    if (page === "stats" || page === "home") {
        updateStatistics();
    }

    if (page === "history") {
        renderHistory();
    }
}


/* ================= STOCKFISH ENGINE ================= */

function loadEngine() {
    if (engineReady || engineLoading) return;

    engineLoading = true;

    try {
        const workerCode = `
            importScripts("${CONFIG.STOCKFISH_URL}");

            self.onerror = function(message) {
                self.postMessage("ENGINE_ERROR " + message);
            };
        `;

        const blob = new Blob(
            [workerCode],
            { type: "application/javascript" }
        );

        const workerURL = URL.createObjectURL(blob);

        engine = new Worker(workerURL);

        URL.revokeObjectURL(workerURL);

        engine.onmessage = function(event) {
            const message = String(event.data || "");

            if (message === "uciok") {
                engine.postMessage("isready");
                return;
            }

            if (message === "readyok") {
                engineReady = true;
                engineLoading = false;
                engineFailed = false;

                showToast("محرك الشطرنج جاهز.", "success");

                if (gameStarted && !gameFinished) {
                    requestEngineMove();
                }

                return;
            }

            if (message.startsWith("bestmove")) {
                handleBestMove(message);
                return;
            }

            if (message.startsWith("ENGINE_ERROR")) {
                engineFailed = true;
                engineLoading = false;
                engineReady = false;

                showToast(
                    "تعذر تحميل محرك Stockfish. تحقق من الاتصال بالإنترنت.",
                    "error"
                );
            }
        };

        engine.onerror = function(error) {
            engineFailed = true;
            engineLoading = false;
            engineReady = false;

            console.error("Stockfish error:", error);

            showToast(
                "تعذر تشغيل محرك الشطرنج. تحقق من توفر المحرك.",
                "error"
            );
        };

        engine.postMessage("uci");

    } catch (error) {
        engineFailed = true;
        engineLoading = false;

        console.error(error);

        showToast("حدث خطأ أثناء تشغيل الروبوت.", "error");
    }
}


/* ================= BOARD ================= */

function createBoard() {
    const board = $("chessBoard");
    if (!board || !game) return;

    board.innerHTML = "";

    const files = boardFlipped
        ? ["h", "g", "f", "e", "d", "c", "b", "a"]
        : ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks = boardFlipped
        ? ["1", "2", "3", "4", "5", "6", "7", "8"]
        : ["8", "7", "6", "5", "4", "3", "2", "1"];

    const position = game.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {

            const file = files[col];
            const rank = ranks[row];
            const square = file + rank;

            const squareElement = document.createElement("button");

            squareElement.type = "button";
            squareElement.className = "chess-square";
            squareElement.dataset.square = square;
            squareElement.setAttribute(
                "aria-label",
                "المربع " + square
            );

            const light = (
                "abcdefgh".indexOf(file) +
                Number(rank)
            ) % 2 === 0;

            squareElement.classList.add(
                light ? "light" : "dark"
            );

            const piece = position[8 - Number(rank)]
                ["abcdefgh".indexOf(file)];

            if (piece) {
                const pieceElement = document.createElement("span");

                pieceElement.className = "chess-piece";

                pieceElement.textContent =
                    CONFIG.PIECES[piece.color][piece.type];

                squareElement.appendChild(pieceElement);
            }

            if (
                selectedSquare === square &&
                !gameFinished
            ) {
                squareElement.classList.add("selected");
            }

            if (
                lastMove &&
                (
                    lastMove.from === square ||
                    lastMove.to === square
                )
            ) {
                squareElement.classList.add("last-move");
            }

            if (
                !gameFinished &&
                showLegalMoves &&
                legalMoves.some(move => move.to === square)
            ) {
                const capture = legalMoves.some(
                    move => move.to === square && move.captured
                );

                squareElement.classList.add(
                    capture ? "legal-capture" : "legal-move"
                );
            }

            board.appendChild(squareElement);
        }
    }
}


/* ================= BOARD INTERACTION ================= */

function selectSquare(square) {
    if (!game || !gameStarted || gameFinished) return;

    if (game.turn() !== playerColor) return;

    const piece = game.get(square);

    if (
        selectedSquare &&
        legalMoves.some(move => move.to === square)
    ) {
        const move = legalMoves.find(
            item => item.to === square
        );

        if (
            move.promotion &&
            ["q", "r", "b", "n"].includes(move.promotion)
        ) {
            showPromotionChooser(
                selectedSquare,
                square
            );
            return;
        }

        executePlayerMove(selectedSquare, square);
        return;
    }

    if (piece && piece.color === playerColor) {
        selectedSquare = square;

        legalMoves = game.moves({
            square,
            verbose: true
        });

        createBoard();
        return;
    }

    selectedSquare = null;
    legalMoves = [];

    createBoard();
}

function executePlayerMove(from, to, promotion = "q") {
    if (!game || gameFinished) return;

    if (game.turn() !== playerColor) return;

    if (confirmMoves) {
        const confirmed = window.confirm(
            "هل تريد تنفيذ هذه النقلة؟"
        );

        if (!confirmed) return;
    }

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
        showToast("هذه النقلة غير قانونية.", "error");
        return;
    }

    lastMove = {
        from: move.from,
        to: move.to
    };

    selectedSquare = null;
    legalMoves = [];

    beginGameClock();
    updateGameInterface();
    createBoard();

    checkGameEnd();

    if (!gameFinished) {
        requestEngineMove();
    }
}


/* ================= PROMOTION ================= */

function showPromotionChooser(from, to) {
    pendingPromotion = { from, to };

    const modal = $("promotionModal");
    const options = $("promotionOptions");

    if (!modal || !options) return;

    options.innerHTML = "";

    const types = ["q", "r", "b", "n"];

    types.forEach(type => {
        const button = document.createElement("button");

        button.type = "button";

        button.textContent =
            CONFIG.PIECES[playerColor][type];

        button.title = {
            q: "ملكة",
            r: "قلعة",
            b: "فيل",
            n: "حصان"
        }[type];

        button.addEventListener("click", () => {
            const move = pendingPromotion;

            modal.classList.add("hidden");
            pendingPromotion = null;

            if (move) {
                executePlayerMove(
                    move.from,
                    move.to,
                    type
                );
            }
        });

        options.appendChild(button);
    });

    modal.classList.remove("hidden");
}


/* ================= CLOCK ================= */

function beginGameClock() {
    if (gameStarted) return;

    gameStarted = true;
    startTimestamp = Date.now();

    const date = new Date(startTimestamp);

    setText(
        "gameStartTime",
        date.toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    );

    updateDuration();

    durationInterval = setInterval(
        updateDuration,
        1000
    );
}

function updateDuration() {
    setText(
        "gameDuration",
        formatDuration(getDuration())
    );
}


/* ================= ENGINE MOVE ================= */

function requestEngineMove() {
    if (!game || gameFinished || !gameStarted) return;

    if (game.turn() === playerColor) return;

    if (!engineReady) {
        if (!engineFailed && !engineLoading) {
            loadEngine();
        }

        return;
    }

    const depth = CONFIG.DIFFICULTY_DEPTH[difficulty];

    engine.postMessage("stop");
    engine.postMessage("ucinewgame");
    engine.postMessage("isready");

    // Position is sent after the engine is ready.
    const fen = game.fen();

    engine.postMessage("position fen " + fen);
    engine.postMessage("go depth " + depth);
}

function handleBestMove(message) {
    if (!game || gameFinished) return;

    if (game.turn() === playerColor) return;

    const parts = message.trim().split(/\s+/);
    const bestMove = parts[1];

    if (!bestMove || bestMove === "(none)") {
        checkGameEnd();
        return;
    }

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    const promotion = bestMove[4] || "q";

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
        showToast(
            "تعذر تنفيذ نقلة الروبوت. أعد المباراة.",
            "error"
        );
        return;
    }

    lastMove = {
        from: move.from,
        to: move.to
    };

    selectedSquare = null;
    legalMoves = [];

    updateGameInterface();
    createBoard();

    checkGameEnd();
}


/* ================= GAME STATUS ================= */

function getGameResult() {
    if (game.in_checkmate()) {
        return {
            result: game.turn() === playerColor
                ? "loss"
                : "win",

            title: game.turn() === playerColor
                ? "لقد خسرت!"
                : "لقد فزت!",

            message: "كش مات! انتهت المباراة."
        };
    }

    if (game.in_stalemate()) {
        return {
            result: "draw",
            title: "تعادل",
            message: "انتهت المباراة بسبب حالة الجمود."
        };
    }

    if (game.in_threefold_repetition()) {
        return {
            result: "draw",
            title: "تعادل",
            message: "تكررت الوضعية ثلاث مرات."
        };
    }

    if (game.insufficient_material()) {
        return {
            result: "draw",
            title: "تعادل",
            message: "لا توجد قطع كافية للفوز."
        };
    }

    if (game.in_draw()) {
        return {
            result: "draw",
            title: "تعادل",
            message: "انتهت المباراة بالتعادل."
        };
    }

    return null;
}

function checkGameEnd() {
    if (!game || gameFinished) return;

    const result = getGameResult();

    if (result) {
        finishGame(result);
    } else {
        setText(
            "gameStatus",
            game.turn() === playerColor
                ? "دورك"
                : "دور الروبوت"
        );
    }
}

function finishGame(result) {
    if (gameFinished) return;

    gameFinished = true;

    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }

    setText("gameStatus", "انتهت المباراة");

    if (engineReady) {
        engine.postMessage("stop");
    }

    saveFinishedGame(result);

    setText("gameOverTitle", result.title);

    setText(
        "gameOverMessage",
        result.message +
        " المدة: " + formatDuration(getDuration()) +
        " | النقلات: " + game.history().length
    );

    const modal = $("gameOverModal");

    if (modal) modal.classList.remove("hidden");

    createBoard();
}


/* ================= SAVE RESULT ================= */

function saveFinishedGame(result) {
    if (gameSaved) return;

    gameSaved = true;

    statistics.total++;

    if (result.result === "win") {
        statistics.wins++;
    } else if (result.result === "loss") {
        statistics.losses++;
    } else {
        statistics.draws++;
    }

    const record = {
        id: Date.now(),
        date: new Date().toLocaleString("ar-SA"),
        result: result.result,
        title: result.title,
        difficulty,
        color: playerColor,
        duration: getDuration(),
        moves: game.history().length,
        pgn: game.pgn(),
        fen: game.fen()
    };

    gameHistory.unshift(record);

    if (gameHistory.length > 100) {
        gameHistory.length = 100;
    }

    lastCompletedGame = record;

    saveData();
    updateStatistics();
    renderHistory();
}


/* ================= GAME INITIALIZATION ================= */

function startNewGame() {
    if (typeof Chess !== "function") {
        showToast(
            "تعذر تحميل مكتبة Chess.js. تحقق من الإنترنت.",
            "error"
        );
        return;
    }

    const selectedColor =
        document.querySelector(".color-option.active[data-color]");

    const chosenColor = selectedColor
        ? selectedColor.dataset.color
        : "white";

    if (chosenColor === "random") {
        playerColor = Math.random() < 0.5 ? "w" : "b";
    } else {
        playerColor = chosenColor === "black" ? "b" : "w";
    }

    game = new Chess();

    gameStarted = false;
    gameFinished = false;
    gameSaved = false;

    startTimestamp = null;

    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }

    selectedSquare = null;
    legalMoves = [];
    lastMove = null;
    pendingPromotion = null;

    boardFlipped = playerColor === "b";

    if (engineReady) {
        engine.postMessage("stop");
        engine.postMessage("ucinewgame");
    }

    const computerColor = playerColor === "w" ? "b" : "w";

    setText(
        "playerColor",
        playerColor === "w" ? "الأبيض" : "الأسود"
    );

    setText(
        "opponentColor",
        computerColor === "w" ? "الأبيض" : "الأسود"
    );

    setText(
        "opponentLevel",
        ["", "مبتدئ", "متوسط", "متقدم", "خبير"][difficulty]
    );

    setText("gameStatus", "جاهزة للعب");
    setText("gameStartTime", "--:--");
    setText("gameDuration", "00:00:00");
    setText("moveCount", "0");

    setText(
        "moveHistory",
        "لم يتم لعب أي نقلة بعد."
    );

    const promotionModal = $("promotionModal");
    if (promotionModal) promotionModal.classList.add("hidden");

    const gameOverModal = $("gameOverModal");
    if (gameOverModal) gameOverModal.classList.add("hidden");

    navigateTo("play");

    createBoard();

    if (!engineReady && !engineFailed) {
        loadEngine();
    }

    if (game.turn() !== playerColor) {
        beginGameClock();
        requestEngineMove();
    }

    showToast("بدأت مباراة جديدة.", "success");
}


/* ================= RESTART ================= */

function restartGame() {
    if (!game) {
        startNewGame();
        return;
    }

    if (engineReady) {
        engine.postMessage("stop");
    }

    game = new Chess();

    gameStarted = false;
    gameFinished = false;
    gameSaved = false;

    startTimestamp = null;

    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }

    selectedSquare = null;
    legalMoves = [];
    lastMove = null;
    pendingPromotion = null;

    setText("gameStartTime", "--:--");
    setText("gameDuration", "00:00:00");
    setText("moveCount", "0");
    setText("gameStatus", "جاهزة للعب");

    renderMoveHistory();

    const modal = $("gameOverModal");
    if (modal) modal.classList.add("hidden");

    const promotion = $("promotionModal");
    if (promotion) promotion.classList.add("hidden");

    createBoard();

    if (game.turn() !== playerColor) {
        beginGameClock();
        requestEngineMove();
    }

    showToast("تمت إعادة المباراة.");
}


/* ================= UNDO ================= */

function undoMove() {
    if (!game || gameFinished) return;

    if (!game.history().length) {
        showToast("لا توجد نقلات للتراجع عنها.");
        return;
    }

    if (engineReady) {
        engine.postMessage("stop");
    }

    // Undo the bot move first, then the player's move.
    if (game.turn() === playerColor) {
        game.undo();
        if (game.history().length) {
            game.undo();
        }
    } else {
        game.undo();
    }

    selectedSquare = null;
    legalMoves = [];

    const history = game.history({ verbose: true });

    lastMove = history.length
        ? {
            from: history[history.length - 1].from,
            to: history[history.length - 1].to
        }
        : null;

    gameFinished = false;
    gameSaved = false;

    const modal = $("gameOverModal");
    if (modal) modal.classList.add("hidden");

    updateGameInterface();
    createBoard();

    if (game.turn() !== playerColor) {
        requestEngineMove();
    } else {
        setText("gameStatus", "دورك");
    }

    showToast("تم التراجع عن النقلات.");
}


/* ================= RESIGN ================= */

function resignGame() {
    if (!game || gameFinished) return;

    if (!gameStarted) {
        showToast("ابدأ المباراة أولاً.");
        return;
    }

    const confirmed = window.confirm(
        "هل أنت متأكد أنك تريد إنهاء المباراة؟"
    );

    if (!confirmed) return;

    finishGame({
        result: "loss",
        title: "استسلمت",
        message: "تم إنهاء المباراة بالاستسلام."
    });
}


/* ================= UPDATE INTERFACE ================= */

function updateGameInterface() {
    if (!game) return;

    setText(
        "moveCount",
        String(game.history().length)
    );

    setText(
        "gameStatus",
        game.turn() === playerColor
            ? "دورك"
            : "دور الروبوت"
    );

    renderMoveHistory();
}

function renderMoveHistory() {
    const container = $("moveHistory");
    if (!container || !game) return;

    const moves = game.history({ verbose: true });

    container.innerHTML = "";

    if (!moves.length) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "لم يتم لعب أي نقلة بعد.";

        container.appendChild(empty);
        return;
    }

    const table = document.createElement("div");
    table.className = "moves-table";

    for (let i = 0; i < moves.length; i += 2) {
        const row = document.createElement("div");
        row.className = "moves-row";

        const number = document.createElement("span");
        number.textContent = (Math.floor(i / 2) + 1) + ".";

        const white = document.createElement("strong");
        white.textContent = moves[i].san;

        const black = document.createElement("strong");
        black.textContent = moves[i + 1]
            ? moves[i + 1].san
            : "—";

        row.append(number, white, black);
        table.appendChild(row);
    }

    container.appendChild(table);
    container.scrollTop = container.scrollHeight;
}


/* ================= STATISTICS ================= */

function updateStatistics() {
    setText("homeTotalGames", statistics.total);
    setText("homeWins", statistics.wins);
    setText("homeLosses", statistics.losses);
    setText("homeDraws", statistics.draws);

    setText("statsTotal", statistics.total);
    setText("statsWins", statistics.wins);
    setText("statsLosses", statistics.losses);
    setText("statsDraws", statistics.draws);

    const percentage = statistics.total
        ? Math.round(
            statistics.wins / statistics.total * 100
        )
        : 0;

    const bar = $("winRateBar");

    if (bar) {
        bar.style.width = percentage + "%";
    }

    setText("winRateText", percentage + "%");
}


/* ================= HISTORY ================= */

function renderHistory() {
    const container = $("historyList");
    if (!container) return;

    container.innerHTML = "";

    if (!gameHistory.length) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "لا توجد مباريات مسجلة حتى الآن.";

        container.appendChild(empty);
        return;
    }

    gameHistory.forEach(record => {
        const item = document.createElement("div");

        item.className = "history-item";

        const heading = document.createElement("strong");
        heading.textContent = record.title;

        const details = document.createElement("p");

        details.textContent =
            record.date +
            " | " +
            formatDuration(record.duration) +
            " | " +
            record.moves +
            " نقلة";

        item.append(heading, details);

        container.appendChild(item);
    });
}


/* ================= ANALYSIS ================= */

function analyzeLastGame() {
    if (!lastCompletedGame) {
        showToast("لا توجد مباراة مكتملة لتحليلها.");
        return;
    }

    const container = $("analysisResults");
    if (!container) return;

    container.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "بيانات آخر مباراة";

    const details = document.createElement("p");

    details.textContent =
        "النتيجة: " + lastCompletedGame.title +
        " | الصعوبة: " + lastCompletedGame.difficulty +
        " | النقلات: " + lastCompletedGame.moves +
        " | المدة: " + formatDuration(lastCompletedGame.duration);

    const pgn = document.createElement("pre");
    pgn.textContent = lastCompletedGame.pgn || "لا يوجد سجل نقلات.";

    pgn.style.whiteSpace = "pre-wrap";
    pgn.style.direction = "ltr";
    pgn.style.textAlign = "left";
    pgn.style.overflowWrap = "anywhere";
    pgn.style.fontSize = "12px";

    container.append(title, details, pgn);

    showToast("تم عرض سجل المباراة.");
}


/* ================= SETTINGS ================= */

function setTheme(theme) {
    const light = theme === "light";

    document.body.classList.toggle(
        "light-theme",
        light
    );

    document.querySelectorAll("[data-theme]").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.theme === theme
        );
    });

    saveSettings();
}

function clearStatistics() {
    const confirmed = window.confirm(
        "سيتم حذف جميع الإحصائيات وسجل المباريات. هل تريد المتابعة؟"
    );

    if (!confirmed) return;

    statistics = {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0
    };

    gameHistory = [];
    lastCompletedGame = null;

    saveData();
    updateStatistics();
    renderHistory();

    const analysis = $("analysisResults");

    if (analysis) {
        analysis.textContent = "لا يوجد تحليل متاح حالياً.";
    }

    showToast("تم مسح الإحصائيات والسجل.", "success");
}


/* ================= DIFFICULTY ================= */

function setDifficulty(value) {
    difficulty = Number(value);

    document.querySelectorAll("[data-difficulty]").forEach(btn => {
        btn.classList.toggle(
            "active",
            Number(btn.dataset.difficulty) === difficulty
        );
    });
}


/* ================= COLOR ================= */

function setColor(button) {
    document.querySelectorAll("[data-color]").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn === button
        );
    });
}


/* ================= EVENT LISTENERS ================= */

function setupNavigation() {
    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.page);
        });
    });

    document.querySelectorAll('[data-action="start-game"]').forEach(button => {
        button.addEventListener("click", () => {
            navigateTo("computer");
        });
    });

    const menu = $("menuToggle");

    if (menu) {
        menu.addEventListener("click", () => {
            $("sidebar")?.classList.toggle("open");
        });
    }

    document.addEventListener("click", event => {
        const sidebar = $("sidebar");
        const menuButton = $("menuToggle");

        if (
            sidebar &&
            menuButton &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            sidebar.classList.remove("open");
        }
    });
}

function setupGameControls() {
    $("startComputerGame")?.addEventListener(
        "click",
        startNewGame
    );

    $("newGameBtn")?.addEventListener(
        "click",
        startNewGame
    );

    $("restartBtn")?.addEventListener(
        "click",
        restartGame
    );

    $("undoBtn")?.addEventListener(
        "click",
        undoMove
    );

    $("resignBtn")?.addEventListener(
        "click",
        resignGame
    );

    $("flipBoardBtn")?.addEventListener("click", () => {
        boardFlipped = !boardFlipped;
        createBoard();
    });

    $("chessBoard")?.addEventListener("click", event => {
        const square = event.target.closest("[data-square]");

        if (!square) return;

        selectSquare(square.dataset.square);
    });

    $("gameOverNewGame")?.addEventListener("click", () => {
        startNewGame();
    });

    $("gameOverClose")?.addEventListener("click", () => {
        $("gameOverModal")?.classList.add("hidden");
    });

    $("promotionModal")?.addEventListener("click", event => {
        if (event.target.id === "promotionModal") {
            pendingPromotion = null;
            event.currentTarget.classList.add("hidden");
        }
    });
}

function setupSettings() {
    document.querySelectorAll("[data-difficulty]").forEach(button => {
        button.addEventListener("click", () => {
            setDifficulty(button.dataset.difficulty);
        });
    });

    document.querySelectorAll("[data-color]").forEach(button => {
        button.addEventListener("click", () => {
            setColor(button);
        });
    });

    document.querySelectorAll("[data-theme]").forEach(button => {
        button.addEventListener("click", () => {
            setTheme(button.dataset.theme);
        });
    });

    $("confirmMoves")?.addEventListener("change", event => {
        confirmMoves = event.target.checked;
        saveSettings();
    });

    $("showLegalMoves")?.addEventListener("change", event => {
        showLegalMoves = event.target.checked;
        saveSettings();
        createBoard();
    });

    $("clearStatsBtn")?.addEventListener(
        "click",
        clearStatistics
    );

    document.querySelector('[data-action="analyze-last-game"]')
        ?.addEventListener("click", analyzeLastGame);
}


/* ================= INITIALIZATION ================= */

function initializeChessArena() {
    if (typeof Chess !== "function") {
        showToast(
            "مكتبة Chess.js غير متاحة. تحقق من الاتصال بالإنترنت.",
            "error"
        );
        return;
    }

    loadData();

    game = new Chess();

    setupNavigation();
    setupGameControls();
    setupSettings();

    updateStatistics();
    renderHistory();
    renderMoveHistory();
    createBoard();

    setDifficulty(1);

    loadEngine();

    console.log("Chess Arena initialized successfully.");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeChessArena
    );
} else {
    initializeChessArena();
}
