(() => {
  const SAVE_KEY = "pig-farm-buildings-v4";
  const AUTO_SAVE_INTERVAL_MS = 5000;
  const MAX_OFFLINE_MS = 1000 * 60 * 60 * 24 * 14;

  const CONFIG = {
    HUNGER_GAIN_PER_MIN: 0.18,
    FREQUENT_FEED_WINDOW_MS: 1000 * 60 * 90,
    GROWTH_PER_FEED_BASE: 18,
    GROWTH_BONUS_FREQUENT: 28,
    POOP_SELL_PRICE: 3,
    MAX_PIGS: 20,
    MAX_COWS: 10,
    MAX_DUCKS: 40,
    MAX_CHICKENS: 40
  };

  const FOOD_TYPES = {
    corn: { id: "corn", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 },
    carrot: { id: "carrot", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 },
    cabbage: { id: "cabbage", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 },
    kabu: { id: "kabu", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 },
    sweetpotato: { id: "sweetpotato", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 },
    apple: { id: "apple", packQty: 5, packCost: 1, hungerRelief: 3, growthBonus: 3 }
  };

  const FOOD_IDS = Object.keys(FOOD_TYPES);

  const BASE_NAMES = [
    "Sunny", "Coco", "Mochi", "Poppy", "Daisy", "Toffee", "Button", "Pumpkin",
    "Cookie", "Maple", "Honey", "Muffin", "Maru", "Fuwa", "Olive", "Pearl",
    "Ruby", "Skippy", "Tutu", "Kiki", "Lala", "Pochi", "Mint", "Latte",
    "Mocha", "Popo", "Nana", "Mimi", "Ringo", "Sora", "Kuma", "Fifi",
    "Gigi", "Chibi", "Pudding", "Pickles", "Yuzu", "Plum", "Kiwi", "Melon",
    "Cherry", "Apricot", "Clover", "Snowy", "Bunny", "Pebble", "Fluffy",
    "Nugget", "Waffle", "Sesame"
  ];

  const STAGE_ORDER = ["Baby", "Young", "Adult", "Old", "Old Old"];

  const ANIMAL_COLLECTION_KEY = {
    pig: "pigs",
    cow: "cows",
    duck: "ducks",
    chicken: "chickens"
  };

  const ANIMAL_TYPES = {
    pig: {
      id: "pig",
      label: "Pig",
      maxCount: CONFIG.MAX_PIGS,
      buyBase: 35,
      buyStep: 9,
      spriteSrc: "./assets/pig_normal.png",
      drawHeightMul: 2.4,
      sellBase: {
        Baby: 18,
        Young: 36,
        Adult: 92,
        Old: 78,
        "Old Old": 58
      },
      stages: [
        { limit: 60, name: "Baby", size: 15, speed: 34 },
        { limit: 240, name: "Young", size: 20, speed: 38 },
        { limit: 720, name: "Adult", size: 26, speed: 35 },
        { limit: 1440, name: "Old", size: 30, speed: 28 },
        { limit: Infinity, name: "Old Old", size: 34, speed: 22 }
      ]
    },
    cow: {
      id: "cow",
      label: "Cow",
      maxCount: CONFIG.MAX_COWS,
      buyBase: 80,
      buyStep: 18,
      spriteSrc: "./assets/cow_normal.png",
      drawHeightMul: 2.7,
      sellBase: {
        Baby: 32,
        Young: 70,
        Adult: 180,
        Old: 150,
        "Old Old": 110
      },
      stages: [
        { limit: 120, name: "Baby", size: 30, speed: 28 },
        { limit: 480, name: "Young", size: 36, speed: 32 },
        { limit: 1440, name: "Adult", size: 42, speed: 30 },
        { limit: 2880, name: "Old", size: 45, speed: 24 },
        { limit: Infinity, name: "Old Old", size: 47, speed: 18 }
      ]
    },
    duck: {
      id: "duck",
      label: "Duck",
      maxCount: CONFIG.MAX_DUCKS,
      buyBase: 20,
      buyStep: 5,
      spriteSrc: "./assets/duck_normal.png",
      drawHeightMul: 2.1,
      sellBase: {
        Baby: 10,
        Young: 20,
        Adult: 42,
        Old: 36,
        "Old Old": 28
      },
      stages: [
        { limit: 60, name: "Baby", size: 12, speed: 42 },
        { limit: 240, name: "Young", size: 15, speed: 46 },
        { limit: 720, name: "Adult", size: 19, speed: 40 },
        { limit: 1440, name: "Old", size: 21, speed: 34 },
        { limit: Infinity, name: "Old Old", size: 23, speed: 28 }
      ]
    },
    chicken: {
      id: "chicken",
      label: "Chicken",
      maxCount: CONFIG.MAX_CHICKENS,
      buyBase: 16,
      buyStep: 4,
      spriteSrc: "./assets/chicken_normal.png",
      drawHeightMul: 2.0,
      sellBase: {
        Baby: 8,
        Young: 16,
        Adult: 34,
        Old: 30,
        "Old Old": 24
      },
      stages: [
        { limit: 60, name: "Baby", size: 11, speed: 40 },
        { limit: 240, name: "Young", size: 14, speed: 44 },
        { limit: 720, name: "Adult", size: 18, speed: 38 },
        { limit: 1440, name: "Old", size: 20, speed: 32 },
        { limit: Infinity, name: "Old Old", size: 22, speed: 26 }
      ]
    }
  };

  const ANIMAL_KINDS = Object.keys(ANIMAL_TYPES);

  const PIG_SUBKINDS = {
    normal: { id: "normal", label: "Normal Pig", spriteSrc: "./assets/pig_normal.png" },
    black: { id: "black", label: "Black Pig", spriteSrc: "./assets/pig_black.png" }
  };

  const COW_SUBKINDS = {
    normal: { id: "normal", label: "Normal Cow", spriteSrc: "./assets/cow_normal.png" },
    black: { id: "black", label: "Black Wagyu", spriteSrc: "./assets/cow_blackwagyu.png" },
    brown: { id: "brown", label: "Brown Wagyu", spriteSrc: "./assets/cow_brownwagyu.png" },
    buffalo: { id: "buffalo", label: "Buffalo", spriteSrc: "./assets/cow_buffalo.png" },
    bison: { id: "bison", label: "Bison Bison", spriteSrc: "./assets/cow_bison.png" },
    cow: { id: "cow", label: "Dairy Cow", spriteSrc: "./assets/cow_dairycow.png" }
  };

  const CHICKEN_SUBKINDS = {
    normal: { id: "normal", label: "Normal Chicken", spriteSrc: "./assets/chicken_normal.png" },
    brown: { id: "brown", label: "Brown Chicken", spriteSrc: "./assets/chicken_brown.png" },
    black: { id: "black", label: "Black Bone Chicken", spriteSrc: "./assets/chicken_ukokkei.png" }
  };

  const jimusho = { x: 10, y: 50, w: 330, h: 200 };
  const barn = { x: 380, y: 160, w: 180, h: 90 };
  const truck = { x: 800, y: 156, w: 138, h: 112 };
  const farm = { x: 0, y: 230, w: 960, h: 370 };

  const top_button = {
    money: 20,
    pig: 130,
    cow: 210,
    duck: 290,
    chicken: 370,
    corn: 480,
    carrot: 560,
    cabbage: 640,
    kabu: 720,
    sweetpotato: 800,
    apple: 880
  };

  const BACKGROUND_SPLIT_Y = 230;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const cardScrimEl = document.getElementById("cardScrim");
  const buildingCardEl = document.getElementById("buildingCard");
  const cardTitleEl = document.getElementById("cardTitle");
  const cardSubtitleEl = document.getElementById("cardSubtitle");
  const cardBodyEl = document.getElementById("cardBody");

  const sprites = createSprites();
  let backgroundLayer = null;

  const topMoneyImage = new Image();
  topMoneyImage.src = "./assets/logo_money.png";
  topMoneyImage.onload = () => render();
  topMoneyImage.onerror = () => console.error("Failed to load image: ./assets/logo_money.png");

  const topPigImage = new Image();
  topPigImage.src = "./assets/logo_pig.png";
  topPigImage.onload = () => render();
  topPigImage.onerror = () => console.error("Failed to load image: ./assets/logo_pig.png");

  const topCowImage = new Image();
  topCowImage.src = "./assets/logo_cow.png";
  topCowImage.onload = () => render();
  topCowImage.onerror = () => console.error("Failed to load image: ./assets/logo_cow.png");

  const topDuckImage = new Image();
  topDuckImage.src = "./assets/logo_duck.png";
  topDuckImage.onload = () => render();
  topDuckImage.onerror = () => console.error("Failed to load image: ./assets/logo_duck.png");

  const topChickenImage = new Image();
  topChickenImage.src = "./assets/logo_chicken.png";
  topChickenImage.onload = () => render();
  topChickenImage.onerror = () => console.error("Failed to load image: ./assets/logo_chicken.png");

  const cornImage = new Image();
  cornImage.src = "./assets/food_corn.png";
  cornImage.onload = () => render();
  cornImage.onerror = () => console.error("Failed to load image: ./assets/food_corn.png");

  const carrotImage = new Image();
  carrotImage.src = "./assets/food_carrot.png";
  carrotImage.onload = () => render();
  carrotImage.onerror = () => console.error("Failed to load image: ./assets/food_carrot.png");

  const cabbageImage = new Image();
  cabbageImage.src = "./assets/food_cabbage.png";
  cabbageImage.onload = () => render();
  cabbageImage.onerror = () => console.error("Failed to load image: ./assets/food_cabbage.png");

  const kabuImage = new Image();
  kabuImage.src = "./assets/food_kabu.png";
  kabuImage.onload = () => render();
  kabuImage.onerror = () => console.error("Failed to load image: ./assets/food_kabu.png");

  const sweetpotatoImage = new Image();
  sweetpotatoImage.src = "./assets/food_sweetpotato.png";
  sweetpotatoImage.onload = () => render();
  sweetpotatoImage.onerror = () => console.error("Failed to load image: ./assets/food_sweetpotato.png");

  const appleImage = new Image();
  appleImage.src = "./assets/food_apple.png";
  appleImage.onload = () => render();
  appleImage.onerror = () => console.error("Failed to load image: ./assets/food_apple.png");

  const highlightImage = new Image();
  highlightImage.src = "./assets/highlight_mark.png";
  highlightImage.onload = () => render();
  highlightImage.onerror = () => console.error("Failed to load image: ./assets/highlight_mark.png");

  const sleepMarkImage = new Image();
  sleepMarkImage.src = "./assets/sleep_mark.png";
  sleepMarkImage.onload = () => render();
  sleepMarkImage.onerror = () => console.error("Failed to load image: ./assets/sleep_mark.png");

  const truckImage = new Image();
  truckImage.src = "./assets/truck_kcar.png";
  truckImage.onload = () => render();
  truckImage.onerror = () => console.error("Failed to load image: ./assets/truck_kcar.png");

  const pigImages = {};
  for (const id of Object.keys(PIG_SUBKINDS)) {
    const img = new Image();
    img.src = PIG_SUBKINDS[id].spriteSrc;
    img.onload = () => render();
    img.onerror = () => console.error(`Failed to load pig image: ${PIG_SUBKINDS[id].spriteSrc}`);
    pigImages[id] = img;
  }

  const cowImages = {};
  for (const id of Object.keys(COW_SUBKINDS)) {
    const img = new Image();
    img.src = COW_SUBKINDS[id].spriteSrc;
    img.onload = () => render();
    img.onerror = () => console.error(`Failed to load cow image: ${COW_SUBKINDS[id].spriteSrc}`);
    cowImages[id] = img;
  }

  const chickenImages = {};
  for (const id of Object.keys(CHICKEN_SUBKINDS)) {
    const img = new Image();
    img.src = CHICKEN_SUBKINDS[id].spriteSrc;
    img.onload = () => render();
    img.onerror = () => console.error(`Failed to load chicken image: ${CHICKEN_SUBKINDS[id].spriteSrc}`);
    chickenImages[id] = img;
  }

  const duckImage = new Image();
  duckImage.src = "./assets/duck_normal.png";
  duckImage.onload = () => render();
  duckImage.onerror = () => console.error("Failed to load image: ./assets/duck_normal.png");

  const skyImage = new Image();
  skyImage.src = "./assets/bg_sky_normal.png";
  skyImage.onload = () => render();
  skyImage.onerror = () => console.error("Failed to load image: ./assets/bg_sky_normal.png");

  const farmBgImage = new Image();
  farmBgImage.src = "./assets/bg_grassland_normal.png";
  farmBgImage.onload = () => render();
  farmBgImage.onerror = () => console.error("Failed to load image: ./assets/bg_grassland_normal.png");

  const fenceImage = new Image();
  fenceImage.src = "./assets/fence_wood.png";
  fenceImage.onload = () => render();
  fenceImage.onerror = () => console.error("Failed to load image: ./assets/fence_wood.png");

  const barnImage = new Image();
  barnImage.src = "./assets/building_barn.png";
  barnImage.onload = () => {
    backgroundLayer = buildBackgroundLayer();
    render();
  };
  barnImage.onerror = () => console.error("Failed to load image: ./assets/building_barn.png");

  const jimushoImage = new Image();
  jimushoImage.src = "./assets/building_jimusho.png";
  jimushoImage.onload = () => {
    backgroundLayer = buildBackgroundLayer();
    render();
  };
  jimushoImage.onerror = () => console.error("Failed to load image: ./assets/building_jimusho.png");

  backgroundLayer = buildBackgroundLayer();

  let lastAutoSaveAt = Date.now();
  let lastUiRefreshAt = 0;
  let openPanel = null;
  let offlineInfo = "Offline progress is enabled.";

  let selectedPigId = null;
  let sellConfirmPigId = null;
  let selectedAnimalKind = null;
  let sellConfirmAnimalKind = null;

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
  cardBodyEl.addEventListener("click", onCardBodyClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanelCard();
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

  function createNewWorld() {
    const now = Date.now();
    const newWorld = {
      version: 5,
      createdAt: now,
      lastUpdateAt: now,
      savedAt: now,
      money: 9999,
      selectedFoodType: "corn",
      foodStock: {
        corn: 999,
        carrot: 999,
        cabbage: 999,
        kabu: 999,
        sweetpotato: 999,
        apple: 999
      },
      foods: [],
      poops: [],
      pigs: [],
      cows: [],
      ducks: [],
      chickens: [],
      nextAnimalId: 1
    };

    for (const name of ["Pinky", "Momo", "Choco"]) {
      newWorld.pigs.push(createAnimal("pig", name, newWorld.nextAnimalId++));
    }

    return newWorld;
  }

  function createAnimal(kind, name, id, subKind = null) {
    const animal = {
      kind,
      subKind: normalizeAnimalSubKind(kind, subKind),
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
      animOffset: rand(0, 9999),
      stage: "Baby",
      size: 15,
      moveSpeed: 34
    };

    applyStage(animal);
    return animal;
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
      version: 5,
      createdAt: safeNumber(raw?.createdAt, now),
      lastUpdateAt: safeNumber(raw?.lastUpdateAt, now),
      savedAt: safeNumber(raw?.savedAt, now),
      money: Math.max(0, Math.floor(safeNumber(raw?.money, 120))),
      selectedFoodType: FOOD_TYPES[raw?.selectedFoodType] ? raw.selectedFoodType : "corn",
      foodStock: normalizeFoodStock(raw?.foodStock ?? raw?.foodInventory),
      foods: Array.isArray(raw?.foods) ? raw.foods.map(normalizeFoodItem) : [],
      poops: Array.isArray(raw?.poops) ? raw.poops.map(normalizePoop) : [],
      pigs: Array.isArray(raw?.pigs) ? raw.pigs.map((animal, index) => normalizeAnimal("pig", animal, index + 1)) : [],
      cows: Array.isArray(raw?.cows) ? raw.cows.map((animal, index) => normalizeAnimal("cow", animal, index + 1)) : [],
      ducks: Array.isArray(raw?.ducks) ? raw.ducks.map((animal, index) => normalizeAnimal("duck", animal, index + 1)) : [],
      chickens: Array.isArray(raw?.chickens) ? raw.chickens.map((animal, index) => normalizeAnimal("chicken", animal, index + 1)) : [],
      nextAnimalId: Math.max(1, Math.floor(safeNumber(raw?.nextAnimalId, safeNumber(raw?.nextPigId, 1))))
    };

    if (!getAllAnimalsFromWorld(normalized).length) {
      for (const name of ["Pinky", "Momo", "Choco"]) {
        normalized.pigs.push(createAnimal("pig", name, normalized.nextAnimalId++));
      }
    }

    const maxId = getAllAnimalsFromWorld(normalized).reduce((max, animal) => Math.max(max, animal.id), 0);
    normalized.nextAnimalId = Math.max(normalized.nextAnimalId, maxId + 1);

    if (!FOOD_TYPES[normalized.selectedFoodType]) {
      normalized.selectedFoodType = "corn";
    }

    return normalized;
  }

  function normalizeFoodStock(rawStock) {
    if (Number.isFinite(rawStock)) {
      return {
        corn: Math.max(0, Math.floor(rawStock)),
        carrot: 0,
        cabbage: 0,
        kabu: 0,
        sweetpotato: 0,
        apple: 0
      };
    }

    return {
      corn: Math.max(0, Math.floor(safeNumber(rawStock?.corn, 10))),
      carrot: Math.max(0, Math.floor(safeNumber(rawStock?.carrot, 5))),
      cabbage: Math.max(0, Math.floor(safeNumber(rawStock?.cabbage, 1))),
      kabu: Math.max(0, Math.floor(safeNumber(rawStock?.kabu, 0))),
      sweetpotato: Math.max(0, Math.floor(safeNumber(rawStock?.sweetpotato, 0))),
      apple: Math.max(0, Math.floor(safeNumber(rawStock?.apple, 0)))
    };
  }

  function normalizeFoodItem(food) {
    const type = FOOD_TYPES[food?.type] ? food.type : "corn";
    return {
      type,
      x: clamp(safeNumber(food?.x, rand(farm.x + 16, farm.x + farm.w - 16)), farm.x + 10, farm.x + farm.w - 10),
      y: clamp(safeNumber(food?.y, rand(farm.y + 16, farm.y + farm.h - 16)), farm.y + 10, farm.y + farm.h - 10),
      r: clamp(safeNumber(food?.r, 10), 7, 14)
    };
  }

  function normalizePoop(poop) {
    return {
      x: clamp(safeNumber(poop?.x, rand(farm.x + 16, farm.x + farm.w - 16)), farm.x + 10, farm.x + farm.w - 10),
      y: clamp(safeNumber(poop?.y, rand(farm.y + 16, farm.y + farm.h - 16)), farm.y + 10, farm.y + farm.h - 10),
      size: clamp(safeNumber(poop?.size, 10), 7, 14),
      createdAt: safeNumber(poop?.createdAt, Date.now())
    };
  }

  function normalizeAnimal(kind, rawAnimal, fallbackId) {
    const animal = {
      kind,
      subKind: normalizeAnimalSubKind(kind, rawAnimal?.subKind ?? rawAnimal?.subkind),
      id: Math.max(1, Math.floor(safeNumber(rawAnimal?.id, fallbackId))),
      name: typeof rawAnimal?.name === "string" ? rawAnimal.name : `${getAnimalLabel(kind)} ${fallbackId}`,
      x: clamp(safeNumber(rawAnimal?.x, rand(farm.x + 50, farm.x + farm.w - 50)), farm.x + 16, farm.x + farm.w - 16),
      y: clamp(safeNumber(rawAnimal?.y, rand(farm.y + 50, farm.y + farm.h - 50)), farm.y + 16, farm.y + farm.h - 16),
      targetX: clamp(safeNumber(rawAnimal?.targetX, rand(farm.x + 30, farm.x + farm.w - 30)), farm.x + 16, farm.x + farm.w - 16),
      targetY: clamp(safeNumber(rawAnimal?.targetY, rand(farm.y + 30, farm.y + farm.h - 30)), farm.y + 16, farm.y + farm.h - 16),
      vx: safeNumber(rawAnimal?.vx, 0),
      vy: safeNumber(rawAnimal?.vy, 0),
      wanderTimer: safeNumber(rawAnimal?.wanderTimer, rand(2, 6)),
      hunger: clamp(safeNumber(rawAnimal?.hunger, 20), 0, 100),
      ageMinutes: Math.max(0, safeNumber(rawAnimal?.ageMinutes, 0)),
      growthBonus: Math.max(0, safeNumber(rawAnimal?.growthBonus, 0)),
      feedCount: Math.max(0, Math.floor(safeNumber(rawAnimal?.feedCount, 0))),
      lastFedAt: Number.isFinite(rawAnimal?.lastFedAt) ? rawAnimal.lastFedAt : -1,
      digestion: Array.isArray(rawAnimal?.digestion)
        ? rawAnimal.digestion.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
        : [],
      animOffset: safeNumber(rawAnimal?.animOffset, rand(0, 9999)),
      stage: "Baby",
      size: 15,
      moveSpeed: 34
    };

    applyStage(animal);
    return animal;
  }

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
      stepWorld(chunk, current + chunk);
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

  function stepWorld(dtMs, stepEnd) {
    prepareHerdingLeaders();
    for (const animal of getAllAnimals()) {
      updatePig(animal, dtMs, stepEnd);
    }
  }

  function updatePig(pig, dtMs, stepEnd) {
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
      return;
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
      const leader = leaderId ? findAnyAnimalById(leaderId) : null;

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

  function openSellConfirmPanel(kind, pigId) {
    const pig = findAnimalById(kind, pigId);
    if (!pig) return;

    sellConfirmPigId = pigId;
    sellConfirmAnimalKind = kind;
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

    let dirX = dx / len;
    let dirY = dy / len;

    let avoidX = 0;
    let avoidY = 0;

    for (const other of getAllAnimals()) {
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

    for (let pass = 0; pass < 2; pass += 1) {
      for (const other of getAllAnimals()) {
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
    const config = FOOD_TYPES[foodType] || FOOD_TYPES.corn;
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

  function applyStage(animal) {
    const stage = getGrowthStage(animal);
    animal.stage = stage.name;
    animal.size = stage.size;
    animal.moveSpeed = stage.speed;
  }

  function getGrowthStage(animal) {
    const score = animal.ageMinutes + animal.growthBonus;
    const type = ANIMAL_TYPES[animal.kind] || ANIMAL_TYPES.pig;
    const stages = type.stages || ANIMAL_TYPES.pig.stages;

    for (const stage of stages) {
      if (score < stage.limit) return stage;
    }

    return stages[stages.length - 1];
  }

  function getBuyAnimalPrice(kind) {
    const type = ANIMAL_TYPES[kind];
    if (!type) return 999999;

    const count = getAnimalCollection(kind).length;
    return type.buyBase + Math.max(0, count - 2) * type.buyStep;
  }

  function getAnimalSellPrice(animal) {
    const type = ANIMAL_TYPES[animal.kind] || ANIMAL_TYPES.pig;
    const stageBase = type.sellBase || ANIMAL_TYPES.pig.sellBase;

    return Math.max(
      15,
      Math.round(
        stageBase[animal.stage] +
        animal.feedCount * 2 +
        Math.min(28, animal.growthBonus * 0.08)
      )
    );
  }

  function canSellAnimal(animal) {
    return STAGE_ORDER.indexOf(animal.stage) >= STAGE_ORDER.indexOf("Adult");
  }

  function buyAnimal(kind, subKind = null) {
    const type = ANIMAL_TYPES[kind];
    if (!type) return false;

    const price = getBuyAnimalPrice(kind);
    const collection = getAnimalCollection(kind);

    if (collection.length >= type.maxCount) {
      offlineInfo = `${type.label} limit reached (${type.maxCount}).`;
      return false;
    }

    if (world.money < price) {
      offlineInfo = "Not enough money to buy.";
      return false;
    }

    const resolvedSubKind = resolvePurchaseSubKind(kind, subKind);

    world.money -= price;
    const animal = createAnimal(kind, nextAnimalName(kind), world.nextAnimalId++, resolvedSubKind);
    collection.push(animal);

    const subKindLabel = getAnimalSubKindLabel(kind, animal.subKind);
    const extraLabel = animal.subKind ? ` (${subKindLabel})` : "";

    offlineInfo = `Bought ${type.label}${extraLabel} ${animal.name} for $${price}.`;
    return true;
  }

  function sellAnimalById(kind, animalId) {
    const collection = getAnimalCollection(kind);
    const animal = collection.find((item) => item.id === animalId);

    if (!animal) {
      offlineInfo = `${getAnimalLabel(kind)} not found.`;
      return false;
    }

    if (!canSellAnimal(animal)) {
      offlineInfo = `${animal.name} is not Adult yet.`;
      return false;
    }

    const value = getAnimalSellPrice(animal);
    world.money += value;
    world[ANIMAL_COLLECTION_KEY[kind]] = collection.filter((item) => item.id !== animal.id);

    if (selectedPigId === animal.id && selectedAnimalKind === animal.kind) {
      selectedPigId = null;
      selectedAnimalKind = null;
    }

    if (sellConfirmPigId === animal.id && sellConfirmAnimalKind === animal.kind) {
      sellConfirmPigId = null;
      sellConfirmAnimalKind = null;
    }

    offlineInfo = `Sold ${animal.name} for $${value}.`;
    return true;
  }

  function isPigSellPending(pig) {
    return (
      openPanel === "sellConfirm" &&
      sellConfirmPigId === pig.id &&
      sellConfirmAnimalKind === pig.kind
    );
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
    offlineInfo = `Bought ${food.packQty} ${getFoodLabel(foodId)} for $${food.packCost}.`;
    return true;
  }

  function getPigHungerBehavior(pig) {
    if (pig.hunger < 5) return { mode: "resting", speed: 0, foodRange: 0 };
    if (pig.hunger < 40) return { mode: "herding", speed: 1.4, foodRange: 90 };
    if (pig.hunger < 70) return { mode: "foraging", speed: 1.1, foodRange: 220 };
    return { mode: "starving", speed: 0.8, foodRange: 150 };
  }

  function prepareHerdingLeaders() {
    herdLeaderByPigId.clear();
    herdLeaderIds.clear();

    const herdingPigs = getAllAnimals()
      .filter((pig) => getPigHungerBehavior(pig).mode === "herding")
      .slice()
      .sort((a, b) => {
        if (a.ageMinutes !== b.ageMinutes) return a.ageMinutes - b.ageMinutes;
        return a.id - b.id;
      });

    for (const pig of herdingPigs) {
      if (herdLeaderIds.has(pig.id)) continue;

      const leader = findNearestOlderPig(pig);
      if (!leader) continue;

      herdLeaderByPigId.set(pig.id, leader.id);
      herdLeaderIds.add(leader.id);
    }
  }

  function findNearestOlderPig(pig) {
    let bestPig = null;
    let bestDist = Infinity;

    for (const other of getAllAnimals()) {
      if (other === pig) continue;
      if (other.ageMinutes <= pig.ageMinutes) continue;

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

  function placeSelectedFood(x, y) {
    const type = world.selectedFoodType;
    const stock = world.foodStock[type] || 0;
    const food = FOOD_TYPES[type];

    if (!food) {
      offlineInfo = "No food selected.";
      return false;
    }

    if (stock <= 0) {
      offlineInfo = `${getFoodLabel(type)} is out of stock. Click the office to buy more.`;
      return false;
    }

    world.foods.push({
      type,
      x: clamp(x, farm.x + 10, farm.x + farm.w - 10),
      y: clamp(y, farm.y + 10, farm.y + farm.h - 10),
      r: rand(8, 11)
    });

    world.foodStock[type] -= 1;
    offlineInfo = `Placed 1 ${getFoodLabel(type)}.`;
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

  function onCanvasPointerDown(event) {
    event.preventDefault();
    syncToNow(false);

    const foodButtons = [
      { x: 480, type: "corn" },
      { x: 560, type: "carrot" },
      { x: 640, type: "cabbage" },
      { x: 720, type: "kabu" },
      { x: 800, type: "sweetpotato" },
      { x: 880, type: "apple" }
    ];

    const { x, y } = getCanvasPointerPosition(event);

    for (const item of foodButtons) {
      if (x >= item.x && x <= item.x + 32 && y >= 10 && y <= 42) {
        world.selectedFoodType = world.selectedFoodType === item.type ? null : item.type;
        persistNow();
        render();
        return;
      }
    }

    const pig = pointInRect(x, y, farm) ? findPigAt(x, y) : null;
    if (pig) {
      dragState = {
        pointerId: event.pointerId,
        pigId: pig.id,
        animalKind: pig.kind,
        startX: x,
        startY: y,
        offsetX: pig.x - x,
        offsetY: pig.y - y,
        moved: false,
        lastAt: Date.now()
      };

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {}

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
    const animals = getAllAnimals();

    for (let i = animals.length - 1; i >= 0; i -= 1) {
      const pig = animals[i];
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

    const nextX = clamp(x + dragState.offsetX, farm.x + pig.size, farm.x + farm.w - pig.size);
    const nextY = clamp(y + dragState.offsetY, farm.y + pig.size, farm.y + farm.h - pig.size);

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
      for (const other of getAllAnimals()) {
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

  function openPigPanel(kind, pigId) {
    const pig = findAnimalById(kind, pigId);
    if (!pig) return;

    selectedPigId = pigId;
    selectedAnimalKind = kind;
    sellConfirmPigId = null;
    sellConfirmAnimalKind = null;
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

    if (action === "buy-animal") {
      changed = buyAnimal(button.dataset.kind, button.dataset.subkind || null);
    } else if (action === "sell-animal") {
      changed = sellAnimalById(button.dataset.kind, Number(button.dataset.animalId));
    } else if (action === "buy-food") {
      changed = buyFoodPack(button.dataset.food);
    } else if (action === "select-food") {
      const foodId = button.dataset.food;
      if (FOOD_TYPES[foodId]) {
        world.selectedFoodType = foodId;
        offlineInfo = `${getFoodLabel(foodId)} selected.`;
        changed = true;
      }
    } else if (action === "confirm-sell") {
      changed = sellAnimalById(button.dataset.kind, Number(button.dataset.animalId));
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
      selectedAnimalKind = null;
      sellConfirmAnimalKind = null;
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
    selectedAnimalKind = null;
    sellConfirmAnimalKind = null;

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

    const pig = findAnimalById(dragState.animalKind, dragState.pigId);
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

    const pig = findAnimalById(dragState.animalKind, dragState.pigId);
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
          } catch (error) {}
          dragState = null;
          openSellConfirmPanel(pig.kind, pig.id);
          return;
        }

        offlineInfo = `${pig.name} moved.`;
        persistNow();
      } else {
        pig.vx = 0;
        pig.vy = 0;
        pig.targetX = pig.x;
        pig.targetY = pig.y;
        openPigPanel(pig.kind, pig.id);
      }
    }

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {}

    dragState = null;
    updateHud();
    render();
  }

  function onCanvasPointerCancel(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const pig = findAnimalById(dragState.animalKind, dragState.pigId);
    if (pig) {
      pig.vx = 0;
      pig.vy = 0;
      pig.targetX = pig.x;
      pig.targetY = pig.y;
      separatePigFromOthers(pig);
    }

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {}

    dragState = null;
    updateHud();
    render();
  }

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
      cardSubtitleEl.textContent = "Check farm status, buy/sell food and animals.";
      cardBodyEl.innerHTML = renderJimushoCardHtml();
      return;
    }

    if (openPanel === "pig") {
      const pig = findAnimalById(selectedAnimalKind, selectedPigId);
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
      const pig = findAnimalById(sellConfirmAnimalKind, sellConfirmPigId);
      if (!pig) {
        cardTitleEl.textContent = "";
        cardSubtitleEl.textContent = "";
        cardBodyEl.innerHTML = "";
        return;
      }

      cardTitleEl.textContent = "";
      cardSubtitleEl.textContent = "";
      cardBodyEl.innerHTML = renderSellConfirmHtml(pig);
    }
  }

  function renderSellConfirmHtml(pig) {
    const sellable = canSellAnimal(pig);
    const price = getAnimalSellPrice(pig);
    const animalLabel = getAnimalLabel(pig.kind);

    return `
      <div class="sell-confirm-wrap">
        <div class="sell-confirm-text">
          ${
            sellable
              ? `Sell <strong>${escapeHtml(pig.name)}</strong> (${animalLabel}) for <strong>$${price}</strong>?`
              : `<strong>${escapeHtml(pig.name)}</strong> cannot be sold yet. Adult required.`
          }
        </div>

        <div class="sell-confirm-actions">
          ${
            sellable
              ? `
                <button class="secondary" data-action="cancel-sell">No</button>
                <button class="danger" data-action="confirm-sell" data-kind="${pig.kind}" data-animal-id="${pig.id}">Yes</button>
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
    const sellable = canSellAnimal(pig);
    const sellPrice = getAnimalSellPrice(pig);
    const animalLabel = getAnimalLabel(pig.kind);

    return `
      <div class="sheet-row">
        <div class="row-header">
          <div class="row-title">
            <strong>${escapeHtml(pig.name)}</strong>
            <span class="stage-chip">${animalLabel}</span>
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
            data-action="sell-animal"
            data-kind="${pig.kind}"
            data-animal-id="${pig.id}"
            ${sellable ? "" : "disabled"}
          >
            ${sellable ? `Sell (+$${sellPrice})` : "Adult required"}
          </button>
        </div>
      </div>
    `;
  }

  function getPigCardPhotoSrc(pig) {
    return getAnimalSpriteSrc(pig);
  }

  function getPigCardPhotoWidth(pig) {
    return clamp(Math.round(100 * (pig.size / 26)), 54, 118);
  }

  function renderPigNoteHtml(pig) {
    const hunger = Math.round(pig.hunger);
    const sellPrice = getAnimalSellPrice(pig);
    const typeLabel = getAnimalSubKindLabel(pig.kind, pig.subKind) || getAnimalLabel(pig.kind);

    return `
      <div class="pig-note-layout">
        <div class="pig-note-left">
          <div class="pig-note-photo-box">
            <img
              class="pig-note-photo"
              src="${getPigCardPhotoSrc(pig)}"
              alt="${escapeHtml(pig.name)}"
              style="width:${getPigCardPhotoWidth(pig)}px"
            >
            <div class="pig-note-name">${escapeHtml(pig.name)}</div>
          </div>

          <div class="pig-note-left-bottom">
            <div class="pig-note-mini">
              <span class="pig-note-mini-label">Type</span>
              <strong>${typeLabel}</strong>
            </div>

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

  function renderBuyAnimalRowHtml(kind) {
    const type = ANIMAL_TYPES[kind];
    const count = getAnimalCollection(kind).length;
    const price = getBuyAnimalPrice(kind);
    const buyDisabled = world.money < price || count >= type.maxCount ? "disabled" : "";

    return `
      <div class="sheet-row">
        <div class="row-header">
          <div class="row-title">
            <strong>${type.label}</strong>
          </div>
          <div class="price-tag">${count}/${type.maxCount}</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="label">Buy price</span>
            $${price}
          </div>
          <div class="meta-item">
            <span class="label">Current</span>
            ${count}
          </div>
          <div class="meta-item">
            <span class="label">Limit</span>
            ${type.maxCount}
          </div>
        </div>

        <div class="row-actions">
          <button
            data-action="buy-animal"
            data-kind="${kind}"
            ${buyDisabled}
          >
            Buy ${type.label} (-$${price})
          </button>
        </div>
      </div>
    `;
  }

  function renderJimushoCardHtml() {
    const selectedFood = FOOD_TYPES[world.selectedFoodType] || null;
    const allAnimals = getAllAnimals();

    return `
      <div class="sheet-top">
        <div class="summary-chip">Money: $${world.money}</div>
        <div class="summary-chip">Pigs: ${world.pigs.length}/${CONFIG.MAX_PIGS}</div>
        <div class="summary-chip">Cows: ${world.cows.length}/${CONFIG.MAX_COWS}</div>
        <div class="summary-chip">Ducks: ${world.ducks.length}/${CONFIG.MAX_DUCKS}</div>
        <div class="summary-chip">Chickens: ${world.chickens.length}/${CONFIG.MAX_CHICKENS}</div>
      </div>

      <div class="sheet-top">
        <div class="summary-chip">Selected: ${selectedFood ? getFoodLabel(selectedFood.id) : "None"}</div>
        <div class="summary-chip">Total stock: ${getTotalFoodStock()}</div>
        <div class="summary-chip">Saved: ${formatRelative(world.savedAt)}</div>
      </div>

      <p class="sheet-note"><strong>Buy Animals</strong></p>
      <div class="sheet-list">
        ${ANIMAL_KINDS.map(renderBuyAnimalRowHtml).join("")}
      </div>

      <p class="sheet-note">
        ここで farm 全体を管理できます。<br>
        food の購入 / 選択、animal の購入、Adult 以上の animal の売却ができます。
      </p>

      <p class="sheet-note"><strong>Food</strong></p>
      <div class="sheet-list">
        ${FOOD_IDS.map(renderJimushoFoodRow).join("")}
      </div>

      <p class="sheet-note"><strong>Animals</strong></p>
      <div class="sheet-list">
        ${allAnimals.map(renderHousePigRow).join("")}
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
            <strong>${getFoodLabel(food.id)}</strong>
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

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundLayer, 0, 0);

    drawTopStatus(top_button.money, 10, topMoneyImage, `${world.money}`);
    drawTopStatus(top_button.pig, 10, topPigImage, `${world.pigs.length}`);
    drawTopStatus(top_button.cow, 10, topCowImage, `${world.cows.length}`);
    drawTopStatus(top_button.duck, 10, topDuckImage, `${world.ducks.length}`);
    drawTopStatus(top_button.chicken, 10, topChickenImage, `${world.chickens.length}`);
    drawTopStatus(top_button.corn, 10, cornImage, `${world.foodStock.corn}`, "corn");
    drawTopStatus(top_button.carrot, 10, carrotImage, `${world.foodStock.carrot}`, "carrot");
    drawTopStatus(top_button.cabbage, 10, cabbageImage, `${world.foodStock.cabbage}`, "cabbage");
    drawTopStatus(top_button.kabu, 10, kabuImage, `${world.foodStock.kabu}`, "kabu");
    drawTopStatus(top_button.sweetpotato, 10, sweetpotatoImage, `${world.foodStock.sweetpotato}`, "sweetpotato");
    drawTopStatus(top_button.apple, 10, appleImage, `${world.foodStock.apple}`, "apple");

    if (openPanel === "jimusho") {
      drawBuildingHighlight(jimusho);
    }

    for (const food of world.foods) drawFood(food);
    for (const poop of world.poops) drawPoop(poop);

    const animalsToDraw = getAllAnimals().slice().sort((a, b) => a.y - b.y);
    for (const pig of animalsToDraw) {
      drawPig(pig);
    }
  }

  function drawTopStatus(x, y, image, text, foodType = null) {
    const iconSize = 32;

    if (foodType && world.selectedFoodType === foodType) {
      ctx.beginPath();
      ctx.arc(x + iconSize / 2, y + iconSize / 2, iconSize / 2 + 1, 0, Math.PI * 2);
      ctx.fillStyle = "#2f5f5f";
      ctx.fill();
    }

    if (image.complete && image.naturalWidth) {
      ctx.drawImage(image, x, y, iconSize, iconSize);
    }

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeText(text, x + iconSize + 2, y + 23);
    ctx.fillText(text, x + iconSize + 2, y + 23);
  }

  function drawBuildingHighlight(rect) {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
  }

  function drawFood(food) {
    drawShadow(food.x, food.y + 7, 12, 5, "rgba(0,0,0,0.16)");

    let img = null;
    switch (food.type) {
      case "corn": img = cornImage; break;
      case "carrot": img = carrotImage; break;
      case "cabbage": img = cabbageImage; break;
      case "kabu": img = kabuImage; break;
      case "sweetpotato": img = sweetpotatoImage; break;
      case "apple": img = appleImage; break;
      default: return;
    }

    if (!img.complete || !img.naturalWidth) return;

    const drawSize = 22;
    ctx.drawImage(img, food.x - drawSize / 2, food.y - drawSize / 2, drawSize, drawSize);
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
    const isResting = getPigHungerBehavior(pig).mode === "resting";
    const speedNow = Math.hypot(pig.vx, pig.vy);
    const moving = speedNow > 1;
    const t = (Date.now() + pig.animOffset) * 0.012;

    const sway = isDragging ? Math.sin(t * 1.35) * 0.3 : moving ? Math.sin(t) * 0.05 : 0;
    const bobY = isDragging ? Math.sin(t * 2.7) * 2.5 : moving ? Math.sin(t * 2) * 1.5 : 0;
    const markSway = isResting ? Math.sin(t * 1.2) * 0.16 : 0;

    return { isResting, sway, bobY, markSway };
  }

  function drawPig(pig) {
    const motion = getPigRenderMotion(pig);
    drawShadow(pig.x, pig.y + pig.size * 0.4, pig.size * 1.05, pig.size * 0.35, getPigShadowColor(pig));

    const animalImage = getAnimalImage(pig.kind, pig.subKind);
    if (!animalImage.complete || !animalImage.naturalWidth) return;

    const aspect = animalImage.naturalWidth / animalImage.naturalHeight;
    const drawH = Math.round(pig.size * (ANIMAL_TYPES[pig.kind]?.drawHeightMul || 2.4));
    const drawW = Math.round(drawH * aspect);
    const px = Math.round(pig.x);
    const py = Math.round(pig.y);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(px, py + motion.bobY);
    ctx.rotate(motion.sway);

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
    ctx.drawImage(animalImage, Math.round(-drawW / 2), Math.round(-drawH * 0.7), drawW, drawH);
    ctx.restore();

    if (motion.isResting && sleepMarkImage.complete && sleepMarkImage.naturalWidth) {
      const markW = Math.round(drawW * 0.55);
      const markH = Math.round(markW * (sleepMarkImage.naturalHeight / sleepMarkImage.naturalWidth));
      const markX = px + pig.size * 1.25;
      const markY = py - drawH * 0.65;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.translate(Math.round(markX), Math.round(markY));
      ctx.rotate(motion.markSway);
      ctx.drawImage(sleepMarkImage, Math.round(-markW / 2), Math.round(-markH / 2), markW, markH);
      ctx.restore();
    }

    if (
      selectedPigId === pig.id &&
      selectedAnimalKind === pig.kind &&
      highlightImage.complete &&
      highlightImage.naturalWidth
    ) {
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

    if (barnImage.complete && barnImage.naturalWidth) {
      c.drawImage(barnImage, barn.x, barn.y, barn.w, barn.h);
    }

    drawJimusho(c);

    return bg;
  }

  function drawJimusho(c) {
    if (!jimushoImage.complete || !jimushoImage.naturalWidth) return;

    c.drawImage(jimushoImage, jimusho.x, jimusho.y, jimusho.w, jimusho.h);

    if (truckImage.complete && truckImage.naturalWidth) {
      c.save();
      c.translate(truck.x + truck.w, truck.y);
      c.scale(-1, 1);
      c.drawImage(truckImage, 0, 0, truck.w, truck.h);
      c.restore();
    }
  }

  function drawFence(c, rect) {
    if (!fenceImage.complete || !fenceImage.naturalWidth) return;

    const drawH = 72;
    const drawW = Math.round(drawH * (fenceImage.naturalWidth / fenceImage.naturalHeight));
    const y = rect.y - Math.round(drawH * 0.55);
    const startX = rect.x;
    const endX = rect.x + rect.w;

    c.save();
    c.beginPath();
    c.rect(startX, y, rect.w, drawH);
    c.clip();

    for (let x = startX; x < endX; x += drawW - 1) {
      c.drawImage(fenceImage, x, y, drawW, drawH);
    }

    c.restore();
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

  function createSprites() {
    return { tiles: createTileSheet() };
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

  function drawFeedMixTile(c, ox, oy) {
    c.fillStyle = "#d59b24";
    c.fillRect(ox + 6, oy + 12, 12, 7);

    c.fillStyle = "#f2c24f";
    c.fillRect(ox + 5, oy + 10, 14, 5);

    c.fillStyle = "#7a4d0f";
    c.fillRect(ox + 7, oy + 8, 2, 2);
    c.fillRect(ox + 11, oy + 7, 2, 2);
    c.fillRect(ox + 15, oy + 8, 2, 2);
  }

  function drawPumpkinTile(c, ox, oy) {
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

  function drawPoopTile(c, ox, oy) {
    c.fillStyle = "#5d3c22";
    c.beginPath();
    c.arc(ox + 9, oy + 15, 4.5, 0, Math.PI * 2);
    c.arc(ox + 15, oy + 15, 4, 0, Math.PI * 2);
    c.arc(ox + 12, oy + 10, 4, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "rgba(255,255,255,0.1)";
    c.fillRect(ox + 9, oy + 9, 2, 2);
  }

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

  function getAnimalCollectionFromWorld(worldObj, kind) {
    return worldObj[ANIMAL_COLLECTION_KEY[kind]] || [];
  }

  function getAnimalCollection(kind) {
    return getAnimalCollectionFromWorld(world, kind);
  }

  function getAllAnimalsFromWorld(worldObj) {
    return ANIMAL_KINDS.flatMap((kind) => getAnimalCollectionFromWorld(worldObj, kind));
  }

  function getAllAnimals() {
    return getAllAnimalsFromWorld(world);
  }

  function findAnimalById(kind, id) {
    return getAnimalCollection(kind).find((item) => item.id === id) || null;
  }

  function findAnyAnimalById(id) {
    return getAllAnimals().find((item) => item.id === id) || null;
  }

  function getAnimalLabel(kind) {
    return ANIMAL_TYPES[kind]?.label || kind;
  }

  function getAnimalSubKindMap(kind) {
    if (kind === "pig") return PIG_SUBKINDS;
    if (kind === "cow") return COW_SUBKINDS;
    if (kind === "chicken") return CHICKEN_SUBKINDS;
    return null;
  }

  function getAnimalSubKindIds(kind) {
    const map = getAnimalSubKindMap(kind);
    return map ? Object.keys(map) : [];
  }

  function normalizeAnimalSubKind(kind, subKind) {
    const map = getAnimalSubKindMap(kind);
    if (!map) return null;
    return map[subKind] ? subKind : "normal";
  }

  function getAnimalSubKindLabel(kind, subKind) {
    const map = getAnimalSubKindMap(kind);
    if (!map) return null;

    const resolved = normalizeAnimalSubKind(kind, subKind);
    return map[resolved]?.label || null;
  }

  function resolvePurchaseSubKind(kind, subKind) {
    if (subKind != null) {
      return normalizeAnimalSubKind(kind, subKind);
    }

    const ids = getAnimalSubKindIds(kind);
    if (!ids.length) return null;

    return pick(ids);
  }

  function getAnimalImage(kind, subKind = null) {
    switch (kind) {
      case "pig": {
        const resolved = normalizeAnimalSubKind("pig", subKind);
        return pigImages[resolved] || pigImages.normal;
      }
      case "cow": {
        const resolved = normalizeAnimalSubKind("cow", subKind);
        return cowImages[resolved] || cowImages.normal;
      }
      case "duck":
        return duckImage;
      case "chicken": {
        const resolved = normalizeAnimalSubKind("chicken", subKind);
        return chickenImages[resolved] || chickenImages.normal;
      }
      default:
        return pigImages.normal;
    }
  }

  function getFoodLabel(foodId) {
    const labels = {
      corn: "Corn",
      carrot: "Carrot",
      cabbage: "Cabbage",
      kabu: "Turnip",
      sweetpotato: "Sweet Potato",
      apple: "Apple"
    };
    return labels[foodId] || foodId || "None";
  }

  function nextAnimalName(kind) {
    if (kind === "pig") {
      return nextPigName();
    }

    const used = new Set(getAnimalCollection(kind).map((a) => a.name));
    let n = getAnimalCollection(kind).length + 1;
    let candidate = `${getAnimalLabel(kind)} ${n}`;

    while (used.has(candidate)) {
      n += 1;
      candidate = `${getAnimalLabel(kind)} ${n}`;
    }

    return candidate;
  }

  function getAnimalSpriteSrc(animal) {
    const map = getAnimalSubKindMap(animal.kind);
    if (map) {
      const resolved = normalizeAnimalSubKind(animal.kind, animal.subKind);
      return map[resolved]?.spriteSrc || ANIMAL_TYPES[animal.kind]?.spriteSrc || ANIMAL_TYPES.pig.spriteSrc;
    }

    return ANIMAL_TYPES[animal.kind]?.spriteSrc || ANIMAL_TYPES.pig.spriteSrc;
  }
})();