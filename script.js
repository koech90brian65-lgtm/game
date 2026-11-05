const board = document.querySelector("#board");
const player = document.querySelector("#player");
const scoreDisplay = document.querySelector("#score");
const timerDisplay = document.querySelector("#timer");
const highScoreDisplay = document.querySelector("#highScore");
const message = document.querySelector("#message");
const soundButton = document.querySelector("#soundButton");

let basketPosition = 0.5;
let score = 0;
let timeLeft = 30;
let gameRunning = false;
let soundEnabled = true;
let dropTimer;
let countdownTimer;
let gameLoop;
let fallingObjects = [];
let audioContext;

let highScore = Number(localStorage.getItem("starCatcherHighScore")) || 0;
highScoreDisplay.textContent = highScore;

function moveBasket(amount) {
  basketPosition = Math.max(0.08, Math.min(0.92, basketPosition + amount));
  player.style.left = `${basketPosition * 100}%`;
}

function playSound(frequency, duration = 0.12, type = "sine") {
  if (!soundEnabled) return;

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    volume.gain.value = 0.08;
    oscillator.connect(volume);
    volume.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // The game still works if sound is unavailable.
  }
}

function makeObject() {
  if (!gameRunning) return;

  const isStar = Math.random() < 0.75;
  const element = document.createElement("span");
  element.className = "falling";
  element.textContent = isStar ? "⭐" : "💧";

  const object = {
    element,
    x: 0.06 + Math.random() * 0.88,
    y: -40,
    speed: 2 + Math.random() * 2,
    isStar
  };

  element.style.left = `${object.x * 100}%`;
  board.appendChild(element);
  fallingObjects.push(object);
}

function updateGame() {
  if (!gameRunning) return;

  const boardHeight = board.clientHeight;
  const basketX = board.clientWidth * basketPosition;

  fallingObjects = fallingObjects.filter(object => {
    object.y += object.speed;
    object.element.style.top = `${object.y}px`;

    const objectX = board.clientWidth * object.x;
    const nearBasket = Math.abs(objectX - basketX) < 58;
    const atBasket = object.y > boardHeight - 65 && object.y < boardHeight - 5;

    if (nearBasket && atBasket) {
      object.element.remove();

      if (object.isStar) {
        score++;
        scoreDisplay.textContent = score;
        playSound(740);

        if (score > highScore) {
          highScore = score;
          highScoreDisplay.textContent = highScore;
          localStorage.setItem("starCatcherHighScore", highScore);
        }
      } else {
        playSound(180, 0.18, "triangle");
      }

      return false;
    }

    if (object.y > boardHeight) {
      object.element.remove();
      return false;
    }

    return true;
  });
}

function finishGame() {
  gameRunning = false;
  clearInterval(dropTimer);
  clearInterval(countdownTimer);
  clearInterval(gameLoop);

  fallingObjects.forEach(object => object.element.remove());
  fallingObjects = [];

  message.textContent = `Time's up! You caught ${score} stars. Press Start game to play again.`;
  playSound(520, 0.3);
}

function startGame() {
  clearInterval(dropTimer);
  clearInterval(countdownTimer);
  clearInterval(gameLoop);

  fallingObjects.forEach(object => object.element.remove());
  fallingObjects = [];

  score = 0;
  timeLeft = 30;
  basketPosition = 0.5;
  gameRunning = true;

  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  player.style.left = "50%";
  message.textContent = "Catch the stars!";

  dropTimer = setInterval(makeObject, 750);
  gameLoop = setInterval(updateGame, 20);

  countdownTimer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      finishGame();
    }
  }, 1000);
}

document.querySelector("#startButton").addEventListener("click", startGame);
document.querySelector("#leftButton").addEventListener("click", () => moveBasket(-0.12));
document.querySelector("#rightButton").addEventListener("click", () => moveBasket(0.12));

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "🔊 Sound on" : "🔇 Sound off";
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveBasket(-0.06);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveBasket(0.06);
  }
});

board.addEventListener("pointerdown", event => {
  const bounds = board.getBoundingClientRect();
  moveBasket(event.clientX < bounds.left + bounds.width / 2 ? -0.12 : 0.12);
});