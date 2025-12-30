/**
 * HyperDuel — Single-file 1v1 typing game (Server + Client in one file)
 * Run:
 *   npm install
 *   npm start
 * Then open:
 *   http://localhost:3000
 */

import http from "http";
import crypto from "crypto";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;

/* ------------------------------ HTML (INLINE) ------------------------------ */
const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>HyperDuel — 1v1 Typing</title>
  <style>
    :root{
      --bg0:#070913;
      --bg1:#0b1028;
      --glass: rgba(255,255,255,.06);
      --stroke: rgba(255,255,255,.14);
      --text: rgba(255,255,255,.88);
      --muted: rgba(255,255,255,.62);
      --faint: rgba(255,255,255,.42);

      --cyan: #4dfcff;
      --vio: #b56bff;
      --pink:#ff4fd6;
      --lime:#4dff9a;
      --amber:#ffd24d;

      --shadow: 0 18px 55px rgba(0,0,0,.55);
      --radius: 18px;
      --radius2: 26px;

      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --ui: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
    }

    *{ box-sizing:border-box; }
    html,body{ height:100%; }
    body{
      margin:0;
      font-family: var(--ui);
      color: var(--text);
      background:
        radial-gradient(1200px 700px at 20% 10%, rgba(77,252,255,.18), transparent 60%),
        radial-gradient(900px 500px at 80% 20%, rgba(181,107,255,.18), transparent 55%),
        radial-gradient(900px 600px at 70% 90%, rgba(255,79,214,.10), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      overflow-x:hidden;
    }

    #stars{
      position:fixed;
      inset:0;
      width:100%;
      height:100%;
      z-index:-3;
    }

    .scanlines{
      position:fixed; inset:0;
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(255,255,255,.03),
          rgba(255,255,255,.03) 1px,
          transparent 2px,
          transparent 6px
        );
      mix-blend-mode: overlay;
      opacity:.25;
      pointer-events:none;
      z-index:-2;
    }
    .vignette{
      position:fixed; inset:0;
      background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.60) 95%);
      pointer-events:none;
      z-index:-1;
    }

    .topbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 18px 22px;
      gap: 16px;
    }
    .brand{ display:flex; align-items:center; gap:14px; }
    .logoMark{
      width:44px; height:44px; border-radius: 12px;
      background:
        radial-gradient(circle at 30% 25%, rgba(255,255,255,.45), transparent 55%),
        conic-gradient(from 180deg, rgba(77,252,255,.9), rgba(181,107,255,.9), rgba(255,79,214,.9), rgba(77,252,255,.9));
      box-shadow:
        0 0 0 1px rgba(255,255,255,.10),
        0 0 24px rgba(77,252,255,.22),
        0 0 34px rgba(181,107,255,.18);
    }
    .brandText .title{
      font-weight: 800;
      letter-spacing:.6px;
      font-size: 18px;
    }
    .brandText .subtitle{
      font-size: 12px;
      color: var(--muted);
      margin-top:2px;
      letter-spacing:.2px;
    }

    .statusPills{ display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
    .pill{
      display:flex; align-items:center; gap:10px;
      padding: 10px 12px;
      border-radius: 999px;
      background: var(--glass);
      border: 1px solid var(--stroke);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }
    .pill .label{ color: var(--muted); font-size: 12px; }
    .dot{
      width:10px; height:10px; border-radius:999px;
      background: rgba(255,255,255,.25);
      box-shadow: 0 0 18px rgba(255,255,255,.12);
    }
    .mono{ font-family: var(--mono); }
    .faint{ color: var(--faint); }

    .wrap{
      width: min(1200px, calc(100% - 32px));
      margin: 0 auto;
      display:grid;
      grid-template-columns: 380px 1fr;
      gap: 16px;
      padding: 10px 0 18px;
    }
    @media (max-width: 980px){
      .wrap{ grid-template-columns: 1fr; }
    }

    .panel{
      border-radius: var(--radius2);
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
      border: 1px solid var(--stroke);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
      overflow:hidden;
      position:relative;
    }
    .panel::before{
      content:"";
      position:absolute; inset:-1px;
      background:
        radial-gradient(600px 120px at 20% 0%, rgba(77,252,255,.22), transparent 55%),
        radial-gradient(600px 120px at 80% 0%, rgba(181,107,255,.20), transparent 55%);
      opacity:.9;
      pointer-events:none;
    }
    .panel > *{ position:relative; }

    .panelHeader{
      padding: 16px 18px 10px;
      display:flex;
      align-items:baseline;
      justify-content:space-between;
      gap: 12px;
    }
    .panelTitle{
      font-weight: 800;
      letter-spacing:.5px;
    }
    .panelHint{
      font-size: 12px;
      color: var(--muted);
    }

    .matchCard{
      margin: 0 16px;
      padding: 14px 14px;
      border-radius: var(--radius);
      background: rgba(0,0,0,.20);
      border: 1px solid rgba(255,255,255,.10);
    }
    .row{
      display:flex; align-items:center; justify-content:space-between;
      gap: 10px;
      padding: 8px 6px;
    }
    .tag{
      font-size: 12px;
      color: var(--muted);
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
    }
    .divider{
      height:1px;
      background: rgba(255,255,255,.12);
      margin: 10px 0;
    }
    .readyRow{
      display:flex; gap: 10px; align-items:center;
      padding-top: 6px;
    }
    .btn{
      position:relative;
      font-weight: 800;
      letter-spacing:.6px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      color: var(--text);
      border-radius: 14px;
      padding: 12px 14px;
      cursor:pointer;
      transition: transform .12s ease, filter .12s ease, background .12s ease;
      user-select:none;
    }
    .btn:disabled{
      opacity:.55;
      cursor:not-allowed;
      filter:saturate(.6);
    }
    .btn:hover:not(:disabled){ transform: translateY(-1px); background: rgba(255,255,255,.09); }
    .btn:active:not(:disabled){ transform: translateY(0px) scale(.99); }

    .primary{
      flex:1;
      border-color: rgba(77,252,255,.35);
      background: linear-gradient(180deg, rgba(77,252,255,.18), rgba(181,107,255,.10));
      box-shadow: 0 0 0 1px rgba(77,252,255,.12), 0 0 22px rgba(77,252,255,.16);
    }
    .btnGlow{
      position:absolute; inset:-1px;
      border-radius: 14px;
      background: radial-gradient(500px 80px at 50% -10px, rgba(77,252,255,.28), transparent 60%);
      opacity:.85;
      pointer-events:none;
    }
    .ghost{
      width: 92px;
      background: rgba(0,0,0,.18);
    }

    .readyStatus{
      display:flex; gap: 10px; align-items:center;
      padding: 10px 6px 0;
      color: var(--muted);
      font-size: 12px;
    }
    .readyDot{
      width: 10px; height: 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.20);
      box-shadow: 0 0 18px rgba(255,255,255,.10);
    }
    .readyDot.on{
      background: var(--lime);
      box-shadow: 0 0 18px rgba(77,255,154,.35), 0 0 34px rgba(77,255,154,.18);
    }

    .statsGrid{
      margin: 14px 16px 16px;
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .stat{
      padding: 12px 12px;
      border-radius: var(--radius);
      background: rgba(0,0,0,.18);
      border: 1px solid rgba(255,255,255,.10);
    }
    .statLabel{ font-size: 12px; color: var(--muted); }
    .statValue{ font-size: 20px; margin-top: 4px; }

    .countdown{
      margin: 0 16px;
      height: 50px;
      display:flex; align-items:center; justify-content:center;
      border-radius: var(--radius);
      background: rgba(0,0,0,.22);
      border: 1px solid rgba(255,255,255,.10);
      font-family: var(--mono);
      font-size: 22px;
      letter-spacing: 1px;
      color: rgba(255,255,255,.82);
      text-shadow: 0 0 24px rgba(77,252,255,.18);
    }

    .promptBox{
      margin: 14px 16px 0;
      padding: 16px 16px;
      border-radius: var(--radius);
      background: rgba(0,0,0,.22);
      border: 1px solid rgba(255,255,255,.10);
      min-height: 120px;
    }
    .prompt{
      font-family: var(--mono);
      font-size: 15px;
      line-height: 1.7;
      color: rgba(255,255,255,.78);
      word-wrap: break-word;
    }
    .prompt .ch{ opacity:.7; }
    .prompt .ch.ok{ opacity: 1; color: rgba(77,255,154,.95); }
    .prompt .ch.bad{ opacity: 1; color: rgba(255,100,100,.95); }
    .prompt .ch.cur{
      opacity: 1;
      color: rgba(255,255,255,.92);
      background: rgba(77,252,255,.14);
      border: 1px solid rgba(77,252,255,.22);
      border-radius: 6px;
      padding: 1px 2px;
    }

    .inputWrap{ margin: 12px 16px 0; }
    .typingInput{
      width:100%;
      padding: 14px 14px;
      border-radius: var(--radius);
      border: 1px solid rgba(255,255,255,.14);
      outline:none;
      background: rgba(0,0,0,.22);
      color: rgba(255,255,255,.92);
      font-family: var(--mono);
      font-size: 14px;
    }
    .typingInput:disabled{ opacity:.6; }
    .microHint{ margin-top: 8px; font-size: 12px; color: var(--muted); }

    .progressWrap{
      margin: 14px 16px 0;
      padding: 14px 14px;
      border-radius: var(--radius);
      background: rgba(0,0,0,.18);
      border: 1px solid rgba(255,255,255,.10);
    }
    .progressLabel{
      display:flex; justify-content:space-between; align-items:center;
      font-size: 12px; color: var(--muted);
      margin-bottom: 6px;
    }
    .bar{
      position:relative;
      height: 14px;
      border-radius: 999px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
      overflow:hidden;
      margin-bottom: 10px;
    }
    .fill{ height:100%; width:0%; border-radius: 999px; transition: width .12s linear; }
    .fill.you{ background: linear-gradient(90deg, rgba(77,252,255,.85), rgba(181,107,255,.85)); }
    .fill.opp{ background: linear-gradient(90deg, rgba(255,79,214,.80), rgba(255,210,77,.75)); }
    .spark{
      position:absolute; top:-10px; width: 12px; height: 34px; border-radius: 999px;
      opacity:.9; transform: translateX(-6px); pointer-events:none;
      background: radial-gradient(circle, rgba(255,255,255,.60), transparent 60%);
      mix-blend-mode: screen;
    }

    .resultBox{
      margin: 14px 16px 0;
      padding: 16px 16px;
      border-radius: var(--radius);
      background: rgba(0,0,0,.28);
      border: 1px solid rgba(255,255,255,.12);
    }
    .resultTitle{ font-weight: 900; letter-spacing:.7px; margin-bottom: 6px; }
    .resultText{ color: rgba(255,255,255,.78); margin-bottom: 12px; }

    .footer{ padding: 14px 18px 22px; display:flex; justify-content:center; opacity:.75; }
  </style>
</head>
<body>
  <canvas id="stars"></canvas>
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <header class="topbar">
    <div class="brand">
      <div class="logoMark"></div>
      <div class="brandText">
        <div class="title">HyperDuel</div>
        <div class="subtitle">1v1 Typing Arena</div>
      </div>
    </div>
    <div class="statusPills">
      <div class="pill" id="pillNet">
        <span class="dot"></span>
        <span id="netText">Connecting…</span>
      </div>
      <div class="pill">
        <span class="label">ID</span>
        <span class="mono" id="playerId">—</span>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="panel left">
      <div class="panelHeader">
        <div class="panelTitle">Match</div>
        <div class="panelHint" id="matchHint">Finding an opponent…</div>
      </div>

      <div class="matchCard">
        <div class="row">
          <div class="tag">You</div>
          <div class="mono" id="youTag">—</div>
        </div>
        <div class="row">
          <div class="tag">Opponent</div>
          <div class="mono" id="oppTag">—</div>
        </div>

        <div class="divider"></div>

        <div class="readyRow">
          <button class="btn primary" id="btnReady" disabled>
            <span class="btnGlow"></span>
            READY UP
          </button>
          <button class="btn ghost" id="btnLeave" disabled>Leave</button>
        </div>

        <div class="readyStatus">
          <div class="readyDot" id="youReadyDot"></div>
          <div class="readyText" id="youReadyText">You: not ready</div>
        </div>
        <div class="readyStatus">
          <div class="readyDot" id="oppReadyDot"></div>
          <div class="readyText" id="oppReadyText">Opponent: not ready</div>
        </div>
      </div>

      <div class="statsGrid">
        <div class="stat">
          <div class="statLabel">Your WPM</div>
          <div class="statValue mono" id="youWpm">0</div>
        </div>
        <div class="stat">
          <div class="statLabel">Your ACC</div>
          <div class="statValue mono" id="youAcc">100%</div>
        </div>
        <div class="stat">
          <div class="statLabel">Opp WPM</div>
          <div class="statValue mono" id="oppWpm">0</div>
        </div>
        <div class="stat">
          <div class="statLabel">Opp ACC</div>
          <div class="statValue mono" id="oppAcc">100%</div>
        </div>
      </div>
    </section>

    <section class="panel right">
      <div class="panelHeader">
        <div class="panelTitle">Arena</div>
        <div class="panelHint" id="arenaHint">Waiting for match…</div>
      </div>

      <div class="countdown" id="countdown">—</div>

      <div class="promptBox">
        <div class="prompt" id="prompt"></div>
      </div>

      <div class="inputWrap">
        <input id="typingInput" class="typingInput" type="text" autocomplete="off"
          spellcheck="false" placeholder="Type here when GO hits…" disabled />
        <div class="microHint" id="microHint">Tip: accuracy first → speed second.</div>
      </div>

      <div class="progressWrap">
        <div class="progressLabel">
          <span>You</span>
          <span class="mono" id="youPct">0%</span>
        </div>
        <div class="bar">
          <div class="fill you" id="youBar"></div>
          <div class="spark" id="youSpark"></div>
        </div>

        <div class="progressLabel">
          <span>Opponent</span>
          <span class="mono" id="oppPct">0%</span>
        </div>
        <div class="bar">
          <div class="fill opp" id="oppBar"></div>
          <div class="spark" id="oppSpark"></div>
        </div>
      </div>

      <div class="resultBox" id="resultBox" hidden>
        <div class="resultTitle" id="resultTitle">Result</div>
        <div class="resultText" id="resultText">—</div>
        <button class="btn primary" id="btnRematch">
          <span class="btnGlow"></span>
          FIND NEW MATCH
        </button>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="mono faint">HyperDuel • One-file build • WebSocket matchmaking</div>
  </footer>

  <script>
    const $ = (id) => document.getElementById(id);

    const pillNet = $("pillNet");
    const netText = $("netText");
    const playerIdEl = $("playerId");

    const matchHint = $("matchHint");
    const arenaHint = $("arenaHint");

    const youTag = $("youTag");
    const oppTag = $("oppTag");

    const btnReady = $("btnReady");
    const btnLeave = $("btnLeave");
    const btnRematch = $("btnRematch");

    const youReadyDot = $("youReadyDot");
    const oppReadyDot = $("oppReadyDot");
    const youReadyText = $("youReadyText");
    const oppReadyText = $("oppReadyText");

    const countdownEl = $("countdown");
    const promptEl = $("prompt");
    const typingInput = $("typingInput");

    const youWpmEl = $("youWpm");
    const youAccEl = $("youAcc");
    const oppWpmEl = $("oppWpm");
    const oppAccEl = $("oppAcc");

    const youPctEl = $("youPct");
    const oppPctEl = $("oppPct");
    const youBar = $("youBar");
    const oppBar = $("oppBar");
    const youSpark = $("youSpark");
    const oppSpark = $("oppSpark");

    const resultBox = $("resultBox");
    const resultTitle = $("resultTitle");
    const resultText = $("resultText");

    let ws;
    let myId = null;
    let roomId = null;

    let raceText = "";
    let spans = [];

    let raceStarted = false;
    let startTime = 0;

    let typedTotal = 0;
    let typedCorrect = 0;
    let cursor = 0;

    let lastSentAt = 0;
    let finished = false;

    function setNet(ok, text) {
      netText.textContent = text;
      const dot = pillNet.querySelector(".dot");
      dot.style.background = ok ? "rgba(77,255,154,.95)" : "rgba(255,100,100,.85)";
    }

    function setPromptText(text) {
      raceText = text || "";
      promptEl.innerHTML = "";
      spans = [];
      for (let i = 0; i < raceText.length; i++) {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = raceText[i];
        promptEl.appendChild(s);
        spans.push(s);
      }
      updateCursorHighlight();
    }

    function updateCursorHighlight() {
      spans.forEach((s) => s.classList.remove("cur"));
      if (spans[cursor]) spans[cursor].classList.add("cur");
    }

    function setProgress(mePct, opPct) {
      youPctEl.textContent = \`\${Math.round(mePct)}%\`;
      oppPctEl.textContent = \`\${Math.round(opPct)}%\`;
      youBar.style.width = \`\${mePct}%\`;
      oppBar.style.width = \`\${opPct}%\`;
      youSpark.style.left = \`calc(\${mePct}% - 6px)\`;
      oppSpark.style.left = \`calc(\${opPct}% - 6px)\`;
    }

    function calcStats() {
      if (!raceStarted || !startTime) return { wpm: 0, acc: 100 };
      const now = performance.now();
      const mins = Math.max(0.001, (now - startTime) / 60000);
      const wpm = (typedCorrect / 5) / mins;
      const acc = typedTotal === 0 ? 100 : (typedCorrect / typedTotal) * 100;
      return { wpm: Math.round(wpm), acc: Math.max(0, Math.min(100, acc)) };
    }

    function updateMyStatsUI() {
      const { wpm, acc } = calcStats();
      youWpmEl.textContent = String(wpm);
      youAccEl.textContent = \`\${acc.toFixed(0)}%\`;
      return { wpm, acc };
    }

    function send(type, payload = {}) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...payload }));
      }
    }

    function startCountdown() {
      typingInput.disabled = true;
      const steps = ["3", "2", "1", "GO"];
      let idx = 0;
      countdownEl.textContent = steps[idx];

      const t = setInterval(() => {
        idx++;
        countdownEl.textContent = steps[idx] || "LIVE";
        if (idx >= steps.length - 1) {
          clearInterval(t);
          countdownEl.textContent = "LIVE";
          raceStarted = true;
          startTime = performance.now();
          typingInput.disabled = false;
          typingInput.focus();
        }
      }, 650);
    }

    function endRaceUI(title, text) {
      finished = true;
      typingInput.disabled = true;
      arenaHint.textContent = "Match ended.";
      resultTitle.textContent = title;
      resultText.textContent = text;
      resultBox.hidden = false;
      btnRematch.disabled = false;
    }

    function connect() {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(\`\${proto}://\${location.host}/ws\`);

      ws.addEventListener("open", () => setNet(true, "Online"));
      ws.addEventListener("close", () => setNet(false, "Disconnected"));

      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);

        if (msg.type === "hello") {
          myId = msg.id;
          playerIdEl.textContent = myId;
          youTag.textContent = myId;
          return;
        }

        if (msg.type === "queue") {
          matchHint.textContent = "Finding an opponent…";
          arenaHint.textContent = "Waiting for match…";
          btnReady.disabled = true;
          btnLeave.disabled = true;
          typingInput.disabled = true;
          setPromptText("Matchmaking…");
          setProgress(0, 0);
          resultBox.hidden = true;
          finished = false;
          raceStarted = false;
          cursor = 0;
          typedTotal = 0;
          typedCorrect = 0;
          return;
        }

        if (msg.type === "matchFound") {
          roomId = msg.roomId;
          oppTag.textContent = msg.opponent;
          matchHint.textContent = "Opponent found. Ready up!";
          arenaHint.textContent = "Press READY when you’re locked in.";
          btnReady.disabled = false;
          btnLeave.disabled = false;
          setPromptText(msg.text);
          setProgress(0, 0);
          countdownEl.textContent = "READY";
          typingInput.value = "";
          typingInput.disabled = true;
          resultBox.hidden = true;
          finished = false;
          raceStarted = false;
          cursor = 0;
          typedTotal = 0;
          typedCorrect = 0;
          return;
        }

        if (msg.type === "readyState") {
          youReadyDot.classList.toggle("on", !!msg.youReady);
          oppReadyDot.classList.toggle("on", !!msg.oppReady);
          youReadyText.textContent = msg.youReady ? "You: READY" : "You: not ready";
          oppReadyText.textContent = msg.oppReady ? "Opponent: READY" : "Opponent: not ready";
          return;
        }

        if (msg.type === "raceStart") {
          startCountdown();
          return;
        }

        if (msg.type === "opponentProgress") {
          oppWpmEl.textContent = String(Math.round(msg.wpm || 0));
          oppAccEl.textContent = \`\${Math.round(msg.acc || 0)}%\`;
          const opPct = Math.max(0, Math.min(100, msg.pct || 0));
          const myPct = parseFloat(youBar.style.width) || 0;
          setProgress(myPct, opPct);
          return;
        }

        if (msg.type === "opponentLeft") {
          endRaceUI("Opponent disconnected", "You win by default.");
          return;
        }

        if (msg.type === "raceEnd") {
          if (finished) return;
          finished = true;
          typingInput.disabled = true;
          const { wpm, acc } = updateMyStatsUI();
          if (!msg.winner) endRaceUI("Time!", \`Nobody finished. You: \${wpm} WPM, \${acc.toFixed(0)}% ACC\`);
          else if (msg.winner === myId) endRaceUI("VICTORY", \`You finished first — \${wpm} WPM, \${acc.toFixed(0)}% ACC\`);
          else endRaceUI("DEFEAT", \`Opponent finished first — your \${wpm} WPM, \${acc.toFixed(0)}% ACC\`);
        }
      });
    }

    btnReady.addEventListener("click", () => { if (roomId) { btnReady.disabled = true; send("ready"); }});
    btnLeave.addEventListener("click", () => { send("leave"); location.reload(); });
    btnRematch.addEventListener("click", () => location.reload());

    typingInput.addEventListener("input", () => {
      if (!raceStarted || finished) return;
      const val = typingInput.value;
      const newLen = val.length;

      if (newLen < cursor) {
        for (let i = newLen; i < cursor; i++) spans[i]?.classList.remove("ok", "bad");
        cursor = newLen;
        updateCursorHighlight();
      } else {
        for (let i = cursor; i < newLen; i++) {
          const correct = val[i] === (raceText[i] ?? "");
          typedTotal += 1;
          if (correct) typedCorrect += 1;
          spans[i]?.classList.remove("ok", "bad");
          spans[i]?.classList.add(correct ? "ok" : "bad");
          cursor = i + 1;
        }
        updateCursorHighlight();
      }

      const pct = (cursor / Math.max(1, raceText.length)) * 100;
      const { wpm, acc } = updateMyStatsUI();
      const opPct = parseFloat(oppBar.style.width) || 0;
      setProgress(pct, opPct);

      const now = performance.now();
      if (now - lastSentAt > 90) {
        lastSentAt = now;
        send("progress", { pct, wpm, acc });
      }

      if (cursor >= raceText.length) {
        finished = true;
        typingInput.disabled = true;
        send("finish");
      }
    });

    // starfield
    const canvas = document.getElementById("stars");
    const ctx = canvas.getContext("2d");
    let W=0,H=0,stars=[],t0=performance.now();
    function resize(){
      W = canvas.width = Math.floor(innerWidth * devicePixelRatio);
      H = canvas.height = Math.floor(innerHeight * devicePixelRatio);
      canvas.style.width="100%"; canvas.style.height="100%";
      const count = Math.floor((innerWidth*innerHeight)/9000);
      stars = new Array(count).fill(0).map(()=>({
        x:Math.random()*W,y:Math.random()*H,z:Math.random(),
        r:(Math.random()*1.5+0.3)*devicePixelRatio,
        v:(Math.random()*0.25+0.08)*devicePixelRatio
      }));
    }
    addEventListener("resize", resize); resize();
    function draw(now){
      const dt=Math.min(32, now-t0); t0=now;
      ctx.clearRect(0,0,W,H);
      for(const s of stars){
        s.y += s.v*dt*(0.55+s.z);
        if(s.y>H+10){ s.y=-10; s.x=Math.random()*W; s.z=Math.random(); }
        const a=0.18+s.z*0.55;
        ctx.beginPath();
        ctx.fillStyle=\`rgba(255,255,255,\${a})\`;
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    connect();
  </script>
</body>
</html>`;

/* ------------------------------ SERVER LOGIC ------------------------------ */

const TEXTS = [
  "Neon storms roll over silent satellites as the pilot steadies their hands and types like lightning.",
  "A clean mind makes clean keystrokes—focus on accuracy, let speed arrive naturally, then accelerate.",
  "Hyperglass panels shimmer while engines hum; two rivals race across words, not miles.",
  "Distraction is cosmic dust: it looks harmless until it clogs your orbit. Keep your cursor on the now.",
  "Precision beats panic. Hit the right keys, breathe, and watch your progress climb into the glow.",
  "In the void, there is only rhythm: press, release, correct, and move forward with calm control."
];

function pickText(){ return TEXTS[Math.floor(Math.random()*TEXTS.length)]; }
function makeId(prefix=""){ return prefix + crypto.randomBytes(8).toString("hex"); }

const server = http.createServer((req, res) => {
  if (req.url === "/" || (req.url && req.url.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok:true }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server, path: "/ws" });

let waitingClient = null;              // { ws, id }
const clients = new Map();             // ws -> { id, roomId }
const rooms = new Map();               // roomId -> room
// room: { id,aWs,bWs,aId,bId,text,aReady,bReady,started,finishedBy,timeout }

function send(ws, type, payload = {}) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...payload }));
}
function roomOf(ws){
  const info = clients.get(ws);
  if (!info?.roomId) return null;
  return rooms.get(info.roomId) || null;
}
function opponentWs(room, ws){ return room.aWs === ws ? room.bWs : room.aWs; }

function sendReadyState(room){
  send(room.aWs, "readyState", { youReady: !!room.aReady, oppReady: !!room.bReady });
  send(room.bWs, "readyState", { youReady: !!room.bReady, oppReady: !!room.aReady });
}
function cleanupRoom(roomId){
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.timeout) clearTimeout(room.timeout);
  for (const [ws, info] of clients.entries()) {
    if (info.roomId === roomId) info.roomId = null;
  }
  rooms.delete(roomId);
}
function pairClients(c1, c2){
  const roomId = makeId("room_");
  const room = {
    id: roomId,
    aWs: c1.ws, bWs: c2.ws,
    aId: c1.id, bId: c2.id,
    text: pickText(),
    aReady:false, bReady:false,
    started:false, finishedBy:null, timeout:null
  };
  rooms.set(roomId, room);
  clients.get(c1.ws).roomId = roomId;
  clients.get(c2.ws).roomId = roomId;

  send(c1.ws, "matchFound", { roomId, you: c1.id, opponent: c2.id, text: room.text });
  send(c2.ws, "matchFound", { roomId, you: c2.id, opponent: c1.id, text: room.text });
  sendReadyState(room);
}
function startRoom(room){
  if (!room || room.started) return;
  room.started = true;
  const startAt = Date.now();
  send(room.aWs, "raceStart", { startAt });
  send(room.bWs, "raceStart", { startAt });

  room.timeout = setTimeout(() => {
    if (!rooms.has(room.id)) return;
    send(room.aWs, "raceEnd", { winner: null, reason: "time_limit" });
    send(room.bWs, "raceEnd", { winner: null, reason: "time_limit" });
    cleanupRoom(room.id);
  }, 90_000);
}

wss.on("connection", (ws) => {
  const id = makeId("p_");
  clients.set(ws, { id, roomId: null });
  send(ws, "hello", { id });

  if (waitingClient && waitingClient.ws.readyState === ws.OPEN) {
    const c1 = waitingClient;
    waitingClient = null;
    pairClients(c1, { ws, id });
  } else {
    waitingClient = { ws, id };
    send(ws, "queue", { status: "waiting" });
  }

  ws.on("message", (buf) => {
    let msg;
    try { msg = JSON.parse(buf.toString()); } catch { return; }

    const room = roomOf(ws);

    if (msg.type === "ready") {
      if (!room) return;
      if (room.aWs === ws) room.aReady = true;
      if (room.bWs === ws) room.bReady = true;
      sendReadyState(room);
      if (room.aReady && room.bReady) startRoom(room);
      return;
    }

    if (msg.type === "progress") {
      if (!room || !room.started) return;
      const pct = Math.max(0, Math.min(100, Number(msg.pct) || 0));
      const wpm = Math.max(0, Number(msg.wpm) || 0);
      const acc = Math.max(0, Math.min(100, Number(msg.acc) || 0));
      send(opponentWs(room, ws), "opponentProgress", { pct, wpm, acc });
      return;
    }

    if (msg.type === "finish") {
      if (!room || !room.started || room.finishedBy) return;
      room.finishedBy = clients.get(ws)?.id || "unknown";
      send(room.aWs, "raceEnd", { winner: room.finishedBy, reason: "finished" });
      send(room.bWs, "raceEnd", { winner: room.finishedBy, reason: "finished" });
      cleanupRoom(room.id);
      return;
    }

    if (msg.type === "leave") {
      if (!room) return;
      send(opponentWs(room, ws), "opponentLeft", {});
      cleanupRoom(room.id);
    }
  });

  ws.on("close", () => {
    if (waitingClient && waitingClient.ws === ws) waitingClient = null;
    const info = clients.get(ws);
    if (info?.roomId) {
      const room = rooms.get(info.roomId);
      if (room) {
        send(opponentWs(room, ws), "opponentLeft", {});
        cleanupRoom(info.roomId);
      }
    }
    clients.delete(ws);
  });
});

server.listen(PORT, () => console.log(\`HyperDuel running at http://localhost:\${PORT}\`));
