// games/day2.js - Minihra: Vánoční pexeso
window.adventGames = window.adventGames || {};

window.adventGames[2] = {
  title: "Vánoční pexeso",
  instructions: "Najdi všechny 3 dvojice symbolů!",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');
    statusText.innerText = "Najdi všechny 3 dvojice!";

    // Ikony pro pexeso (3 dvojice = 6 karet)
    const icons = ['🎄', '⛄', '🔔', '🎄', '⛄', '🔔'];
    // Náhodné zamíchání
    icons.sort(() => Math.random() - 0.5);

    // Mřížka 2 sloupce x 3 řádky
    const cols = 2;
    const rows = 3;
    const cardW = 120;
    const cardH = 90;
    const gapX = 25;
    const gapY = 25;
    const startX = (canvas.width - (cols * cardW + gapX)) / 2;
    const startY = 35;

    let cards = [];
    for (let i = 0; i < 6; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      cards.push({
        id: i,
        val: icons[i],
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

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      cards.forEach(card => {
        if (card.matched) {
          // Uhodnutá karta
          ctx.fillStyle = '#2f9e44';
          ctx.strokeStyle = '#51cf66';
        } else if (card.flipped) {
          // Otočená lícem nahoru
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#38bdf8';
        } else {
          // Rubem nahoru
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#64748b';
        }

        // Vykreslení obdélníku karty
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.w, card.h, 10);
        ctx.fill();
        ctx.stroke();

        // Obsah karty
        if (card.flipped || card.matched) {
          ctx.font = '40px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(card.val, card.x + card.w / 2, card.y + card.h / 2);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❓', card.x + card.w / 2, card.y + card.h / 2);
        }
      });
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

          if (matchedPairs === 3) {
            statusText.innerText = '🎉 Skvělá paměť! Den 2 je splněn!';
            onComplete();
          }
        } else {
          setTimeout(() => {
            c1.flipped = false;
            c2.flipped = false;
            flippedCards = [];
            lockBoard = false;
            draw();
          }, 900);
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

    draw();

    this.cleanup = function() {
      canvas.removeEventListener('touchstart', this.touchHandler);
      canvas.removeEventListener('mousedown', this.mouseHandler);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};