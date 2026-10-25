// games/day7.js - Šplhání po stromečku (s arcade tlačítky VLEVO / VPRAVO)
window.adventGames = window.adventGames || {};

window.adventGames[7] = {
  title: "Šplhání po stromečku",
  instructions: "Vyskákej se skřítkem po větvích až k hvězdě! Použij tlačítka dole (nebo šipky na klávesnici). Sbírej jablíčka 🍎 pro obří skok a rukavice 🧤 proti ledu 🧊!",

  start: function(canvas, statusText, onComplete) {
    var ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 400;

    var animId = null;
    var timerInt = null;
    var timerStarted = false;
    var startTime = null;
    var elapsed = 0;
    var isDone = false;

    var GOAL_HEIGHT = 3000;
    var START_Y = 320;

    // --- Vytvoření ovládacích tlačítek pod canvasem ---
    var controlsWrap = document.getElementById('day7-controls-wrap');
    if (!controlsWrap) {
      controlsWrap = document.createElement('div');
      controlsWrap.id = 'day7-controls-wrap';
      controlsWrap.style.width = '100%';
      controlsWrap.style.maxWidth = '320px';
      controlsWrap.style.margin = '10px auto 0 auto';
      controlsWrap.style.display = 'grid';
      controlsWrap.style.gridTemplateColumns = '1fr 1fr';
      controlsWrap.style.gap = '10px';

      controlsWrap.innerHTML = `
        <button id="day7-btn-left" style="
          background: #1e293b;
          border: 2px solid #3b82f6;
          color: #ffffff;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">◀ VLEVO</button>
        <button id="day7-btn-right" style="
          background: #1e293b;
          border: 2px solid #3b82f6;
          color: #ffffff;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">VPRAVO ▶</button>
      `;
      canvas.parentNode.insertBefore(controlsWrap, statusText);
    } else {
      controlsWrap.style.display = 'grid';
    }

    var btnLeft = document.getElementById('day7-btn-left');
    var btnRight = document.getElementById('day7-btn-right');

    // Rekordy
    var myBest = window.adventScores ? window.adventScores.getPersonalBest(7) : null;
    var topScore = null;
    var topHolder = 'Zatím nikdo';

    function refreshStatus(banner) {
      var topTxt = topScore !== null ? (topScore + 's (' + topHolder + ')') : 'Zatím nikdo';
      var pct = Math.min(100, Math.floor((maxAlt / GOAL_HEIGHT) * 100));
      var gloveTxt = hasGloves ? " | 🧤 Štít aktivní!" : "";
      if (banner) {
        statusText.innerText = banner + " | TOP: " + topTxt;
      } else {
        statusText.innerText = "⏱️ " + elapsed + "s | Výška: " + pct + "%" + gloveTxt + " | TOP: " + topTxt;
      }
    }
    refreshStatus();

    if (window.adventScores && window.adventScores.getGlobalRecord) {
      window.adventScores.getGlobalRecord(7).then(function(rec) {
        if (rec) {
          topScore = rec.score;
          topHolder = rec.player_name;
          refreshStatus();
        }
      }).catch(function() {});
    }

    function beginTimer() {
      if (timerStarted) return;
      timerStarted = true;
      startTime = Date.now();
      timerInt = setInterval(function() {
        if (!isDone) {
          elapsed = Math.floor((Date.now() - startTime) / 1000);
          refreshStatus();
        }
      }, 1000);
    }

    var hero = {
      x: 147,
      y: START_Y,
      vx: 0,
      vy: -7,
      w: 26,
      h: 26,
      facing: 1
    };

    var GRAV = 0.35;
    var JUMP = -9.2;
    var SUPER_JUMP = -15.5;
    var camY = START_Y - 220;
    var maxAlt = 0;
    var alertBanner = "";
    var alertTimer = null;

    var hasGloves = false;

    // Generování větví a bonusů
    var plats = [];
    var items = [];

    plats.push({ x: 80, y: 350, w: 160, h: 14, type: 'normal', broken: false });

    var genY = 290;
    while (genY > -GOAL_HEIGHT) {
      genY -= (40 + Math.random() * 20);
      var w = 62 + Math.random() * 26;
      var x = 15 + Math.random() * (320 - w - 30);
      var t = 'normal';
      var rnd = Math.random();

      if (rnd < 0.20 && genY < 180) {
        t = 'fragile';
      } else if (rnd < 0.32 && genY < 60 && genY > -GOAL_HEIGHT + 140) {
        t = 'trap';
      }

      var pl = { x: Math.round(x), y: Math.round(genY), w: Math.round(w), h: 12, type: t, broken: false };
      plats.push(pl);

      if (t === 'normal' && Math.random() < 0.16) {
        items.push({
          type: 'apple',
          x: pl.x + pl.w / 2,
          y: pl.y - 18,
          collected: false
        });
      } else if (t === 'normal' && Math.random() < 0.11) {
        items.push({
          type: 'gloves',
          x: pl.x + pl.w / 2,
          y: pl.y - 18,
          collected: false
        });
      }
    }

    plats.push({ x: 110, y: -GOAL_HEIGHT, w: 100, h: 16, type: 'star', broken: false });

    function failReset(reason) {
      alertBanner = reason;
      if (alertTimer) clearTimeout(alertTimer);
      alertTimer = setTimeout(function() { alertBanner = ""; }, 2200);

      hero.x = 147;
      hero.y = START_Y;
      hero.vx = 0;
      hero.vy = -6;
      camY = START_Y - 220;
      hasGloves = false;

      for (var i = 0; i < plats.length; i++) {
        plats[i].broken = false;
      }
      for (var k = 0; k < items.length; k++) {
        items[k].collected = false;
      }

      refreshStatus();
    }

    function winGame() {
      if (isDone) return;
      isDone = true;
      if (timerInt) clearInterval(timerInt);

      var score = Math.max(1, elapsed);
      if (window.adventScores && window.adventScores.recordScoreOnline) {
        window.adventScores.recordScoreOnline(7, score);
      }

      var msg = "🌟 Hvězda dosažena za " + score + "s! ";
      if (!topScore || score < topScore) msg += "🔥 NOVÝ REKORD!";
      else if (!myBest || score < myBest) msg += "🌟 Tvůj rekord!";

      statusText.innerText = msg;
      onComplete(score);
    }

    // Stav kláves a tlačítek
    var inputLeft = false;
    var inputRight = false;

    function loop() {
      if (!isDone) {
        if (inputLeft && !inputRight) {
          hero.vx = -4.5;
        } else if (inputRight && !inputLeft) {
          hero.vx = 4.5;
        } else {
          hero.vx *= 0.85;
        }

        if (hero.vx > 0.4) hero.facing = 1;
        else if (hero.vx < -0.4) hero.facing = -1;

        hero.x += hero.vx;
        if (hero.x < -hero.w) hero.x = 320;
        if (hero.x > 320) hero.x = -hero.w;

        hero.vy += GRAV;
        hero.y += hero.vy;

        // Bonusy
        var heroCenterX = hero.x + hero.w / 2;
        var heroCenterY = hero.y + hero.h / 2;

        for (var k = 0; k < items.length; k++) {
          var it = items[k];
          if (it.collected) continue;
          if (Math.hypot(heroCenterX - it.x, heroCenterY - it.y) < 22) {
            it.collected = true;
            if (it.type === 'apple') {
              hero.vy = SUPER_JUMP;
              alertBanner = "🍎 Super skok!";
            } else if (it.type === 'gloves') {
              hasGloves = true;
              alertBanner = "🧤 Zimní rukavice nasazeny!";
            }
            if (alertTimer) clearTimeout(alertTimer);
            alertTimer = setTimeout(function() { alertBanner = ""; }, 1800);
            refreshStatus();
          }
        }

        // Dopad na větve
        if (hero.vy > 0) {
          var foot = hero.y + hero.h;
          var prev = foot - hero.vy;

          for (var i = 0; i < plats.length; i++) {
            var p = plats[i];
            if (p.broken) continue;

            if (foot >= p.y && prev <= p.y + 12 && hero.x + hero.w >= p.x && hero.x <= p.x + p.w) {
              if (p.type === 'star') {
                hero.vy = -3;
                winGame();
              } else if (p.type === 'trap') {
                if (hasGloves) {
                  hasGloves = false;
                  p.broken = true;
                  hero.vy = JUMP;
                  alertBanner = "🧤 Led překonán rukavicemi!";
                  if (alertTimer) clearTimeout(alertTimer);
                  alertTimer = setTimeout(function() { alertBanner = ""; }, 1800);
                  refreshStatus();
                } else {
                  failReset("🧊 Ledová past! Zpět na začátek!");
                }
              } else if (p.type === 'fragile') {
                p.broken = true;
                hero.vy = JUMP * 0.9;
                (function(platform) {
                  setTimeout(function() { platform.broken = false; }, 3000);
                })(p);
              } else {
                hero.vy = JUMP;
              }
              break;
            }
          }
        }

        var targetCam = hero.y - 220;
        if (targetCam < camY) camY = targetCam;

        var alt = Math.max(0, Math.floor(START_Y - hero.y));
        if (alt > maxAlt) maxAlt = alt;

        if (hero.y > camY + 440) {
          failReset("⚠️ Pád z větve! Zpět na začátek!");
        }
      }

      // Vykreslování
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 320, 400);

      ctx.save();
      ctx.translate(0, -camY);

      // Kmen
      ctx.fillStyle = '#1c1106';
      ctx.fillRect(148, -GOAL_HEIGHT - 30, 24, GOAL_HEIGHT + 450);

      // Větve
      for (var j = 0; j < plats.length; j++) {
        var pl = plats[j];
        if (pl.broken) continue;
        if (pl.y < camY - 30 || pl.y > camY + 430) continue;

        if (pl.type === 'star') {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
          ctx.font = '34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', pl.x + pl.w / 2, pl.y - 8);
        } else if (pl.type === 'trap') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧊', pl.x + pl.w / 2, pl.y + 9);
        } else if (pl.type === 'fragile') {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pl.x + 2, pl.y - 2, pl.w - 4, 3);
        } else {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(pl.x + 2, pl.y - 2, pl.w - 4, 3);
        }
      }

      // Bonusy
      for (var m = 0; m < items.length; m++) {
        var itm = items[m];
        if (itm.collected) continue;
        if (itm.y < camY - 30 || itm.y > camY + 430) continue;

        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(itm.type === 'apple' ? '🍎' : '🧤', itm.x, itm.y);
      }

      // Skřítek
      ctx.save();
      ctx.translate(hero.x + hero.w / 2, hero.y + hero.h / 2);
      if (hero.facing === -1) ctx.scale(-1, 1);

      if (hasGloves) {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.fillText('🧤', 12, -12);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '26px sans-serif';
      ctx.fillText('🧝', 0, -2);
      ctx.restore();

      ctx.restore();

      // Lišta
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 320, 34);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px sans-serif';

      if (isDone) {
        ctx.fillStyle = '#facc15';
        ctx.fillText('🌟 HVĚZDA DOSAŽENA! 🌟', 160, 17);
      } else if (alertBanner) {
        ctx.fillStyle = alertBanner.indexOf('🧊') !== -1 || alertBanner.indexOf('⚠️') !== -1 ? '#f87171' : '#facc15';
        ctx.fillText(alertBanner, 160, 17);
      } else {
        ctx.fillStyle = '#38bdf8';
        var p = Math.min(100, Math.floor((maxAlt / GOAL_HEIGHT) * 100));
        var gloveStatus = hasGloves ? " | 🧤 Štít" : "";
        ctx.fillText("🎄 Vrchol: " + p + "%" + gloveStatus + " | Špička: 100%", 160, 17);
      }

      animId = requestAnimationFrame(loop);
    }

    // --- Obsluha tlačítek (Touch + Myš) ---
    function setBtnStyle(btn, active) {
      if (!btn) return;
      btn.style.background = active ? '#2563eb' : '#1e293b';
      btn.style.transform = active ? 'scale(0.96)' : 'scale(1)';
    }

    var leftDown = function(e) { e.preventDefault(); beginTimer(); inputLeft = true; setBtnStyle(btnLeft, true); };
    var leftUp = function(e) { e.preventDefault(); inputLeft = false; setBtnStyle(btnLeft, false); };

    var rightDown = function(e) { e.preventDefault(); beginTimer(); inputRight = true; setBtnStyle(btnRight, true); };
    var rightUp = function(e) { e.preventDefault(); inputRight = false; setBtnStyle(btnRight, false); };

    if (btnLeft) {
      btnLeft.addEventListener('touchstart', leftDown, { passive: false });
      btnLeft.addEventListener('touchend', leftUp, { passive: false });
      btnLeft.addEventListener('mousedown', leftDown);
      btnLeft.addEventListener('mouseup', leftUp);
      btnLeft.addEventListener('mouseleave', leftUp);
    }

    if (btnRight) {
      btnRight.addEventListener('touchstart', rightDown, { passive: false });
      btnRight.addEventListener('touchend', rightUp, { passive: false });
      btnRight.addEventListener('mousedown', rightDown);
      btnRight.addEventListener('mouseup', rightUp);
      btnRight.addEventListener('mouseleave', rightUp);
    }

    // --- Klávesnice (PC šipky a A/D) ---
    var kd = function(e) {
      beginTimer();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputLeft = true;
        setBtnStyle(btnLeft, true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRight = true;
        setBtnStyle(btnRight, true);
      }
    };

    var ku = function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputLeft = false;
        setBtnStyle(btnLeft, false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRight = false;
        setBtnStyle(btnRight, false);
      }
    };

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    loop();

    this.cleanup = function() {
      if (animId) cancelAnimationFrame(animId);
      if (timerInt) clearInterval(timerInt);
      if (alertTimer) clearTimeout(alertTimer);

      if (controlsWrap) controlsWrap.style.display = 'none';

      if (btnLeft) {
        btnLeft.removeEventListener('touchstart', leftDown);
        btnLeft.removeEventListener('touchend', leftUp);
        btnLeft.removeEventListener('mousedown', leftDown);
        btnLeft.removeEventListener('mouseup', leftUp);
        btnLeft.removeEventListener('mouseleave', leftUp);
      }

      if (btnRight) {
        btnRight.removeEventListener('touchstart', rightDown);
        btnRight.removeEventListener('touchend', rightUp);
        btnRight.removeEventListener('mousedown', rightDown);
        btnRight.removeEventListener('mouseup', rightUp);
        btnRight.removeEventListener('mouseleave', rightUp);
      }

      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};