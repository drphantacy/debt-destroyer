let player, tokens, debtWall, debtOracle;
let bgMusic, coinSound, wallCrumbleSound, winSound, gameOverSound;
let networkActivity = 0;
let cityBackground, titleImage, supercollateralCoin, liquidationMonster;
let destroyerIdle, destroyerFlyingRight, destroyerFlyingLeft, sadHero;
let monsters;
let isMoving = false;
let direction = 0;
let gameState = "start";
let buttonHovered = false;
let titleWidth, titleHeight;
let gameTimer = 0;
let hasSpawnedInitialMonsters = false;

// Transition animation variables
let transitionTimer = 0;
let transitionDuration = 60;
let startHeroX, startHeroY, endHeroX, endHeroY;

// Button hover fade effect variables
let hoverFade = 0;
let hoverFadeSpeed = 0.05;
let originalColor, invertedColor;

// Countdown timer variables
let countdownTimer = 60;
let lastSecond = 0;
let monoFont = "Courier New";

// Coin drop speed variables
let coinSpeedMin = 1;
let coinSpeedMax = 2;
let speedIncreaseTimer = 0;
let lastSpeedIncrease = 0;

// Coin spawning variables
let coinsSpawned = 0;
let coinSpawnTimer = 0;
let coinsCollected = 0;

// Monster spawning variables
let monsterSpawnTimer = 0;
let lastMonsterSpawn = 0;

// Flying animation variables
let flyTimer = 0;
let flyDuration = 180;
let flyPath = [];
let flyX = 0, flyY = 0;
let lastFlyX = 0;

// Game over button hover states
let tryAgainHovered = false;
let leaderboardHovered = false;
let backHovered = false;

// Button hover fade for game over and leaderboard buttons
let tryAgainFade = 0;
let leaderboardFade = 0;
let backFade = 0;

// Gradient for progress bar
let redGradient, greenGradient;

// Jumping constants
const jumpForce = -12; // Upward velocity when jumping (negative because up is negative y)
const gravity = 0.5;   // Downward acceleration per frame

function preload() {
  cityBackground = loadImage('city-background.png');
  titleImage = loadImage('title-image.png');
  supercollateralCoin = loadImage('supercollateral-coin.png');
  liquidationMonster = loadImage('liquidation-monster.png');
  destroyerIdle = loadImage('destroyer-idle.png');
  destroyerFlyingRight = loadImage('destroyer-flying-right.png');
  destroyerFlyingLeft = loadImage('destroyer-flying-left.png');
  sadHero = loadImage('sad-hero.png');
  bgMusic = new Howl({ src: ['synthwave-bg.mp3'], loop: true, volume: 0.5 });
  coinSound = new Howl({ src: ['coin.mp3'] });
  wallCrumbleSound = new Howl({ src: ['crumble.mp3'] });
  winSound = new Howl({ src: ['win.wav'] });
  gameOverSound = new Howl({ src: ['game-over.wav'] });
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2;
}

function setup() {
  createCanvas(800, 600);
  let aspectRatio = destroyerIdle.width / destroyerIdle.height;
  let displayHeight = 60;
  let displayWidth = displayHeight * aspectRatio;

  let titleAspectRatio = titleImage.width / titleImage.height;
  titleHeight = 100;
  titleWidth = titleHeight * titleAspectRatio;

  player = {
    x: 400,
    y: 520,
    width: displayWidth,
    height: displayHeight,
    speed: 9.6,
    ySpeed: 0,      // Vertical velocity for jumping
    onGround: true, // Whether the player is on the ground
    groundY: 520    // The y position of the ground
  };
  tokens = [];
  monsters = [];
  debtWall = { health: 900, x: 0, y: 0, w: 800, h: 100 };
  debtOracle = { lastUpdate: 0 };

  originalColor = color(0, 255, 204);
  invertedColor = color(255 - red(originalColor), 255 - green(originalColor), 255 - blue(originalColor));

  // Create gradients for the progress bar
  redGradient = createGraphics(200, 30);
  redGradient.noStroke();
  for (let y = 0; y < 30; y++) {
    let inter = map(y, 0, 30, 0, 1);
    let c = lerpColor(color(255, 50, 50), color(150, 0, 0), inter);
    redGradient.fill(c);
    redGradient.rect(0, y, 200, 1);
  }

  greenGradient = createGraphics(200, 30);
  greenGradient.noStroke();
  for (let y = 0; y < 30; y++) {
    let inter = map(y, 0, 30, 0, 1);
    let c = lerpColor(color(50, 255, 50), color(0, 150, 0), inter);
    greenGradient.fill(c);
    greenGradient.rect(0, y, 200, 1);
  }

  flyPath = [
    { x: width / 2 - player.width / 2, y: 390 },
    { x: width / 2 - 100 + random(-20, 20), y: 300 + random(-20, 20) },
    { x: width / 2 + 100 + random(-20, 20), y: 250 + random(-20, 20) },
    { x: width / 2 - 100 + random(-20, 20), y: 200 + random(-20, 20) },
    { x: width / 2 + 100 + random(-20, 20), y: 150 + random(-20, 20) }
  ];
}

function resetGame() {
  // Reset player position and state
  player.x = 400;
  player.y = 520;
  player.ySpeed = 0;
  player.onGround = true;

  // Reset game timers
  gameTimer = 0;
  countdownTimer = 60;
  lastSecond = frameCount;
  speedIncreaseTimer = 0;
  lastSpeedIncrease = frameCount;
  coinSpeedMin = 1;
  coinSpeedMax = 2;
  coinSpawnTimer = 0;
  monsterSpawnTimer = 0;
  lastMonsterSpawn = 0;

  // Reset game objects
  tokens = [];
  monsters = [];

  // Reset points and counters
  coinsSpawned = 0;
  coinsCollected = 0;
  debtWall.health = 900;

  // Reset flags
  hasSpawnedInitialMonsters = false;

  // Reset music (already stopped in winLevel/gameOver, but ensure it's ready to play)
  bgMusic.stop();
}

function startGame() {
  startHeroX = width / 2 - player.width / 2;
  startHeroY = 390;
  flyTimer = 0;
  flyX = startHeroX;
  flyY = startHeroY;
  lastFlyX = flyX;
  gameState = "flyAround";
}

function startTransition() {
  startHeroX = flyX;
  startHeroY = flyY;
  endHeroX = player.x;
  endHeroY = player.y;
  transitionTimer = 0;
  gameState = "transition";
}

function startPlaying() {
  countdownTimer = 60;
  lastSecond = frameCount;
  speedIncreaseTimer = 0;
  lastSpeedIncrease = frameCount;
  coinSpeedMin = 1;
  coinSpeedMax = 2;
  coinsSpawned = 0;
  coinsCollected = 0;
  tokens = [];
  bgMusic.play();
  gameState = "playing";
  gameTimer = 0;
  hasSpawnedInitialMonsters = false;
  monsterSpawnTimer = 0;
  lastMonsterSpawn = 0;
}

function draw() {
  image(cityBackground, 0, 0, width, height);

  if (gameState === "start") {
    fill(0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, 600, 500, 20);

    image(titleImage, width / 2 - titleWidth / 2, 100, titleWidth, titleHeight);

    textFont("Trebuchet MS");
    fill(0, 255, 204);
    textSize(20);
    textStyle(NORMAL);
    textAlign(CENTER);
    text("Hero's Mission:", width / 2, 220);
    fill(255);
    textSize(14);
    textAlign(CENTER);
    textWrap(WORD);
    text("Soar with LEFT/RIGHT keys to grab coins, Hero!", width / 2, 250, 560);
    text("Smash the Debt Wall by collecting coins, but they vanish in 2 seconds!", width / 2, 280, 560);
    text("Dodge Monsters—they steal loot or add debt!", width / 2, 320, 560);
    text("Crush the debt to claim Superseed glory!", width / 2, 350, 560);

    image(destroyerIdle, width / 2 - player.width / 2, 430, player.width, player.height);

    let buttonX = width / 2 - 100;
    let buttonY = 465 - 25;
    buttonHovered = (mouseX >= buttonX && mouseX <= buttonX + 200 && mouseY >= buttonY && mouseY <= buttonY + 50);

    if (buttonHovered) {
      hoverFade = min(hoverFade + hoverFadeSpeed, 1);
    } else {
      hoverFade = max(hoverFade - hoverFadeSpeed, 0);
    }

    let currentColor = lerpColor(invertedColor, originalColor, hoverFade);
    fill(currentColor);
    rectMode(CENTER);
    rect(width / 2, 465, 200, 50, 10);
    fill(0);
    textSize(20);
    text("Let's Grow!", width / 2, 470);
  } else if (gameState === "flyAround") {
    flyTimer += 1;
    let t = flyTimer / flyDuration;
    t = easeInOut(t);

    let segmentLength = 1 / (flyPath.length - 1);
    let segment = floor(t / segmentLength);
    let segmentT = (t % segmentLength) / segmentLength;

    if (segment >= flyPath.length - 1) {
      segment = flyPath.length - 2;
      segmentT = 1;
    }

    let currentPoint = flyPath[segment];
    let nextPoint = flyPath[segment + 1];

    lastFlyX = flyX;
    flyX = lerp(currentPoint.x, nextPoint.x, segmentT);
    flyY = lerp(currentPoint.y, nextPoint.y, segmentT);

    let sprite = (flyX > lastFlyX) ? destroyerFlyingRight : destroyerFlyingLeft;
    image(sprite, flyX, flyY, player.width, player.height);

    if (flyTimer >= flyDuration) {
      startTransition();
    }
  } else if (gameState === "transition") {
    transitionTimer += 1;
    let t = transitionTimer / transitionDuration;
    let currentX = lerp(startHeroX, endHeroX, t);
    let currentY = lerp(startHeroY, endHeroY, t);

    image(destroyerIdle, currentX, currentY, player.width, player.height);

    if (transitionTimer >= transitionDuration) {
      startPlaying();
    }
  } else if (gameState === "playing") {
    gameTimer += 1;
    speedIncreaseTimer += 1;
    coinSpawnTimer += 1;
    monsterSpawnTimer += 1;

    if (coinSpawnTimer >= 40) {
      spawnTokens(1);
      coinsSpawned++;
      coinSpawnTimer = 0;
    }

    if (speedIncreaseTimer - lastSpeedIncrease >= 600) {
      coinSpeedMin += 0.5;
      coinSpeedMax += 0.5;
      lastSpeedIncrease = speedIncreaseTimer;
    }

    if (monsterSpawnTimer - lastMonsterSpawn >= 300) {
      spawnMonsters(2);
      lastMonsterSpawn = monsterSpawnTimer;
    }

    if (frameCount - lastSecond >= 60) {
      countdownTimer -= 1;
      lastSecond = frameCount;
    }

    if (countdownTimer <= 0) {
      gameOver();
    }

    if (!hasSpawnedInitialMonsters && gameTimer >= 300) {
      spawnMonsters(2);
      hasSpawnedInitialMonsters = true;
    }

    updatePlayer();
    updateTokens();
    updateMonsters();
    updateDebtWall();
    updateDebtOracle();
    drawUI();

    textFont(monoFont);
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER);
    text(nf(countdownTimer, 2), width / 2, 40);
  } else if (gameState === "debtCleared") {
    fill(0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, 600, 500, 20);

    fill(255);
    textSize(48);
    textStyle(BOLD);
    textAlign(CENTER);
    text("Debt Cleared!", width / 2, 150);

    image(destroyerIdle, width / 2 - player.width / 2, 200, player.width, player.height);

    let tryAgainX = width / 2 - 180;
    let tryAgainY = 400 - 25;
    tryAgainHovered = (mouseX >= tryAgainX && mouseX <= tryAgainX + 150 && mouseY >= tryAgainY && mouseY <= tryAgainY + 50);
    if (tryAgainHovered) {
      tryAgainFade = min(tryAgainFade + hoverFadeSpeed, 1);
    } else {
      tryAgainFade = max(tryAgainFade - hoverFadeSpeed, 0);
    }
    let tryAgainColor = lerpColor(invertedColor, originalColor, tryAgainFade);
    fill(tryAgainColor);
    rect(tryAgainX + 75, 400, 150, 50, 10);
    fill(0);
    textSize(20);
    text("Play Again", tryAgainX + 75, 405); // Changed "Try Again" to "Play Again"

    let leaderboardX = width / 2 + 30;
    let leaderboardY = 400 - 25;
    leaderboardHovered = (mouseX >= leaderboardX && mouseX <= leaderboardX + 150 && mouseY >= leaderboardY && mouseY <= leaderboardY + 50);
    if (leaderboardHovered) {
      leaderboardFade = min(leaderboardFade + hoverFadeSpeed, 1);
    } else {
      leaderboardFade = max(leaderboardFade - hoverFadeSpeed, 0);
    }
    let leaderboardColor = lerpColor(invertedColor, originalColor, leaderboardFade);
    fill(leaderboardColor);
    rect(leaderboardX + 75, 400, 150, 50, 10);
    fill(0);
    textSize(20);
    text("Leaderboard", leaderboardX + 75, 405);
  } else if (gameState === "gameOver") {
    fill(0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, 600, 500, 20);

    fill(255);
    textSize(48);
    textStyle(BOLD);
    textAlign(CENTER);
    text("Game Over", width / 2, 150);

    let sadHeroWidth = 200;
    let sadHeroHeight = sadHeroWidth * (sadHero.height / sadHero.width);
    image(sadHero, width / 2 - sadHeroWidth / 2, 200, sadHeroWidth, sadHeroHeight);

    let tryAgainX = width / 2 - 180;
    let tryAgainY = 400 - 25;
    tryAgainHovered = (mouseX >= tryAgainX && mouseX <= tryAgainX + 150 && mouseY >= tryAgainY && mouseY <= tryAgainY + 50);
    if (tryAgainHovered) {
      tryAgainFade = min(tryAgainFade + hoverFadeSpeed, 1);
    } else {
      tryAgainFade = max(tryAgainFade - hoverFadeSpeed, 0);
    }
    let tryAgainColor = lerpColor(invertedColor, originalColor, tryAgainFade);
    fill(tryAgainColor);
    rect(tryAgainX + 75, 400, 150, 50, 10);
    fill(0);
    textSize(20); // Fixed typo: was textSize(W)
    text("Try Again", tryAgainX + 75, 405);

    let leaderboardX = width / 2 + 30;
    let leaderboardY = 400 - 25;
    leaderboardHovered = (mouseX >= leaderboardX && mouseX <= leaderboardX + 150 && mouseY >= leaderboardY && mouseY <= leaderboardY + 50);
    if (leaderboardHovered) {
      leaderboardFade = min(leaderboardFade + hoverFadeSpeed, 1);
    } else {
      leaderboardFade = max(leaderboardFade - hoverFadeSpeed, 0);
    }
    let leaderboardColor = lerpColor(invertedColor, originalColor, leaderboardFade);
    fill(leaderboardColor);
    rect(leaderboardX + 75, 400, 150, 50, 10);
    fill(0);
    textSize(20);
    text("Leaderboard", leaderboardX + 75, 405);
  } else if (gameState === "leaderboard") {
    fill(0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, 600, 500, 20);

    fill(255);
    textSize(20);
    textStyle(NORMAL);
    textAlign(CENTER);
    text("There is no leaderboard", width / 2, 150);
    textSize(16);
    text("There is no winning or losing in debt onchain, just make sure", width / 2, 200);
    text("you are comfortable with what you are investing or risking.", width / 2, 220);
    text("Explore self-repaying loans by Superseed, a new financial", width / 2, 240);
    text("primitive where network fees fuel a better onchain experience.", width / 2, 260);
    text("With love, Superseed Hero.", width / 2, 300);

    let backX = width / 2 - 50;
    let backY = 400 - 25;
    backHovered = (mouseX >= backX && mouseX <= backX + 100 && mouseY >= backY && mouseY <= backY + 50);
    if (backHovered) {
      backFade = min(backFade + hoverFadeSpeed, 1);
    } else {
      backFade = max(backFade - hoverFadeSpeed, 0);
    }
    let backColor = lerpColor(invertedColor, originalColor, backFade);
    fill(backColor);
    rect(backX + 50, 400, 100, 50, 10);
    fill(0);
    textSize(20);
    text("Back", backX + 50, 405);
  }
}

function mousePressed() {
  if (gameState === "start") {
    let buttonX = width / 2 - 100;
    let buttonY = 465 - 25;
    if (mouseX >= buttonX && mouseX <= buttonX + 200 && mouseY >= buttonY && mouseY <= buttonY + 50) {
      startGame();
    }
  } else if (gameState === "gameOver" || gameState === "debtCleared") {
    let tryAgainX = width / 2 - 180;
    let tryAgainY = 400 - 25;
    if (mouseX >= tryAgainX && mouseX <= tryAgainX + 150 && mouseY >= tryAgainY && mouseY <= tryAgainY + 50) {
      resetGame(); // Reset game state before restarting
      gameState = "start";
      bgMusic.stop();
    }

    let leaderboardX = width / 2 + 30;
    let leaderboardY = 400 - 25;
    if (mouseX >= leaderboardX && mouseX <= leaderboardX + 150 && mouseY >= leaderboardY && mouseY <= leaderboardY + 50) {
      gameState = "leaderboard";
    }
  } else if (gameState === "leaderboard") {
    let backX = width / 2 - 50;
    let backY = 400 - 25;
    if (mouseX >= backX && mouseX <= backX + 100 && mouseY >= backY && mouseY <= backY + 50) {
      gameState = "gameOver";
    }
  }
}

function updatePlayer() {
  let prevX = player.x;

  direction = 0;
  if (keyIsDown(LEFT_ARROW)) {
    player.x -= player.speed;
    direction = -1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    player.x += player.speed;
    direction = 1;
  }
  player.x = constrain(player.x, 0, width - player.width);

  // Handle jumping
  if (keyIsDown(UP_ARROW) && player.onGround) {
    player.ySpeed = jumpForce; // Apply upward velocity
    player.onGround = false;   // Player is now in the air
  }

  // Apply gravity
  player.ySpeed += gravity;
  player.y += player.ySpeed;

  // Check if player has landed
  if (player.y >= player.groundY) {
    player.y = player.groundY; // Snap to ground
    player.ySpeed = 0;         // Stop vertical movement
    player.onGround = true;    // Player is back on the ground
  }

  isMoving = (player.x !== prevX);

  // Display appropriate sprite based on movement and jumping
  if (!player.onGround) {
    // In the air (jumping or falling)
    if (direction === -1) {
      image(destroyerFlyingLeft, player.x, player.y, player.width, player.height);
    } else if (direction === 1) {
      image(destroyerFlyingRight, player.x, player.y, player.width, player.height);
    } else {
      // Use the flying sprite that matches the last direction
      let sprite = direction === -1 ? destroyerFlyingLeft : destroyerFlyingRight;
      image(sprite, player.x, player.y, player.width, player.height);
    }
  } else {
    // On the ground
    if (isMoving) {
      if (direction === -1) {
        image(destroyerFlyingLeft, player.x, player.y, player.width, player.height);
      } else {
        image(destroyerFlyingRight, player.x, player.y, player.width, player.height);
      }
    } else {
      image(destroyerIdle, player.x, player.y, player.width, player.height);
    }
  }
}

function spawnTokens(num) {
  for (let i = 0; i < num; i++) {
    let tokenSize = 11;
    tokens.push({
      x: random(tokenSize / 2, width - tokenSize / 2),
      y: -5,
      size: tokenSize,
      speed: random(coinSpeedMin, coinSpeedMax),
      groundTimer: 0
    });
  }
}

function spawnMonsters(num) {
  for (let i = 0; i < num; i++) {
    let monsterSize = 20;
    monsters.push({
      x: random(monsterSize / 2, width - monsterSize / 2),
      y: -5,
      size: monsterSize,
      speed: random(1, 3),
      groundTimer: 0
    });
  }
}

function updateTokens() {
  for (let i = tokens.length - 1; i >= 0; i--) {
    tokens[i].y += tokens[i].speed;
    if (tokens[i].y >= 530) {
      tokens[i].y = 530;
      tokens[i].speed = 0;
      tokens[i].groundTimer += 1;
    }

    if (tokens[i].groundTimer >= 120) {
      tokens.splice(i, 1);
      continue;
    }

    image(supercollateralCoin, tokens[i].x - tokens[i].size / 2, tokens[i].y - tokens[i].size / 2, tokens[i].size, tokens[i].size);
    if (dist(player.x + player.width / 2, player.y + player.height / 2, tokens[i].x, tokens[i].y) < (player.width / 2 + tokens[i].size / 2)) {
      tokens.splice(i, 1);
      debtWall.health -= 10;
      coinsCollected += 1;
      coinSound.play();
      if (debtWall.health <= 0) winLevel();
    }
  }
}

function updateMonsters() {
  for (let i = monsters.length - 1; i >= 0; i--) {
    monsters[i].y += monsters[i].speed;
    if (monsters[i].y >= 530) {
      monsters[i].y = 530;
      monsters[i].speed = 0;
      monsters[i].groundTimer += 1;
      if (monsters[i].groundTimer >= 30) {
        monsters.splice(i, 1);
        continue;
      }
    }

    image(liquidationMonster, monsters[i].x - monsters[i].size / 2, monsters[i].y - monsters[i].size / 2, monsters[i].size, monsters[i].size);
    if (dist(player.x + player.width / 2, player.y + player.height / 2, monsters[i].x, monsters[i].y) < (player.width / 2 + monsters[i].size / 2)) {
      monsters.splice(i, 1);
      debtWall.health += 100;
      wallCrumbleSound.play();
    }
  }
}

function updateDebtWall() {
  if (debtWall.health <= 0) wallCrumbleSound.play();
}

function updateDebtOracle() {
  if (frameCount - debtOracle.lastUpdate > 120) {
    networkActivity = random(0, 100);
    if (networkActivity > 50) {
      spawnTokens(3);
      coinsSpawned += 3;
      if (random() < 0.5) spawnMonsters(1);
    }
    debtOracle.lastUpdate = frameCount;
  }
}

function drawUI() {
  let barX = 10;
  let barY = 50;
  let barWidth = 200;
  let barHeight = 30;
  let coinSize = 31;

  image(supercollateralCoin, barX, barY - coinSize - 5, coinSize, coinSize);

  image(redGradient, barX + coinSize + 5, barY);

  let greenWidth = map(coinsCollected, 0, 90, 0, barWidth);
  let greenX = barX + coinSize + 5 + barWidth - greenWidth;
  push();
  translate(greenX, barY);
  image(greenGradient, 0, 0, greenWidth, barHeight);
  pop();

  fill(255);
  textSize(16);
  textAlign(CENTER);
  textFont(monoFont);
  text(`${debtWall.health} ETH`, barX + coinSize + 5 + barWidth / 2, barY + 20);
}

function winLevel() {
  bgMusic.stop();
  winSound.play();
  gameState = "debtCleared";
}

function gameOver() {
  bgMusic.stop();
  gameOverSound.play();
  gameState = "gameOver";
}