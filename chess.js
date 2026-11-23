const gameMenu = document.getElementById("game-menu");
const aiSettings = document.getElementById("ai-settings");
const onlineSettings = document.getElementById("online-settings");
const chessGame = document.getElementById("chess-game");

// التنقل بين القوائم
document.getElementById("ai-mode").addEventListener("click", () => {
    gameMenu.hidden = true;
    aiSettings.hidden = false;
});

document.getElementById("online-mode").addEventListener("click", () => {
    gameMenu.hidden = true;
    onlineSettings.hidden = false;
});

document.getElementById("back-from-ai").addEventListener("click", () => {
    aiSettings.hidden = true;
    gameMenu.hidden = false;
});

document.getElementById("back-from-online").addEventListener("click", () => {
    onlineSettings.hidden = true;
    gameMenu.hidden = false;
});

// بدء مباراة الذكاء الاصطناعي
document.getElementById("start-ai-game").addEventListener("click", () => {
    const difficulty = document.getElementById("ai-difficulty").value;
    let color = document.getElementById("player-color").value;

    if (color === "random") {
        color = Math.random() < 0.5 ? "white" : "black";
    }

    aiSettings.hidden = true;
    chessGame.hidden = false;

    document.getElementById("player-label").textContent =
        color === "white" ? "الأبيض" : "الأسود";

    document.getElementById("opponent-label").textContent =
        color === "white" ? "الأسود" : "الأبيض";

    document.getElementById("game-status").textContent =
        "جاري تجهيز المباراة...";

    console.log("AI Difficulty:", difficulty);
    console.log("Player Color:", color);
});

// الخروج من المباراة
document.getElementById("exit-game").addEventListener("click", () => {
    chessGame.hidden = true;
    gameMenu.hidden = false;
});

// إنشاء غرفة (واجهة مبدئية)
document.getElementById("create-room").addEventListener("click", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    document.getElementById("room-info").hidden = false;
    document.getElementById("room-code-display").textContent = roomCode;

    document.getElementById("room-status").textContent =
        "تم إنشاء الغرفة. بانتظار اللاعب الآخر...";
});

// نسخ رمز الغرفة
document.getElementById("copy-room-code").addEventListener("click", async () => {
    const code = document.getElementById("room-code-display").textContent;

    try {
        await navigator.clipboard.writeText(code);
        alert("تم نسخ رمز الغرفة!");
    } catch {
        alert("تعذر النسخ، انسخ الرمز يدويًا: " + code);
    }
});

// الانضمام إلى غرفة (واجهة مبدئية)
document.getElementById("join-room").addEventListener("click", () => {
    const code = document.getElementById("room-code").value.trim().toUpperCase();

    if (!code) {
        alert("أدخل رمز الغرفة أولاً");
        return;
    }

    alert("نظام الاتصال بالغرف سيتم ربطه في المرحلة القادمة.");
});

// إعادة المباراة (مبدئيًا)
document.getElementById("restart-game").addEventListener("click", () => {
    location.reload();
});

// قلب الرقعة
document.getElementById("flip-board").addEventListener("click", () => {
    const board = document.getElementById("chessboard");
    board.classList.toggle("flipped");
});

console.log("GUESSIT CHESS loaded successfully ♟");