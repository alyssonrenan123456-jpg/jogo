const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const road = { x: 80, width: 340 };
const player = {
  x: W / 2 - 23,
  y: H - 125,
  width: 46,
  height: 82,
  speed: 0,
  maxSpeed: 11,
  acceleration: 0.16,
  braking: 0.22,
  friction: 0.055
};

let keys = {};
let enemies = [];
let score = 0;
let best = Number(localStorage.getItem("streetRushBest") || 0);
let roadOffset = 0;
let spawnTimer = 0;
let running = false;
let lastTime = 0;

document.getElementById("best").textContent = best;

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = startGame;

function startGame() {
  score = 0;
  enemies = [];
  player.x = W / 2 - player.width / 2;
  player.y = H - 125;
  player.speed = 0;
  spawnTimer = 0;
  running = true;

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameOver").classList.add("hidden");

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 16.67, 2);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  const accelerating = keys["arrowup"] || keys["w"];
  const braking = keys["arrowdown"] || keys["s"];

  if (accelerating) player.speed += player.acceleration * dt;
  else player.speed -= player.friction * dt;

  if (braking) player.speed -= player.braking * dt;

  player.speed = Math.max(0, Math.min(player.maxSpeed, player.speed));

  const steerSpeed = 5.2 + player.speed * 0.18;

  if (keys["arrowleft"] || keys["a"]) player.x -= steerSpeed * dt;
  if (keys["arrowright"] || keys["d"]) player.x += steerSpeed * dt;

  player.x = Math.max(road.x + 8, Math.min(
    road.x + road.width - player.width - 8,
    player.x
  ));

  roadOffset += player.speed * 5 * dt;
  if (roadOffset > 80) roadOffset -= 80;

  spawnTimer += dt;

  const spawnEvery = Math.max(26, 70 - score / 12);
  if (spawnTimer > spawnEvery) {
    spawnEnemy();
    spawnTimer = 0;
  }

  for (const enemy of enemies) {
    enemy.y += (3.2 + player.speed * 0.65) * dt;

    if (enemy.y > H + 100) {
      enemy.dead = true;
      score++;
    }

    if (collides(player, enemy)) {
      gameOver();
      return;
    }
  }

  enemies = enemies.filter(e => !e.dead);

  document.getElementById("score").textContent = score;
  document.getElementById("speed").textContent = Math.round(player.speed * 18);
}

function spawnEnemy() {
  const width = 46;
  const x = road.x + 12 + Math.random() * (road.width - width - 24);
  const colors = ["#e74c3c", "#f1c40f", "#9b59b6", "#3498db", "#ecf0f1"];
  enemies.push({
    x,
    y: -100,
    width,
    height: 82,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
}

function collides(a, b) {
  const padding = 7;
  return (
    a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding
  );
}

function gameOver() {
  running = false;

  if (score > best) {
    best = score;
    localStorage.setItem("streetRushBest", best);
  }

  document.getElementById("best").textContent = best;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").classList.remove("hidden");
}

function draw() {
  drawBackground();
  drawRoad();

  for (const enemy of enemies) {
    drawCar(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
  }

  drawCar(player.x, player.y, player.width, player.height, "#19d37a");
}

function drawBackground() {
  ctx.fillStyle = "#237a3b";
  ctx.fillRect(0, 0, W, H);

  // árvores simples
  for (let y = -40; y < H + 50; y += 90) {
    const offset = (y + roadOffset) % 90;
    drawTree(42, offset);
    drawTree(458, offset + 35);
  }
}

function drawTree(x, y) {
  ctx.fillStyle = "#70452a";
  ctx.fillRect(x - 4, y + 12, 8, 22);

  ctx.beginPath();
  ctx.arc(x, y + 8, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#165d2b";
  ctx.fill();
}

function drawRoad() {
  ctx.fillStyle = "#444";
  ctx.fillRect(road.x, 0, road.width, H);

  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(road.x, 0, 6, H);
  ctx.fillRect(road.x + road.width - 6, 0, 6, H);

  ctx.fillStyle = "#f5f5f5";
  for (let y = -80 + roadOffset; y < H; y += 80) {
    ctx.fillRect(W / 2 - 4, y, 8, 42);
  }
}

function drawCar(x, y, width, height, color) {
  // sombra
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(x + 4, y + 5, width, height);

  // carroceria
  ctx.fillStyle = color;
  roundRect(x, y, width, height, 9);
  ctx.fill();

  // vidro
  ctx.fillStyle = "#17202a";
  roundRect(x + 8, y + 12, width - 16, 24, 5);
  ctx.fill();

  // vidro traseiro
  roundRect(x + 8, y + height - 34, width - 16, 20, 5);
  ctx.fill();

  // farois
  ctx.fillStyle = "#fff4b0";
  ctx.fillRect(x + 5, y + 5, 9, 7);
  ctx.fillRect(x + width - 14, y + 5, 9, 7);

  // lanternas
  ctx.fillStyle = "#ff3030";
  ctx.fillRect(x + 5, y + height - 9, 9, 5);
  ctx.fillRect(x + width - 14, y + height - 9, 9, 5);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

draw();
