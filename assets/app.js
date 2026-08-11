(function () {
  "use strict";

  /* ---------- Build path (publicado em ./build) ---------- */
  const BUILD_DIR = "build";
  const BUILD_URL = BUILD_DIR;

  const canvas = document.getElementById("unity-canvas");
  const gameHost = document.getElementById("gameHost");
  const loadingEl = document.getElementById("loading");
  const progressEl = document.getElementById("progress");
  const loadingTextEl = document.getElementById("loadingText");
  const unityStateEl = document.getElementById("unityState");

  let unityInstance = null;

  /* ---------- Console capture (mostra Debug.Log da Unity) ---------- */
  const consoleEl = document.getElementById("console");
  const consoleCaptureChk = document.getElementById("consoleCapture");
  const nativeConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function stringifyArg(v) {
    if (v === null || v === undefined) return String(v);
    if (typeof v === "object") {
      try {
        return JSON.stringify(v);
      } catch (e) {
        return String(v);
      }
    }
    return String(v);
  }

  function appendConsole(level, args) {
    if (!consoleCaptureChk.checked) return;
    const entry = document.createElement("div");
    entry.className = "centry level-" + level;
    entry.textContent = "[" + nowStamp() + "] " + args.map(stringifyArg).join(" ");
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    while (consoleEl.childElementCount > 400) {
      consoleEl.removeChild(consoleEl.firstChild);
    }
  }

  console.log = function () {
    appendConsole("log", Array.prototype.slice.call(arguments));
    nativeConsole.log.apply(console, arguments);
  };
  console.info = function () {
    appendConsole("info", Array.prototype.slice.call(arguments));
    nativeConsole.info.apply(console, arguments);
  };
  console.warn = function () {
    appendConsole("warn", Array.prototype.slice.call(arguments));
    nativeConsole.warn.apply(console, arguments);
  };
  console.error = function () {
    appendConsole("error", Array.prototype.slice.call(arguments));
    nativeConsole.error.apply(console, arguments);
  };

  window.addEventListener("error", (e) => {
    appendConsole("error", ["[page] " + (e.message || e.type)]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    appendConsole("error", ["[page] unhandled rejection: " + stringifyArg(e.reason)]);
  });

  /* ---------- Tráfego (eventos de ciclo de vida) ---------- */
  const logEl = document.getElementById("log");
  function log(kind, text, isError) {
    const entry = document.createElement("div");
    entry.className = "entry" + (isError ? " error" : "");
    entry.innerHTML = `<span class="tag">[${nowStamp()} ${kind}]</span> ${text}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    while (logEl.childElementCount > 200) {
      logEl.removeChild(logEl.firstChild);
    }
  }

  /* ---------- Dados do jogo (stats) ---------- */
  const statsEl = document.getElementById("stats");
  const LS_VISITS = "mma_visits";
  let visits = 0;
  try {
    visits = parseInt(localStorage.getItem(LS_VISITS), 10) || 0;
    visits += 1;
    localStorage.setItem(LS_VISITS, String(visits));
  } catch (e) {
    /* localStorage indisponível */
  }
  statsEl.textContent =
    "Visitas: " + visits + "\n" +
    "Navegador: " + (navigator.userAgent.match(/Chrome|Firefox|Safari|Edge/)[0] || "?") +
    " | Resolução: " + window.screen.width + "x" + window.screen.height;

  /* ---------- Fullscreen (Esc para sair) ---------- */
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function toggleFullscreen() {
    if (!isFullscreen()) {
      if (gameHost.requestFullscreen) gameHost.requestFullscreen();
      else if (gameHost.webkitRequestFullscreen) gameHost.webkitRequestFullscreen();
      return;
    }
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  document.getElementById("fullscreenBtn").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", fitCanvas);
  document.addEventListener("webkitfullscreenchange", fitCanvas);

  /* ---------- Canvas 16:9 fit ---------- */
  const ASPECT_RATIO = 16 / 9;
  function fitCanvas() {
    const hostW = gameHost.clientWidth;
    const hostH = gameHost.clientHeight;
    if (!hostW || !hostH) return;
    let w = hostW;
    let h = w / ASPECT_RATIO;
    if (h > hostH) {
      h = hostH;
      w = h * ASPECT_RATIO;
    }
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }
  window.addEventListener("resize", fitCanvas);

  /* ---------- Resolve nomes de arquivo do build ---------- */
  async function resolveVariant(name, candidates) {
    for (const c of candidates) {
      const url = BUILD_URL + "/" + name + c;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) return url;
      } catch (e) {
        /* continua */
      }
    }
    throw new Error("Arquivo não encontrado no build: " + name + " (em " + BUILD_URL + ")");
  }

  let loadingTextTimeout;
  function animateLoadingDots(dots) {
    loadingTextEl.textContent = "CARREGANDO" + ".".repeat(dots % 4);
    loadingTextTimeout = setTimeout(() => animateLoadingDots(dots + 1), 500);
  }

  function setUnityState(text, ok) {
    unityStateEl.textContent = text;
    unityStateEl.style.color = ok ? "#7fd18c" : "#e8a0a0";
  }

  function onProgress(progress) {
    progressEl.style.width = progress * 100 + "%";
  }

  async function initUnity() {
    log("info", "Carregando build de " + BUILD_DIR + " ...");
    setUnityState("carregando...");

    let dataUrl, frameworkUrl, codeUrl;
    try {
      dataUrl = await resolveVariant("WebGL.data", ["", ".unityweb", ".br", ".gz"]);
      frameworkUrl = await resolveVariant("WebGL.framework.js", ["", ".unityweb", ".br", ".gz"]);
      codeUrl = await resolveVariant("WebGL.wasm", ["", ".unityweb", ".br", ".gz"]);
    } catch (e) {
      loadingEl.style.display = "none";
      setUnityState("erro", false);
      log("error", e.message, true);
      console.error(e.message);
      return;
    }

    const config = {
      dataUrl: dataUrl,
      frameworkUrl: frameworkUrl,
      codeUrl: codeUrl,
      streamingAssetsUrl: BUILD_DIR + "/StreamingAssets",      companyName: "Megaman Arena Tribute",
      productName: "Megaman Arena Tribute",
      productVersion: "1.0",
      matchWebGLToCanvasSize: true,
      devicePixelRatio: 1,
    };

    const script = document.createElement("script");
    script.src = BUILD_URL + "/WebGL.loader.js";
    script.onload = async () => {
      if (typeof createUnityInstance !== "function") {
        loadingEl.style.display = "none";
        setUnityState("erro", false);
        log("error", "WebGL.loader.js não definiu createUnityInstance.", true);
        return;
      }
      try {
        const instance = await createUnityInstance(canvas, config, onProgress);
        unityInstance = instance;
        window.unityInstance = instance;
        loadingEl.style.display = "none";
        setUnityState("pronto", true);
        fitCanvas();
        log("info", "Unity carregado e pronto.");
      } catch (err) {
        loadingEl.style.display = "none";
        setUnityState("erro", false);
        log("error", "Falha ao carregar Unity: " + (err.message || err), true);
        console.error(err);
      }
    };
    script.onerror = () => {
      loadingEl.style.display = "none";
      setUnityState("erro", false);
      log("error", "Falha ao baixar WebGL.loader.js.", true);
    };
    document.body.appendChild(script);
  }

  /* ---------- Recarregar ---------- */
  document.getElementById("reloadBtn").addEventListener("click", () => location.reload());
  document.getElementById("copyConsoleBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(consoleEl.innerText);
    } catch (e) {
      /* clipboard indisponível */
    }
  });

  fitCanvas();
  animateLoadingDots(0);
  initUnity();
})();
