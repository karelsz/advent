// games/day2.js - Minihra: České vánoční pexeso (4 sloupce x 5 řádků = 20 karet)
window.adventGames = window.adventGames || {};

window.adventGames[2] = {
  title: "Vánoční pexeso",
  instructions: "Najdi všech 10 dvojic vánočních symbolů!",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    // 10 vybraných motivů (vytvoří 10 dvojic = 20 karet)
    const baseIcons = [
      { icon: '🎄', name: 'Stromeček' },
      { icon: '🐟', name: 'Kapr' },
      { icon: '✨', name: 'Zlaté prasátko' },
      { icon: '☄️', name: 'Betlémská hvězda' },
      { icon: '🍞', name: 'Vánočka' },
      { icon: '🍎', name: 'Jablko s hvězdou' },
      { icon: '🕯️', name: 'Ořechová lodička' },
      { icon: '🌿', name: 'Jmelí' },
      { icon: '🍪', name: 'Perníček / Cukroví' },
      { icon: '🐶', name: 'Border kolie' }
    ];

    // Zdvojení na páry (celkem 20 karet) a náhodné zamíchání
    let deck = [...baseIcons, ...baseIcons];
    deck.sort(() => Math.random() - 0.5);

    // Nastavení mřížky 4 sloupce x 5 řádků pro plátno 320 x 400
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

    statusText.innerText = `Najdi všech 10 dvojic! Splněno: 0 / ${TOTAL_PAIRS}`;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      cards.forEach(card => {
        if (card.matched) {
          // Správně uhodnutá dvojice (zelená)
          ctx.fillStyle = '#1e3a24';
          ctx.strokeStyle = '#2f9e44';
        } else if (card.flipped) {
          // Právě otočená karta (modrá)
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#38bdf8';
        } else {
          // Rubem nahoru (tmavá vánoční červená)
          ctx.fillStyle = '#450a0a';
          ctx.strokeStyle = '#b91c1c';
        }

        // Vykreslení těla karty
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.w, card.h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (card.flipped || card.matched) {
          // Líc karty: motiv a malý popis
          ctx.font = '28px sans-serif';
          ctx.fillText(card.val, card.x + card.w / 2, card.y + card.h / 2 - 4);
          
          ctx.font = '9px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(card.label.slice(0, 11), card.x + card.w / 2, card.y + card.h - 10);
        } else {
          // Rub karty: vločka
          ctx.fillStyle = '#f87171';
          ctx.font = '22px sans-serif';
          ctx.fillText('❄️', card.x + card.w / 2, card.y + card.h / 2);
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
          statusText.innerText = `Nalezeno: ${matchedPairs} / ${TOTAL_PAIRS} dvojic!`;
          draw();

          if (matchedPairs === TOTAL_PAIRS) {
            statusText.innerText = '🎉 Fantastické! Všech 10 dvojic nalezeno!';
            onComplete();
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