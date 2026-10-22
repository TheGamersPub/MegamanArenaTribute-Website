(function () {
  "use strict";

  /* ---------- Build Godot (publicado em ./build, carregado via iframe same-origin) ---------- */
  const BUILD_DIR = "build";

  const frame = document.getElementById("game-frame");
  const gameHost = document.getElementById("gameHost");
  const gameStateEl = document.getElementById("gameState");

  /* ---------- Console capture (mostra os print() do Godot) ---------- */
  const consoleEl = document.getElementById("console");
  const consoleCaptureChk = document.getElementById("consoleCapture");

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

  function hookConsole(win, source) {
    const target = win.console;
    if (!target || target.__mmaHooked) return;
    target.__mmaHooked = true;
    ["log", "info", "warn", "error"].forEach((level) => {
      const native = target[level].bind(target);
      target[level] = function () {
        const args = Array.prototype.slice.call(arguments);
        appendConsole(level, args);
        onGameMessage(level, args);
        native.apply(null, args);
      };
    });
    win.addEventListener("error", (e) => {
      appendConsole("error", ["[" + source + "] " + (e.message || e.type)]);
    });
    win.addEventListener("unhandledrejection", (e) => {
      appendConsole("error", ["[" + source + "] unhandled rejection: " + stringifyArg(e.reason)]);
    });
  }

  hookConsole(window, "page");

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
  const browser = (navigator.userAgent.match(/Edg|Chrome|Firefox|Safari/) || ["?"])[0];
  statsEl.textContent =
    "Visitas: " + visits + "\n" +
    "Navegador: " + (browser === "Edg" ? "Edge" : browser) +
    " | Resolução: " + window.screen.width + "x" + window.screen.height;

  /* ---------- Estado do jogo ---------- */
  function setGameState(text, ok) {
    gameStateEl.textContent = text;
    gameStateEl.style.color = ok ? "#7fd18c" : "#e8a0a0";
  }

  let started = false;
  function onGameMessage(level, args) {
    const text = args.map(stringifyArg).join(" ");
    if (!started && text.indexOf("Godot Engine v") === 0) {
      started = true;
      setGameState("pronto", true);
      log("info", "Engine iniciada: " + text.split(" - ")[0]);
    }
    if (level === "error" && !started) {
      setGameState("erro", false);
    }
  }

  /* ---------- Iframe do jogo ---------- */
  // A janela do iframe só existe depois que a navegação começa; tenta enganchar
  // o console cedo para não perder as primeiras mensagens da engine.
  let hookTimer = setInterval(tryHookFrame, 20);
  function tryHookFrame() {
    try {
      const win = frame.contentWindow;
      if (win && win.location.href.indexOf(BUILD_DIR) !== -1) {
        hookConsole(win, "game");
        if (win.console.__mmaHooked) {
          clearInterval(hookTimer);
          hookTimer = null;
        }
      }
    } catch (e) {
      /* ainda navegando */
    }
  }

  log("info", "Carregando build de " + BUILD_DIR + "/index.html ...");
  frame.addEventListener("load", () => {
    tryHookFrame();
    log("info", "Página do jogo carregada.");
    frame.focus();
  });
  frame.addEventListener("error", () => {
    setGameState("erro", false);
    log("error", "Falha ao carregar " + BUILD_DIR + "/index.html.", true);
  });

  /* ---------- Fullscreen (Esc para sair) ---------- */
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function toggleFullscreen() {
    if (!isFullscreen()) {
      if (gameHost.requestFullscreen) gameHost.requestFullscreen();
      else if (gameHost.webkitRequestFullscreen) gameHost.webkitRequestFullscreen();
      frame.focus();
      return;
    }
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  document.getElementById("fullscreenBtn").addEventListener("click", toggleFullscreen);

  /* ---------- Recarregar / copiar console ---------- */
  document.getElementById("reloadBtn").addEventListener("click", () => location.reload());
  document.getElementById("copyConsoleBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(consoleEl.innerText);
    } catch (e) {
      /* clipboard indisponível */
    }
  });
})();
