// games/day9.js - Zdobení stromečku zpaměti (s náhodnými pozicemi a novými ozdobami)
window.adventGames = window.adventGames || {};

window.adventGames[9] = {
  title: "Zdobení stromečku",
  instructions: "Dobře si zapamatuj, kde na stromku visí ozdoby! Po 5 sekundách zmizí do krabice a tvým úkolem je umístit je zpět co nejpřesněji.",

  start: function(canvas, statusText, onComplete) {
    canvas.width = 320;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    let animId = null;
    let countdownInterval = null;
    let phase = 'memorize'; // 'memorize', 'decorating', 'result'
    let memorizeSeconds = 5;
    let totalScore = 0;

    // Rekordy
    let myBest = window.adventScores ? window.adventScores.getPersonalBest(9) : null;
    let topScore = null;
    let topHolder = 'Zatím nikdo';

    function refreshStatus(customMsg) {
      const topLabel = topScore !== null ? `${topScore} % (${topHolder})` : 'Zatím nikdo';
      if (customMsg) {
        statusText.innerText = `${customMsg} | TOP: ${topLabel}`;
      } else if (phase === 'memorize') {
        statusText.innerText = `👀 Zapamatuj si stromeček! Čas: ${memorizeSeconds}s | TOP: ${topLabel}`;
      } else if (phase === 'decorating') {
        statusText.innerText = `🎄 Natahej ozdoby z krabice na stromek | TOP: ${topLabel}`;
      } else {
        statusText.innerText = `✨ Přesnost: ${totalScore} % | TOP: ${topLabel}`;
      }
    }
    refreshStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(9).then(rec => {
        if (rec) {
          topScore = rec.score;
          topHolder = rec.player_name;
          refreshStatus();
        }
      }).catch(() => {});
    }

    // Tlačítko "Hotovo" pod canvasem
    let submitBtn = document.getElementById('day9-submit-btn');
    if (!submitBtn) {
      submitBtn = document.createElement('button');
      submitBtn.id = 'day9-submit-btn';
      submitBtn.innerText = 'Hotovo! Zkontrolovat 🎄';
      submitBtn.style.display = 'none';
      submitBtn.style.width = '100%';
      submitBtn.style.maxWidth = '320px';
      submitBtn.style.margin = '10px auto 0 auto';
      submitBtn.style.padding = '12px';
      submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      submitBtn.style.color = '#ffffff';
      submitBtn.style.border = 'none';
      submitBtn.style.borderRadius = '10px';
      submitBtn.style.fontWeight = 'bold';
      submitBtn.style.fontSize = '1rem';
      submitBtn.style.cursor = 'pointer';
      submitBtn.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
      canvas.parentNode.insertBefore(submitBtn, statusText);
    } else {
      submitBtn.style.display = 'none';
    }

    // Zásobník všech dostupných ozdob (včetně Santy a Dárku)
    const availableOrnamentTypes = [
      { id: 'star', icon: '⭐', size: 28 },
      { id: 'red', icon: '🔴', size: 24 },
      { id: 'gold', icon: '🟡', size: 24 },
      { id: 'bell', icon: '🔔', size: 24 },
      { id: 'ginger', icon: '🍪', size: 24 },
      { id: 'cane', icon: '🦯', size: 24 },
      { id: 'santa', icon: '🎅', size: 24 },
      { id: 'gift', icon: '🎁', size: 24 }
    ];

    // Vybereme náhodných 6 až 7 ozdob pro aktuální hru (hvězda je vždy zahrnuta)
    const otherItems = availableOrnamentTypes.filter(it => it.id !== 'star').sort(() => Math.random() - 0.5);
    const chosenItems = [
      availableOrnamentTypes.find(it => it.id === 'star'),
      ...otherItems.slice(0, 6)
    ];

    // Funkce pro generování náhodné pozice na ploše jehličí stromečku
    // Jehličí sahá od Y = 50 do Y = 280, šířka roste s výškou
    function getRandomTreePosition(existingPositions, isStar) {
      if (isStar) {
        // Hvězda je na špičce s drobnou náhodnou odchylkou
        return { x: 160 + (Math.random() * 8 - 4), y: 55 + (Math.random() * 6 - 3) };
      }

      let attempts = 0;
      while (attempts < 100) {
        attempts++;
        // Náhodné Y na ploše stromečku (80 až 265 px)
        const y = 80 + Math.random() * 185;
        // Spočítáme maximální povolenou pološířku stromu v dané výšce (kužel)
        const progress = (y - 50) / 235; // 0 u špičky, 1 dole
        const halfWidth = 35 + progress * 75; // od cca 35 px nahoře do 110 px dole
        const x = 160 + (Math.random() * 2 - 1) * halfWidth;

        // Kontrola, aby nebyla příliš blízko jiné již vygenerované ozdobě
        const tooClose = existingPositions.some(p => Math.hypot(p.x - x, p.y - y) < 36);
        if (!tooClose) {
          return { x: Math.round(x), y: Math.round(y) };
        }
      }
      // Fallback
      return { x: 160 + (Math.random() * 60 - 30), y: 150 + Math.random() * 80 };
    }

    // Vygenerujeme náhodné pozice pro každou vybranou ozdobu
    const targetPositions = [];
    chosenItems.forEach(item => {
      const pos = getRandomTreePosition(targetPositions, item.id === 'star');
      targetPositions.push(pos);
    });

    // Pozice v krabici dole (2 řádky pro pohodlné tažení)
    const totalCount = chosenItems.length;
    const boxPositions = [];
    for (let i = 0; i < totalCount; i++) {
      const row = i < 4 ? 0 : 1;
      const col = i < 4 ? i : i - 4;
      const countInRow = row === 0 ? Math.min(4, totalCount) : totalCount - 4;
      const spacing = 280 / (countInRow + 1);
      const bx = 20 + spacing * (col + 1);
      const by = row === 0 ? 344 : 374;
      boxPositions.push({ x: Math.round(bx), y: Math.round(by) });
    }

    const ornaments = chosenItems.map((item, idx) => {
      const target = targetPositions[idx];
      const box = boxPositions[idx];
      return {
        ...item,
        targetX: target.x,
        targetY: target.y,
        // Začíná na cíli pro fázi zapamatování
        x: target.x,
        y: target.y,
        boxX: box.x,
        boxY: box.y
      };
    });

    // Odpočet zapamatování (5 s)
    countdownInterval = setInterval(() => {
      memorizeSeconds--;
      refreshStatus();
      if (memorizeSeconds <= 0) {
        clearInterval(countdownInterval);
        startDecoratingPhase();
      }
    }, 1000);

    function startDecoratingPhase() {
      phase = 'decorating';
      // Schováme ozdoby do krabice
      ornaments.forEach(o => {
        o.x = o.boxX;
        o.y = o.boxY;
      });
      submitBtn.style.display = 'block';
      refreshStatus();
    }

    // Vyhodnocení přesnosti
    function evaluatePlacement() {
      phase = 'result';
      submitBtn.style.display = 'none';

      let totalPct = 0;
      ornaments.forEach(o => {
        const dist = Math.hypot(o.x - o.targetX, o.y - o.targetY);
        // Do 15 px = 100 %, nad 90 px = 0 %
        let pct = Math.max(0, 100 - Math.max(0, dist - 15) * 1.3);
        totalPct += pct;
      });

      totalScore = Math.round(totalPct / ornaments.length);

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        window.adventScores.recordScoreOnline(9, totalScore);
      }

      let msg = `✨ Přesnost: ${totalScore} %! `;
      if (!topScore || totalScore > topScore) msg += "🔥 NOVÝ REKORD!";
      else if (!myBest || totalScore > myBest) msg += "🌟 Tvůj rekord!";

      refreshStatus(msg);
      onComplete(totalScore);
    }

    submitBtn.onclick = evaluatePlacement;

    // Drag & Drop
    let draggedOrnament = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (320 / rect.width),
        y: (clientY - rect.top) * (400 / rect.height)
      };
    }

    function onPointerDown(clientX, clientY) {
      if (phase !== 'decorating') return;
      const pos = getCanvasCoords(clientX, clientY);

      for (let i = ornaments.length - 1; i >= 0; i--) {
        const o = ornaments[i];
        if (Math.hypot(pos.x - o.x, pos.y - o.y) < 22) {
          draggedOrnament = o;
          dragOffsetX = o.x - pos.x;
          dragOffsetY = o.y - pos.y;
          // Přenést ozdobu nahoru pro překreslování
          ornaments.splice(i, 1);
          ornaments.push(o);
          break;
        }
      }
    }

    function onPointerMove(clientX, clientY) {
      if (!draggedOrnament) return;
      const pos = getCanvasCoords(clientX, clientY);
      draggedOrnament.x = Math.max(16, Math.min(304, pos.x + dragOffsetX));
      draggedOrnament.y = Math.max(20, Math.min(385, pos.y + dragOffsetY));
    }

    function onPointerUp() {
      draggedOrnament = null;
    }

    // Kreslení stromečku
    function drawTree() {
      // Kmen
      ctx.fillStyle = '#451a03';
      ctx.fillRect(145, 275, 30, 45);

      // Květináč
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(135, 320);
      ctx.lineTo(185, 320);
      ctx.lineTo(178, 305);
      ctx.lineTo(142, 305);
      ctx.closePath();
      ctx.fill();

      // 3 patra větví
      function drawBranchTier(topY, bottomY, leftX, rightX) {
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.moveTo(160, topY);
        ctx.lineTo(rightX, bottomY);
        ctx.quadraticCurveTo(160, bottomY - 12, leftX, bottomY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(leftX + 10, bottomY, 5, 0, Math.PI * 2);
        ctx.arc(160, bottomY - 4, 6, 0, Math.PI * 2);
        ctx.arc(rightX - 10, bottomY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      drawBranchTier(180, 285, 60, 260);
      drawBranchTier(120, 215, 80, 240);
      drawBranchTier(50, 150, 105, 215);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Noční pozadí
      ctx.fillStyle = '#091528';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Podlaha
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(0, 310, 320, 90);
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.lineTo(320, 310);
      ctx.stroke();

      // Stromeček
      drawTree();

      // Krabice na ozdoby
      if (phase !== 'memorize') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(10, 324, 300, 68, 8);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📦 KRABICE S OZDOBAMI', 160, 336);
      }

      // Výsledek: Duchové původních pozic + čáry odchylek
      if (phase === 'result') {
        ornaments.forEach(o => {
          const dist = Math.hypot(o.x - o.targetX, o.y - o.targetY);
          ctx.strokeStyle = dist < 25 ? '#22c55e' : (dist < 50 ? '#facc15' : '#ef4444');
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.targetX, o.targetY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.font = `${o.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(o.icon, o.targetX, o.targetY);
          ctx.restore();
        });
      }

      // Vykreslení samotných ozdob
      ornaments.forEach(o => {
        ctx.save();
        ctx.font = `${o.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (draggedOrnament === o) {
          ctx.shadowColor = '#ffd43b';
          ctx.shadowBlur = 12;
        }

        ctx.fillText(o.icon, o.x, o.y);
        ctx.restore();
      });

      // Zobrazení odpočtu při zapamatování
      if (phase === 'memorize') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, 320, 38);
        ctx.fillStyle = '#ffd43b';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`👀 Zapamatuj si pozice: ${memorizeSeconds}s`, 160, 19);
      }

      animId = requestAnimationFrame(draw);
    }

    const ts = (e) => { e.preventDefault(); onPointerDown(e.touches[0].clientX, e.touches[0].clientY); };
    const tm = (e) => { e.preventDefault(); onPointerMove(e.touches[0].clientX, e.touches[0].clientY); };
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
      if (countdownInterval) clearInterval(countdownInterval);
      if (submitBtn) submitBtn.style.display = 'none';

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