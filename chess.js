/* =========================================================
   CHESS ARENA - SUPABASE ROOMS EDITION
   Compatible with the existing chess.html and legacy chess.js API
   Requires: Chess.js + Supabase JS v2 loaded before this file.
   ========================================================= */

"use strict";

/* ========================= CONFIG ========================= */

const CONFIG = {
    STORAGE_KEY: "chessArenaData",
    ROOM_LENGTH: 6,
    DEFAULT_TIME: 5 * 60,
    PIECES: {
        w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
        b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
    }
};

/* ========================= STATE ========================= */

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
let currentRoom = null;
let currentUserId = null;
let roomChannel = null;
let roomBusy = false;
let applyingRemoteMove = false;
let pendingPromotion = null;
let matchSaved = false;
let soundEnabled = true;

let settings = {
    sound: true,
    highlights: true,
    lastMove: true,
    coordinates: true
};

const $ = id => document.getElementById(id);

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
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
    seconds = Math.max(0, Number(seconds) || 0);
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
        String(seconds % 60).padStart(2, "0");
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
    setTimeout(() => toast.remove(), 3500);
}

function showModal(id) { showElement(id); }
function closeModal(id) { hideElement(id); }

/* ========================= SUPABASE ========================= */

function getSupabase() {
    if (!window.supabaseClient) {
        throw new Error("Supabase client غير موجود. تأكد من إضافته في chess.html قبل chess.js.");
    }
    return window.supabaseClient;
}

async function ensureAnonymousLogin() {
    const client = getSupabase();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;

    let user = sessionData?.session?.user;

    if (!user) {
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        user = data?.user || data?.session?.user;
    }

    if (!user?.id) throw new Error("تعذر إنشاء هوية اللاعب.");
    currentUserId = user.id;
    return user;
}

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

        // Anonymous login is needed only for online rooms.
        console.log("CHESS ARENA initialized.");
    } catch (error) {
        console.error(error);
        alert("تعذر تشغيل لعبة الشطرنج: " + (error.message || error));
    }
}

/* ========================= NAVIGATION ========================= */

function navigateTo(page) {
    document.querySelectorAll(".app-page").forEach(section => {
        section.classList.remove("active");
    });

    const target = $("page-" + page);
    if (!target) return;
    target.classList.add("active");

    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    if (page === "stats") {
        updateStatistics();
        renderRecentGames();
    }
    if (page === "history") renderFullHistory();
    if (page === "play") updateInterface();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ========================= BOARD ========================= */

function createBoard() {
    if (!$("chessBoard")) {
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
    const ranks = boardFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const orderedFiles = boardFlipped ? [...files].reverse() : files;

    ranks.forEach(rank => {
        orderedFiles.forEach(file => {
            const squareName = file + rank;
            const piece = chess.get(squareName);
            const fileIndex = files.indexOf(file);
            const isLight = (fileIndex + rank) % 2 === 0;
            const square = document.createElement("div");

            square.className = "square " + (isLight ? "light" : "dark");
            square.dataset.square = squareName;
            square.setAttribute("role", "gridcell");

            if (selectedSquare === squareName) square.classList.add("selected");

            if (settings.highlights && possibleMoves.some(move => move.to === squareName)) {
                square.classList.add("legal-move");
            }

            if (settings.lastMove && lastMove &&
                (lastMove.from === squareName || lastMove.to === squareName)) {
                square.classList.add("last-move");
            }

            if (piece) {
                const pieceElement = document.createElement("span");
                pieceElement.className = "piece " +
                    (piece.color === "w" ? "white-piece" : "black-piece");
                pieceElement.textContent = CONFIG.PIECES[piece.color][piece.type];
                square.appendChild(pieceElement);
            }

            square.addEventListener("click", () => handleSquareClick(squareName));
            boardElement.appendChild(square);
        });
    });

    updateInterface();
    updateKingStatus();
}

function canCurrentUserMove() {
    if (gameMode !== "room") return true;
    if (!currentRoom || currentRoom.status !== "playing") return false;
    return chess && chess.turn() === playerColor;
}

function handleSquareClick(squareName) {
    if (!chess || !gameStarted || gameFinished || aiThinking) return;
    if (gameMode === "ai" && chess.turn() !== playerColor) return;
    if (gameMode === "room" && !canCurrentUserMove()) return;

    const piece = chess.get(squareName);

    if (selectedSquare) {
        const validMove = possibleMoves.find(move => move.to === squareName);
        if (validMove) {
            if (validMove.promotion) openPromotionModal(selectedSquare, squareName);
            else makeMove(selectedSquare, squareName);
            return;
        }
    }

    if (piece && piece.color === chess.turn()) {
        selectedSquare = squareName;
        possibleMoves = chess.moves({ square: squareName, verbose: true });
        renderBoard();
        return;
    }

    selectedSquare = null;
    possibleMoves = [];
    renderBoard();
}

/* ========================= PROMOTION ========================= */

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

/* ========================= MOVE + ONLINE SYNC ========================= */

async function makeMove(from, to, promotion = "q") {
    if (!chess || gameFinished || !gameStarted) return;
    if (gameMode === "room" && !canCurrentUserMove()) {
        showToast("انتظر دورك.", "error");
        return;
    }

    let move;
    try {
        move = chess.move({ from, to, promotion });
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

    if (gameMode === "room" && !applyingRemoteMove && !gameFinished) {
        await syncRoomMove();
    }

    if (gameMode === "ai" && !gameFinished && chess.turn() !== playerColor) {
        aiTimeout = setTimeout(makeComputerMove, 500);
    }
}

async function syncRoomMove() {
    if (!currentRoomCode || !currentRoom || roomBusy) return;

    roomBusy = true;
    try {
        const client = getSupabase();
        const payload = {
            p_room_code: currentRoomCode,
            p_fen: chess.fen(),
            p_moves: chess.history(),
            p_status: "playing"
        };

        const { data, error } = await client.rpc("update_chess_room", payload);
        if (error) throw error;
        if (data) currentRoom = Array.isArray(data) ? data[0] : data;
    } catch (error) {
        console.error("Room move sync failed:", error);
        try {
            // Roll back the local move if the server rejected it.
            chess.undo();
            lastMove = chess.history({ verbose: true }).slice(-1)[0] || null;
            moveCounter = chess.history().length;
            selectedSquare = null;
            possibleMoves = [];
            renderBoard();
            updateMoveHistory();
            checkGameStatus();
        } catch (rollbackError) {
            console.error(rollbackError);
        }
        showToast("تعذرت مزامنة النقلة: " + (error.message || "خطأ اتصال"), "error");
    } finally {
        roomBusy = false;
    }
}

function applyRemoteMoves(room) {
    if (!room || !Array.isArray(room.moves)) return;

    const localHistory = chess ? chess.history() : [];
    const remoteHistory = room.moves;

    if (remoteHistory.length <= localHistory.length) return;

    try {
        const replay = new Chess();
        remoteHistory.forEach(san => {
            const result = replay.move(san);
            if (!result) throw new Error("Invalid move in room history");
        });

        if (room.fen && replay.fen() !== room.fen) {
            throw new Error("Room FEN does not match move history");
        }

        applyingRemoteMove = true;
        chess = replay;
        currentRoom = room;
        lastMove = chess.history({ verbose: true }).slice(-1)[0] || null;
        moveCounter = chess.history().length;
        selectedSquare = null;
        possibleMoves = [];

        renderBoard();
        updateMoveHistory();
        updateTimer();
        checkGameStatus();
        showToast("تم استلام نقلة اللاعب الآخر.");
    } catch (error) {
        console.error("Could not apply remote moves:", error);
        showToast("وصلت بيانات مباراة غير متوافقة.", "error");
    } finally {
        applyingRemoteMove = false;
    }
} 

}

/* ========================= NEW GAME ========================= */

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

    boardFlipped = (playerColor === "b" && (mode === "ai" || mode === "room"));

    initialTime = options.time || CONFIG.DEFAULT_TIME;
    whiteTime = initialTime;
    blackTime = initialTime;

    if (mode === "ai") {
        setText("currentGameMode", "ضد الكمبيوتر");
        setText("whitePlayerName", playerColor === "w" ? "أنت" : "الكمبيوتر");
        setText("blackPlayerName", playerColor === "b" ? "أنت" : "الكمبيوتر");
    } else if (mode === "room") {
        setText("currentGameMode", "غرفة أونلاين");
        setText("whitePlayerName", currentRoom?.white_player === currentUserId ? "أنت" : "الخصم");
        setText("blackPlayerName", currentRoom?.black_player === currentUserId ? "أنت" : "الخصم");
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
        aiTimeout = setTimeout(makeComputerMove, 500);
    }
}

/* ========================= UNDO / BOARD ========================= */

function undoMove() {
    if (!chess || gameFinished || !gameStarted || aiThinking) return;

    if (gameMode === "room") {
        showToast("التراجع غير متاح في المباريات الأونلاين.", "error");
        return;
    }

    if (chess.history().length === 0) {
        showToast("لا توجد نقلات للتراجع عنها.", "error");
        return;
    }

    chess.undo();
    if (gameMode === "ai" && chess.history().length > 0) chess.undo();

    selectedSquare = null;
    possibleMoves = [];
    lastMove = chess.history({ verbose: true }).slice(-1)[0] || null;
    moveCounter = chess.history().length;

    renderBoard();
    updateMoveHistory();
    updateInterface();
    checkGameStatus();
    showToast("تم التراجع عن النقلة.");
}

function flipBoard() {
    boardFlipped = !boardFlipped;
    renderBoard();
    showToast("تم قلب الرقعة.");
}

function restartGame() {
    if (!confirm("هل تريد إعادة المباراة؟")) return;
    if (gameMode === "room") {
        showToast("إعادة المباراة الأونلاين تحتاج إنشاء غرفة جديدة.", "error");
        return;
    }
    startNewGame(gameMode, { time: initialTime });
}

function resignGame() {
    if (!gameStarted || gameFinished) return;
    if (!confirm("هل أنت متأكد أنك تريد الاستسلام؟")) return;
    const winner = chess.turn() === "w" ? "b" : "w";
    finishGame("resign", winner);
}

/* ========================= COMPUTER SETTINGS ========================= */

function configureComputerGame() {
    const level = document.querySelector(".difficulty-card.active");
    const color = document.querySelector(".color-option.active");
    const time = document.querySelector(".time-option.active");

    const difficultyMap = { "1": "easy", "2": "medium", "3": "hard", "4": "expert" };
    aiDifficulty = difficultyMap[level?.dataset.level || "2"];

    const selectedColor = color?.dataset.color || "white";
    if (selectedColor === "random") playerColor = Math.random() < 0.5 ? "w" : "b";
    else playerColor = selectedColor === "black" ? "b" : "w";

    const minutes = Number(time?.dataset.time || 5);
    startNewGame("ai", { time: minutes * 60 });
}

/* ========================= ONLINE ROOMS ========================= */

function generateRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < CONFIG.ROOM_LENGTH; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }
    return code;
}

async function createRoom() {
    try {
        await ensureAnonymousLogin();
        const client = getSupabase();

        const { data, error } = await client.rpc("create_chess_room");
        if (error) throw error;

        currentRoom = Array.isArray(data) ? data[0] : data;
        if (!currentRoom?.room_code) throw new Error("لم يرجع الخادم رمز الغرفة.");

        currentRoomCode = currentRoom.room_code;
        playerColor = "w";
        boardFlipped = false;

        setText("generatedRoomCode", currentRoomCode);
        showElement("createdRoomCard");
        setText("gameStatus", "بانتظار اللاعب الثاني...");
        showToast("تم إنشاء الغرفة. أرسل الرمز لصديقك.");

        subscribeToRoom();
    } catch (error) {
        console.error(error);
        showToast("تعذر إنشاء الغرفة: " + (error.message || error), "error");
    }
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

async function joinRoom() {
    const input = $("roomCodeInput");
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (code.length !== CONFIG.ROOM_LENGTH) {
        showToast("رمز الغرفة يجب أن يتكون من 6 أحرف.", "error");
        return;
    }

    try {
        await ensureAnonymousLogin();
        const client = getSupabase();

        const { data, error } = await client.rpc("join_chess_room", {
            p_room_code: code
        });
        if (error) throw error;

        currentRoom = Array.isArray(data) ? data[0] : data;
        if (!currentRoom) throw new Error("لم يتم العثور على بيانات الغرفة.");

        currentRoomCode = currentRoom.room_code;
        playerColor = currentRoom.white_player === currentUserId ? "w" : "b";
        boardFlipped = playerColor === "b";

        if (currentRoom.status !== "playing" || !currentRoom.black_player) {
            showToast("الغرفة لم يكتمل انضمام اللاعب الثاني إليها.", "error");
            return;
        }

        startRoomGameFromData(currentRoom);
        subscribeToRoom();
        showToast("تم الانضمام إلى المباراة!");
    } catch (error) {
        console.error(error);
        showToast("تعذر الانضمام: " + (error.message || error), "error");
    }
}

function startRoomGameFromData(room) {
    currentRoom = room;
    playerColor = room.white_player === currentUserId ? "w" : "b";
    boardFlipped = playerColor === "b";

    startNewGame("room", { time: CONFIG.DEFAULT_TIME });

    if (Array.isArray(room.moves) && room.moves.length) {
        const replay = new Chess();
        room.moves.forEach(san => replay.move(san));
        chess = replay;
        lastMove = chess.history({ verbose: true }).slice(-1)[0] || null;
        moveCounter = chess.history().length;
        renderBoard();
        updateMoveHistory();
    }
}

function subscribeToRoom() {
    const client = getSupabase();

    if (roomChannel) {
        client.removeChannel(roomChannel);
        roomChannel = null;
    }
    if (!currentRoomCode) return;

    roomChannel = client
        .channel("chess-room-" + currentRoomCode)
        .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "chess_rooms",
            filter: "room_code=eq." + currentRoomCode
        }, payload => {
            const room = payload.new;
            if (!room) return;

            const wasWaiting = !currentRoom || currentRoom.status !== "playing";
            currentRoom = room;

            if (room.status === "playing" && room.white_player && room.black_player) {
                if (!gameStarted || gameMode !== "room" || wasWaiting) {
                    startRoomGameFromData(room);
                    showToast("انضم اللاعب الثاني. بدأت المباراة!");
                } else {
                    applyRemoteMoves(room);
                }
            }
        })
        .subscribe(status => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                console.error("Realtime channel status:", status);
                showToast("انقطع اتصال المزامنة. تحقق من الإنترنت.", "error");
            }
        });
}

async function leaveRoom() {
    if (roomChannel) {
        await getSupabase().removeChannel(roomChannel);
        roomChannel = null;
    }
    currentRoom = null;
    currentRoomCode = null;
    gameStarted = false;
    stopTimer();
}

/* ========================= STATISTICS ========================= */

function getStatistics() {
    const defaults = {
        games: 0, wins: 0, losses: 0, draws: 0,
        totalMoves: 0, history: []
    };

    try {
        const saved = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
        return { ...defaults, ...(saved || {}), history: saved?.history || [] };
    } catch (error) {
        return defaults;
    }
}

function saveStatistics(data) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
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
    Object.entries(elements).forEach(([id, value]) => setText(id, value));
}

function loadStatistics() { updateStatistics(); }

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
        const userWon = gameMode === "room"
            ? winner === playerColor
            : (winner === playerColor || (gameMode === "local" && winner === "w"));

        if (userWon) {
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
        reason,
        moves: chess.history().length,
        duration: elapsedSeconds
    });

    stats.history = stats.history.slice(0, 50);
    saveStatistics(stats);
    updateStatistics();
    renderRecentGames();
}
/* =========================================================
   31. COMPUTER ENGINE
========================================================= */

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

function evaluateBoard(position) {
    let score = 0;

    position.board().forEach(row => {
        row.forEach(piece => {
            if (!piece) return;

            const value = PIECE_VALUES[piece.type] || 0;
            score += piece.color === "w" ? value : -value;
        });
    });

    return score;
}

function minimax(position, depth, alpha, beta, maximizing) {
    if (depth === 0 || position.isGameOver()) {
        return evaluateBoard(position);
    }

    const moves = position.moves({ verbose: true });

    if (maximizing) {
        let best = -Infinity;

        for (const move of moves) {
            position.move(move);
            best = Math.max(best, minimax(position, depth - 1, alpha, beta, false));
            position.undo();

            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
        }

        return best;
    }

    let best = Infinity;

    for (const move of moves) {
        position.move(move);
        best = Math.min(best, minimax(position, depth - 1, alpha, beta, true));
        position.undo();

        beta = Math.min(beta, best);
        if (beta <= alpha) break;
    }

    return best;
}

function chooseComputerMove() {
    if (!chess || chess.isGameOver()) return null;

    const moves = chess.moves({ verbose: true });
    if (!moves.length) return null;

    const depthMap = {
        easy: 1,
        medium: 1,
        hard: 2,
        expert: 3
    };

    const depth = depthMap[aiDifficulty] || 1;

    if (aiDifficulty === "easy") {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    let bestMove = null;
    let bestScore = playerColor === "w" ? Infinity : -Infinity;

    for (const move of moves) {
        chess.move(move);
        let score = minimax(
            chess,
            depth - 1,
            -Infinity,
            Infinity,
            chess.turn() === "w"
        );
        chess.undo();

        score += Math.random() * 5;

        if (playerColor === "w" && score < bestScore) {
            bestScore = score;
            bestMove = move;
        }

        if (playerColor === "b" && score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove || moves[0];
}

async function makeComputerMove() {
    if (!chess || gameFinished || !gameStarted || gameMode !== "ai") return;
    if (chess.turn() === playerColor) return;

    aiThinking = true;
    updateInterface();

    await new Promise(resolve => setTimeout(resolve, 250));

    const move = chooseComputerMove();

    aiThinking = false;

    if (!move || gameFinished) return;

    await makeMove(
        move.from,
        move.to,
        move.promotion || "q"
    );
}

/* =========================================================
   32. GAME STATUS
========================================================= */

function checkGameStatus() {
    if (!chess) return;

    if (chess.isCheckmate()) {
        const winner = chess.turn() === "w" ? "b" : "w";
        finishGame("checkmate", winner);
        return;
    }

    if (chess.isDraw()) {
        finishGame("draw", null);
        return;
    }

    if (chess.isCheck()) {
        setText("gameStatus", "كش!");
    } else {
        setText("gameStatus", "المباراة مستمرة");
    }

    updateKingStatus();
}

function finishGame(reason, winner = null) {
    if (gameFinished) return;

    gameFinished = true;
    gameStarted = false;
    aiThinking = false;

    stopTimer();

    if (aiTimeout) {
        clearTimeout(aiTimeout);
        aiTimeout = null;
    }

    let title = "انتهت المباراة";
    let description = "";

    if (reason === "checkmate") {
        title = "كش مات!";
        description = winner === playerColor ? "لقد فزت بالمباراة!" : "انتهت المباراة بفوز الخصم.";
    } else if (reason === "resign") {
        title = "استسلام";
        description = winner === playerColor ? "فزت بسبب استسلام الخصم." : "لقد استسلمت.";
    } else if (reason === "timeout") {
        title = "انتهى الوقت";
        description = winner === playerColor ? "فزت بسبب انتهاء وقت الخصم." : "انتهى وقتك.";
    } else {
        title = "تعادل";
        description = "انتهت المباراة بالتعادل.";
    }

    setText("resultTitle", title);
    setText("resultMessage", description);
    setText("resultDescription", description);
    setText("gameStatus", title);

    saveMatch(reason, winner);
    renderBoard();

    showModal("resultModal");

    if (gameMode === "room") {
        showToast("انتهت المباراة على هذا الجهاز. حالة الغرفة في قاعدة البيانات لم تُغلق تلقائيًا.");
    }
}

/* =========================================================
   33. TIMER SYSTEM
========================================================= */

function updateTimer() {
    setText("whiteTimer", formatTime(whiteTime));
    setText("blackTimer", formatTime(blackTime));

    setText("whiteTime", formatTime(whiteTime));
    setText("blackTime", formatTime(blackTime));

    const whiteClock = $("whiteTimer");
    const blackClock = $("blackTimer");

    if (whiteClock) {
        whiteClock.classList.toggle("active-clock", chess?.turn() === "w" && gameStarted);
    }

    if (blackClock) {
        blackClock.classList.toggle("active-clock", chess?.turn() === "b" && gameStarted);
    }

    setText("elapsedTime", formatTime(elapsedSeconds));
    setText("moveCounter", moveCounter);
    setText("totalMoves", moveCounter);
}

function startTimer() {
    stopTimer();

    timerInterval = setInterval(() => {
        if (!gameStarted || gameFinished || !chess) return;

        elapsedSeconds++;

        if (chess.turn() === "w") {
            whiteTime--;
        } else {
            blackTime--;
        }

        if (whiteTime <= 0) {
            whiteTime = 0;
            updateTimer();
            finishGame("timeout", "b");
            return;
        }

        if (blackTime <= 0) {
            blackTime = 0;
            updateTimer();
            finishGame("timeout", "w");
            return;
        }

        updateTimer();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/* =========================================================
   34. MOVE HISTORY
========================================================= */

function updateMoveHistory() {
    if (!chess) return;

    const container =
        $("moveHistory") ||
        $("movesList") ||
        $("moveList");

    if (!container) return;

    container.innerHTML = "";

    const history = chess.history();

    if (!history.length) {
        const empty = document.createElement("div");
        empty.className = "empty-history";
        empty.textContent = "لا توجد نقلات حتى الآن";
        container.appendChild(empty);
        return;
    }

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

    container.scrollTop = container.scrollHeight;
}

/* =========================================================
   35. INTERFACE
========================================================= */

function updateInterface() {
    if (!chess) return;

    setText("moveCounter", chess.history().length);
    setText("totalMoves", chess.history().length);

    setText(
        "turnIndicator",
        chess.turn() === "w" ? "دور الأبيض" : "دور الأسود"
    );

    const status = $("gameStatus");

    if (status && gameStarted && !gameFinished) {
        if (aiThinking) {
            status.textContent = "الكمبيوتر يفكر...";
        } else if (chess.isCheck()) {
            status.textContent = "كش!";
        } else {
            status.textContent = chess.turn() === "w"
                ? "دور الأبيض"
                : "دور الأسود";
        }
    }

    const undoButton = $("undoButton");
    if (undoButton) {
        undoButton.disabled =
            gameFinished ||
            !gameStarted ||
            gameMode === "room" ||
            chess.history().length === 0;
    }

    updateTimer();
}

function updateKingStatus() {
    if (!chess) return;

    setText(
        "kingStatus",
        chess.isCheck() ? "الملك في حالة كش" : ""
    );
}

/* =========================================================
   36. SOUND SYSTEM
========================================================= */

function playMoveSound() {
    if (!settings.sound || !soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.frequency.value = 520;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.12
        );

        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);

        oscillator.onended = () => context.close();
    } catch (error) {
        console.warn("Sound unavailable:", error);
    }
}

/* =========================================================
   37. SETTINGS
========================================================= */

function saveSettings() {
    try {
        localStorage.setItem(
            "chessArenaSettings",
            JSON.stringify(settings)
        );
    } catch (error) {
        console.error(error);
    }
}

function loadSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("chessArenaSettings")
        );

        if (saved && typeof saved === "object") {
            settings = { ...settings, ...saved };
        }
    } catch (error) {
        console.error(error);
    }

    soundEnabled = settings.sound;
}

function toggleSound() {
    settings.sound = !settings.sound;
    soundEnabled = settings.sound;
    saveSettings();

    showToast(
        settings.sound ? "تم تشغيل الأصوات." : "تم إيقاف الأصوات."
    );
}

function toggleHighlights() {
    settings.highlights = !settings.highlights;
    saveSettings();
    renderBoard();
}

function toggleLastMove() {
    settings.lastMove = !settings.lastMove;
    saveSettings();
    renderBoard();
}

function toggleCoordinates() {
    settings.coordinates = !settings.coordinates;
    saveSettings();
    renderBoard();
}

/* =========================================================
   38. STATISTICS HISTORY
========================================================= */

function renderRecentGames() {
    const container = $("recentGames");
    if (!container) return;

    const stats = getStatistics();
    container.innerHTML = "";

    if (!stats.history.length) {
        container.textContent = "لا توجد مباريات سابقة.";
        return;
    }

    stats.history.slice(0, 5).forEach(game => {
        const item = document.createElement("div");
        item.className = "history-item";

        const title = document.createElement("strong");
        title.textContent =
            game.result === "win" ? "فوز" :
            game.result === "loss" ? "خسارة" : "تعادل";

        const details = document.createElement("span");
        details.textContent =
            " | " + game.date +
            " | النقلات: " + game.moves;

        item.append(title, details);
        container.appendChild(item);
    });
}

function renderFullHistory() {
    const container = $("fullHistory") || $("historyList");
    if (!container) return;

    const stats = getStatistics();
    container.innerHTML = "";

    if (!stats.history.length) {
        container.textContent = "لا يوجد سجل مباريات.";
        return;
    }

    stats.history.forEach((game, index) => {
        const item = document.createElement("div");
        item.className = "history-item";

        const title = document.createElement("strong");
        title.textContent = "المباراة " + (index + 1);

        const details = document.createElement("p");
        details.textContent =
            "النتيجة: " + game.result +
            " | الوضع: " + game.mode +
            " | السبب: " + game.reason +
            " | النقلات: " + game.moves +
            " | المدة: " + formatTime(game.duration);

        item.append(title, details);
        container.appendChild(item);
    });
}

/* =========================================================
   39. EVENT BINDING
========================================================= */

function bindEvents() {
    document.querySelectorAll("[data-action]").forEach(element => {
        if (element.dataset.bound === "true") return;

        element.dataset.bound = "true";

        element.addEventListener("click", () => {
            const action = element.dataset.action;

            const actions = {
                undo: undoMove,
                flip: flipBoard,
                restart: restartGame,
                resign: resignGame,
                createRoom: createRoom,
                joinRoom: joinRoom,
                copyRoomCode: copyRoomCode,
                leaveRoom: leaveRoom,
                toggleSound: toggleSound,
                toggleHighlights: toggleHighlights,
                toggleLastMove: toggleLastMove,
                toggleCoordinates: toggleCoordinates
            };

            if (actions[action]) actions[action]();
        });
    });

    document.querySelectorAll("[data-promotion]").forEach(element => {
        if (element.dataset.bound === "true") return;

        element.dataset.bound = "true";

        element.addEventListener("click", () => {
            completePromotion(element.dataset.promotion);
        });
    });

    document.querySelectorAll("[data-page]").forEach(element => {
        if (element.dataset.pageBound === "true") return;

        element.dataset.pageBound = "true";

        element.addEventListener("click", () => {
            navigateTo(element.dataset.page);
        });
    });
}

/* =========================================================
   40. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    initializeChessArena();
});

/* =========================================================
   41. GLOBAL FUNCTIONS
========================================================= */

window.startNewGame = startNewGame;
window.configureComputerGame = configureComputerGame;
window.makeMove = makeMove;
window.undoMove = undoMove;
window.flipBoard = flipBoard;
window.restartGame = restartGame;
window.resignGame = resignGame;
window.navigateTo = navigateTo;

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.copyRoomCode = copyRoomCode;
window.leaveRoom = leaveRoom;

window.completePromotion = completePromotion;
window.closeModal = closeModal;
window.toggleSound = toggleSound;
window.toggleHighlights = toggleHighlights;
window.toggleLastMove = toggleLastMove;
window.toggleCoordinates = toggleCoordinates;

console.log("CHESS ARENA - ALL SYSTEMS LOADED");
