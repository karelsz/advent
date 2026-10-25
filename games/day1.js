// games/day1.js - Minihra: Chytání dárků se Supabase online rekordy
window.adventGames = window.adventGames || {};

window.adventGames[1] = {
  title: "Chytání dárků",
  instructions: "Ovládej saně sliderem nebo tažením a nasbírej za 30 sekund co nejvíce bodů!",

  start: async function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let timerInterval;

    let timeLeft = 30;
    let score = 0;
    const WIN_SCORE = 25;
    let isGameOver = false;

    // Načtení stávajících rekordů
    const myBestInitial = window.adventScores.getPersonalBest(1);
    let globalBest = await window.adventScores.getGlobalRecord(1);
    let topScoreValue = globalBest ? globalBest.score : 0;
    let topHolderName = globalBest ? globalBest.player_name : 'Zatím nikdo';

    const basketWidth = 64;
    const basketHeight = 18;
    let basketX = (canvas.width - basketWidth) / 2;

    const ITEM_TYPES = [
      { char: '🎁', points: 3, speed: 4.4 },
      { char: '⭐', points: 2, speed: 3.3 },
      { char: '🍬', points: 1, speed: 2.2 }
    ];
    let items = [];

    // Vytvoření / zobrazení slideru
    let sliderContainer = document.getElementById('day1-slider-wrap');
    if (!sliderContainer) {
      sliderContainer = document.createElement('div');
      sliderContainer.id = 'day1-slider-wrap';
      sliderContainer.style.cssText = `
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
      `;
      sliderContainer.innerHTML = `
        <label for="day1-slider" style="font-size: 0.8rem; color: #94a3b8;">⬅️ Táhni pro pohyb saní ➡️</label>
        <input type="range" id="day1-slider" min="0" max="100" value="50" style="
          width: 85%;
          height: 14px;
          border-radius: 8px;
          accent-color: #e03131;
          cursor: pointer;
        ">
      `;
      canvas.parentNode.insertBefore(sliderContainer, statusText);
    } else {
      sliderContainer.style.display = 'flex';
      const input = document.getElementById('day1-slider');
      if (input) input.value = "50";
    }

    const slider = document.getElementById('day1-slider');
    const updateBasketFromSlider = () => {
      const percent = slider.value / 100;
      basketX = percent * (canvas.width - basketWidth);
    };
    slider.addEventListener('input', updateBasketFromSlider);

    const moveBasketByClientX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (clientX - rect.left) * scaleX;
      basketX = Math.max(0, Math.min(canvas.width - basketWidth, x - basketWidth / 2));
      slider.value = (basketX / (canvas.width - basketWidth)) * 100;
    };

    this.touchHandler = (e) => moveBasketByClientX(e.touches[0].clientX);
    this.mouseHandler = (e) => {
      if (e.buttons === 1) moveBasketByClientX(e.clientX);
    };

    canvas.addEventListener('touchmove', this.touchHandler, { passive: true });
    canvas.addEventListener('mousemove', this.mouseHandler);

    statusText.innerText = `Čas: ${timeLeft}s | Skóre: ${score} b. | TOP: ${topScoreValue} b. (${topHolderName})`;

    // Odpočet 30s
    timerInterval = setInterval(async () => {
      if (timeLeft > 0) {
        timeLeft--;
        statusText.innerText = `Čas: ${timeLeft}s | Skóre: ${score} b. | TOP: ${topScoreValue} b. (${topHolderName})`;
      } else {
        clearInterval(timerInterval);
        isGameOver = true;

        // Odeslání do Supabase
        await window.adventScores.recordScoreOnline(1, score);

        let resultMsg = `Konec! Skóre: ${score} b. `;
        if (score > topScoreValue) {
          resultMsg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
        } else if (score > myBestInitial) {
          resultMsg += `🎉 Tvůj nový osobní rekord!`;
        }

        if (score >= WIN_SCORE) {
          resultMsg += ` Den splněn!`;
          onComplete(score);
        } else {
          resultMsg += ` (Pro hvězdu je třeba ${WIN_SCORE} b.)`;
        }

        statusText.innerText = resultMsg;
      }
    }, 1000);

    // Kreslení legendy nahoře
    function drawLegend() {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, 36);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '13px sans-serif';

      ctx.fillStyle = '#f8fafc';
      ctx.fillText('🎁 = 3b', 55, 18);
      ctx.fillText('⭐ = 2b', 160, 18);
      ctx.fillText('🍬 = 1b', 265, 18);
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLegend();

      if (Math.random() < 0.045 && !isGameOver) {
        const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        items.push({
          x: Math.random() * (canvas.width - 26),
          y: 40,
          speed: type.speed + Math.random() * 0.8,
          char: type.char,
          points: type.points
        });
      }

      // Kreslení saní
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.roundRect(basketX, canvas.height - basketHeight - 12, basketWidth, basketHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#ffd43b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("SANĚ", basketX + basketWidth / 2, canvas.height - 15);

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'left';
      const basketY = canvas.height - basketHeight - 12;

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.speed;
        ctx.fillText(it.char, it.x, it.y);

        if (
          it.y >= basketY &&
          it.y <= basketY + basketHeight + 10 &&
          it.x + 22 >= basketX &&
          it.x <= basketX + basketWidth
        ) {
          score += it.points;
          items.splice(i, 1);
          statusText.innerText = `Čas: ${timeLeft}s | Skóre: ${score} b. | TOP: ${topScoreValue} b. (${topHolderName})`;
          continue;
        }

        if (it.y > canvas.height + 20) {
          items.splice(i, 1);
        }
      }

      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(loop);
      }
    }

    loop();

    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timerInterval) clearInterval(timerInterval);
      canvas.removeEventListener('touchmove', this.touchHandler);
      canvas.removeEventListener('mousemove', this.mouseHandler);
      slider.removeEventListener('input', updateBasketFromSlider);

      const sContainer = document.getElementById('day1-slider-wrap');
      if (sContainer) sContainer.style.display = 'none';
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};