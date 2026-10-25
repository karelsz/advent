// games/day7.js - Minihra: Šplhání po stromečku (Doodle Jump styl - opravená kamera a start)
window.adventGames = window.adventGames || {};

window.adventGames[7] = {
  title: "Šplhání po stromečku",
  instructions: "Vyskákej se skřítkem po větvích až na špičku stromečku k hvězdě! Tahem do stran řiď skok. Pozor na ledové pasti (vrátí tě na start) a praskající větve!",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let timerInterval;

    let timerStarted = false;
    let startTime = null;
    let elapsedSeconds = 0;
    let isGameOver = false;

    const TREE_TOP_HEIGHT = 1600;

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(7) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus(extra = "") {
      const topLabel = topScoreValue !== null ? `${topScoreValue}s (${topHolderName})` : 'Zatím nikdo';
      const progressPercent = Math.min(100, Math.floor((maxAltitude / TREE_TOP_HEIGHT) * 100));
      if (extra) {
        statusText.innerText = `${extra} | TOP: ${topLabel}`;
      } else {
        statusText.innerText = `⏱️ ${elapsedSeconds}s | Výška: ${progressPercent}% | TOP: ${topLabel}`;
      }
    }
    updateStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(7).then(rec => {
        if (rec) {
          topScoreValue = rec.score;
          topHolderName = rec.player_name;
          updateStatus();
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
          updateStatus();
        }
      }, 1000);
    }

    // Fyzika skřítka
    const START_Y = 320;
    const player = {
      x: 147,
      y: START_Y,
      vx: 0,
      vy: -7, // Mírný první odraz při startu
      w: 26,
      h: 26,
      facing: 1
    };

    const GRAVITY = 0.36;
    const JUMP_STRENGTH = -9.6;

    // Kamera začíná ukotvená na spodní části canvasu
    let cameraY = START_Y - 220;
    let maxAltitude = 0;
    let trapMessageTimeout = null;
    let warningBanner = "";

    // Generování větví a pastí
    let platforms = [];

    function generateLevel() {
      platforms = [];
      // Výchozí pevná podesta přímo pod skřítkem
      platforms.push({ x: 90, y: 350, w: 140, h: 14, type: 'normal', broken: false });

      let currentY = 290;
      while (currentY > -TREE_TOP_HEIGHT) {
        const gap = 46 + Math.random() * 26;
        currentY -= gap;

        const w = 60 + Math.random() * 25;
        const x = 20 + Math.random() * (canvas.width - w - 40);

        let type = 'normal';
        const rand = Math.random();
        if (rand < 0.22 && currentY < 180) {
          type = 'fragile'; // Praskne po 1 odrazu
        } else if (rand < 0.38 && currentY < 80 && currentY > -TREE_TOP_HEIGHT + 140) {
          type = 'trap'; // Ledová past (pád na začátek)
        }

        platforms.push({
          x: Math.round(x),
          y: Math.round(currentY),
          w: Math.round(w),
          h: 12,
          type: type,
          broken: false
        });
      }

      // Hvězda na samé špičce
      platforms.push({
        x: 120,
        y: -TREE_TOP_HEIGHT,
        w: 80,
        h: 16,
        type: 'star',
        broken: false
      });
    }

    generateLevel();

    function triggerTrapReset(reason) {
      warningBanner = reason;
      if (trapMessageTimeout) clearTimeout(trapMessageTimeout);
      trapMessageTimeout = setTimeout(() => { warningBanner = ""; }, 2200);

      player.x = 147;
      player.y = START_Y;
      player.vx = 0;
      player.vy = JUMP_STRENGTH * 0.7;
      cameraY = START_Y - 220;
    }

    async function handleWin() {
      if (isGameOver) return;
      isGameOver = true;
      if (timerInterval) clearInterval(timerInterval);

      const finalTime = Math.max(1, elapsedSeconds);

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        await window.adventScores.recordScoreOnline(7, finalTime);
      }

      let msg = `🌟 Špička pokořena za ${finalTime}s! `;
      if (!topScoreValue || finalTime < topScoreValue) {
        msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
      } else if (!myBestInitial || finalTime < myBestInitial) {
        msg += `🌟 Tvůj osobní rekord!`;
      }

      statusText.innerText = msg;
      onComplete(finalTime);
    }

    // Ovládání
    let targetX = 160;
    let isTouching = false;
    const keys = { left: false, right: false };

    function handlePointer(clientX) {
      startTimer();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      targetX = (clientX - rect.left) * scaleX;
    }

    function updatePhysics() {
      if (isGameOver) return;

      if (keys.left) player.vx = -4.2;
      else if (keys.right) player.vx = 4.2;
      else if (isTouching) {
        const dx = targetX - (player.x + player.w / 2);
        player.vx = Math.max(-5, Math.min(5, dx * 0.25));
      } else {
        player.vx *= 0.85;
      }

      if (player.vx > 0.4) player.facing = 1;
      else if (player.vx < -0.4) player.facing = -1;

      player.x += player.vx;

      // Wrap around okraje
      if (player.x < -player.w) player.x = canvas.width;
      if (player.x > canvas.width) player.x = -player.w;

      // Gravitace
      player.vy += GRAVITY;
      player.y += player.vy;

      // Kolize s větvemi jen při pohybu dolů
      if (player.vy > 0) {
        const footY = player.y + player.h;
        const prevFootY = footY - player.vy;

        for (let i = 0; i < platforms.length; i++) {
          const p = platforms[i];
          if (p.broken) continue;

          if (
            footY >= p.y && prevFootY <= p.y + 10 &&
            player.x + player.w >= p.x && player.x <= p.x + p.w
          ) {
            if (p.type === 'star') {
              player.vy = -3;
              handleWin();
            } else if (p.type === 'trap') {
              triggerTrapReset("🧊 Ledová past! Spadl jsi na start!");
            } else if (p.type === 'fragile') {
              p.broken = true;
              player.vy = JUMP_STRENGTH * 0.9;
            } else {
              player.vy = JUMP_STRENGTH;
            }
            break;
          }
        }
      }

      // Kamera se posouvá POUZE nahoru
      const targetCamY = player.y - 220;
      if (targetCamY < cameraY) {
        cameraY = targetCamY;
      }

      const currentAlt = Math.max(0, Math.floor(START_Y - player.y));
      if (currentAlt > maxAltitude) {
        maxAltitude = currentAlt;
      }

      // Pád pod kameru
      if (player.y > cameraY + canvas.height + 30) {
        triggerTrapReset("⚠️ Pád z větve! Zpět na začátek!");
      }
    }

    function draw() {
      updatePhysics();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pozadí
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(0, -cameraY);

      // Kmen stromečku uprostřed
      ctx.fillStyle = '#1e1308';
      ctx.fillRect(canvas.width / 2 - 12, -TREE_TOP_HEIGHT - 40, 24, TREE_TOP_HEIGHT + 450);

      // 1. Větve
      platforms.forEach(p => {
        if (p.y < cameraY - 40 || p.y > cameraY + canvas.height + 40) return;
        if (p.broken) return;

        if (p.type === 'star') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 6);
          ctx.fill();

          ctx.font = '36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', p.x + p.w / 2, p.y - 12);
        } else if (p.type === 'trap') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 4);
          ctx.fill();

          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧊', p.x + p.w / 2, p.y + 8);
        } else if (p.type === 'fragile') {
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 4);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x + 3, p.y - 2, p.w - 6, 3);
        } else {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 5);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);

          if (p.w > 65) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(p.x + 10, p.y + p.h + 4, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 2. Skřítek
      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
      if (player.facing === -1) {
        ctx.scale(-1, 1);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '26px sans-serif';
      ctx.fillText('🧝', 0, -2);
      ctx.restore();

      ctx.restore(); // Konec posunu kamery

      // Horní stavová lišta (kreslí se na pevné místo mimo kameru)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px sans-serif';

      if (isGameOver) {
        ctx.fillStyle = '#facc15';
        ctx.fillText('🌟 HVĚZDA DOSAŽENA! 🌟', canvas.width / 2, 18);
      } else if (warningBanner) {
        ctx.fillStyle = '#f87171';
        ctx.fillText(warningBanner, canvas.width / 2, 18);
      } else {
        ctx.fillStyle = '#38bdf8';
        const pct = Math.min(100, Math.floor((maxAltitude / TREE_TOP_HEIGHT) * 100));
        ctx.fillText(`🎄 Vrchol: ${pct}% | Špička: 100%`, canvas.width / 2, 18);
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    this.touchStart = (e) => {
      e.preventDefault();
      isTouching = true;
      handlePointer(e.touches[0].clientX);
    };
    this.touchMove = (e) => {
      e.preventDefault();
      if (isTouching) handlePointer(e.touches[0].clientX);
    };
    this.touchEnd = (e) => {
      e.preventDefault();
      isTouching = false;
    };

    this.mouseDown = (e) => {
      isTouching = true;
      handlePointer(e.clientX);
    };
    this.mouseMove = (e) => {
      if (isTouching) handlePointer(e.clientX);
    };
    this.mouseUp = () => {
      isTouching = false;
    };

    this.keyDown = (e) => {
      startTimer();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    };
    this.keyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    };

    canvas.addEventListener('touchstart', this.touchStart, { passive: false });
    canvas.addEventListener('touchmove', this.touchMove, { passive: false });
    canvas.addEventListener('touchend', this.touchEnd, { passive: false });

    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('mousemove', this.mouseMove);
    canvas.addEventListener('mouseup', this.mouseUp);

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);

    draw();

    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timerInterval) clearInterval(timerInterval);
      if (trapMessageTimeout) clearTimeout(trapMessageTimeout);

      canvas.removeEventListener('touchstart', this.touchStart);
      canvas.removeEventListener('touchmove', this.touchMove);
      canvas.removeEventListener('touchend', this.touchEnd);

      canvas.removeEventListener('mousedown', this.mouseDown);
      canvas.removeEventListener('mousemove', this.mouseMove);
      canvas.removeEventListener('mouseup', this.mouseUp);

      window.removeEventListener('keydown', this.keyDown);
      window.removeEventListener('keyup', this.keyUp);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};