let express = require("express");
let randomstring = require("randomstring");
let ServerState = require("./state").ServerState;
let Player = require("./state").Player;
let Game = require("./state").Game;
const FRAME_RATE = require("./state").FRAME_RATE;

const UPDATE_INTERVAL = 1000 / FRAME_RATE;

var app = express();
var server = app.listen(3000);

// serve frontend dir
app.use(express.static(__dirname + "/frontend"));

// socket.io server listens to the app
var io = require("socket.io").listen(server);

let state = new ServerState();

let generateNewGameId = () =>
  randomstring.generate({
    length: 4,
    charset: "numeric",
  });

io.on("connection", function (socket) {
  socket.on("createGameReq", () => {
    console.log("GAME STARTED BY SOCKET: " + socket.id);

    let playerOneSocketId = socket.id;
    let gameId = generateNewGameId();

    let g = new Game(gameId);
    g.join(new Player(playerOneSocketId, true));
    state.addGame(g);

    io.sockets.connected[playerOneSocketId].emit("createGameRes", {
      id: gameId,
    });
  });

  socket.on("joinGameReq", function (data) {
    let playerTwoSocketId = socket.id;
    // TODO add data validations
    let gameId = data.id;

    console.log(
      "GAME_ID REQUESTED TO JOIN :   " +
        gameId +
        " BY SOCKET_ID   " +
        playerTwoSocketId
    );

    let g = state.getGameObj(gameId);

    if (g) {
      g.join(new Player(playerTwoSocketId, false));

      let playerOneSocketId = g.playerOne.socketId;

      io.sockets.connected[playerOneSocketId].emit("clientStartGame", {
        state: g.serialize(),
      });
      io.sockets.connected[playerTwoSocketId].emit("clientStartGame", {
        state: g.serialize(),
      });
      g.start();
    } else {
      io.sockets.connected[playerTwoSocketId].emit("invalidGameId", {
        id: gameId,
      });
    }
  });

  socket.on("playerMove", function (data) {
    // TODO add data validations
    let playerY = data.myNewY; // [x, y]
    let gameId = data.id;

    let playerSocketId = socket.id;

    let g = state.getGameObj(gameId);
    if (g) {
      if (playerSocketId === g.playerOne.socketId) {
        g.playerOne.updatePosition(playerY);
      } else if (playerSocketId === g.playerTwo.socketId) {
        g.playerTwo.updatePosition(playerY);
      } else {
        // TODO
      }
    } else {
      // TODO
      console.error("Invalid playerMove. Game with id not found. data:", data);
    }
  });
});

let updateAllClients = () => {
  state.getAllGameObjs().forEach((g) => {
    if (!g.hasStarted()) return;

    // TODO check for alive socket connection
    if (
      !io.sockets.connected[g.playerOne.socketId] ||
      !io.sockets.connected[g.playerTwo.socketId]
    ) {
      g.stop();
    }

    io.sockets.connected[g.playerOne.socketId].emit("updateClient", {
      state: g.serialize(),
    });
    io.sockets.connected[g.playerTwo.socketId].emit("updateClient", {
      state: g.serialize(),
    });
  });
};

setInterval(updateAllClients, UPDATE_INTERVAL);
