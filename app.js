(() => {
  const SAVE_KEY = "pig-farm-buildings-v4";
  const AUTO_SAVE_INTERVAL_MS = 5000;
  const MAX_OFFLINE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

  const CONFIG = {
    HUNGER_GAIN_PER_MIN: 0.18,
    HUNGRY_TO_SEEK_FOOD: 18,
    FREQUENT_FEED_WINDOW_MS: 1000 * 60 * 90,
    GROWTH_PER_FEED_BASE: 18,
    GROWTH_BONUS_FREQUENT: 28,
    POOP_SELL_PRICE: 3,
    MAX_PIGS: 10
  };

  const FOOD_TYPES = {
    mix: {
      id: "mix",
      name: "Feed Mix",
      packQty: 5,
      packCost: 15,
      hungerRelief: 3,
      growthBonus: 8,
      color: "#e8bf4d",
      tileKey: "foodMix"
    },
    pumpkin: {
      id: "pumpkin",
      name: "Pumpkin Bites",
      packQty: 5,
      packCost: 28,
      hungerRelief: 5,
      growthBonus: 18,
      color: "#f08c2e",
      tileKey: "foodPumpkin"
    },
    root: {
      id: "root",
      name: "Sweet Roots",
      packQty: 5,
      packCost: 42,
      hungerRelief: 7,
      growthBonus: 30,
      color: "#bb7be8",
      tileKey: "foodRoot"
    }
  };

  const FOOD_IDS = Object.keys(FOOD_TYPES);
  const BASE_NAMES = [
    "Pinky",
    "Momo",
    "Choco",
    "Peanut",
    "Rosie",
    "Boba",
    "Puff",
    "Nori",
    "Lulu",
    "Biscuit",
    "Berry",
    "Peach"
  ];
  const STAGE_ORDER = ["Baby", "Young", "Adult", "Old", "Old Old"];

  //window is 960 x 600
  const jimusho = { x: 28, y: 10, w: 330, h: 240 };
  const truck = { x: 800, y: 156, w: 138, h: 112 };
  const farm = { x: 0, y: 230, w: 960, h: 370 };

  const BACKGROUND_SPLIT_Y = 230;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const moneyInfoEl = document.getElementById("moneyInfo");
  const selectedFoodInfoEl = document.getElementById("selectedFoodInfo");
  const stockInfoEl = document.getElementById("stockInfo");
  const worldInfoEl = document.getElementById("worldInfo");
  const saveInfoEl = document.getElementById("saveInfo");
  const tapHintEl = document.getElementById("tapHint");

  const cardScrimEl = document.getElementById("cardScrim");
  const buildingCardEl = document.getElementById("buildingCard");
  const cardTitleEl = document.getElementById("cardTitle");
  const cardSubtitleEl = document.getElementById("cardSubtitle");
  const cardBodyEl = document.getElementById("cardBody");

  const sprites = createSprites();
  let backgroundLayer = null;

  const moneyImage = new Image();
  moneyImage.src = "./assets/logo_money.png";
  moneyImage.onload = () => render();
  moneyImage.onerror = () => console.error("Failed to load image: ./assets/logo_money.png");

  const highlightImage = new Image();
  highlightImage.src = "./assets/highlight_mark.png";
  highlightImage.onload = () => { render(); };
  highlightImage.onerror = () => { console.error("Failed to load image: ./assets/highlight.png") };

  const sleepMarkImage = new Image();
  sleepMarkImage.src = "./assets/sleep_mark.png";
  sleepMarkImage.onload = () => { render(); };
  sleepMarkImage.onerror = () => { console.error("Failed to load image: ./assets/sleep_mark.png") };

  const truckImage = new Image();
  truckImage.src = "./assets/truck_kcar.png";
  truckImage.onload = () => { render() };
  truckImage.onerror = () => { console.error("Failed to load image: ./assets/truck_kcar.png") };

  const pigImage = new Image();
  pigImage.src = "./assets/pig_normal_adult.png";
  pigImage.onload = () => { render() };
  pigImage.onerror = () => { console.error("Failed to load pig image: ./assets/pig_normal_adult.png") };

  const skyImage = new Image();
  skyImage.src = "./assets/bg_sky_normal.png";
  skyImage.onload = () => {
    //backgroundLayer = buildBackgroundLayer();
    render();
  };
  skyImage.onerror = () => { console.error("Failed to load background image: ./assets/bg_sky_normal.png") };

  const farmBgImage = new Image();
  farmBgImage.src = "./assets/bg_grassland_normal.png";
  farmBgImage.onload = () => {
    //backgroundLayer = buildBackgroundLayer();
    render();
  };
  farmBgImage.onerror = () => { console.error("Failed to load background image: ./assets/bg_grassland_normal.png") };

  const fenceImage = new Image();
  fenceImage.src = "./assets/fence_wood.png";
  fenceImage.onload = () => {
    //backgroundLayer = buildBackgroundLayer();
    render();
  };
  fenceImage.onerror = () => { console.error("Failed to load image: ./assets/fence_bamboo.png") };

  const jimushoImage = new Image();
  jimushoImage.src = "./assets/jimusho_level1.png";
  jimushoImage.onload = () => {
    backgroundLayer = buildBackgroundLayer();
    render();
  };
  jimushoImage.onerror = () => { console.error("Failed to load image: ./assets/building_jimusho.png") };

  backgroundLayer = buildBackgroundLayer();

  let lastAutoSaveAt = Date.now();
  let lastUiRefreshAt = 0;
  let openPanel = null;
  let offlineInfo = "Offline progress is enabled.";
  let selectedPigId = null;
  let sellConfirmPigId = null;
  let dragState = null;
  let herdLeaderByPigId = new Map();
  let herdLeaderIds = new Set();

  const savedText = safeStorageGet(SAVE_KEY);
  let world = savedText ? loadWorld(savedText) || createNewWorld() : createNewWorld();

  const recoveredMs = syncToNow(true);
  if (!savedText) {
    offlineInfo = "New farm created. Tap the office to manage the farm.";
  } else if (recoveredMs <= 2000) {
    offlineInfo = "Saved farm loaded. Offline progress is enabled.";
  }

  persistNow();
  updateHud();
  render();
  requestAnimationFrame(loop);

  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  canvas.addEventListener("pointermove", onCanvasPointerMove);
  canvas.addEventListener("pointerup", onCanvasPointerUp);
  canvas.addEventListener("pointercancel", onCanvasPointerCancel);

  cardScrimEl.addEventListener("click", closePanelCard);
  //closeCardBtn.addEventListener("click", closePanelCard);
  cardBodyEl.addEventListener("click", onCardBodyClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanelCard();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      persistNow();
    } else {
      const elapsed = syncToNow(false);
      if (elapsed > 2000) {
        offlineInfo = `Caught up ${formatDuration(elapsed)} while the tab was hidden.`;
      }
      updateHud();
      render();
    }
  });

  window.addEventListener("focus", () => {
    const elapsed = syncToNow(false);
    if (elapsed > 2000) {
      offlineInfo = `Caught up ${formatDuration(elapsed)}.`;
    }
    updateHud();
    render();
  });

  window.addEventListener("resize", () => {
    if (openPanel === "pig") {
      positionPigNoteToCanvas();
    } else if (openPanel === "sellConfirm") {
      positionCardToCanvasCenter();
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (openPanel === "pig") {
        positionPigNoteToCanvas();
      } else if (openPanel === "sellConfirm") {
        positionCardToCanvasCenter();
      }
    },
    { passive: true }
  );

  window.addEventListener("pagehide", persistNow);
  window.addEventListener("beforeunload", persistNow);

  function loop() {
    const now = Date.now();

    syncToNow(false);
    render();

    if (now - lastUiRefreshAt >= 250) {
      updateHud();
      lastUiRefreshAt = now;
    }

    if (now - lastAutoSaveAt >= AUTO_SAVE_INTERVAL_MS) {
      persistNow();
    }

    requestAnimationFrame(loop);
  }

  // -----------------------------------
  // World creation / load / normalize
  // -----------------------------------
  function createNewWorld() {
    const now = Date.now();
    const newWorld = {
      version: 4,
      createdAt: now,
      lastUpdateAt: now,
      savedAt: now,
      money: 120,
      selectedFoodType: "mix",
      foodStock: {
        mix: 8,
        pumpkin: 2,
        root: 1
      },
      foods: [],
      poops: [],
      pigs: [],
      nextPigId: 1
    };

    for (const name of ["Pinky", "Momo", "Choco"]) {
      newWorld.pigs.push(createPig(name, newWorld.nextPigId++));
    }

    return newWorld;
  }

  function createPig(name, id) {
    const pig = {
      id,
      name,
      x: rand(farm.x + 50, farm.x + farm.w - 50),
      y: rand(farm.y + 50, farm.y + farm.h - 50),
      targetX: rand(farm.x + 30, farm.x + farm.w - 30),
      targetY: rand(farm.y + 30, farm.y + farm.h - 30),
      vx: 0,
      vy: 0,
      wanderTimer: rand(2, 6),
      hunger: rand(10, 30),
      ageMinutes: 0,
      growthBonus: 0,
      feedCount: 0,
      lastFedAt: -1,
      digestion: [],
      variant: Math.floor(rand(0, 3)),
      animOffset: rand(0, 9999),
      stage: "Baby",
      size: 15,
      moveSpeed: 34
    };

    applyStage(pig);
    return pig;
  }

  function loadWorld(text) {
    try {
      return normalizeWorld(JSON.parse(text));
    } catch (error) {
      console.warn("Could not parse saved world:", error);
      return null;
    }
  }

  function normalizeWorld(raw) {
    const now = Date.now();
    const normalized = {
      version: 4,
      createdAt: safeNumber(raw?.createdAt, now),
      lastUpdateAt: safeNumber(raw?.lastUpdateAt, now),
      savedAt: safeNumber(raw?.savedAt, now),
      money: Math.max(0, Math.floor(safeNumber(raw?.money, 120))),
      selectedFoodType: FOOD_TYPES[raw?.selectedFoodType] ? raw.selectedFoodType : "mix",
      foodStock: normalizeFoodStock(raw?.foodStock ?? raw?.foodInventory),
      foods: Array.isArray(raw?.foods) ? raw.foods.map(normalizeFoodItem) : [],
      poops: Array.isArray(raw?.poops) ? raw.poops.map(normalizePoop) : [],
      pigs: Array.isArray(raw?.pigs)
        ? raw.pigs.map((pig, index) => normalizePig(pig, index + 1))
        : [],
      nextPigId: Math.max(1, Math.floor(safeNumber(raw?.nextPigId, 1)))
    };

    if (!normalized.pigs.length) {
      for (const name of ["Pinky", "Momo", "Choco"]) {
        normalized.pigs.push(createPig(name, normalized.nextPigId++));
      }
    }

    const maxId = normalized.pigs.reduce((max, pig) => Math.max(max, pig.id), 0);
    normalized.nextPigId = Math.max(normalized.nextPigId, maxId + 1);

    if (!FOOD_TYPES[normalized.selectedFoodType]) {
      normalized.selectedFoodType = "mix";
    }

    return normalized;
  }

  function normalizeFoodStock(rawStock) {
    if (Number.isFinite(rawStock)) {
      return {
        mix: Math.max(0, Math.floor(rawStock)),
        pumpkin: 0,
        root: 0
      };
    }

    return {
      mix: Math.max(0, Math.floor(safeNumber(rawStock?.mix, 8))),
      pumpkin: Math.max(0, Math.floor(safeNumber(rawStock?.pumpkin, 2))),
      root: Math.max(0, Math.floor(safeNumber(rawStock?.root, 1)))
    };
  }

  function normalizeFoodItem(food) {
    const type = FOOD_TYPES[food?.type] ? food.type : "mix";
    return {
      type,
      x: clamp(
        safeNumber(food?.x, rand(farm.x + 16, farm.x + farm.w - 16)),
        farm.x + 10,
        farm.x + farm.w - 10
      ),
      y: clamp(
        safeNumber(food?.y, rand(farm.y + 16, farm.y + farm.h - 16)),
        farm.y + 10,
        farm.y + farm.h - 10
      ),
      r: clamp(safeNumber(food?.r, 10), 7, 14)
    };
  }

  function normalizePoop(poop) {
    return {
      x: clamp(
        safeNumber(poop?.x, rand(farm.x + 16, farm.x + farm.w - 16)),
        farm.x + 10,
        farm.x + farm.w - 10
      ),
      y: clamp(
        safeNumber(poop?.y, rand(farm.y + 16, farm.y + farm.h - 16)),
        farm.y + 10,
        farm.y + farm.h - 10
      ),
      size: clamp(safeNumber(poop?.size, 10), 7, 14),
      createdAt: safeNumber(poop?.createdAt, Date.now())
    };
  }

  function normalizePig(rawPig, fallbackId) {
    const pig = {
      id: Math.max(1, Math.floor(safeNumber(rawPig?.id, fallbackId))),
      name: typeof rawPig?.name === "string" ? rawPig.name : `Pig ${fallbackId}`,
      x: clamp(
        safeNumber(rawPig?.x, rand(farm.x + 50, farm.x + farm.w - 50)),
        farm.x + 16,
        farm.x + farm.w - 16
      ),
      y: clamp(
        safeNumber(rawPig?.y, rand(farm.y + 50, farm.y + farm.h - 50)),
        farm.y + 16,
        farm.y + farm.h - 16
      ),
      targetX: clamp(
        safeNumber(rawPig?.targetX, rand(farm.x + 30, farm.x + farm.w - 30)),
        farm.x + 16,
        farm.x + farm.w - 16
      ),
      targetY: clamp(
        safeNumber(rawPig?.targetY, rand(farm.y + 30, farm.y + farm.h - 30)),
        farm.y + 16,
        farm.y + farm.h - 16
      ),
      vx: safeNumber(rawPig?.vx, 0),
      vy: safeNumber(rawPig?.vy, 0),
      wanderTimer: safeNumber(rawPig?.wanderTimer, rand(2, 6)),
      hunger: clamp(safeNumber(rawPig?.hunger, 20), 0, 100),
      ageMinutes: Math.max(0, safeNumber(rawPig?.ageMinutes, 0)),
      growthBonus: Math.max(0, safeNumber(rawPig?.growthBonus, 0)),
      feedCount: Math.max(0, Math.floor(safeNumber(rawPig?.feedCount, 0))),
      lastFedAt: Number.isFinite(rawPig?.lastFedAt) ? rawPig.lastFedAt : -1,
      digestion: Array.isArray(rawPig?.digestion)
        ? rawPig.digestion.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
        : [],
      variant: clampInt(safeNumber(rawPig?.variant, 0), 0, 2),
      animOffset: safeNumber(rawPig?.animOffset, rand(0, 9999)),
      stage: "Baby",
      size: 15,
      moveSpeed: 34
    };

    applyStage(pig);
    return pig;
  }

  // -----------------------------------
  // Persistence / offline catch-up
  // -----------------------------------
  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage read failed:", error);
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  }

  function persistNow() {
    syncToNow(false);
    world.savedAt = Date.now();
    safeStorageSet(SAVE_KEY, JSON.stringify(world));
    lastAutoSaveAt = Date.now();
  }

  function syncToNow(announce) {
    const now = Date.now();

    if (!Number.isFinite(world.lastUpdateAt)) {
      world.lastUpdateAt = now;
      return 0;
    }

    let elapsed = now - world.lastUpdateAt;

    if (elapsed <= 0) {
      world.lastUpdateAt = now;
      return 0;
    }

    if (elapsed > MAX_OFFLINE_MS) {
      simulateWorld(MAX_OFFLINE_MS);
      world.lastUpdateAt = now;

      if (announce) {
        offlineInfo = `Applied ${formatDuration(MAX_OFFLINE_MS)} of offline progress (cap reached).`;
      }
      return MAX_OFFLINE_MS;
    }

    simulateWorld(elapsed);

    if (announce && elapsed > 2000) {
      offlineInfo = `Applied ${formatDuration(elapsed)} of offline progress.`;
    }

    return elapsed;
  }

  function simulateWorld(elapsedMs) {
    if (elapsedMs <= 0) return;

    const stepMs = chooseSimulationStepMs(elapsedMs);
    const end = world.lastUpdateAt + elapsedMs;
    let current = world.lastUpdateAt;

    while (current < end) {
      const chunk = Math.min(stepMs, end - current);
      stepWorld(chunk, current, current + chunk);
      current += chunk;
    }

    world.lastUpdateAt = end;
  }

  function chooseSimulationStepMs(totalMs) {
    if (totalMs <= 1000 * 60 * 60) return 1000;
    if (totalMs <= 1000 * 60 * 60 * 12) return 5000;
    if (totalMs <= 1000 * 60 * 60 * 24 * 2) return 15000;
    if (totalMs <= 1000 * 60 * 60 * 24 * 7) return 30000;
    return 120000;
  }

  // -----------------------------------
  // Simulation
  // -----------------------------------
  function stepWorld(dtMs, stepStart, stepEnd) {
    prepareHerdingLeaders();
    for (const pig of world.pigs) {
      updatePig(pig, dtMs, stepStart, stepEnd);
    }
  }

  function updatePig(pig, dtMs, stepStart, stepEnd) {
    const dtSec = dtMs / 1000;
    const dtMin = dtMs / 60000;

    pig.ageMinutes += dtMin;
    pig.hunger = clamp(pig.hunger + dtMin * CONFIG.HUNGER_GAIN_PER_MIN, 0, 100);
    applyStage(pig);

    if (dragState && dragState.pigId === pig.id) {
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      return;
    }

    if (isPigSellPending(pig)) {
      pig.x = 825;
      pig.y = 210;
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      return
    }

    const behavior = getPigHungerBehavior(pig);
    pig.moveSpeed = Math.floor(pig.moveSpeed * behavior.speed);
    const nearbyFood = nearestFood(pig, behavior.foodRange);

    if (behavior.mode === "resting") {
      pig.targetX = pig.x;
      pig.targetY = pig.y;
    } else if (nearbyFood) {
      pig.targetX = nearbyFood.food.x;
      pig.targetY = nearbyFood.food.y;
    } else if (behavior.mode === "herding") {
      const leaderId = herdLeaderByPigId.get(pig.id);
      const leader = leaderId
        ? world.pigs.find((item) => item.id === leaderId)
        : null;

      if (leader) {
        pig.wanderTimer -= dtSec;

        const targetTooFarFromLeader =
          distance(pig.targetX, pig.targetY, leader.x, leader.y) > 90;

        if (
          pig.wanderTimer <= 0 ||
          distance(pig.x, pig.y, pig.targetX, pig.targetY) < 10 ||
          targetTooFarFromLeader
        ) {
          chooseHerdTargetAroundPig(pig, leader);
        }
      } else {
        pig.wanderTimer -= dtSec;
        if (pig.wanderTimer <= 0 || distance(pig.x, pig.y, pig.targetX, pig.targetY) < 10) {
          chooseWanderTarget(pig);
        }
      }
    } else {
      pig.wanderTimer -= dtSec;
      if (pig.wanderTimer <= 0 || distance(pig.x, pig.y, pig.targetX, pig.targetY) < 10) {
        chooseWanderTarget(pig);
      }
    }

    movePig(pig, dtSec);

    for (let i = world.foods.length - 1; i >= 0; i -= 1) {
      const food = world.foods[i];
      if (distance(pig.x, pig.y, food.x, food.y) <= pig.size + food.r + 4) {
        world.foods.splice(i, 1);
        feedPig(pig, food.type, stepEnd);
        break;
      }
    }

    const futureDigest = [];
    for (const dueAt of pig.digestion) {
      if (dueAt <= stepEnd) {
        createPoopNearPig(pig, dueAt);
      } else {
        futureDigest.push(dueAt);
      }
    }
    pig.digestion = futureDigest;
  }

  function isPigOnTruck(pig) {
    const nearestX = clamp(pig.x, truck.x, truck.x + truck.w);
    const nearestY = clamp(pig.y, truck.y, truck.y + truck.h);
    return distance(pig.x, pig.y, nearestX, nearestY) <= pig.size;
  }

  function setCardVisualMode(mode) {
    buildingCardEl.classList.remove("pig-info-card", "sell-confirm-card", "jimusho-manage-card");

    if (mode === "pig") {
      buildingCardEl.classList.add("pig-info-card");
    } else if (mode === "sellConfirm") {
      buildingCardEl.classList.add("sell-confirm-card");
    } else if (mode === "jimusho") {
      buildingCardEl.classList.add("jimusho-manage-card");
    }
  }

  function positionCardToCanvasCenter() {
    const rect = canvas.getBoundingClientRect();
    buildingCardEl.style.left = `${rect.left + rect.width / 2}px`;
    buildingCardEl.style.top = `${rect.top + rect.height / 2}px`;
    buildingCardEl.style.right = "auto";
    buildingCardEl.style.bottom = "auto";
  }

  function openSellConfirmPanel(pigId) {
    const pig = world.pigs.find((item) => item.id === pigId);
    if (!pig) return;

    sellConfirmPigId = pigId;
    openPanel = "sellConfirm";

    setCardVisualMode("sellConfirm");
    positionCardToCanvasCenter();

    buildingCardEl.classList.add("show");
    cardScrimEl.classList.add("show");
    buildingCardEl.setAttribute("aria-hidden", "false");

    updateHud();
    render();
  }

  function movePig(pig, dtSec) {
    const dx = pig.targetX - pig.x;
    const dy = pig.targetY - pig.y;
    const len = Math.hypot(dx, dy);

    if (len < 0.001) {
      pig.vx = 0;
      pig.vy = 0;
      return;
    }

    const speed = pig.moveSpeed;
    const travel = Math.min(speed * dtSec, len);

    const startX = pig.x;
    const startY = pig.y;

    // base direction: toward target
    let dirX = dx / len;
    let dirY = dy / len;

    // soft avoidance: steer away from nearby pigs
    let avoidX = 0;
    let avoidY = 0;

    for (const other of world.pigs) {
      if (other === pig) continue;

      const ox = pig.x - other.x;
      const oy = pig.y - other.y;
      const d = Math.hypot(ox, oy);

      const avoidRadius = pig.size + other.size + 20;
      if (d > 0.001 && d < avoidRadius) {
        const strength = (avoidRadius - d) / avoidRadius;
        avoidX += (ox / d) * strength;
        avoidY += (oy / d) * strength;
      }
    }

    // mix target direction + avoidance
    dirX += avoidX * 1.35;
    dirY += avoidY * 1.35;

    const mixedLen = Math.hypot(dirX, dirY);
    if (mixedLen > 0.001) {
      dirX /= mixedLen;
      dirY /= mixedLen;
    } else {
      dirX = dx / len;
      dirY = dy / len;
    }

    pig.x += dirX * travel;
    pig.y += dirY * travel;

    pig.x = clamp(pig.x, farm.x + pig.size, farm.x + farm.w - pig.size);
    pig.y = clamp(pig.y, farm.y + pig.size, farm.y + farm.h - pig.size);

    // final overlap cleanup
    for (let pass = 0; pass < 2; pass += 1) {
      for (const other of world.pigs) {
        if (other === pig) continue;

        let ox = pig.x - other.x;
        let oy = pig.y - other.y;
        let d = Math.hypot(ox, oy);
        const minDist = pig.size + other.size + 2;

        if (d < minDist) {
          if (d < 0.001) {
            const angle = ((pig.id * 37 + other.id * 17) % 360) * Math.PI / 180;
            ox = Math.cos(angle);
            oy = Math.sin(angle);
            d = 1;
          }

          const push = minDist - d;
          pig.x += (ox / d) * push;
          pig.y += (oy / d) * push;

          pig.x = clamp(pig.x, farm.x + pig.size, farm.x + farm.w - pig.size);
          pig.y = clamp(pig.y, farm.y + pig.size, farm.y + farm.h - pig.size);
        }
      }
    }

    pig.vx = dtSec > 0 ? (pig.x - startX) / dtSec : 0;
    pig.vy = dtSec > 0 ? (pig.y - startY) / dtSec : 0;
  }


  function nearestFood(pig, maxDist = Infinity) {
    if (!world.foods.length) return null;

    let bestFood = null;
    let bestDist = maxDist;

    for (const food of world.foods) {
      const d = distance(pig.x, pig.y, food.x, food.y);
      if (d < bestDist) {
        bestDist = d;
        bestFood = food;
      }
    }

    return bestFood ? { food: bestFood, dist: bestDist } : null;
  }

  function chooseWanderTarget(pig) {
    pig.targetX = rand(farm.x + 30, farm.x + farm.w - 30);
    pig.targetY = rand(farm.y + 30, farm.y + farm.h - 30);
    pig.wanderTimer = rand(3, 8);
  }

  function feedPig(pig, foodType, fedAtMs) {
    const config = FOOD_TYPES[foodType] || FOOD_TYPES.mix;
    const fedRecently =
      pig.lastFedAt > 0 && fedAtMs - pig.lastFedAt <= CONFIG.FREQUENT_FEED_WINDOW_MS;

    pig.hunger = Math.max(0, pig.hunger - config.hungerRelief);
    pig.feedCount += 1;
    pig.growthBonus += CONFIG.GROWTH_PER_FEED_BASE + config.growthBonus;

    if (fedRecently) {
      pig.growthBonus += CONFIG.GROWTH_BONUS_FREQUENT;
    }

    pig.lastFedAt = fedAtMs;
    pig.digestion.push(fedAtMs + rand(30, 120) * 60 * 1000);
    pig.digestion.sort((a, b) => a - b);
    applyStage(pig);
  }

  function createPoopNearPig(pig, createdAt) {
    const angle = rand(0, Math.PI * 2);
    const gap = pig.size + 10;

    world.poops.push({
      x: clamp(pig.x + Math.cos(angle) * gap, farm.x + 12, farm.x + farm.w - 12),
      y: clamp(pig.y + Math.sin(angle) * gap, farm.y + 12, farm.y + farm.h - 12),
      size: rand(8, 12),
      createdAt
    });
  }

  function applyStage(pig) {
    const stage = getGrowthStage(pig);
    pig.stage = stage.name;
    pig.size = stage.size;
    pig.moveSpeed = stage.speed;
  }

  function getGrowthStage(pig) {
    const score = pig.ageMinutes + pig.growthBonus;

    if (score < 60) return { name: "Baby", size: 15, speed: 34 };
    if (score < 240) return { name: "Young", size: 20, speed: 38 };
    if (score < 720) return { name: "Adult", size: 26, speed: 35 };
    if (score < 1440) return { name: "Old", size: 30, speed: 28 };
    return { name: "Old Old", size: 34, speed: 22 };
  }

  // -----------------------------------
  // Economy / actions
  // -----------------------------------
  function getBuyPigPrice() {
    return 35 + Math.max(0, world.pigs.length - 2) * 9;
  }

  function getPigSellPrice(pig) {
    const stageBase = {
      Baby: 18,
      Young: 36,
      Adult: 92,
      Old: 78,
      "Old Old": 58
    };

    return Math.max(
      15,
      Math.round(
        stageBase[pig.stage] +
        pig.feedCount * 2 +
        Math.min(28, pig.growthBonus * 0.08)
      )
    );
  }

  function canSellPig(pig) {
    return STAGE_ORDER.indexOf(pig.stage) >= STAGE_ORDER.indexOf("Adult");
  }

  function buyPig() {
    const price = getBuyPigPrice();

    if (world.pigs.length >= CONFIG.MAX_PIGS) {
      offlineInfo = `Pig limit reached (${CONFIG.MAX_PIGS}).`;
      return false;
    }

    if (world.money < price) {
      offlineInfo = "Not enough money to buy a pig.";
      return false;
    }

    world.money -= price;
    const pig = createPig(nextPigName(), world.nextPigId++);
    world.pigs.push(pig);
    offlineInfo = `Bought ${pig.name} for $${price}.`;
    return true;
  }

  function isPigSellPending(pig) {
    return openPanel === "sellConfirm" && sellConfirmPigId === pig.id;
  }

  function sellPigById(pigId) {
    const pig = world.pigs.find((item) => item.id === pigId);
    if (!pig) {
      offlineInfo = "Pig not found.";
      return false;
    }

    if (!canSellPig(pig)) {
      offlineInfo = `${pig.name} is not Adult yet.`;
      return false;
    }

    const value = getPigSellPrice(pig);
    world.money += value;
    world.pigs = world.pigs.filter((item) => item.id !== pig.id);

    if (selectedPigId === pig.id) {
      selectedPigId = null;
    }
    if (sellConfirmPigId === pig.id) {
      sellConfirmPigId = null;
    }

    offlineInfo = `Sold ${pig.name} for $${value}.`;
    return true;
  }

  function buyFoodPack(foodId) {
    const food = FOOD_TYPES[foodId];
    if (!food) return false;

    if (world.money < food.packCost) {
      offlineInfo = "Not enough money.";
      return false;
    }

    world.money -= food.packCost;
    world.foodStock[foodId] = (world.foodStock[foodId] || 0) + food.packQty;
    offlineInfo = `Bought ${food.packQty} ${food.name} for $${food.packCost}.`;
    return true;
  }

  function getPigHungerBehavior(pig) {
    if (pig.hunger < 5) { return { mode: "resting", speed: 0, foodRange: 0 } };
    if (pig.hunger < 40) { return { mode: "herding", speed: 1.4, foodRange: 90 } };
    if (pig.hunger < 70) { return { mode: "foraging", speed: 1.1, foodRange: 220 } };
    return { mode: "starving", speed: 0.8, foodRange: 150 };
  }

  function nearestPig(pig, maxDist = Infinity) {
    let bestPig = null;
    let bestDist = maxDist;

    for (const other of world.pigs) {
      if (other === pig) continue;

      const d = distance(pig.x, pig.y, other.x, other.y);
      if (d < bestDist) {
        bestDist = d;
        bestPig = other;
      }
    }

    return bestPig ? { pig: bestPig, dist: bestDist } : null;
  }

  function prepareHerdingLeaders() {
    herdLeaderByPigId.clear();
    herdLeaderIds.clear();

    const herdingPigs = world.pigs
      .filter((pig) => getPigHungerBehavior(pig).mode === "herding")
      .slice()
      .sort((a, b) => {
        if (a.ageMinutes !== b.ageMinutes) {
          return a.ageMinutes - b.ageMinutes; // younger first
        }
        return a.id - b.id;
      });

    for (const pig of herdingPigs) {
      // if another pig already chose this pig as a leader,
      // this pig will not follow another pig
      if (herdLeaderIds.has(pig.id)) {
        continue;
      }

      const leader = findNearestOlderPig(pig);
      if (!leader) continue;

      herdLeaderByPigId.set(pig.id, leader.id);
      herdLeaderIds.add(leader.id);
    }
  }

  function findNearestOlderPig(pig) {
    let bestPig = null;
    let bestDist = Infinity;

    for (const other of world.pigs) {
      if (other === pig) continue;
      if (other.ageMinutes <= pig.ageMinutes) continue; // only older pigs

      const d = distance(pig.x, pig.y, other.x, other.y);
      if (d < bestDist) {
        bestDist = d;
        bestPig = other;
      }
    }

    return bestPig;
  }

  function chooseHerdTargetAroundPig(pig, leader) {
    const angle = rand(0, Math.PI * 2);
    const radius = pig.size + leader.size + rand(18, 56);

    pig.targetX = clamp(
      leader.x + Math.cos(angle) * radius,
      farm.x + pig.size,
      farm.x + farm.w - pig.size
    );

    pig.targetY = clamp(
      leader.y + Math.sin(angle) * radius,
      farm.y + pig.size,
      farm.y + farm.h - pig.size
    );

    pig.wanderTimer = rand(1.2, 3.0);
  }

  function chooseFollowPigTarget(pig, leader) {
    const angle = ((pig.id * 53 + leader.id * 17) % 360) * Math.PI / 180;
    const radius = pig.size + leader.size + 18;

    pig.targetX = clamp(
      leader.x + Math.cos(angle) * radius,
      farm.x + pig.size,
      farm.x + farm.w - pig.size
    );

    pig.targetY = clamp(
      leader.y + Math.sin(angle) * radius,
      farm.y + pig.size,
      farm.y + farm.h - pig.size
    );
  }

  function placeSelectedFood(x, y) {
    const type = world.selectedFoodType;
    const stock = world.foodStock[type] || 0;
    const food = FOOD_TYPES[type];

    if (!food) {
      offlineInfo = "No food selected.";
      return false;
    }

    if (stock <= 0) {
      offlineInfo = `${food.name} is out of stock. Click the office to buy more.`;
      return false;
    }

    world.foods.push({
      type,
      x: clamp(x, farm.x + 10, farm.x + farm.w - 10),
      y: clamp(y, farm.y + 10, farm.y + farm.h - 10),
      r: rand(8, 11)
    });

    world.foodStock[type] -= 1;
    offlineInfo = `Placed 1 ${food.name}.`;
    return true;
  }

  function sellPoopAt(x, y) {
    for (let i = world.poops.length - 1; i >= 0; i -= 1) {
      const poop = world.poops[i];
      if (distance(x, y, poop.x, poop.y) <= poop.size + 12) {
        world.poops.splice(i, 1);
        world.money += CONFIG.POOP_SELL_PRICE;
        offlineInfo = `Sold poop for $${CONFIG.POOP_SELL_PRICE}.`;
        return true;
      }
    }
    return false;
  }

  function nextPigName() {
    const used = new Set(world.pigs.map((p) => p.name));
    const base = pick(BASE_NAMES);

    if (!used.has(base)) return base;

    let n = 2;
    let candidate = `${base} ${n}`;
    while (used.has(candidate)) {
      n += 1;
      candidate = `${base} ${n}`;
    }
    return candidate;
  }

  // -----------------------------------
  // Canvas interactions
  // -----------------------------------
  function onCanvasPointerDown(event) {
    event.preventDefault();
    syncToNow(false);

    const { x, y } = getCanvasPointerPosition(event);

    const pig = pointInRect(x, y, farm) ? findPigAt(x, y) : null;
    if (pig) {
      dragState = {
        pointerId: event.pointerId,
        pigId: pig.id,
        startX: x,
        startY: y,
        offsetX: pig.x - x,
        offsetY: pig.y - y,
        moved: false,
        lastAt: Date.now()
      };

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) { }

      return;
    }

    if (pointInRect(x, y, jimusho)) {
      togglePanel("jimusho");
      return;
    }

    if (sellPoopAt(x, y)) {
      persistNow();
      updateHud();
      render();
      return;
    }

    if (pointInRect(x, y, farm)) {
      placeSelectedFood(x, y);
      persistNow();
      updateHud();
      render();
    }
  }

  function getCanvasPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function findPigAt(x, y) {
    for (let i = world.pigs.length - 1; i >= 0; i -= 1) {
      const pig = world.pigs[i];

      const dx = x - pig.x;
      const dy = y - (pig.y - pig.size * 0.15);
      const rx = pig.size * 1.15;
      const ry = pig.size * 0.95;

      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.25) {
        return pig;
      }
    }
    return null;
  }

  function dragPigToPointer(pig, x, y) {
    if (!dragState) return;

    const now = Date.now();
    const dtSec = Math.max(0.001, (now - dragState.lastAt) / 1000);

    const nextX = clamp(
      x + dragState.offsetX,
      farm.x + pig.size,
      farm.x + farm.w - pig.size
    );
    const nextY = clamp(
      y + dragState.offsetY,
      farm.y + pig.size,
      farm.y + farm.h - pig.size
    );

    pig.vx = (nextX - pig.x) / dtSec;
    pig.vy = (nextY - pig.y) / dtSec;

    pig.x = nextX;
    pig.y = nextY;

    separatePigFromOthers(pig);

    pig.targetX = pig.x;
    pig.targetY = pig.y;

    dragState.lastAt = now;
  }

  function separatePigFromOthers(pig) {
    for (let pass = 0; pass < 3; pass += 1) {
      for (const other of world.pigs) {
        if (other === pig) continue;

        let dx = pig.x - other.x;
        let dy = pig.y - other.y;
        let d = Math.hypot(dx, dy);
        const minDist = pig.size + other.size + 2;

        if (d < minDist) {
          if (d < 0.001) {
            const angle = ((pig.id * 37 + other.id * 17) % 360) * Math.PI / 180;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            d = 1;
          }

          const push = minDist - d;
          pig.x += (dx / d) * push;
          pig.y += (dy / d) * push;

          pig.x = clamp(pig.x, farm.x + pig.size, farm.x + farm.w - pig.size);
          pig.y = clamp(pig.y, farm.y + pig.size, farm.y + farm.h - pig.size);
        }
      }
    }
  }

  function positionPigNoteToCanvas() {
    const canvasRect = canvas.getBoundingClientRect();
    const noteRect = buildingCardEl.getBoundingClientRect();
    const margin = 12;

    const centerX = canvasRect.right - margin - noteRect.width / 2;
    const centerY = canvasRect.bottom - margin - noteRect.height / 2;

    buildingCardEl.style.left = `${centerX}px`;
    buildingCardEl.style.top = `${centerY}px`;
    buildingCardEl.style.right = "auto";
    buildingCardEl.style.bottom = "auto";
  }

  function clearCardFixedPosition() {
    buildingCardEl.style.left = "";
    buildingCardEl.style.top = "";
    buildingCardEl.style.right = "";
    buildingCardEl.style.bottom = "";
  }

  function openPigPanel(pigId) {
    const pig = world.pigs.find((item) => item.id === pigId);
    if (!pig) return;

    selectedPigId = pigId;
    sellConfirmPigId = null;
    openPanel = "pig";

    setCardVisualMode("pig");
    positionPigNoteToCanvas();

    buildingCardEl.classList.add("show");
    cardScrimEl.classList.add("show");
    buildingCardEl.setAttribute("aria-hidden", "false");

    updateHud();
    render();
  }

  function onCardBodyClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    syncToNow(false);

    const action = button.dataset.action;
    let changed = false;
    let shouldClose = false;

    if (action === "buy-pig") {
      changed = buyPig();
    } else if (action === "sell-pig") {
      changed = sellPigById(Number(button.dataset.pigId));
    } else if (action === "buy-food") {
      changed = buyFoodPack(button.dataset.food);
    } else if (action === "select-food") {
      const foodId = button.dataset.food;
      if (FOOD_TYPES[foodId]) {
        world.selectedFoodType = foodId;
        offlineInfo = `${FOOD_TYPES[foodId].name} selected.`;
        changed = true;
      }
    } else if (action === "confirm-sell") {
      changed = sellPigById(Number(button.dataset.pigId));
      shouldClose = true;
    } else if (action === "cancel-sell") {
      offlineInfo = "Sale canceled";
      shouldClose = true;
    }

    if (shouldClose) {
      closePanelCard();
    }

    if (changed) {
      persistNow();
    }

    updateHud();
    render();
  }

  function togglePanel(type) {
    if (openPanel === type) {
      closePanelCard();
      return;
    }

    if (type === "jimusho") {
      selectedPigId = null;
      sellConfirmPigId = null;
      setCardVisualMode("jimusho");
      clearCardFixedPosition();
    } else {
      setCardVisualMode(null);
      clearCardFixedPosition();
    }

    openPanel = type;
    buildingCardEl.classList.add("show");
    cardScrimEl.classList.add("show");
    buildingCardEl.setAttribute("aria-hidden", "false");

    updateHud();
    render();
  }

  function closePanelCard() {
    const hadCustomMode =
      buildingCardEl.classList.contains("pig-info-card") ||
      buildingCardEl.classList.contains("sell-confirm-card") ||
      buildingCardEl.classList.contains("jimusho-manage-card");

    openPanel = null;
    selectedPigId = null;
    sellConfirmPigId = null;

    buildingCardEl.classList.remove("show");
    cardScrimEl.classList.remove("show");
    buildingCardEl.setAttribute("aria-hidden", "true");

    cardTitleEl.textContent = "";
    cardSubtitleEl.textContent = "";
    cardBodyEl.innerHTML = "";

    if (hadCustomMode) {
      const onEnd = (event) => {
        if (event.target !== buildingCardEl) return;
        buildingCardEl.removeEventListener("transitionend", onEnd);

        if (!openPanel) {
          setCardVisualMode(null);
          clearCardFixedPosition();
        }
      };

      buildingCardEl.addEventListener("transitionend", onEnd);
    } else {
      setCardVisualMode(null);
      clearCardFixedPosition();
    }

    updateHud();
    render();
  }

  function onCanvasPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    event.preventDefault();
    syncToNow(false);

    const pig = world.pigs.find((item) => item.id === dragState.pigId);
    if (!pig) {
      dragState = null;
      return;
    }

    const { x, y } = getCanvasPointerPosition(event);

    if (!dragState.moved && distance(x, y, dragState.startX, dragState.startY) > 6) {
      dragState.moved = true;
    }

    dragPigToPointer(pig, x, y);
    render();
  }

  function onCanvasPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    event.preventDefault();
    syncToNow(false);

    const pig = world.pigs.find((item) => item.id === dragState.pigId);
    const { x, y } = getCanvasPointerPosition(event);
    const wasMoved = dragState.moved;

    if (pig) {
      if (wasMoved) {
        dragPigToPointer(pig, x, y);
        pig.vx = 0;
        pig.vy = 0;
        pig.targetX = pig.x;
        pig.targetY = pig.y;

        if (isPigOnTruck(pig)) {
          try {
            canvas.releasePointerCapture(event.pointerId);
          } catch (error) { }

          dragState = null;
          openSellConfirmPanel(pig.id);
          return;
        }

        offlineInfo = `${pig.name} moved.`;
        persistNow();
      } else {
        pig.vx = 0;
        pig.vy = 0;
        pig.targetX = pig.x;
        pig.targetY = pig.y;
        openPigPanel(pig.id);
      }
    }

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) { }

    dragState = null;
    updateHud();
    render();
  }

  function onCanvasPointerCancel(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const pig = world.pigs.find((item) => item.id === dragState.pigId);
    if (pig) {
      pig.vx = 0;
      pig.vy = 0;
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      separatePigFromOthers(pig);
    }

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) { }

    dragState = null;
    updateHud();
    render();
  }

  // -----------------------------------
  // UI rendering
  // -----------------------------------
  function updateHud() {
    renderActiveCard();
  }

  function renderActiveCard() {
    if (!openPanel) {
      cardTitleEl.textContent = "";
      cardSubtitleEl.textContent = "";
      cardBodyEl.innerHTML = "";
      return;
    }

    if (openPanel === "jimusho") {
      cardTitleEl.textContent = "Farm Office";
      cardSubtitleEl.textContent = "Check farm status, buy/sell food and pigs.";
      cardBodyEl.innerHTML = renderJimushoCardHtml();
      return;
    }

    if (openPanel === "pig") {
      const pig = world.pigs.find((item) => item.id === selectedPigId);
      if (!pig) {
        cardTitleEl.textContent = "";
        cardSubtitleEl.textContent = "";
        cardBodyEl.innerHTML = "";
        return;
      }
      cardTitleEl.textContent = "";
      cardSubtitleEl.textContent = "";
      cardBodyEl.innerHTML = renderPigNoteHtml(pig);
      return;
    }

    if (openPanel === "sellConfirm") {
      const pig = world.pigs.find((item) => item.id === sellConfirmPigId);
      if (!pig) {
        cardTitleEl.textContent = "";
        cardSubtitleEl.textContent = "";
        cardBodyEl.innerHTML = "";
        return;
      }

      cardTitleEl.textContent = "";
      cardSubtitleEl.textContent = "";
      cardBodyEl.innerHTML = renderSellConfirmHtml(pig);
      return;
    }
  }

  function renderSellConfirmHtml(pig) {
    const sellable = canSellPig(pig);
    const price = getPigSellPrice(pig);

    return `
      <div class="sell-confirm-wrap">
        <div class="sell-confirm-text">
          ${sellable
        ? `Sell <strong>${escapeHtml(pig.name)}</strong> for <strong>$${price}</strong>?`
        : `<strong>${escapeHtml(pig.name)}</strong> cannot be sold yet. Adult required.`
      }
        </div>

        <div class="sell-confirm-actions">
          ${sellable
        ? `
                <button class="secondary" data-action="cancel-sell">No</button>
                <button class="danger" data-action="confirm-sell" data-pig-id="${pig.id}">Yes</button>
              `
        : `
                <button class="secondary" data-action="cancel-sell">OK</button>
              `
      }
        </div>
      </div>
    `;
  }

  function renderHousePigRow(pig) {
    const sellable = canSellPig(pig);
    const sellPrice = getPigSellPrice(pig);
    const nextPoopMs = pig.digestion.length
      ? Math.max(0, Math.min(...pig.digestion) - world.lastUpdateAt)
      : null;

    return `
      <div class="sheet-row">
        <div class="row-header">
          <div class="row-title">
            <strong>${escapeHtml(pig.name)}</strong>
            <span class="stage-chip">${pig.stage}</span>
          </div>
          <div class="price-tag">$${sellPrice}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="label">Age</span>
            ${formatMinutes(pig.ageMinutes)}
          </div>
          <div class="meta-item">
            <span class="label">Feed count</span>
            ${pig.feedCount}
          </div>
          <div class="meta-item">
            <span class="label">Last fed</span>
            ${pig.lastFedAt > 0 ? formatRelative(pig.lastFedAt) : "never"}
          </div>
        </div>

        <div class="meter-label">Hunger ${Math.round(pig.hunger)}%</div>
        <div class="progress">
          <span style="width:${Math.round(pig.hunger)}%"></span>
        </div>

        <div class="row-actions">
          <button
            class="${sellable ? "danger" : "ghost"}"
            data-action="sell-pig"
            data-pig-id="${pig.id}"
            ${sellable ? "" : "disabled"}
          >
            ${sellable ? `Sell (+$${sellPrice})` : "Adult required"}
          </button>
        </div>
      </div>
    `;
  }

  function getPigCardPhotoSrc() {
    return "./assets/pig_normal_adult.png";
  }

  function getPigCardPhotoWidth(pig) {
    // Adult(size 26) を基準に note 上の幅を決める
    // Baby は小さく、Old / Old Old は大きく見せる
    return clamp(Math.round(100 * (pig.size / 26)), 54, 118);
  }

  function renderPigNoteHtml(pig) {
    const nextPoopMs = pig.digestion.length
      ? Math.max(0, Math.min(...pig.digestion) - world.lastUpdateAt)
      : null;

    const hunger = Math.round(pig.hunger);
    const sellPrice = getPigSellPrice(pig);

    return `
      <div class="pig-note-layout">
        <div class="pig-note-left">
          <div class="pig-note-photo-box">
            <img
              class="pig-note-photo"
              src="${getPigCardPhotoSrc()}"
              alt="${escapeHtml(pig.name)}"
              style="width:${getPigCardPhotoWidth(pig)}px"
            >
            <div class="pig-note-name">${escapeHtml(pig.name)}</div>
          </div>

          <div class="pig-note-left-bottom">
            <div class="pig-note-mini">
              <span class="pig-note-mini-label">Stage</span>
              <strong>${pig.stage}</strong>
            </div>

            <div class="pig-note-mini">
              <span class="pig-note-mini-label">Age</span>
              <strong>${formatMinutes(pig.ageMinutes)}</strong>
            </div>
          </div>
        </div>

        <div class="pig-note-right">
          <div class="pig-note-row">
            <span class="pig-note-label">Hunger</span>
            <strong>${hunger}%</strong>
          </div>

          <div class="pig-note-meter">
            <span style="width:${hunger}%"></span>
          </div>

          <div class="pig-note-row">
            <span class="pig-note-label">Feed count</span>
            <strong>${pig.feedCount}</strong>
          </div>

          <div class="pig-note-row">
            <span class="pig-note-label">Growth bonus</span>
            <strong>${Math.round(pig.growthBonus)}</strong>
          </div>

          <div class="pig-note-row">
            <span class="pig-note-label">Last fed</span>
            <strong>${pig.lastFedAt > 0 ? formatRelative(pig.lastFedAt) : "never"}</strong>
          </div>

          <div class="pig-note-row">
            <span class="pig-note-label">Value</span>
            <strong>$${sellPrice}</strong>
          </div>

        </div>
      </div>
    `;
  }

  function renderPigCardHtml(pig) {
    const nextPoopMs = pig.digestion.length
      ? Math.max(0, Math.min(...pig.digestion) - world.lastUpdateAt)
      : null;

    const hunger = Math.round(pig.hunger);
    const sellPrice = getPigSellPrice(pig);

    return `
      <div class="sheet-top">
        <div class="summary-chip">Name: ${escapeHtml(pig.name)}</div>
        <div class="summary-chip">Stage: ${pig.stage}</div>
        <div class="summary-chip">ID: ${pig.id}</div>
        <div class="summary-chip">Value: $${sellPrice}</div>
      </div>

      <div class="sheet-row">
        <div class="meta-grid">
          <div class="meta-item">
            <span class="label">Age</span>
            ${formatMinutes(pig.ageMinutes)}
          </div>
          <div class="meta-item">
            <span class="label">Hunger</span>
            ${hunger}%
          </div>
          <div class="meta-item">
            <span class="label">Feed count</span>
            ${pig.feedCount}
          </div>
          <div class="meta-item">
            <span class="label">Growth bonus</span>
            ${Math.round(pig.growthBonus)}
          </div>
          <div class="meta-item">
            <span class="label">Last fed</span>
            ${pig.lastFedAt > 0 ? formatRelative(pig.lastFedAt) : "never"}
          </div>
          <div class="meta-item">
            <span class="label">Digestion queue</span>
            ${pig.digestion.length}
          </div>
          <div class="meta-item">
            <span class="label">Move speed</span>
            ${pig.moveSpeed}
          </div>
          <div class="meta-item">
            <span class="label">Target</span>
            ${Math.round(pig.targetX)}, ${Math.round(pig.targetY)}
          </div>
          <div class="meta-item">
            <span class="label">Variant</span>
            ${pig.variant}
          </div>
          <div class="meta-item">
            <span class="label">Can sell</span>
            ${canSellPig(pig) ? "yes" : "no"}
          </div>
        </div>

        <div class="meter-label">Hunger ${hunger}%</div>
        <div class="progress">
          <span style="width:${hunger}%"></span>
        </div>

        <p class="sheet-note">
          Click a pig to open this card.<br>
          Drag a pig anywhere in the farm to move it manually.
        </p>
      </div>
    `;
  }

  function renderJimushoCardHtml() {
    const selectedFood = FOOD_TYPES[world.selectedFoodType];
    const buyPrice = getBuyPigPrice();
    const buyDisabled =
      world.money < buyPrice || world.pigs.length >= CONFIG.MAX_PIGS ? "disabled" : "";

    return `
      <div class="sheet-top">
        <div class="summary-chip">Money: $${world.money}</div>
        <div class="summary-chip">Pigs: ${world.pigs.length}/${CONFIG.MAX_PIGS}</div>
        <div class="summary-chip">Poop: ${world.poops.length}</div>
        <div class="summary-chip">Saved: ${formatRelative(world.savedAt)}</div>
      </div>

      <div class="sheet-top">
        <div class="summary-chip">Selected: ${selectedFood.name}</div>
        <div class="summary-chip">Total stock: ${getTotalFoodStock()}</div>
        <div class="summary-chip">Buy pig: $${buyPrice}</div>
      </div>

      <button class="full-btn" data-action="buy-pig" ${buyDisabled}>
        Buy Pig (-$${buyPrice})
      </button>

      <p class="sheet-note">
        ここで farm 全体を管理できます。<br>
        food の購入 / 選択、pig の購入、Adult 以上の pig の売却ができます。
      </p>

      <p class="sheet-note"><strong>Food</strong></p>
      <div class="sheet-list">
        ${FOOD_IDS.map(renderJimushoFoodRow).join("")}
      </div>

      <p class="sheet-note"><strong>Pigs</strong></p>
      <div class="sheet-list">
        ${world.pigs.map(renderHousePigRow).join("")}
      </div>
    `;
  }

  function renderJimushoFoodRow(foodId) {
    const food = FOOD_TYPES[foodId];
    const isSelected = world.selectedFoodType === foodId;
    const buyDisabled = world.money < food.packCost ? "disabled" : "";

    return `
      <div class="sheet-row">
        <div class="row-header">
          <div class="row-title">
            <span class="food-swatch" style="background:${food.color}"></span>
            <strong>${food.name}</strong>
            ${isSelected ? `<span class="stage-chip">Selected</span>` : ""}
          </div>
          <div class="price-tag">Stock ${world.foodStock[foodId] || 0}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="label">Pack</span>
            ${food.packQty} items
          </div>
          <div class="meta-item">
            <span class="label">Pack price</span>
            $${food.packCost}
          </div>
          <div class="meta-item">
            <span class="label">Hunger relief</span>
            ${food.hungerRelief}
          </div>
          <div class="meta-item">
            <span class="label">Growth bonus</span>
            +${CONFIG.GROWTH_PER_FEED_BASE + food.growthBonus}
          </div>
        </div>

        <div class="row-actions">
          <button
            data-action="select-food"
            data-food="${food.id}"
            class="${isSelected ? "active" : "secondary"}"
          >
            ${isSelected ? "Selected" : "Select"}
          </button>

          <button
            data-action="buy-food"
            data-food="${food.id}"
            ${buyDisabled}
          >
            Buy ${food.packQty} (-$${food.packCost})
          </button>
        </div>
      </div>
    `;
  }

  function getTotalFoodStock() {
    return FOOD_IDS.reduce((sum, id) => sum + (world.foodStock[id] || 0), 0);
  }

  // -----------------------------------
  // Canvas rendering
  // -----------------------------------
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayer, 0, 0);

    drawMoneyStatus();

    if (openPanel === "jimusho") {
      drawBuildingHighlight(jimusho);
    }

    for (const food of world.foods) {
      drawFood(food);
    }

    for (const poop of world.poops) {
      drawPoop(poop);
    }

    for (const pig of world.pigs) {
      drawPig(pig);
    }
  }

  function drawMoneyStatus() {
    const x = 12;
    const y = 12;
    const iconSize = 32;

    if (moneyImage.complete && moneyImage.naturalWidth) {
      ctx.drawImage(moneyImage, x, y, iconSize, iconSize);
    }

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;

    const text = `${world.money}`;
    ctx.strokeText(text, x + iconSize + 30, y + 25);
    ctx.fillText(text, x + iconSize + 30, y + 25);
  }

  function drawBuildingHighlight(rect) {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  }

  function drawFood(food) {
    const tileId = sprites.tiles.ids[FOOD_TYPES[food.type].tileKey];
    drawShadow(food.x, food.y + 7, 12, 5, "rgba(0,0,0,0.16)");
    drawTileSpriteCentered(ctx, tileId, food.x, food.y, 22);
  }

  function drawPoop(poop) {
    drawShadow(poop.x, poop.y + 7, 12, 5, "rgba(0,0,0,0.18)");
    drawTileSpriteCentered(ctx, sprites.tiles.ids.poop, poop.x, poop.y, 22);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(poop.x, poop.y, poop.size + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  function getPigShadowColor(pig) {
    const stageIndex = Math.max(0, STAGE_ORDER.indexOf(pig.stage));
    const alpha = 0.10 + stageIndex * 0.04;
    return `rgba(0,0,0,${alpha.toFixed(2)})`;
  }

  function getPigRenderMotion(pig) {
    const isDragging = !!dragState && dragState.pigId === pig.id;
    const isSellPending = isPigSellPending(pig);
    const isResting = getPigHungerBehavior(pig).mode === "resting";
    const speedNow = Math.hypot(pig.vx, pig.vy);
    const moving = speedNow > 1;
    const t = (Date.now() + pig.animOffset) * 0.012;

    const sway = isDragging
      ? Math.sin(t * 1.35) * 0.3
      : moving
        ? Math.sin(t) * 0.05
        : 0;

    const bobY = isDragging
      ? Math.sin(t * 2.7) * 2.5
      : moving
        ? Math.sin(t * 2) * 1.5
        : 0;

    const markSway = isResting ? Math.sin(t * 1.2) * 0.16 : 0;

    return {
      isDragging,
      isSellPending,
      isResting,
      sway,
      bobY,
      markSway,
      t
    };
  }

  /*function drawPig(pig) {
    const isDragging = !!dragState && dragState.pigId === pig.id;
    const isSellPending = isPigSellPending(pig);
    const speedNow = Math.hypot(pig.vx, pig.vy);
    const moving = speedNow > 1;
    const t = (Date.now() + pig.animOffset) * 0.012;
    const sway = isDragging ? Math.sin(t * 1.35) * 0.3 : moving ? Math.sin(t) * 0.05 : 0;
    const bobY = isDragging ? Math.sin(t * 2.7) * 2.5 : moving ? Math.sin(t * 2) * 1.5 : 0;
    drawShadow(pig.x, pig.y + pig.size * 0.4, pig.size * 1.05, pig.size * 0.35, getPigShadowColor(pig));
    if (!pigImage.complete || !pigImage.naturalWidth) return;
    const aspect = pigImage.naturalWidth / pigImage.naturalHeight;
    const drawH = Math.round(pig.size * 2.4);
    const drawW = Math.round(drawH * aspect);
    const px = Math.round(pig.x);
    const py = Math.round(pig.y);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(px, py + bobY);
    ctx.rotate(sway);
    const facing = pig.vx < -0.5 ? 1 : -1;
    ctx.scale(facing, 1);
    ctx.drawImage(pigImage, Math.round(-drawW / 2), Math.round(-drawH * 0.7), drawW, drawH);
    ctx.restore();

    if (selectedPigId === pig.id && highlightImage.complete && highlightImage.naturalWidth) {
      const highlightW = Math.round(drawW * 0.6);
      const highlightH = Math.round(highlightW * (highlightImage.naturalHeight / highlightImage.naturalWidth));
      ctx.drawImage(highlightImage, Math.round(px - highlightW / 2), Math.round(py - drawH * 1.55), highlightW, highlightH);
    }
  }*/

  function drawPig(pig) {
    const motion = getPigRenderMotion(pig);
    const sway = motion.sway;
    const bobY = motion.bobY;
    const isResting = motion.isResting;
    const markSway = motion.markSway;
    drawShadow(pig.x, pig.y + pig.size * 0.4, pig.size * 1.05, pig.size * 0.35, getPigShadowColor(pig));

    if (!pigImage.complete || !pigImage.naturalWidth) return;

    const aspect = pigImage.naturalWidth / pigImage.naturalHeight;
    const drawH = Math.round(pig.size * 2.4);
    const drawW = Math.round(drawH * aspect);
    const px = Math.round(pig.x);
    const py = Math.round(pig.y);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(px, py + bobY);
    ctx.rotate(sway);

    //const facing = pig.vx < -0.5 ? 1 : -1;
    //ctx.scale(facing, 1);
    if (pig._facing !== 1 && pig._facing !== -1) {
      const initialDx = pig.targetX - pig.x;
      pig._facing = initialDx < 0 ? 1 : -1;
    }

    if (pig.vx < -0.5) {
      pig._facing = 1;
    } else if (pig.vx > 0.5) {
      pig._facing = -1;
    }
    ctx.scale(pig._facing, 1);
    ctx.drawImage(
      pigImage,
      Math.round(-drawW / 2),
      Math.round(-drawH * 0.7),
      drawW,
      drawH
    );
    ctx.restore();

    // sleep mark for resting pigs
    if (isResting && sleepMarkImage.complete && sleepMarkImage.naturalWidth) {
      const markW = Math.round(drawW * 0.55);
      const markH = Math.round(
        markW * (sleepMarkImage.naturalHeight / sleepMarkImage.naturalWidth)
      );

      const markX = px + pig.size * 1.85;
      const markY = py - drawH * 0.65;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.translate(Math.round(markX), Math.round(markY));
      ctx.rotate(markSway);
      ctx.drawImage(
        sleepMarkImage,
        Math.round(-markW / 2),
        Math.round(-markH / 2),
        markW,
        markH
      );
      ctx.restore();
    }

    if (selectedPigId === pig.id && highlightImage.complete && highlightImage.naturalWidth) {
      const highlightW = Math.round(drawW * 0.6);
      const highlightH = Math.round(
        highlightW * (highlightImage.naturalHeight / highlightImage.naturalWidth)
      );

      ctx.drawImage(
        highlightImage,
        Math.round(px - highlightW / 2),
        Math.round(py - drawH * 1.55),
        highlightW,
        highlightH
      );
    }
  }

  function buildBackgroundLayer() {
    const bg = document.createElement("canvas");
    bg.width = canvas.width;
    bg.height = canvas.height;
    const c = bg.getContext("2d");
    c.imageSmoothingEnabled = false;

    if (skyImage.complete && skyImage.naturalWidth) {
      c.drawImage(skyImage, 0, 0, bg.width, BACKGROUND_SPLIT_Y);
    } else {
      const sky = c.createLinearGradient(0, 0, 0, BACKGROUND_SPLIT_Y);
      sky.addColorStop(0, "#78c8ff");
      sky.addColorStop(1, "#dff4ff");
      c.fillStyle = sky;
      c.fillRect(0, 0, bg.width, BACKGROUND_SPLIT_Y);
    }

    if (farmBgImage.complete && farmBgImage.naturalWidth) {
      c.drawImage(farmBgImage, 0, BACKGROUND_SPLIT_Y, bg.width, bg.height - BACKGROUND_SPLIT_Y);
    }

    drawFence(c, farm);

    drawJimusho(c);

    return bg;
  }

  function drawJimusho(c) {
    if (!jimushoImage.complete || !jimushoImage.naturalWidth) { return };
    c.drawImage(jimushoImage, jimusho.x, jimusho.y, jimusho.w, jimusho.h);
    if (truckImage.complete && truckImage.naturalWidth) {
      c.save();
      c.translate(truck.x + truck.w, truck.y);
      c.scale(-1, 1);
      c.drawImage(truckImage, 0, 0, truck.w, truck.h);
      c.restore();
    };
  }

  function drawFence(c, rect) {
    if (!fenceImage.complete || !fenceImage.naturalWidth) {
      return;
    }
    const drawH = 72; // 好みで調整
    const drawW = Math.round(drawH * (fenceImage.naturalWidth / fenceImage.naturalHeight));
    // fence を sky と farm の境界に置く
    // 必要ならこの値を少し上下に調整
    const y = rect.y - Math.round(drawH * 0.55);
    const startX = rect.x;
    const endX = rect.x + rect.w;
    c.save();
    // farm 幅の中だけ描く
    c.beginPath();
    c.rect(startX, y, rect.w, drawH);
    c.clip();
    for (let x = startX; x < endX; x += drawW - 1) {
      c.drawImage(fenceImage, x, y, drawW, drawH);
    }
    c.restore();
  }

  function drawTiledRect(c, tileId, x, y, w, h, useGrassMix = false) {
    const size = sprites.tiles.size;
    const endX = x + w;
    const endY = y + h;

    for (let ty = y; ty < endY; ty += size) {
      for (let tx = x; tx < endX; tx += size) {
        let actualId = tileId;
        if (useGrassMix) {
          actualId =
            hash2D(Math.floor(tx / size), Math.floor(ty / size)) % 2 === 0
              ? sprites.tiles.ids.grassA
              : sprites.tiles.ids.grassB;
        }

        c.drawImage(
          sprites.tiles.canvas,
          actualId * size,
          0,
          size,
          size,
          tx,
          ty,
          size,
          size
        );
      }
    }
  }

  function drawTileSpriteCentered(c, tileId, x, y, drawSize) {
    const size = sprites.tiles.size;
    c.drawImage(
      sprites.tiles.canvas,
      tileId * size,
      0,
      size,
      size,
      x - drawSize / 2,
      y - drawSize / 2,
      drawSize,
      drawSize
    );
  }

  function drawShadow(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // -----------------------------------
  // Sprite sheets
  // -----------------------------------
  function createSprites() {
    return {
      tiles: createTileSheet()
    };
  }

  function createTileSheet() {
    const size = 24;
    const ids = {
      grassA: 0,
      grassB: 1,
      dirt: 2,
      foodMix: 3,
      foodPumpkin: 4,
      foodRoot: 5,
      poop: 6
    };

    const count = 10;
    const off = document.createElement("canvas");
    off.width = size * count;
    off.height = size;
    const c = off.getContext("2d");
    c.imageSmoothingEnabled = false;

    drawFeedMixTile(c, ids.foodMix * size, 0, size);
    drawPumpkinTile(c, ids.foodPumpkin * size, 0, size);
    drawPoopTile(c, ids.poop * size, 0, size);
    return { canvas: off, size, ids };
  }

  function drawFeedMixTile(c, ox, oy, size) {
    c.fillStyle = "#d59b24";
    c.fillRect(ox + 6, oy + 12, 12, 7);

    c.fillStyle = "#f2c24f";
    c.fillRect(ox + 5, oy + 10, 14, 5);

    c.fillStyle = "#7a4d0f";
    c.fillRect(ox + 7, oy + 8, 2, 2);
    c.fillRect(ox + 11, oy + 7, 2, 2);
    c.fillRect(ox + 15, oy + 8, 2, 2);
  }

  function drawPumpkinTile(c, ox, oy, size) {
    c.fillStyle = "#ef8c2d";
    c.beginPath();
    c.arc(ox + 12, oy + 13, 6, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#ca6c14";
    c.fillRect(ox + 9, oy + 8, 2, 9);
    c.fillRect(ox + 13, oy + 8, 2, 9);

    c.fillStyle = "#4d8f32";
    c.fillRect(ox + 11, oy + 5, 2, 4);
  }

  function drawPoopTile(c, ox, oy, size) {
    c.fillStyle = "#5d3c22";
    c.beginPath();
    c.arc(ox + 9, oy + 15, 4.5, 0, Math.PI * 2);
    c.arc(ox + 15, oy + 15, 4, 0, Math.PI * 2);
    c.arc(ox + 12, oy + 10, 4, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "rgba(255,255,255,0.1)";
    c.fillRect(ox + 9, oy + 9, 2, 2);
  }

  function drawWallTile(c, ox, oy, size) {
    c.fillStyle = "#8b5a33";
    c.fillRect(ox, oy, size, size);

    c.strokeStyle = "#6b4326";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(ox + 8, oy);
    c.lineTo(ox + 8, oy + size);
    c.moveTo(ox + 16, oy);
    c.lineTo(ox + 16, oy + size);
    c.stroke();

    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(ox, oy + 1, size, 2);
  }

  function drawRoofTile(c, ox, oy, size) {
    c.fillStyle = "#b84d39";
    c.fillRect(ox, oy, size, size);

    c.strokeStyle = "#8a3326";
    c.lineWidth = 2;
    for (let y = oy + 4; y < oy + size; y += 6) {
      c.beginPath();
      c.moveTo(ox, y);
      c.lineTo(ox + size, y);
      c.stroke();
    }
  }

  function drawHayTile(c, ox, oy, size) {
    c.fillStyle = "#e5c75e";
    c.fillRect(ox, oy, size, size);

    c.strokeStyle = "#9a7b1f";
    c.lineWidth = 1.5;
    for (let i = 2; i < size; i += 5) {
      c.beginPath();
      c.moveTo(ox + i, oy + 1);
      c.lineTo(ox + i - 2, oy + size - 2);
      c.stroke();
    }
  }

  // -----------------------------------
  // Helpers
  // -----------------------------------
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, Math.floor(value)));
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function safeNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function hash2D(x, y) {
    const n = (x * 73856093) ^ (y * 19349663);
    return Math.abs(n);
  }

  function formatMinutes(totalMinutes) {
    const mins = Math.max(0, Math.floor(totalMinutes));
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    const minutes = mins % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatDuration(ms) {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatDurationShort(ms) {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));

    if (totalMinutes < 60) return `${totalMinutes}m`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  function formatRelative(timestamp) {
    const diff = Math.max(0, Date.now() - timestamp);

    if (diff < 5000) return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();