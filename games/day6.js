// games/day6.js - Minihra: Zdobení perníčků jedním tahem (8 vánočních tvarů)
window.adventGames = window.adventGames || {};

window.adventGames[6] = {
  title: "Zdobení perníčků",
  instructions: "Obkresli předlohu na perníčku bílou polevou jedním tahem! Čím přesnější linie, tím vyšší procento získáš.",

  start: function(canvas, statusText, onComplete) {
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let isDrawing = false;
    let userPath = [];
    let hasDrawn = false;
    let evaluatedAccuracy = 0;
    const PASS_ACCURACY = 70;

    // Rekordy
    let myBestInitial = window.adventScores ? window.adventScores.getPersonalBest(6) : null;
    let topScoreValue = null;
    let topHolderName = 'Zatím nikdo';

    function updateStatus(extraMsg = "") {
      const topLabel = topScoreValue !== null ? `${topScoreValue}% (${topHolderName})` : 'Zatím nikdo';
      if (extraMsg) {
        statusText.innerText = `${extraMsg} | TOP: ${topLabel}`;
      } else {
        statusText.innerText = `Přesnost: ${evaluatedAccuracy}% | Cíl: ${PASS_ACCURACY}% | TOP: ${topLabel}`;
      }
    }
    updateStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(6).then(rec => {
        if (rec) {
          topScoreValue = rec.score;
          topHolderName = rec.player_name;
          updateStatus();
        }
      }).catch(() => {});
    }

    // Celkem 8 tvarů pro canvas 320 x 400 (střed perníčku cca [160, 230])
    const TEMPLATES = [
      {
        name: "Vánoční stromeček",
        points: [
          { x: 160, y: 125 },
          { x: 210, y: 175 },
          { x: 185, y: 175 },
          { x: 230, y: 235 },
          { x: 195, y: 235 },
          { x: 240, y: 305 },
          { x: 180, y: 305 },
          { x: 180, y: 340 },
          { x: 140, y: 340 },
          { x: 140, y: 305 },
          { x: 80,  y: 305 },
          { x: 125, y: 235 },
          { x: 90,  y: 235 },
          { x: 135, y: 175 },
          { x: 110, y: 175 },
          { x: 160, y: 125 }
        ]
      },
      {
        name: "Hvězda",
        points: [
          { x: 160, y: 125 },
          { x: 182, y: 195 },
          { x: 255, y: 195 },
          { x: 197, y: 238 },
          { x: 218, y: 310 },
          { x: 160, y: 268 },
          { x: 102, y: 310 },
          { x: 123, y: 238 },
          { x: 65,  y: 195 },
          { x: 138, y: 195 },
          { x: 160, y: 125 }
        ]
      },
      {
        name: "Zvoneček",
        points: [
          { x: 160, y: 135 },
          { x: 195, y: 160 },
          { x: 205, y: 240 },
          { x: 245, y: 295 },
          { x: 185, y: 295 },
          { x: 180, y: 325 },
          { x: 140, y: 325 },
          { x: 135, y: 295 },
          { x: 75,  y: 295 },
          { x: 115, y: 240 },
          { x: 125, y: 160 },
          { x: 160, y: 135 }
        ]
      },
      {
        name: "Sněhulák",
        points: [
          { x: 160, y: 120 },
          { x: 180, y: 120 },
          { x: 180, y: 145 },
          { x: 195, y: 160 },
          { x: 195, y: 185 },
          { x: 180, y: 200 },
          { x: 210, y: 220 },
          { x: 210, y: 255 },
          { x: 190, y: 275 },
          { x: 230, y: 295 },
          { x: 230, y: 340 },
          { x: 160, y: 350 },
          { x: 90,  y: 340 },
          { x: 90,  y: 295 },
          { x: 130, y: 275 },
          { x: 110, y: 255 },
          { x: 110, y: 220 },
          { x: 140, y: 200 },
          { x: 125, y: 185 },
          { x: 125, y: 160 },
          { x: 140, y: 145 },
          { x: 140, y: 120 },
          { x: 160, y: 120 }
        ]
      },
      {
        name: "Vánoční kapr",
        points: [
          { x: 65,  y: 235 }, // pusa
          { x: 105, y: 175 }, // hlava shora
          { x: 160, y: 165 }, // hřbet
          { x: 190, y: 145 }, // hřbetní ploutev
          { x: 205, y: 175 },
          { x: 245, y: 210 }, // kořen ocasu
          { x: 275, y: 165 }, // horní cíp ocasu
          { x: 255, y: 235 }, // střed ocasu
          { x: 275, y: 305 }, // dolní cíp ocasu
          { x: 245, y: 260 },
          { x: 195, y: 285 }, // bříško
          { x: 165, y: 310 }, // břišní ploutev
          { x: 145, y: 285 },
          { x: 105, y: 280 }, // spodek hlavy
          { x: 65,  y: 235 }
        ]
      },
      {
        name: "Vánoční kometa",
        points: [
          { x: 100, y: 145 }, // horní cíp hvězdy
          { x: 115, y: 180 },
          { x: 155, y: 180 }, // pravý cíp hvězdy
          { x: 265, y: 165 }, // horní ohon komety
          { x: 215, y: 215 },
          { x: 275, y: 220 }, // střední ohon
          { x: 205, y: 245 },
          { x: 260, y: 275 }, // dolní ohon
          { x: 135, y: 250 },
          { x: 125, y: 285 }, // dolní cíp hvězdy
          { x: 95,  y: 245 },
          { x: 60,  y: 260 }, // levý dolní cíp
          { x: 75,  y: 220 },
          { x: 50,  y: 190 }, // levý cíp
          { x: 85,  y: 180 },
          { x: 100, y: 145 }
        ]
      },
      {
        name: "Vánoční bota",
        points: [
          { x: 125, y: 125 }, // lem nahoře vlevo
          { x: 195, y: 125 }, // lem nahoře vpravo
          { x: 195, y: 165 },
          { x: 180, y: 175 }, // lýtko vpravo
          { x: 180, y: 260 },
          { x: 240, y: 285 }, // nárt doprava
          { x: 255, y: 320 }, // špička
          { x: 230, y: 345 }, // spodní bříško špičky
          { x: 125, y: 345 }, // pata
          { x: 125, y: 175 }, // lýtko vlevo
          { x: 110, y: 165 },
          { x: 110, y: 125 },
          { x: 125, y: 125 }
        ]
      },
      {
        name: "Andělíček",
        points: [
          { x: 160, y: 120 }, // svatozář nahoře
          { x: 185, y: 120 },
          { x: 185, y: 140 },
          { x: 175, y: 160 }, // krk
          { x: 245, y: 160 }, // pravé křídlo špička
          { x: 235, y: 225 }, // křídlo dolů
          { x: 180, y: 215 },
          { x: 215, y: 335 }, // lem šatů vpravo
          { x: 160, y: 330 }, // lem šatů střed
          { x: 105, y: 335 }, // lem šatů vlevo
          { x: 140, y: 215 },
          { x: 85,  y: 225 }, // levé křídlo dolů
          { x: 75,  y: 160 }, // levé křídlo špička
          { x: 145, y: 160 }, // krk vlevo
          { x: 135, y: 140 },
          { x: 135, y: 120 },
          { x: 160, y: 120 }
        ]
      }
    ];

    // Náhodný výběr jednoho z 8 tvarů při každém otevření
    const activeTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

    // Vygenerování hustší sítě bodů podél předlohy pro přesné porovnání
    function interpolatePath(points, step = 5) {
      let dense = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(1, Math.floor(dist / step));
        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          dense.push({
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
          });
        }
      }
      dense.push(points[points.length - 1]);
      return dense;
    }

    const denseTemplate = interpolatePath(activeTemplate.points, 5);

    // Výpočet shody křivky (procenta 0 až 100)
    function calculateAccuracy(userPts) {
      if (userPts.length < 25) return 0;

      // 1. Pokrytí: jak blízko je každý bod předlohy k nakreslenému tahu
      let sumTemplateDist = 0;
      denseTemplate.forEach(tp => {
        let minDist = Infinity;
        for (let i = 0; i < userPts.length; i++) {
          const d = Math.hypot(tp.x - userPts[i].x, tp.y - userPts[i].y);
          if (d < minDist) minDist = d;
        }
        sumTemplateDist += Math.min(minDist, 50);
      });
      const avgTemplateError = sumTemplateDist / denseTemplate.length;

      // 2. Přesnost: jak blízko je každý bod tahu k ideální lince
      let sumUserDist = 0;
      userPts.forEach(up => {
        let minDist = Infinity;
        for (let i = 0; i < denseTemplate.length; i++) {
          const d = Math.hypot(up.x - denseTemplate[i].x, up.y - denseTemplate[i].y);
          if (d < minDist) minDist = d;
        }
        sumUserDist += Math.min(minDist, 50);
      });
      const avgUserError = sumUserDist / userPts.length;

      const totalError = (avgTemplateError * 0.6) + (avgUserError * 0.4);

      // Převod na procenta
      let score = Math.max(0, 100 - (totalError * 2.6));
      return Math.round(score);
    }

    function evaluateDrawing() {
      if (userPath.length < 15) {
        userPath = [];
        return;
      }

      evaluatedAccuracy = calculateAccuracy(userPath);
      hasDrawn = true;

      if (window.adventScores && window.adventScores.recordScoreOnline) {
        window.adventScores.recordScoreOnline(6, evaluatedAccuracy);
      }

      let msg = `Poleva nanesena: ${evaluatedAccuracy}%! `;
      if (evaluatedAccuracy >= PASS_ACCURACY) {
        msg += `✨ Nádhera! Den splněn!`;
        onComplete(evaluatedAccuracy);
      } else {
        msg += `(Potřeba alespoň ${PASS_ACCURACY}%)`;
      }
      updateStatus(msg);
    }

    function resetDrawing() {
      userPath = [];
      hasDrawn = false;
      evaluatedAccuracy = 0;
      updateStatus();
    }

    // Vykreslování
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pozadí plechu
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Horní lišta
      ctx.fillStyle = '#292524';
      ctx.fillRect(0, 0, canvas.width, 42);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`🍪 Vzor: ${activeTemplate.name} (táhni jedním tahem)`, canvas.width / 2, 21);

      // Perníkový podklad
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(30, 60, 260, 310, 28);
      ctx.fill();
      ctx.stroke();

      // Perníková textura
      ctx.fillStyle = 'rgba(254, 215, 170, 0.12)';
      for (let tx = 45; tx <= 275; tx += 28) {
        for (let ty = 75; ty <= 355; ty += 28) {
          ctx.beginPath();
          ctx.arc(tx + ((ty % 2) * 6), ty, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 1. Předloha (čárkovaná vodicí linie)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      activeTemplate.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Značka začátku
      const startPt = activeTemplate.points[0];
      if (!hasDrawn && userPath.length === 0) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('Začni zde 👇', startPt.x, startPt.y - 12);
      }

      // 2. Kreslená poleva
      if (userPath.length > 1) {
        // Stín
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(userPath[0].x + 1, userPath[0].y + 2);
        for (let i = 1; i < userPath.length; i++) {
          ctx.lineTo(userPath[i].x + 1, userPath[i].y + 2);
        }
        ctx.stroke();

        // Bílá poleva
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(userPath[0].x, userPath[0].y);
        for (let i = 1; i < userPath.length; i++) {
          ctx.lineTo(userPath[i].x, userPath[i].y);
        }
        ctx.stroke();

        // Lesk
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(userPath[0].x - 1, userPath[0].y - 1);
        for (let i = 1; i < userPath.length; i++) {
          ctx.lineTo(userPath[i].x - 1, userPath[i].y - 1);
        }
        ctx.stroke();
      }

      // Tlačítko pro nový pokus
      if (hasDrawn) {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(95, 345, 130, 30, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Zkusit znovu 🔄', 160, 360);
      }

      animationFrameId = requestAnimationFrame(draw);
    }

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

    function onPointerDown(e) {
      const pos = getPos(e);

      if (hasDrawn && pos.x >= 90 && pos.x <= 230 && pos.y >= 340 && pos.y <= 380) {
        resetDrawing();
        return;
      }

      if (hasDrawn) return;

      isDrawing = true;
      userPath = [{ x: pos.x, y: pos.y }];
    }

    function onPointerMove(e) {
      if (!isDrawing || hasDrawn) return;
      const pos = getPos(e);

      const last = userPath[userPath.length - 1];
      if (Math.hypot(pos.x - last.x, pos.y - last.y) >= 3) {
        userPath.push({ x: pos.x, y: pos.y });
      }
    }

    function onPointerUp() {
      if (isDrawing && !hasDrawn) {
        isDrawing = false;
        evaluateDrawing();
      }
    }

    this.touchStart = (e) => { e.preventDefault(); onPointerDown(e); };
    this.touchMove = (e) => { e.preventDefault(); onPointerMove(e); };
    this.touchEnd = (e) => { e.preventDefault(); onPointerUp(); };

    this.mouseDown = (e) => onPointerDown(e);
    this.mouseMove = (e) => onPointerMove(e);
    this.mouseUp = (e) => onPointerUp();

    canvas.addEventListener('touchstart', this.touchStart, { passive: false });
    canvas.addEventListener('touchmove', this.touchMove, { passive: false });
    canvas.addEventListener('touchend', this.touchEnd, { passive: false });

    canvas.addEventListener('mousedown', this.mouseDown);
    canvas.addEventListener('mousemove', this.mouseMove);
    canvas.addEventListener('mouseup', this.mouseUp);

    draw();

    this.cleanup = function() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

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