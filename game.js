const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do jogo
const TILE_SIZE = 30;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const ENEMY_SPEED = 500;

// Sprites
const sprites = {
  player: "🧍",
  wall: "🟫",
  trap: "🔥",
  goal: "🎯",
  enemy: "👾",
  health: "🍎",
};

// Variáveis do jogo
let map = [];
let player = { x: 1, y: 1, life: 3, points: 0 };
let enemies = [];
let turns = 0;
let streak = 0;
let enemyMoveInterval;

// Referências para HUD
const hudLife = document.getElementById("life");
const hudPoints = document.getElementById("points");
const hudTurns = document.getElementById("turns");
const hudStreak = document.getElementById("streak");

// Função para atualizar o HUD
function updateHUD() {
  hudLife.textContent = `❤️ Vida: ${player.life}`;
  hudPoints.textContent = `⭐ Pontos: ${player.points}`;
  hudTurns.textContent = `🔄 Turnos: ${turns}`;
  hudStreak.textContent = streak;
}

// Função Flood Fill para verificar se o objetivo é alcançável
function isReachable(startX, startY, targetX, targetY) {
  const visited = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(false)
  );

  function dfs(x, y) {
    if (
      x < 0 ||
      y < 0 ||
      x >= MAP_WIDTH ||
      y >= MAP_HEIGHT ||
      visited[y][x] ||
      map[y][x] === sprites.wall
    ) {
      return false;
    }

    if (x === targetX && y === targetY) {
      return true;
    }

    visited[y][x] = true;

    return (
      dfs(x + 1, y) || dfs(x - 1, y) || dfs(x, y + 1) || dfs(x, y - 1)
    );
  }

  return dfs(startX, startY);
}

// Função para colocar itens no mapa
function placeItem(item, minDistanceFromPlayer = 0) {
  let placed = false;
  while (!placed) {
    const x = Math.floor(Math.random() * MAP_WIDTH);
    const y = Math.floor(Math.random() * MAP_HEIGHT);

    if (
      !map[y][x] &&
      calculateDistance(x, y, player.x, player.y) >= minDistanceFromPlayer &&
      isReachable(player.x, player.y, x, y)
    ) {
      map[y][x] = item;
      if (item === sprites.enemy) {
        enemies.push({ x, y });
      }
      return { x, y };
    }
  }
}

// Função para calcular a distância entre dois pontos
function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Função para desenhar o mapa
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = map[y][x];
      if (tile) {
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
      }
    }
  }

  updateHUD();
}

// Movimento dos inimigos
function moveEnemies() {
  console.log("Iniciando movimento dos inimigos...");
  for (let enemy of enemies) {
    let moved = false;

    const directions = [
      { dx: Math.sign(player.x - enemy.x), dy: 0 },
      { dx: 0, dy: Math.sign(player.y - enemy.y) },
    ];

    for (let dir of directions) {
      const newX = enemy.x + dir.dx;
      const newY = enemy.y + dir.dy;

      if (
        newX >= 0 &&
        newX < MAP_WIDTH &&
        newY >= 0 &&
        newY < MAP_HEIGHT &&
        (!map[newY][newX] || map[newY][newX] === sprites.player)
      ) {
        map[enemy.y][enemy.x] = null;
        enemy.x = newX;
        enemy.y = newY;
        map[newY][newX] = sprites.enemy;
        moved = true;
        break;
      }
    }

    if (!moved) {
      const randomDirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (let dir of randomDirs) {
        const newX = enemy.x + dir.dx;
        const newY = enemy.y + dir.dy;

        if (
          newX >= 0 &&
          newX < MAP_WIDTH &&
          newY >= 0 &&
          newY < MAP_HEIGHT &&
          !map[newY][newX]
        ) {
          map[enemy.y][enemy.x] = null;
          enemy.x = newX;
          enemy.y = newY;
          map[newY][newX] = sprites.enemy;
          break;
        }
      }
    }

    if (enemy.x === player.x && enemy.y === player.y) {
      player.life--;
      if (player.life <= 0) {
        streak = 0;
        alert("Game Over!");
        startGame();
        return;
      }
    }
  }

  drawMap();
}

// Função para gerar o mapa inicial
function generateMap() {
  console.log("Gerando mapa...");
  map = [];
  enemies = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    let row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (Math.random() < 0.3) row.push(sprites.wall);
      else row.push(null);
    }
    map.push(row);
  }

  map[player.y][player.x] = sprites.player;

  placeItem(sprites.goal, 8);
  for (let i = 0; i < 8; i++) placeItem(sprites.trap);
  for (let i = 0; i < 5; i++) placeItem(sprites.enemy);
  for (let i = 0; i < 3; i++) placeItem(sprites.health);
}

// Função para mover o jogador
function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (
    newX >= 0 &&
    newX < MAP_WIDTH &&
    newY >= 0 &&
    newY < MAP_HEIGHT &&
    map[newY][newX] !== sprites.wall
  ) {
    const target = map[newY][newX];

    if (target === sprites.trap) {
      player.life--;
    } else if (target === sprites.goal) {
      streak++;
      player.points += 50;
      alert("Parabéns! Você alcançou o objetivo!");
      startGame();
      return;
    }

    if (player.life <= 0) {
      streak = 0;
      alert("Game Over!");
      startGame();
      return;
    }

    map[player.y][player.x] = null;
    player.x = newX;
    player.y = newY;
    map[player.y][player.x] = sprites.player;

    turns++;
  }

  drawMap();
}

// Detectar entrada do teclado
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  else if (e.key === "ArrowDown") movePlayer(0, 1);
  else if (e.key === "ArrowLeft") movePlayer(-1, 0);
  else if (e.key === "ArrowRight") movePlayer(1, 0);
});

// Iniciar o jogo
function startGame() {
  console.log("Iniciando jogo...");
  clearInterval(enemyMoveInterval);
  player = { x: 1, y: 1, life: 3, points: player.points, streak: streak };
  turns = 0;
  enemies = [];
  map = [];

  generateMap();
  drawMap();
  updateHUD();

  enemyMoveInterval = setInterval(() => {
    console.log("Movimento dos inimigos iniciado.");
    moveEnemies();
  }, ENEMY_SPEED);
}

startGame();
