const FRAME_RATE = 45;
const CANVAS_HEIGHT = 400;
const CANVAS_WIDTH = 600;

const PADDLE_THICKNESS = 10;
const PADDLE_LENGTH = 100;
const HALF_PADDLE_LENGTH = PADDLE_LENGTH / 2;

const BALL_DIAMETER = 20;
const BALL_RADIUS = BALL_DIAMETER / 2;

let BASE_BALLX = CANVAS_WIDTH / 2;
let BASE_BALLY = CANVAS_HEIGHT / 2;

let BASE_BALL_VX = 10;
let BASE_BALL_VY = 10;

let ballX = BASE_BALLX; // horizontal
let ballY = BASE_BALLY;

let speedX = BASE_BALL_VX; // horizontal
let speedY = BASE_BALL_VY;

let playerY = CANVAS_HEIGHT / 2; // vertical
let playerX = 0;
let otherPlayerY = CANVAS_HEIGHT / 2; // vertical;
let otherPlayerX = CANVAS_WIDTH;

var socket = io();

let SOUNDS = {};
let loadSounds = () => {
  Howler.volume(1.0);
  SOUNDS["bounce"] = new Howl({
    src: ["ball-hit.wav"],
  });
};

let playSound = (kind) => {
  console.log("play sounds", kind);
  // FIXME to fix this error:
  // The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
  // if (getAudioContext().state !== "running") {
  //   getAudioContext().resume();
  // }
  if (kind in SOUNDS) {
    let hack = () => SOUNDS[kind].play();
    hack();
  }
};

function setup() {
  let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(FRAME_RATE);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.parent("canvas");
  loadSounds();
  setupRemoteListeners();
}

function draw() {
  clear();
  background(153); // some grey
  drawPlayers();
  drawBall();

  sendEvents();
}

let setupRemoteListeners = () => {
  socket.on("welcome", function (data) {
    console.log(data.message);
  });

  socket.on("update-player-2", function (data) {
    otherPlayerY = data.y;
  });
};

let sendEvents = () => {
  socket.emit(
    "player-position",
    {
      x: playerX,
      y: playerY,
    },
    (response) => {
      console.log("position event response: ", response);
    }
  );
};

function mouseMoved() {
  playerY = mouseY;
  if (playerY < HALF_PADDLE_LENGTH) {
    playerY = HALF_PADDLE_LENGTH;
  } else if (playerY > CANVAS_HEIGHT - HALF_PADDLE_LENGTH) {
    playerY = CANVAS_HEIGHT - HALF_PADDLE_LENGTH;
  }
}

let drawPlayers = () => {
  // player 1 (YOU)
  drawPlayer(playerX, playerY);

  // player 2
  drawPlayer(otherPlayerX - PADDLE_THICKNESS, otherPlayerY);
};

let drawPlayer = (x, y) => {
  y -= PADDLE_LENGTH / 2;
  rect(x, y, PADDLE_THICKNESS, PADDLE_LENGTH);
};

let drawBall = () => {
  adjustBallXY();
  circle(ballX, ballY, BALL_DIAMETER);
};

let adjustBallXY = () => {
  if (ballX < (-1 * CANVAS_WIDTH) / 1.5) {
    createNewBall();
  } else if (ballX < BALL_RADIUS + PADDLE_THICKNESS) {
    if (shouldBounceOffPaddle()) {
      speedX *= -1;
      playSound("bounce");
    }
  } else if (ballX > CANVAS_WIDTH - BALL_RADIUS) {
    speedX *= -1;
    playSound("bounce");
  } else if (ballY < BALL_RADIUS) {
    speedY *= -1;
    playSound("bounce");
  } else if (ballY > CANVAS_HEIGHT - BALL_RADIUS) {
    speedY *= -1;
    playSound("bounce");
  }
  ballX += speedX;
  ballY += speedY;
};

let shouldBounceOffPaddle = () => {
  return (
    ballY >= playerY - HALF_PADDLE_LENGTH &&
    ballY <= playerY + HALF_PADDLE_LENGTH
  );
};

let createNewBall = () => {
  // setInterval(() => {
  ballX = BASE_BALLX;
  ballY = BASE_BALLY;
  speedX = BASE_BALL_VX;
  speedY = BASE_BALL_VY;
  console.log("New ball..");
  // }, 1000);
};
