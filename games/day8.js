// games/day8.js - Sestřelování rampouchů sněhovou koulí (Slingshot / Angry Birds styl)
window.adventGames = window.adventGames || {};

window.adventGames[8] = {
  title: "Sestřelování rampouchů",
  instructions: "Natáhni sněhovou kouli v praku tahem dolů, zamiř a pusť! Sestřeluj rampouchy ze střechy. Pozor, postupně dorůstají! Máš 30 sekund.",

  start: function(canvas, statusText, onComplete) {
    canvas.width = 320;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    let animId = null;
    let timerInt = null;
    let timerStarted = false;
    let timeLeft = 30;
    let score = 0;
    let isGameOver = false;

    // Rekordy
    let myBest = window.adventScores ? window.adventScores.getPersonalBest(8) : null;
    let topScore = null;
    let topHolder = 'Zatím nikdo';

    function refreshStatus() {
      const topLabel = topScore !== null ? `${topScore} b. (${topHolder})` : 'Zatím nikdo';
      if (isGameOver) {
        statusText.innerText = `🎉 Konec! Tvoje skóre: ${score} b. | TOP: ${topLabel}`;
      } else {
        statusText.innerText = `⏱️ ${timeLeft}s | Skóre: ${score} b. | TOP: ${topLabel}`;
      }
    }
    refreshStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(8).then(rec => {
        if (rec) {
          topScore = rec.score;
          topHolder = rec.player_name;
          refreshStatus();
        }
      }).catch(() => {});
    }

    function beginTimer() {
      if (timerStarted) return;
      timerStarted = true;
      timerInt = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          endGame();
        } else {
          refreshStatus();
        }
      }, 1000);
    }

    // Pozice praku
    const SLING_X = 160;
    const SLING_Y = 340;
    const MAX_PULL = 65;

    let isAiming = false;
    let dragPos = { x: SLING_X, y: SLING_Y };

    // Letící koule
    let snowballs = [];

    // Tříštící se částice ledu
    let particles = [];

    // Rampouchy na střeše (7 pozic)
    const ICICLE_COUNT = 7;
    const icicles = [];

    for (let i = 0; i < ICICLE_COUNT; i++) {
      const x = 32 + i * 42;
      const isGold = Math.random() < 0.15;
      icicles.push({
        x: x,
        y: 42,
        w: 16,
        maxH: 45 + Math.random() * 20,
        currentH: 45 + Math.random() * 20,
        state: 'ready', // 'ready', 'growing'
        growProgress: 1,
        isGold: isGold,
        points: isGold ? 30 : 10
      });
    }

    // Vytvoření střepů ledu
    function createShatterEffect(x, y, isGold) {
      for (let p = 0; p < 14; p++) {
        particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 3 + 1,
          size: 2 + Math.random() * 4,
          alpha: 1,
          color: isGold ? '#facc15' : '#e0f2fe'
        });
      }
    }

    function shootBall() {
      beginTimer();
      const dx = SLING_X - dragPos.x;
      const dy = SLING_Y - dragPos.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 12) {
        const speed = pullDist * 0.22;
        const angle = Math.atan2(dy, dx);

        snowballs.push({
          x: dragPos.x,
          y: dragPos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 9
        });
      }

      isAiming = false;
      dragPos = { x: SLING_X, y: SLING_Y };
    }

    async function endGame() {
      if (isGameOver) return;
      isGameOver = true;
      if (timerInt) clearInterval(timerInt);

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        await window.adventScores.recordScoreOnline(8, score);
      }

      let msg = `❄️ Skvělá trefa! ${score} bodů! `;
      if (!topScore || score > topScore) {
        msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
      } else if (!myBest || score > myBest) {
        msg += `🌟 Tvůj osobní rekord!`;
      }

      statusText.innerText = msg;
      onComplete(score);
    }

    // Hlavní fyzika a aktualizace
    function update() {
      if (isGameOver) return;

      // 1. Pohyb sněhových koulí
      for (let i = snowballs.length - 1; i >= 0; i--) {
        const b = snowballs[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.22; // gravitace

        // Kolize s rampouchy
        for (let j = 0; j < icicles.length; j++) {
          const ic = icicles[j];
          if (ic.state !== 'ready') continue;

          // Kontrola zásahu trojúhelníkového rampouchu
          if (
            b.x >= ic.x - ic.w && b.x <= ic.x + ic.w &&
            b.y >= ic.y && b.y <= ic.y + ic.currentH
          ) {
            // Zásah!
            score += ic.points;
            createShatterEffect(ic.x, ic.y + ic.currentH / 2, ic.isGold);

            // Pokud to byl zlatý, roztříští i sousedy
            if (ic.isGold) {
              if (icicles[j - 1] && icicles[j - 1].state === 'ready') {
                score += icicles[j - 1].points;
                createShatterEffect(icicles[j - 1].x, icicles[j - 1].y + 20, false);
                startRegrowth(icicles[j - 1]);
              }
              if (icicles[j + 1] && icicles[j + 1].state === 'ready') {
                score += icicles[j + 1].points;
                createShatterEffect(icicles[j + 1].x, icicles[j + 1].y + 20, false);
                startRegrowth(icicles[j + 1]);
              }
            }

            startRegrowth(ic);
            snowballs.splice(i, 1);
            refreshStatus();
            break;
          }
        }

        // Odstranění koule mimo obrazovku
        if (b.y > 420 || b.x < -20 || b.x > 340) {
          snowballs.splice(i, 1);
        }
      }

      // 2. Dorůstání rampouchů
      icicles.forEach(ic => {
        if (ic.state === 'growing') {
          ic.growProgress += 0.007; // Plynulé dorůstání cca 4-5 sekund
          ic.currentH = ic.maxH * ic.growProgress;
          if (ic.growProgress >= 1) {
            ic.state = 'ready';
            ic.currentH = ic.maxH;
          }
        }
      });

      // 3. Částice ledu
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.2;
        pt.alpha -= 0.025;
        if (pt.alpha <= 0) {
          particles.splice(p, 1);
        }
      }
    }

    function startRegrowth(ic) {
      ic.state = 'growing';
      ic.growProgress = 0.05;
      ic.currentH = 4;
      ic.isGold = Math.random() < 0.14; // Šance na nový zlatý rampouch
      ic.points = ic.isGold ? 30 : 10;
    }

    // Kreslení scény
    function draw() {
      update();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Noční zimní obloha
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
      skyGrad.addColorStop(0, '#0a192f');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Padající sněhové vločky na pozadí
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let f = 0; f < 18; f++) {
        const fx = (f * 37 + (Date.now() * 0.02 * (f % 3 + 1))) % 320;
        const fy = (f * 43 + (Date.now() * 0.03 * (f % 2 + 1))) % 400;
        ctx.beginPath();
        ctx.arc(fx, fy, (f % 3 === 0) ? 1.8 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Střecha chaloupky a dřevěná římsa nahoře
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, 320, 34);

      // Vrstva sněhu na střeše
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, 34);
      for (let sx = 0; sx <= 320; sx += 32) {
        ctx.quadraticCurveTo(sx + 16, 40, sx + 32, 34);
      }
      ctx.lineTo(320, 0);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Rampouchy
      icicles.forEach(ic => {
        ctx.save();

        if (ic.isGold) {
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#fef08a';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
          ctx.strokeStyle = '#ffffff';
          ctx.shadowBlur = 0;
        }

        // Tvar rampouchu (kužel)
        ctx.beginPath();
        ctx.moveTo(ic.x - ic.w / 2, ic.y);
        ctx.lineTo(ic.x + ic.w / 2, ic.y);
        ctx.lineTo(ic.x, ic.y + ic.currentH);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();

        // Kapka vody pod dorůstajícím rampouchem
        if (ic.state === 'growing') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ic.x, ic.y + ic.currentH + 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Krystalky roztříštěného ledu
      particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.restore();
      });

      // Prak - dřevěná vidlice
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(SLING_X - 22, SLING_Y - 14);
      ctx.lineTo(SLING_X - 10, SLING_Y + 16);
      ctx.lineTo(SLING_X, SLING_Y + 36);
      ctx.lineTo(SLING_X + 10, SLING_Y + 16);
      ctx.lineTo(SLING_X + 22, SLING_Y - 14);
      ctx.stroke();

      // Trajektorie při míření (tečkovaná vodicí linie)
      if (isAiming) {
        const dx = SLING_X - dragPos.x;
        const dy = SLING_Y - dragPos.y;
        const speed = Math.hypot(dx, dy) * 0.22;
        const angle = Math.atan2(dy, dx);
        let simX = dragPos.x;
        let simY = dragPos.y;
        let simVx = Math.cos(angle) * speed;
        let simVy = Math.sin(angle) * speed;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        for (let s = 0; s < 14; s++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.22;
          ctx.beginPath();
          ctx.arc(simX, simY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Napnutá guma praku
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(SLING_X - 20, SLING_Y - 10);
        ctx.lineTo(dragPos.x, dragPos.y);
        ctx.lineTo(SLING_X + 20, SLING_Y - 10);
        ctx.stroke();

        // Natahovaná sněhová koule
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dragPos.x, dragPos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Klidová guma
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(SLING_X - 20, SLING_Y - 10);
        ctx.lineTo(SLING_X, SLING_Y - 6);
        ctx.lineTo(SLING_X + 20, SLING_Y - 10);
        ctx.stroke();

        // Připravená koule v lůžku
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(SLING_X, SLING_Y - 6, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Letící sněhové koule
      snowballs.forEach(b => {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Nápověda na začátku
      if (!timerStarted) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👇 Natáhni kouli dolů a vystřel! 🎯', 160, 305);
      }

      animId = requestAnimationFrame(draw);
    }

    // Dotykové a myší ovládání
    function getPointerPos(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = 320 / rect.width;
      const scaleY = 400 / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function onPointerDown(clientX, clientY) {
      if (isGameOver) return;
      const p = getPointerPos(clientX, clientY);

      // Chycení koule v blízkosti praku
      if (Math.hypot(p.x - SLING_X, p.y - SLING_Y) < 45) {
        isAiming = true;
        dragPos = { x: p.x, y: p.y };
      }
    }

    function onPointerMove(clientX, clientY) {
      if (!isAiming || isGameOver) return;
      const p = getPointerPos(clientX, clientY);

      // Omezení maximální délky natažení
      let dx = p.x - SLING_X;
      let dy = p.y - SLING_Y;

      // Natahovat lze hlavně směrem dolů (aby koule letěla nahoru)
      if (dy < -10) dy = -10;

      const dist = Math.hypot(dx, dy);
      if (dist > MAX_PULL) {
        const ratio = MAX_PULL / dist;
        dx *= ratio;
        dy *= ratio;
      }

      dragPos = { x: SLING_X + dx, y: SLING_Y + dy };
    }

    function onPointerUp() {
      if (isAiming) {
        shootBall();
      }
    }

    const ts = (e) => { e.preventDefault(); onPointerDown(e.touches[0].clientX, e.touches[0].clientY); };
    const tm = (e) => { e.preventDefault(); if (isAiming) onPointerMove(e.touches[0].clientX, e.touches[0].clientY); };
    const te = (e) => { e.preventDefault(); onPointerUp(); };

    const md = (e) => onPointerDown(e.clientX, e.clientY);
    const mm = (e) => onPointerMove(e.clientX, e.clientY);
    const mu = () => onPointerUp();

    canvas.addEventListener('touchstart', ts, { passive: false });
    canvas.addEventListener('touchmove', tm, { passive: false });
    canvas.addEventListener('touchend', te, { passive: false });

    canvas.addEventListener('mousedown', md);
    canvas.addEventListener('mousemove', mm);
    canvas.addEventListener('mouseup', mu);

    draw();

    this.cleanup = function() {
      if (animId) cancelAnimationFrame(animId);
      if (timerInt) clearInterval(timerInt);

      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchmove', tm);
      canvas.removeEventListener('touchend', te);

      canvas.removeEventListener('mousedown', md);
      canvas.removeEventListener('mousemove', mm);
      canvas.removeEventListener('mouseup', mu);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};