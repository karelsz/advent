// games/day5.js - Minihra: Rozmotávání vánočního řetězu (15 světýlek, kontrola po puštění)
window.adventGames = window.adventGames || {};

window.adventGames[5] = {
  title: "Rozmotávání světýlek",
  instructions: "Rozmotej vánoční řetěz z 15 světýlek! Přetahuj žárovky tak, aby se kabel nikde nekřížil. Výhra se vyhodnotí po puštění prstu.",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let timerInterval;

    let timerStarted = false;
    let startTime = null;
    let elapsedSeconds = 0;
    let isGameOver = false;

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(5) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus(crossCount = 0) {
      const topLabel = topScoreValue !== null ? `${topScoreValue}s (${topHolderName})` : 'Zatím nikdo';
      if (isGameOver) {
        statusText.innerText = `🎉 Rozmotáno za ${elapsedSeconds}s! | TOP: ${topLabel}`;
      } else {
        statusText.innerText = `⏱️ ${elapsedSeconds}s | Křížení: ${crossCount} | TOP: ${topLabel}`;
      }
    }
    updateStatus(0);

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(5).then(rec => {
        if (rec) {
          topScoreValue = rec.score;
          topHolderName = rec.player_name;
          updateStatus(lastCrossCount);
        }
      }).catch(() => {});
    }

    function startTimer() {
      if (timerStarted) return;
      timerStarted = true;
      startTime = Date.now();
      timerInterval = setInterval(() => {
        if (!isGameOver) {
          elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          updateStatus(lastCrossCount);
        }
      }, 1000);
    }

    const PALETTE = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
      '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
      '#a855f7', '#ec4899', '#f43f5e', '#14b8a6'
    ];

    const TOTAL_NODES = 15;

    // 1 souvislý řetěz: 0 - 1 - 2 - ... - 14 (přesně 14 kabelů)
    const EDGES = [];
    for (let i = 0; i < TOTAL_NODES - 1; i++) {
      EDGES.push([i, i + 1]);
    }

    // 1. Vytvoření zaručeně rozmotatelných pozic po vlnovkách
  // 1. Spočítáme 15 pozic ve vlnovce (zaručeně nekřížící se základ)
    const basePositions = [];
    const rows = 5;
    const cols = 3;
    const startX = 55;
    const endX = 265;
    const startY = 85;
    const endY = 365;

    for (let i = 0; i < TOTAL_NODES; i++) {
      const row = Math.floor(i / cols);
      const colInRow = i % cols;
      const actualCol = (row % 2 === 0) ? colInRow : (cols - 1 - colInRow);

      const x = startX + (actualCol / (cols - 1)) * (endX - startX);
      const y = startY + (row / (rows - 1)) * (endY - startY);
      basePositions.push({ x, y });
    }

    // 2. Náhodné zamíchání, dokud nevznikne správně zamotaný rébus (4 až 9 křížení)
    let nodes = [];
    let attempts = 0;

    do {
      attempts++;
      // Vytvoříme náhodnou permutaci indexů
      let shuffledSlots = Array.from({ length: TOTAL_NODES }, (_, i) => i);
      for (let i = shuffledSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledSlots[i], shuffledSlots[j]] = [shuffledSlots[j], shuffledSlots[i]];
      }

      nodes = [];
      for (let i = 0; i < TOTAL_NODES; i++) {
        const targetPos = basePositions[shuffledSlots[i]];
        // Jemný náhodný posun pro přirozenější rozházený vzhled
        const jitterX = (Math.random() - 0.5) * 14;
        const jitterY = (Math.random() - 0.5) * 14;

        nodes.push({
          id: i,
          color: PALETTE[i % PALETTE.length],
          x: Math.round(targetPos.x + jitterX),
          y: Math.round(targetPos.y + jitterY),
          radius: 11
        });
      }
      // Opakujeme, dokud není křížení dostatečné (nebo po 100 pokusech)
    } while ((getCrossedEdges().length < 4 || getCrossedEdges().length > 10) && attempts < 100);

    // Vektorový součin a kontrola křížení úseček
    function crossProduct(ax, ay, bx, by) {
      return ax * by - ay * bx;
    }

    function isSegmentIntersecting(p1, p2, p3, p4) {
      const d1x = p2.x - p1.x;
      const d1y = p2.y - p1.y;
      const d2x = p4.x - p3.x;
      const d2y = p4.y - p3.y;

      const cp1 = crossProduct(d1x, d1y, p3.x - p1.x, p3.y - p1.y);
      const cp2 = crossProduct(d1x, d1y, p4.x - p1.x, p4.y - p1.y);
      const cp3 = crossProduct(d2x, d2y, p1.x - p3.x, p1.y - p3.y);
      const cp4 = crossProduct(d2x, d2y, p2.x - p3.x, p2.y - p3.y);

      return (
        ((cp1 > 0 && cp2 < 0) || (cp1 < 0 && cp2 > 0)) &&
        ((cp3 > 0 && cp4 < 0) || (cp3 < 0 && cp4 > 0))
      );
    }

    function getCrossedEdges() {
      let crossed = new Set();
      for (let i = 0; i < EDGES.length; i++) {
        for (let j = i + 1; j < EDGES.length; j++) {
          const [u1, v1] = EDGES[i];
          const [u2, v2] = EDGES[j];

          // Sousední díly se nekříží
          if (u1 === u2 || u1 === v2 || v1 === u2 || v1 === v2) continue;

          if (isSegmentIntersecting(nodes[u1], nodes[v1], nodes[u2], nodes[v2])) {
            crossed.add(i);
            crossed.add(j);
          }
        }
      }
      return Array.from(crossed);
    }

    let lastCrossCount = getCrossedEdges().length;
    let draggedNode = null;
    let dragOffset = { x: 0, y: 0 };
    let winGlowAnim = 0;

    // Vítězství
    async function handleWin() {
      if (isGameOver) return;
      isGameOver = true;
      if (timerInterval) clearInterval(timerInterval);

      const finalTime = Math.max(1, elapsedSeconds);

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        await window.adventScores.recordScoreOnline(5, finalTime);
      }

      let msg = `✨ Všech 15 světýlek svítí! (${finalTime}s) `;
      if (!topScoreValue || finalTime < topScoreValue) {
        msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
      } else if (!myBestInitial || finalTime < myBestInitial) {
        msg += `🌟 Tvůj osobní rekord!`;
      }

      statusText.innerText = msg;
      onComplete(finalTime);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pozadí
      ctx.fillStyle = '#0a1120';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Horní stavová lišta
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 42);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px sans-serif';

      const crossedIndices = isGameOver ? [] : getCrossedEdges();
      lastCrossCount = crossedIndices.length;

      if (isGameOver) {
        ctx.fillStyle = '#facc15';
        ctx.fillText('🌟 15 SVĚTÝLEK ROZSVÍCENO! 🌟', canvas.width / 2, 21);
      } else if (crossedIndices.length > 0) {
        ctx.fillStyle = '#f87171';
        ctx.fillText(`🔴 Křížení: ${crossedIndices.length} (pusť prst po přesunu)`, canvas.width / 2, 21);
      } else {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('🟢 Žádné křížení! Pusť prst pro potvrzení', canvas.width / 2, 21);
      }

      // 1. Kreslení kabelu
      EDGES.forEach((edge, idx) => {
        const n1 = nodes[edge[0]];
        const n2 = nodes[edge[1]];
        const isCrossed = crossedIndices.includes(idx);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);

        if (isGameOver) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
        } else if (isCrossed) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 2. Kreslení žárovek
      nodes.forEach((n, idx) => {
        const isDragging = (draggedNode && draggedNode.id === n.id);
        const glowRadius = isGameOver ? 20 + Math.sin(winGlowAnim + idx) * 4 : (isDragging ? 18 : 11);

        // Záře
        const grad = ctx.createRadialGradient(n.x, n.y, 3, n.x, n.y, glowRadius);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Tělo žárovky
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Okraj
        ctx.strokeStyle = isDragging ? '#facc15' : '#ffffff';
        ctx.lineWidth = isDragging ? 2.5 : 1.5;
        ctx.stroke();

        // Odlesk
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(n.x - 3, n.y - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Zástrčka na začátku
        if (n.id === 0) {
          ctx.font = '14px sans-serif';
          ctx.fillText('🔌', n.x - 18, n.y - 12);
        }
      });

      if (isGameOver) {
        winGlowAnim += 0.08;
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function onPointerDown(e) {
      if (isGameOver) return;
      const pos = getPos(e);

      // Velkorysý hit-radius (22 px), aby se světýlko snadno chytalo i na mobilu
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(pos.x - n.x, pos.y - n.y) <= n.radius + 12) {
          draggedNode = n;
          dragOffset.x = pos.x - n.x;
          dragOffset.y = pos.y - n.y;
          startTimer();
          break;
        }
      }
    }

    function onPointerMove(e) {
      if (!draggedNode || isGameOver) return;
      const pos = getPos(e);

      const padding = 16;
      const topBarHeight = 52;
      draggedNode.x = Math.max(padding, Math.min(canvas.width - padding, pos.x - dragOffset.x));
      draggedNode.y = Math.max(topBarHeight + padding, Math.min(canvas.height - padding, pos.y - dragOffset.y));
    }

    // KONTROLA VÝHRY AŽ PO PUSTĚNÍ PRSTU / MYŠI
    function onPointerUp() {
      if (!draggedNode && !timerStarted) return;
      draggedNode = null;

      // Zkontrolujeme až teď, když hráč prst pustil
      if (!isGameOver && timerStarted) {
        const remainingCrosses = getCrossedEdges();
        if (remainingCrosses.length === 0) {
          handleWin();
        }
      }
    }

    this.touchStart = (e) => { e.preventDefault(); onPointerDown(e); };
    this.touchMove = (e) => { e.preventDefault(); onPointerMove(e); };
    this.touchEnd = (e) => { e.preventDefault(); onPointerUp(); };

    this.mouseDown = (e) => onPointerDown(e);
    this.mouseMove = (e) => onPointerMove(e);
    this.mouseUp = (e) => onPointerUp();

    canvas.addEventListener('touchstart', this.touchStart, { passive: false });
    canvas.addEventListener('touchmove', this.touchMove, { passive: false });
    canvas.addEventListener('touchend', this.touchEnd, { passive: false });

    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('mousemove', this.mouseMove);
    canvas.addEventListener('mouseup', this.mouseUp);

    draw();

    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timerInterval) clearInterval(timerInterval);

      canvas.removeEventListener('touchstart', this.touchStart);
      canvas.removeEventListener('touchmove', this.touchMove);
      canvas.removeEventListener('touchend', this.touchEnd);

      canvas.removeEventListener('mousedown', this.mouseDown);
      canvas.removeEventListener('mousemove', this.mouseMove);
      canvas.removeEventListener('mouseup', this.mouseUp);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};