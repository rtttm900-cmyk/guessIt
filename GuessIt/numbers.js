let secretNumber;
let attempts = 0;
let maxNumber = 0;

let seconds = 0;
let timerInterval = null;

let gameActive = false;

function startGame() {

    let value = Number(document.getElementById("maxNumber").value);

    if (!Number.isSafeInteger(value) || value < 2) {
        document.getElementById("message").textContent =
            "اكتب رقماً صحيحاً أكبر من 1!";
        return;
    }

    maxNumber = value;
    secretNumber = Math.floor(Math.random() * maxNumber) + 1;

    attempts = 0;
    seconds = 0;
    gameActive = true;

    document.getElementById("attempts").textContent = 0;
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("message").textContent =
        "بدأت اللعبة! حاول اكتشاف الرقم.";

    document.getElementById("guess").disabled = false;
    document.getElementById("guessBtn").disabled = false;
    document.getElementById("maxNumber").disabled = true;
    document.getElementById("startBtn").disabled = true;

    document.getElementById("guess").value = "";

    startTimer();
}

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(function() {

        seconds++;

        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds % 60;

        document.getElementById("timer").textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(remainingSeconds).padStart(2, "0");

    }, 1000);
}

function checkGuess() {

    if (!gameActive) return;

    let input = document.getElementById("guess");
    let guess = Number(input.value);
    let message = document.getElementById("message");

    if (input.value.trim() === "" || !Number.isSafeInteger(guess)) {
        message.textContent = "اكتب رقماً صحيحاً!";
        return;
    }

    if (guess < 1 || guess > maxNumber) {
        message.textContent =
            "اختر رقماً بين 1 و " + maxNumber;
        return;
    }

    attempts++;

    document.getElementById("attempts").textContent = attempts;

    if (guess === secretNumber) {

        message.textContent =
            "🎉 مبروك! خمنت الرقم الصحيح: " + secretNumber;

        finishGame();

    } else if (guess < secretNumber) {

        message.textContent = "الرقم أكبر! ⬆️";

    } else {

        message.textContent = "الرقم أصغر! ⬇️";

    }

    input.value = "";
}

function finishGame() {

    gameActive = false;
    clearInterval(timerInterval);

    document.getElementById("guess").disabled = true;
    document.getElementById("guessBtn").disabled = true;
}

function stopGame() {

    if (!gameActive) return;

    clearInterval(timerInterval);

    gameActive = false;

    document.getElementById("message").textContent =
        "تم إيقاف اللعبة! اضغط إعادة اللعب للبدء من جديد.";

    document.getElementById("guess").disabled = true;
    document.getElementById("guessBtn").disabled = true;
}

function restartGame() {

    clearInterval(timerInterval);

    attempts = 0;
    seconds = 0;
    gameActive = false;

    document.getElementById("guess").value = "";
    document.getElementById("guess").disabled = true;
    document.getElementById("guessBtn").disabled = true;

    document.getElementById("maxNumber").disabled = false;
    document.getElementById("startBtn").disabled = false;

    document.getElementById("maxNumber").value = "";

    document.getElementById("attempts").textContent = "0";
    document.getElementById("timer").textContent = "00:00";

    document.getElementById("message").textContent =
        "اختر رقماً جديداً وابدأ اللعبة!";
}

document.getElementById("guess").addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        checkGuess();
    }

});