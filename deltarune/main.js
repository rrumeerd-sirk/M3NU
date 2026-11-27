// =====================
// Configuratie
// =====================
const SCALE = 3;          // groote speel scherm
const SPR_W = 16;         // breede sprite
const SPR_H = 30;         // hoogte

const BASE_W = 400;       // loop veld
const BASE_H = 200;

// =====================
// canvas berekeningen
// =====================
const canvas = document.getElementById("game");
canvas.width  = BASE_W * SCALE;
canvas.height = BASE_H * SCALE;

const ctx = canvas.getContext("2d");

// =====================
// knoppen
// =====================
const keys = {};
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

// =====================
// sprites
// =====================
function load(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const kris = {
  down: [
    load("kris/down_0.png"),
    load("kris/down_1.png"),
    load("kris/down_2.png"),
    load("kris/down_3.png")
  ],
  left: [
    load("kris/left_0.png"),
    load("kris/left_1.png")
  ],
  right: [
    load("kris/right_0.png"),
    load("kris/right_1.png")
  ],
  up: [
    load("kris/up_0.png"),
    load("kris/up_1.png"),
    load("kris/up_2.png"),
    load("kris/up_3.png")
  ]
};

// =====================
// bewegings shit
// =====================
const player = {
  x: BASE_W / 2 - SPR_W / 2,
  y: BASE_H / 2 - SPR_H / 2,
  speed: 2,
  dir: "down",
  frame: 0,
  timer: 0,
  moving: false
};

// =====================
// Update snelheid
// =====================
function update() {
  player.moving = false;

  if (keys["ArrowDown"]) {
    player.y += player.speed;
    player.dir = "down";
    player.moving = true;
  }
  if (keys["ArrowUp"]) {
    player.y -= player.speed;
    player.dir = "up";
    player.moving = true;
  }
  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.dir = "left";
    player.moving = true;
  }
  if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.dir = "right";
    player.moving = true;
  }

  if (player.moving) {
    player.timer++;
    if (player.timer >= 8) {
      player.frame++;
      player.timer = 0;
    }
  } else {
    player.frame = 0; // idle
  }

  player.frame %= kris[player.dir].length;
}

// =====================
// tekenen
// =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // gwn simpel
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- wel gwn frame-perfect ---
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const img = kris[player.dir][player.frame];

  ctx.drawImage(
    img,
    Math.floor(player.x * SCALE),
    Math.floor(player.y * SCALE),
    SPR_W * SCALE,
    SPR_H * SCALE
  );

  ctx.restore();
}

// =====================
// loopen van de script
// =====================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
