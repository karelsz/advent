// games/day2.js - Minihra: České vánoční pexeso (skóre = čas v sekundách)
window.adventGames = window.adventGames || {};

window.adventGames[2] = {
  title: "Vánoční pexeso",
  instructions: "Najdi všech 10 dvojic co nejrychleji! Čas běží od prvního kliknutí.",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    // 10 vybraných motivů (vytvoří 10 dvojic = 20 karet)
    const baseIcons = [
      { icon: '🎄', name: 'Stromeček' },
      { icon: '🐟', name: 'Kapr' },
      { icon: '✨', name: 'Hvězda' },
      { icon: '☄️', name: 'Kometa' },
      { icon: '🍞', name: 'Vánočka' },
      { icon: '🍎', name: 'Jablko' },
      { icon: '🕯️', name: 'Svíčka' },
      { icon: '🌿', name: 'Jmelí' },
      { icon: '🍪', name: 'Perníček' },
      { icon: '🐶', name: 'Pes' }
    ];

    // Zdvojení na páry (celkem 20 karet) a náhodné zamíchání
    let deck = [...baseIcons, ...baseIcons];
    deck.sort(() => Math.random() - 0.5);

    // Mřížka 4 sloupce x 5 řádků pro plátno 320 x 400
    const cols = 4;
    const rows = 5;
    const cardW = 66;
    const cardH = 66;
    const gapX = 8;
    const gapY = 8;
    const startX = (canvas.width - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 16;

    let cards = [];
    for (let i = 0; i < 20; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      cards.push({
        id: i,
        val: deck[i].icon,
        label: deck[i].name,
        x: startX + c * (cardW + gapX),
        y: startY + r * (cardH + gapY),
        w: cardW,
        h: cardH,
        flipped: false,
        matched: false
      });
    }

    let flippedCards = [];
    let lockBoard = false;
    let matchedPairs = 0;
    const TOTAL_PAIRS = 10;

    // Stopky
    let timerStarted = false;
    let startTime = null;
    let timerInterval = null;
    let elapsedSeconds = 0;

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(2) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus() {
      const topLabel = topScoreValue !== null ? `${topScoreValue}s (${topHolderName})` : 'Zatím nikdo';
      statusText.innerText = `⏱️ ${elapsedSeconds}s | Dvojice: ${matchedPairs}/${TOTAL_PAIRS} | TOP: ${topLabel}`;
    }

    updateStatus();

    // Načtení rekordu na pozadí (neblokuje zobrazení hry)
    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(2).then(globalBest => {
        if (globalBest) {
          topScoreValue = globalBest.score;
          topHolderName = globalBest.player_name;
          updateStatus();
        }
      }).catch(() => {});
    }

    function startTimer() {
      if (timerStarted) return;
      timerStarted = true;
      startTime = Date.now();
      timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateStatus();
      }, 1000);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      cards.forEach(card => {
        if (card.matched) {
          ctx.fillStyle = '#1e3a24';
          ctx.strokeStyle = '#2f9e44';
        } else if (card.flipped) {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#38bdf8';
        } else {
          ctx.fillStyle = '#450a0a';
          ctx.strokeStyle = '#b91c1c';
        }

        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.w, card.h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (card.flipped || card.matched) {
          ctx.font = '28px sans-serif';
          ctx.fillText(card.val, card.x + card.w / 2, card.y + card.h / 2 - 4);

          ctx.font = '9px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(card.label.slice(0, 11), card.x + card.w / 2, card.y + card.h - 10);
        } else {
          ctx.fillStyle = '#f87171';
          ctx.font = '22px sans-serif';
          ctx.fillText('❄️', card.x + card.w / 2, card.y + card.h / 2);
        }
      });
    }

    async function handleWin() {
      if (timerInterval) clearInterval(timerInterval);
      const finalTime = elapsedSeconds;

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        await window.adventScores.recordScoreOnline(2, finalTime);
      }

      let msg = `🎉 Dokončeno za ${finalTime}s! `;
      if (!topScoreValue || finalTime < topScoreValue) {
        msg += `🔥 NOVÝ GLOBÁLNÍ REKORD!`;
      } else if (!myBestInitial || finalTime < myBestInitial) {
        msg += `🌟 Tvůj osobní rekord!`;
      }

      statusText.innerText = msg;
      onComplete(finalTime);
    }

    function handleClick(clientX, clientY) {
      if (lockBoard) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const clicked = cards.find(c => 
        !c.flipped && !c.matched &&
        x >= c.x && x <= c.x + c.w &&
        y >= c.y && y <= c.y + c.h
      );

      if (!clicked) return;

      startTimer();

      clicked.flipped = true;
      flippedCards.push(clicked);
      draw();

      if (flippedCards.length === 2) {
        lockBoard = true;
        const [c1, c2] = flippedCards;

        if (c1.val === c2.val) {
          c1.matched = true;
          c2.matched = true;
          matchedPairs++;
          flippedCards = [];
          lockBoard = false;
          draw();

          if (matchedPairs === TOTAL_PAIRS) {
            handleWin();
          }
        } else {
          setTimeout(() => {
            c1.flipped = false;
            c2.flipped = false;
            flippedCards = [];
            lockBoard = false;
            draw();
          }, 850);
        }
      }
    }

    this.touchHandler = (e) => {
      handleClick(e.touches[0].clientX, e.touches[0].clientY);
    };
    this.mouseHandler = (e) => {
      handleClick(e.clientX, e.clientY);
    };

    canvas.addEventListener('touchstart', this.touchHandler, { passive: true });
    canvas.addEventListener('mousedown', this.mouseHandler);

    // Okamžité vykreslení
    draw();

    this.cleanup = function() {
      if (timerInterval) clearInterval(timerInterval);
      canvas.removeEventListener('touchstart', this.touchHandler);
      canvas.removeEventListener('mousedown', this.mouseHandler);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};