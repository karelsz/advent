// games/day7.js - Šplhání po stromečku (s jablíčky na super skok a rukavicemi proti ledu)
window.adventGames = window.adventGames || {};

window.adventGames[7] = {
  title: "Šplhání po stromečku",
  instructions: "Vyskákej se skřítkem po větvích až k hvězdě! Sbírej jablíčka 🍎 pro obří skok a rukavice 🧤, které tě ochrání před pádem z ledové pasti 🧊!",

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

    var GOAL_HEIGHT = 1500;
    var START_Y = 320;

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
    var SUPER_JUMP = -12.5; // Odraz z jablíčka
    var camY = START_Y - 220;
    var maxAlt = 0;
    var alertBanner = "";
    var alertTimer = null;

    var hasGloves = false; // Má skřítek rukavice?

    // Generování větví a bonusů
    var plats = [];
    var items = []; // Jablíčka a rukavice

    plats.push({ x: 80, y: 350, w: 160, h: 14, type: 'normal', broken: false });

    var genY = 290;
    while (genY > -GOAL_HEIGHT) {
      // Příjemnější rozestupy (40 až 60 px)
      genY -= (40 + Math.random() * 20);
      var w = 62 + Math.random() * 26;
      var x = 15 + Math.random() * (320 - w - 30);
      var t = 'normal';
      var rnd = Math.random();

      // Vyváženější pasti: méně ledu, více křehkých větví
      if (rnd < 0.20 && genY < 180) {
        t = 'fragile';
      } else if (rnd < 0.32 && genY < 60 && genY > -GOAL_HEIGHT + 140) {
        t = 'trap';
      }

      var pl = { x: Math.round(x), y: Math.round(genY), w: Math.round(w), h: 12, type: t, broken: false };
      plats.push(pl);

      // Přidání jablíčka (cca na 12 % normálních větví)
      if (t === 'normal' && Math.random() < 0.16) {
        items.push({
          type: 'apple',
          x: pl.x + pl.w / 2,
          y: pl.y - 18,
          collected: false
        });
      }
      // Přidání rukavic (cca na 8 % větví, hlavně před zónami s ledem)
      else if (t === 'normal' && Math.random() < 0.11) {
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

    var dragging = false;
    var aimX = 160;
    var keys = { l: false, r: false };

    function ptrMove(cx) {
      beginTimer();
      var rect = canvas.getBoundingClientRect();
      aimX = (cx - rect.left) * (320 / rect.width);
    }

    function loop() {
      if (!isDone) {
        if (keys.l) hero.vx = -4.2;
        else if (keys.r) hero.vx = 4.2;
        else if (dragging) {
          hero.vx = Math.max(-5, Math.min(5, (aimX - (hero.x + hero.w / 2)) * 0.25));
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

        // Kolize s bonusy (jablíčka a rukavice)
        var heroCenterX = hero.x + hero.w / 2;
        var heroCenterY = hero.y + hero.h / 2;

        for (var k = 0; k < items.length; k++) {
          var it = items[k];
          if (it.collected) continue;
          if (Math.hypot(heroCenterX - it.x, heroCenterY - it.y) < 22) {
            it.collected = true;
            if (it.type === 'apple') {
              hero.vy = SUPER_JUMP; // Katapult nahoru!
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

        // Dopady na větve (jen při pádu dolů)
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
                  // Rukavice zachránily situaci!
                  hasGloves = false;
                  p.broken = true; // Rozbije led
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
                // Sníh znovu napadne za 3 sekundy
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

      // Kreslení scény
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 320, 400);

      ctx.save();
      ctx.translate(0, -camY);

      // Kmen stromečku
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

      // Bonusy (jablíčka a rukavice)
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

      // Ochranná modrá záře a ikona rukavic, pokud má štít
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

      // Horní lišta
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

    var ts = function(e) { e.preventDefault(); dragging = true; ptrMove(e.touches[0].clientX); };
    var tm = function(e) { e.preventDefault(); if (dragging) ptrMove(e.touches[0].clientX); };
    var te = function(e) { e.preventDefault(); dragging = false; };

    var md = function(e) { dragging = true; ptrMove(e.clientX); };
    var mm = function(e) { if (dragging) ptrMove(e.clientX); };
    var mu = function() { dragging = false; };

    var kd = function(e) {
      beginTimer();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.l = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.r = true;
    };
    var ku = function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.l = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.r = false;
    };

    canvas.addEventListener('touchstart', ts, { passive: false });
    canvas.addEventListener('touchmove', tm, { passive: false });
    canvas.addEventListener('touchend', te, { passive: false });

    canvas.addEventListener('mousedown', md);
    canvas.addEventListener('mousemove', mm);
    canvas.addEventListener('mouseup', mu);

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    loop();

    this.cleanup = function() {
      if (animId) cancelAnimationFrame(animId);
      if (timerInt) clearInterval(timerInt);
      if (alertTimer) clearTimeout(alertTimer);

      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchmove', tm);
      canvas.removeEventListener('touchend', te);

      canvas.removeEventListener('mousedown', md);
      canvas.removeEventListener('mousemove', mm);
      canvas.removeEventListener('mouseup', mu);

      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  },

  stop: function() {
    if (this.cleanup) this.cleanup();
  }
};