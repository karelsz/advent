// games/day1.js - Minihra: Chytání dárků
window.adventGames = window.adventGames || {};

window.adventGames[1] = {
  title: "Chytání dárků",
  instructions: "Tažením prstu chytej padající dárky!",
  
  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let basketX = 130;
    const basketWidth = 60;
    const basketHeight = 16;
    let gifts = [];
    let caughtCount = 0;
    const TARGET_GIFTS = 7;
    let isGameOver = false;

    statusText.innerText = `Chyť 7 dárků! Splněno: 0 / ${TARGET_GIFTS}`;

    function moveBasket(clientX) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (clientX - rect.left) * scaleX;
      basketX = Math.max(0, Math.min(canvas.width - basketWidth, x - basketWidth / 2));
    }

    this.touchHandler = (e) => moveBasket(e.touches[0].clientX);
    this.mouseHandler = (e) => moveBasket(e.clientX);

    canvas.addEventListener('touchmove', this.touchHandler, { passive: true });
    canvas.addEventListener('mousemove', this.mouseHandler);

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.03 && !isGameOver) {
        gifts.push({
          x: Math.random() * (canvas.width - 24),
          y: -20,
          speed: 2 + Math.random() * 2,
          char: ['🎁', '⭐', '🍬'][Math.floor(Math.random() * 3)]
        });
      }

      // Kreslení saní
      ctx.fillStyle = '#e03131';
      ctx.fillRect(basketX, canvas.height - basketHeight - 10, basketWidth, basketHeight);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText("SANĚ", basketX + 13, canvas.height - 12);

      // Pohyb a kolize
      ctx.font = '20px sans-serif';
      for (let i = gifts.length - 1; i >= 0; i--) {
        const gift = gifts[i];
        gift.y += gift.speed;
        ctx.fillText(gift.char, gift.x, gift.y);

        const basketY = canvas.height - basketHeight - 10;
        if (
          gift.y >= basketY &&
          gift.y <= basketY + basketHeight + 10 &&
          gift.x + 20 >= basketX &&
          gift.x <= basketX + basketWidth
        ) {
          gifts.splice(i, 1);
          caughtCount++;
          statusText.innerText = `Chyceno: ${caughtCount} / ${TARGET_GIFTS}`;

          if (caughtCount >= TARGET_GIFTS && !isGameOver) {
            isGameOver = true;
            statusText.innerText = '🎉 Výborně! Den 1 je splněn!';
            onComplete();
          }
          continue;
        }

        if (gift.y > canvas.height + 20) {
          gifts.splice(i, 1);
        }
      }

      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(loop);
      }
    }

    loop();

    // Funkce pro bezpečné ukončení hry při zavření okna
    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('touchmove', this.touchHandler);
      canvas.removeEventListener('mousemove', this.mouseHandler);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};