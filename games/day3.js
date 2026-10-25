// games/day3.js - Minihra: Balení dárků na čas (4 fáze balení)
window.adventGames = window.adventGames || {};

window.adventGames[3] = {
  title: "Balení dárků",
  instructions: "Zabal co nejvíce dárků za 35 sekund: ustřihni papír, přetáhni hračku, slož rohy a zavaž mašli!",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let timerInterval;

    // Herní stav
    let timeLeft = 35;
    let score = 0;
    const WIN_SCORE = 15;
    let isGameOver = false;

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(3) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus() {
      const topLabel = topScoreValue !== null ? `${topScoreValue} b. (${topHolderName})` : 'Zatím nikdo';
      statusText.innerText = `⏱️ ${timeLeft}s | Skóre: ${score} b. | TOP: ${topLabel}`;
    }
    updateStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(3).then(rec => {
        if (rec) {
          topScoreValue = rec.score;
          topHolderName = rec.player_name;
          updateStatus();
        }
      }).catch(() => {});
    }

    // Možné hračky k zabalení
    const TOYS = [
      { name: "Medvídek", icon: "🧸" },
      { name: "Autíčko", icon: "🚗" },
      { name: "Vláček", icon: "🚂" },
      { name: "Robot", icon: "🤖" },
      { name: "Knížka", icon: "📚" },
      { name: "Brýle", icon: "🕶️" },
      { name: "Rukavice", icon: "🧤" },
      { name: "Míč", icon: "⚽" },
      { name: "Playstation", icon: "🎮" },
      { name: "Brusle", icon: "🎿" }
    ];

    // Barvy papíru
    const PAPERS = ['#b91c1c', '#15803d', '#1d4ed8', '#7e22ce'];

    // Fáze balení:
    // 0: CUT (střihání papíru tahem zleva doprava)
    // 1: DRAG (přetažení hračky doprostřed papíru)
    // 2: FOLD (kliknutí na 4 rohy papíru)
    // 3: BOW (kroužení prstem pro uvázání mašle)
    // 4: DONE (dárek je hotov, kliknutí pro další)
    let currentToy = TOYS[0];
    let paperColor = PAPERS[0];
    let phase = 0;

    // Fáze 0 data (střihání)
    let cutProgress = 0; // 0 až 100 %

    // Fáze 1 data (přetažení)
    let toyX = 160;
    let toyY = 80;
    let isDragging = false;
    const targetBox = { x: 90, y: 190, w: 140, h: 140 };

    // Fáze 2 data (rohy papíru)
    let corners = [];
    function resetCorners() {
      corners = [
        { id: 0, x: 90, y: 190, clicked: false },
        { id: 1, x: 230, y: 190, clicked: false },
        { id: 2, x: 90, y: 330, clicked: false },
        { id: 3, x: 230, y: 330, clicked: false }
      ];
    }
    resetCorners();

    // Fáze 3 data (vázání mašle)
    let bowProgress = 0; // 0 až 100 %
    let lastAngle = null;

    function nextGift() {
      currentToy = TOYS[Math.floor(Math.random() * TOYS.length)];
      paperColor = PAPERS[Math.floor(Math.random() * PAPERS.length)];
      phase = 0;
      cutProgress = 0;
      toyX = 160;
      toyY = 80;
      isDragging = false;
      bowProgress = 0;
      lastAngle = null;
      resetCorners();
    }

    // Časomíra
    timerInterval = setInterval(async () => {
      if (timeLeft > 0) {
        timeLeft--;
        updateStatus();
      } else {
        clearInterval(timerInterval);
        isGameOver = true;

        if (window.adventScores && window.adventScores.recordScoreOnline) {
          await window.adventScores.recordScoreOnline(3, score);
        }

        let msg = `⏰ Konec! Zabaleno za ${score} b. `;
        if (!topScoreValue || score > topScoreValue) {
          msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
        } else if (!myBestInitial || score > myBestInitial) {
          msg += `🌟 Tvůj osobní rekord!`;
        }

        if (score >= WIN_SCORE) {
          msg += ` Den splněn!`;
          onComplete(score);
        } else {
          msg += ` (Cíl byl ${WIN_SCORE} b.)`;
        }
        statusText.innerText = msg;
      }
    }, 1000);

    // Vykreslování
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Horní lišta s pokyny pro aktuální fázi
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 42);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';

      let instruction = "";
      if (phase === 0) instruction = "✂️ 1. Přejeď prstem pro ustřižení papíru";
      else if (phase === 1) instruction = "🎁 2. Přetáhni hračku na papír";
      else if (phase === 2) instruction = "📐 3. Klikni na všechny 4 rohy";
      else if (phase === 3) instruction = "🎀 4. Toč prstem dokola pro mašli!";
      else if (phase === 4) instruction = "✨ Zabaleno! Klikni pro další dárek";

      ctx.fillText(instruction, canvas.width / 2, 26);

      // Plocha papíru
      ctx.fillStyle = paperColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      if (phase === 0) {
        // Balicí papír v roli
        ctx.fillRect(50, 190, 220, 150);

        // Vodicí linie pro střih
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(50, 190);
        ctx.lineTo(270, 190);
        ctx.stroke();
        ctx.setLineDash([]);

        // Nůžky ukazující postup
        const cutX = 50 + (cutProgress / 100) * 220;
        ctx.font = '24px sans-serif';
        ctx.fillText('✂️', cutX, 190);
      } else {
        // Papír na stole
        ctx.fillRect(targetBox.x, targetBox.y, targetBox.w, targetBox.h);
        ctx.strokeRect(targetBox.x, targetBox.y, targetBox.w, targetBox.h);
      }

      // Vykreslení hračky
      if (phase <= 1) {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentToy.icon, toyX, toyY);
      }

      // Fáze 2: Rohy papíru
      if (phase === 2) {
        // Hračka je uvnitř
        ctx.font = '32px sans-serif';
        ctx.fillText(currentToy.icon, 160, 260);

        corners.forEach(corner => {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = corner.clicked ? '#22c55e' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(corner.clicked ? '✓' : '👆', corner.x, corner.y);
        });
      }

      // Fáze 3: Vázání stuhy a mašle
      if (phase >= 3) {
        // Převázaná krabice (stuhy)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(160 - 8, targetBox.y, 16, targetBox.h);
        ctx.fillRect(targetBox.x, 260 - 8, targetBox.w, 16);

        if (phase === 3) {
          // Kruhový ukazatel vázání
          ctx.beginPath();
          ctx.arc(160, 260, 36, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 6;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(160, 260, 36, -Math.PI / 2, (-Math.PI / 2) + (bowProgress / 100) * (Math.PI * 2));
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 6;
          ctx.stroke();

          ctx.font = '24px sans-serif';
          ctx.fillText('🔄', 160, 260);
        }
      }

      // Fáze 4: Hotovo s velkou mašlí
      if (phase === 4) {
        ctx.font = '48px sans-serif';
        ctx.fillText('🎀', 160, 260);

        // Tlačítko další dárek
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(85, 350, 150, 36, 10);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Další dárek ➔', 160, 368);
      }

      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(draw);
      }
    }

    // Pomocná funkce pro souřadnice
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

    // Obsluha dotyků / kliknutí
    function handleStart(e) {
      if (isGameOver) return;
      const pos = getPos(e);

      // Fáze 1: Začátek tahu hračky
      if (phase === 1) {
        if (Math.hypot(pos.x - toyX, pos.y - toyY) < 35) {
          isDragging = true;
        }
      }

      // Fáze 2: Klik na rohy
      if (phase === 2) {
        corners.forEach(c => {
          if (!c.clicked && Math.hypot(pos.x - c.x, pos.y - c.y) < 24) {
            c.clicked = true;
          }
        });
        if (corners.every(c => c.clicked)) {
          phase = 3;
        }
      }

      // Fáze 4: Kliknutí pro další dárek
      if (phase === 4) {
        if (pos.y >= 340 && pos.y <= 390 && pos.x >= 70 && pos.x <= 250) {
          nextGift();
        }
      }
    }

    function handleMove(e) {
      if (isGameOver) return;
      const pos = getPos(e);

      // Fáze 0: Střihání přejetím zleva doprava
      if (phase === 0) {
        if (pos.y >= 165 && pos.y <= 215 && pos.x >= 40 && pos.x <= 280) {
          const currentCut = Math.min(100, Math.max(0, ((pos.x - 50) / 220) * 100));
          if (currentCut > cutProgress) {
            cutProgress = currentCut;
            if (cutProgress >= 90) {
              phase = 1;
            }
          }
        }
      }

      // Fáze 1: Přetahování hračky
      if (phase === 1 && isDragging) {
        toyX = pos.x;
        toyY = pos.y;

        // Kontrola dopadu na papír
        if (
          toyX >= targetBox.x && toyX <= targetBox.x + targetBox.w &&
          toyY >= targetBox.y && toyY <= targetBox.y + targetBox.h
        ) {
          isDragging = false;
          toyX = 160;
          toyY = 260;
          phase = 2;
        }
      }

      // Fáze 3: Točení dokola pro mašli
      if (phase === 3) {
        const angle = Math.atan2(pos.y - 260, pos.x - 160);
        if (lastAngle !== null) {
          let diff = angle - lastAngle;
          if (diff < -Math.PI) diff += Math.PI * 2;
          if (diff > Math.PI) diff -= Math.PI * 2;

          bowProgress += Math.abs(diff) * 12;
          if (bowProgress >= 100) {
            phase = 4;
            score += 5;
            updateStatus();
          }
        }
        lastAngle = angle;
      }
    }

    function handleEnd() {
      isDragging = false;
      lastAngle = null;
    }

    // Event listenery
    this.touchStart = (e) => handleStart(e);
    this.touchMove = (e) => handleMove(e);
    this.touchEnd = () => handleEnd();

    this.mouseDown = (e) => handleStart(e);
    this.mouseMove = (e) => handleMove(e);
    this.mouseUp = () => handleEnd();

    canvas.addEventListener('touchstart', this.touchStart, { passive: true });
    canvas.addEventListener('touchmove', this.touchMove, { passive: true });
    canvas.addEventListener('touchend', this.touchEnd);

    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('mousemove', this.mouseMove);
    canvas.addEventListener('mouseup', this.mouseUp);

    // Spuštění
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