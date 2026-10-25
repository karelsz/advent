// games/day4.js - Minihra: Zloděj cukroví (mechanika Červená-zelená)
window.adventGames = window.adventGames || {};

window.adventGames[4] = {
  title: "Zloděj cukroví",
  instructions: "Drž prst na talíři a ujez cukroví (+10 b/s)! Jakmile se babička otočí, okamžitě prst pusť, jinak ztratíš body!",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let gameTimerInterval;
    let babiLoopTimeout;

    // Herní stav
    let timeLeft = 30;
    let score = 0;
    const WIN_SCORE = 100;
    let isGameOver = false;
    let isEating = false; // true, pokud hráč drží prst na talíři

    // Stavy babičky: 'away' (peče zády), 'warning' (zpozorní), 'looking' (otočená dopředu)
    let babiState = 'away';

    // Drobečky a vizuální efekty
    let crumbs = [];

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(4) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus() {
      const topLabel = topScoreValue !== null ? `${topScoreValue} b. (${topHolderName})` : 'Zatím nikdo';
      statusText.innerText = `⏱️ ${timeLeft}s | Skóre: ${Math.floor(score)} b. | TOP: ${topLabel}`;
    }
    updateStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(4).then(rec => {
        if (rec) {
          topScoreValue = rec.score;
          topHolderName = rec.player_name;
          updateStatus();
        }
      }).catch(() => {});
    }

    // Cyklus chování babičky
    function scheduleBabi() {
      if (isGameOver) return;

      if (babiState === 'away') {
        // Babička peče zády náhodně 1.8 až 3.8 sekundy
        const waitTime = 1800 + Math.random() * 2000;
        babiLoopTimeout = setTimeout(() => {
          if (isGameOver) return;
          babiState = 'warning'; // Zpozorní!
          babiLoopTimeout = setTimeout(() => {
            if (isGameOver) return;
            babiState = 'looking'; // Otočí se!
            scheduleBabi();
          }, 700); // 700 ms na reakci hráče pro zvednutí prstu
        }, waitTime);
      } else if (babiState === 'looking') {
        // Babička se dívá náhodně 1.5 až 2.5 sekundy
        const lookTime = 1500 + Math.random() * 1000;
        babiLoopTimeout = setTimeout(() => {
          if (isGameOver) return;
          babiState = 'away'; // Otočí se zpátky k troubě
          scheduleBabi();
        }, lookTime);
      }
    }
    scheduleBabi();

    // Časomíra (hlavní 30s odpočet)
    gameTimerInterval = setInterval(async () => {
      if (timeLeft > 0) {
        timeLeft--;
        updateStatus();
      } else {
        clearInterval(gameTimerInterval);
        clearTimeout(babiLoopTimeout);
        isGameOver = true;

        const finalScore = Math.max(0, Math.floor(score));

        if (window.adventScores && window.adventScores.recordScoreOnline) {
          await window.adventScores.recordScoreOnline(4, finalScore);
        }

        let msg = `⏰ Čas vypršel! Získáno ${finalScore} b. `;
        if (!topScoreValue || finalScore > topScoreValue) {
          msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
        } else if (!myBestInitial || finalScore > myBestInitial) {
          msg += `🌟 Tvůj osobní rekord!`;
        }

        if (finalScore >= WIN_SCORE) {
          msg += ` Den splněn!`;
          onComplete(finalScore);
        } else {
          msg += ` (Cíl byl ${WIN_SCORE} b.)`;
        }
        statusText.innerText = msg;
      }
    }, 1000);

    // Vykreslování a průběžný výpočet bodů
    let lastFrameTime = performance.now();

    function draw(now) {
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // Zpracování skóre podle držení prstu
      if (!isGameOver && dt < 0.2) {
        if (isEating) {
          if (babiState === 'looking') {
            // Přistižen při činu: -5 bodů za sekundu
            score = Math.max(0, score - 5 * dt);
          } else {
            // Bezpečné ujídání: +10 bodů za sekundu
            score += 10 * dt;

            // Náhodně vytvoříme drobeček
            if (Math.random() < 0.3) {
              crumbs.push({
                x: 140 + Math.random() * 40,
                y: 280 + Math.random() * 20,
                vx: (Math.random() - 0.5) * 40,
                vy: -Math.random() * 30,
                alpha: 1
              });
            }
          }
          updateStatus();
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Kuchyňské pozadí
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pokud hráč riskuje při otočené babičce, červené varovné probliknutí
      if (isEating && babiState === 'looking') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Horní stavová lišta
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 42);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px sans-serif';

      if (babiState === 'away') {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('🟢 Babička peče zády – JEZ! (drž prst)', canvas.width / 2, 21);
      } else if (babiState === 'warning') {
        ctx.fillStyle = '#facc15';
        ctx.fillText('🟡 POZOR! Babička se otáčí!', canvas.width / 2, 21);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.fillText('🔴 BABIČKA SE DÍVÁ! (Pusť prst!)', canvas.width / 2, 21);
      }

      // 2. Kuchyňská linka a trouba
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 60, 280, 100);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 75, 70, 70); // Trouba
      ctx.fillStyle = '#f97316';
      ctx.font = '22px sans-serif';
      ctx.fillText('🔥', 75, 110);

      // 3. Postava babičky
      ctx.textAlign = 'center';
      if (babiState === 'away') {
        // Otočená zády k troubě
        ctx.font = '54px sans-serif';
        ctx.fillText('👵', 200, 115);
        ctx.font = '24px sans-serif';
        ctx.fillText('🥣', 235, 120); // Míchá těsto
      } else if (babiState === 'warning') {
        // Zpozorní
        ctx.font = '54px sans-serif';
        ctx.fillText('👵', 200, 115);
        ctx.font = '32px sans-serif';
        ctx.fillText('👀', 200, 58);
      } else {
        // Dívá se přísně na hráče
        ctx.font = '58px sans-serif';
        ctx.fillText('👵', 160, 115);
        ctx.font = '28px sans-serif';
        ctx.fillText('😡', 160, 60);
      }

      // 4. Stůl s talířem plným cukroví
      // Dřevěný stůl
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 210, canvas.width, 190);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 205, canvas.width, 10);

      // Talíř s cukrovím
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(160, 285, 95, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Cukroví na talíři
      ctx.font = '26px sans-serif';
      ctx.fillText('🍪', 135, 275);
      ctx.fillText('🥐', 165, 275); // Vanilkový rohlíček
      ctx.fillText('🥮', 190, 285);
      ctx.fillText('🍩', 140, 298);
      ctx.fillText('🍪', 170, 302);

      // Drobečky
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.alpha -= dt * 1.5;
        if (c.alpha <= 0) {
          crumbs.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(251, 191, 36, ${c.alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ruka hráče nebo nápis pro akci
      if (isEating) {
        // Natáhnutá ruka sahající po cukroví
        ctx.font = '46px sans-serif';
        ctx.fillText('🫳', 160, 240);

        if (babiState === 'looking') {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('-5 b/s (PUSTI!)', 160, 360);
        } else {
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('+10 b/s (HAM!)', 160, 360);
        }
      } else {
        // Návod pod talířem
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '13px sans-serif';
        ctx.fillText('👇 Drž prst kdekoliv na stole pro mlsání', 160, 370);
      }

      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(draw);
      }
    }

    // Detekce stisku / puštění
    function startEating() {
      if (!isGameOver) isEating = true;
    }

    function stopEating() {
      isEating = false;
    }

    this.touchStart = (e) => { e.preventDefault(); startEating(); };
    this.touchEnd = (e) => { e.preventDefault(); stopEating(); };
    this.touchCancel = (e) => { e.preventDefault(); stopEating(); };

    this.mouseDown = () => startEating();
    this.mouseUp = () => stopEating();
    this.mouseLeave = () => stopEating();

    canvas.addEventListener('touchstart', this.touchStart, { passive: false });
    canvas.addEventListener('touchend', this.touchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.touchCancel, { passive: false });

    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('mouseup', this.mouseUp);
    canvas.addEventListener('mouseleave', this.mouseLeave);

    // Spuštění herní smyčky
    animationFrameId = requestAnimationFrame(draw);

    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (gameTimerInterval) clearInterval(gameTimerInterval);
      if (babiLoopTimeout) clearTimeout(babiLoopTimeout);

      canvas.removeEventListener('touchstart', this.touchStart);
      canvas.removeEventListener('touchend', this.touchEnd);
      canvas.removeEventListener('touchcancel', this.touchCancel);

      canvas.removeEventListener('mousedown', this.mouseDown);
      canvas.removeEventListener('mouseup', this.mouseUp);
      canvas.removeEventListener('mouseleave', this.mouseLeave);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};