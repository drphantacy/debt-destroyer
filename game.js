let player, tokens, debtWall, debtOracle;
let bgMusic, introMusic, coinSound, wallCrumbleSound, winSound, gameOverSound;
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
let hasPlayedIntroMusic = false; // Flag to track if intro music has played

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
  introMusic = new Howl({ src: ['intro.mp3'], loop: true, volume: 0.5 });
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
  hasPlayedIntroMusic = false; // Reset the flag so music can play again on interaction

  // Reset music
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
    text("Dash with the LEFT/RIGHT keys and leap with UP to chase down shimmering coins!", width / 2, 250, 560);
    text("Smash through the looming Debt Wall — but hurry, coins vanish after just 2 seconds!", width / 2, 280, 560);
    text("Dodge sneaky Monsters — they’ll swipe your loot or stack your debt!", width / 2, 310, 560);
    text("Conquer the debt and rise to Superseed glory, brave Hero!", width / 2, 340, 560);

    image(destroyerIdle, width / 2 - player.width / 2, 390, player.width, player.height);

    let buttonX = width / 2 - 100;
    let buttonY = 465 - 25;
    buttonHovered = (mouseX >= buttonX && mouseX <= buttonX + 200 && mouseY >= buttonY && mouseY <= buttonY + 50);

    if (buttonHovered) {
      hoverFade = min(hoverFade + hoverFadeSpeed, 1);
    } else {
      hoverFade = max(hoverFade - hoverFadeSpeed, 0);
    }

    let currentColor = lerpColor(originalColor, invertedColor, hoverFade);
    fill(currentColor);
    rectMode(CENTER);
    rect(width / 2, 465, 200, 50, 10);
    fill(0);
    textSize(20);
    text("Let's Go!", width / 2, 470);
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

    // Draw countdown timer with white box and black border
    textFont(monoFont);
    textSize(20);
    textAlign(CENTER);
    rectMode(CENTER);
    fill(255); // White background
    stroke(0); // Black border
    strokeWeight(4); // Thick border
    rect(width / 2, 40, 50, 30); // White box
    noStroke(); // Remove stroke for text
    fill(countdownTimer <= 10 ? color(255, 0, 0) : color(0)); // Red if <= 10, black otherwise
    text(nf(countdownTimer, 2), width / 2, 45);
  } else if (gameState === "debtCleared") {
    fill(0, 200);
    rectMode(CENTER);
    rect(width / 2, height / 2, 600, 500, 20);

    fill(255);
    textSize(48);
    textStyle(BOLD);
    textAlign(CENTER);
    text("Debt Cleared!", width / 2, 150);

    let scaleFactor = 2;
    let scaledWidth = player.width * scaleFactor;
    let scaledHeight = player.height * scaleFactor;
    image(destroyerIdle, width / 2 - scaledWidth / 2, 200, scaledWidth, scaledHeight);

    let tryAgainX = width / 2 - 180;
    let tryAgainY = 400 - 25;
    tryAgainHovered = (mouseX >= tryAgainX && mouseX <= tryAgainX + 150 && mouseY >= tryAgainY && mouseY <= tryAgainY + 50);
    if (tryAgainHovered) {
      tryAgainFade = min(tryAgainFade + hoverFadeSpeed, 1);
    } else {
      tryAgainFade = max(tryAgainFade - hoverFadeSpeed, 0);
    }
    let tryAgainColor = lerpColor(originalColor, invertedColor, tryAgainFade);
    fill(tryAgainColor);
    rect(tryAgainX + 75, 400, 150, 50, 10);
    fill(0);
    textSize(20);
    text("Play Again", tryAgainX + 75, 405);

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
    textSize(20);
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
    textAlign(CENTER);
    textWrap(WORD);

    // Set the text box width to 500 to create padding on the left and right (600 - 50 on each side = 500)
    let textBoxWidth = 500;

    // Title
    textSize(20);
    textStyle(NORMAL);
    text("There is no leaderboard.", width / 2, 150, textBoxWidth);

    // Main body text
    textSize(16);
    text("Onchain finance isn’t a race — it’s about moving at your own pace. Know what you’re investing or risking, and stay within your comfort zone.", width / 2, 180, textBoxWidth);

    // Additional text
    text("Discover self-repaying loans with Superseed — a new financial primitive where network fees help reduce your debt and improve the onchain experience.", width / 2, 260, textBoxWidth);

    // Signature
    text("With care,\nSuperseed Hero.", width / 2, 340, textBoxWidth);

    let backX = width / 2 - 50;
    let backY = 420 - 25; // Moved 20px lower (400 -> 420)
    backHovered = (mouseX >= backX && mouseX <= backX + 100 && mouseY >= backY && mouseY <= backY + 50);
    if (backHovered) {
      backFade = min(backFade + hoverFadeSpeed, 1);
    } else {
      backFade = max(backFade - hoverFadeSpeed, 0);
    }
    let backColor = lerpColor(invertedColor, originalColor, backFade);
    fill(backColor);
    rect(backX + 50, 420, 100, 50, 10); // Adjusted y position
    fill(0);
    textSize(20);
    text("Back", backX + 50, 425); // Adjusted y position (405 -> 425)
  }
}

function mousePressed() {
  // Play intro music on the first user interaction if it hasn't played yet
  if (!hasPlayedIntroMusic && gameState === "start") {
    introMusic.play();
    hasPlayedIntroMusic = true;
  }

  if (gameState === "start") {
    let buttonX = width / 2 - 100;
    let buttonY = 465 - 25;
    if (mouseX >= buttonX && mouseX <= buttonX + 200 && mouseY >= buttonY && mouseY <= buttonY + 50) {
      introMusic.stop(); // Stop intro music when "Let's Go" is clicked
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
    let backY = 420 - 25; // Updated y position
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
    player.ySpeed = jumpForce;
    player.onGround = false;
  }

  // Apply gravity
  player.ySpeed += gravity;
  player.y += player.ySpeed;

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.ySpeed = 0;
    player.onGround = true;
  }

  isMoving = (player.x !== prevX);

  if (!player.onGround) {
    if (direction === -1) {
      image(destroyerFlyingLeft, player.x, player.y, player.width, player.height);
    } else if (direction === 1) {
      image(destroyerFlyingRight, player.x, player.y, player.width, player.height);
    } else {
      let sprite = direction === -1 ? destroyerFlyingLeft : destroyerFlyingRight;
      image(sprite, player.x, player.y, player.width, player.height);
    }
  } else {
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
      coinsCollected += 1; // Ensure this increments
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
      // Adjust coinsCollected to reflect the increased debt
      let coinsEquivalent = 100 / 10; // Each coin reduces health by 10, so 100 health = 10 coins
      coinsCollected = max(0, coinsCollected - coinsEquivalent); // Reduce coinsCollected, but not below 0
      wallCrumbleSound.play();
    }
  }
}

function updateDebtWall() {
  // Only play the crumble sound if the game is still in "playing" state
  // (i.e., not when the user has won and transitioned to "debtCleared")
  if (debtWall.health <= 0 && gameState === "playing") {
    wallCrumbleSound.play();
  }
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
  let barY = 10;
  let barWidth = 200;
  let barHeight = 30;
  let coinSize = 31;

  // Draw the coin
  image(supercollateralCoin, barX, barY, coinSize, coinSize);

  // Draw the progress bar with a 2px black border
  stroke(0); // Black border
  strokeWeight(2); // 2px border
  image(redGradient, barX + coinSize + 5, barY);

  if (coinsCollected > 0) {
    let greenWidth = map(coinsCollected, 0, 90, 0, barWidth);
    let greenX = barX + coinSize + 5 + barWidth - greenWidth;
    push();
    translate(greenX, barY);
    image(greenGradient, 0, 0, greenWidth, barHeight);
    pop();
  }
  noStroke(); // Remove stroke for the text

  // Draw the text inside the progress bar
  fill(255);
  textSize(16);
  textAlign(CENTER);
  textFont(monoFont);
  textStyle(BOLD);
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