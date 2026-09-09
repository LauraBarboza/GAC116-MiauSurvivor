'use strict';

// Tudo é local: sprites originais, lógica, eventos e desenho em Canvas 2D.
const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['lives', 'score', 'time', 'level', 'xp-label', 'xp-bar', 'xp-fill', 'pause', 'overlay', 'panel', 'status', 'best'].map(id => [id, document.getElementById(id)]));
const W = window.matchMedia('(max-width: 650px)').matches ? 540 : 960, H = 540;
canvas.width = W;
const keys = new Set();
let mode = 'start', game, choices = [], lastFrame = 0, record = 0;
try { record = Math.max(0, Number(localStorage.getItem('miau-survivor-best')) || 0); } catch { /* O jogo também funciona com armazenamento bloqueado. */ }
ui.best.textContent = record;
const dogs = [
  { name: 'Vira-lata', color: '#ba9476', dark: '#755a4d', hp: 2, speed: 51, radius: 13, xp: 1 },
  { name: 'Caramelo', color: '#e1ab53', dark: '#a26735', hp: 1, speed: 79, radius: 11, xp: 1 },
  { name: 'Bulldog', color: '#a5afb6', dark: '#636f7d', hp: 5, speed: 33, radius: 17, xp: 3 }
];
const upgrades = [
  { title: 'Tiro gigante', icon: '◆', description: '+25% no tamanho do projétil', apply: p => { p.shotSize *= 1.25; } },
  { title: 'Rajada', icon: '»', description: '15% menos tempo entre tiros', apply: p => { p.interval *= 0.85; } },
  { title: 'Garras afiadas', icon: '✦', description: '+1 de dano por projétil', apply: p => { p.damage++; } },
  { title: 'Patas ligeiras', icon: '↗', description: '+12% na velocidade do gato', apply: p => { p.speed *= 1.12; } }
];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clockText = t => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

function freshGame() {
  return { player: { x: W / 2, y: H / 2, r: 12, lives: 3, speed: 170, damage: 1, interval: 0.52, shotSize: 5, invincible: 0, facing: 1 }, enemies: [], bullets: [], gems: [], particles: [], time: 0, killPoints: 0, score: 0, kills: 0, level: 1, xp: 0, need: 5, spawnIn: 0.65, shotIn: 0, upgrades: 0 };
}

function setMode(next) {
  mode = next;
  keys.clear();
  ui.overlay.hidden = next === 'playing';
  ui.pause.disabled = !['playing', 'paused'].includes(next);
  ui.pause.textContent = next === 'paused' ? '▶ Continuar' : 'Ⅱ Pausar';
  ui.pause.setAttribute('aria-label', next === 'paused' ? 'Continuar partida' : 'Pausar partida');
  ui.status.textContent = { start: 'Pronto para jogar', playing: 'Sobreviva e colete XP', paused: 'Partida pausada', upgrade: 'Escolha uma melhoria', over: 'Fim de partida' }[next];
}
function focusPanel() { ui.panel.querySelector('button')?.focus({ preventScroll: true }); }
function start() {
  game = freshGame();
  setMode('playing');
  syncHud();
  canvas.focus({ preventScroll: true });
}
function showStart() {
  game = freshGame();
  setMode('start');
  ui.panel.innerHTML = '<div class="cat-mark" aria-hidden="true"> /\\_/\\<br>( o.o )<br> &gt; ^ &lt;</div><p class="eyebrow">BEM-VINDA AO QUINTAL</p><h2>MIAU SURVIVOR</h2><p>Você é pequena. A confusão é enorme.<br>Escape dos cachorros, colete XP e fique mais forte.</p><button class="primary" id="start">Começar partida →</button><p class="hint">WASD / setas para mover · tiro automático · 3 vidas</p>';
  document.querySelector('#start').addEventListener('click', start);
}
function pause() {
  if (mode === 'paused') {
    setMode('playing');
    canvas.focus({ preventScroll: true });
  } else if (mode === 'playing') {
    setMode('paused');
    ui.panel.innerHTML = '<p class="eyebrow">UMA PAUSA PARA O CAFUNÉ</p><h2>Respire. O quintal espera.</h2><p>O tempo e os inimigos estão parados.</p><button class="primary" id="resume">Continuar partida →</button><p class="hint">P ou Esc também continua</p>';
    document.querySelector('#resume').addEventListener('click', pause);
    focusPanel();
  }
}
function gameOver() {
  record = Math.max(record, game.score);
  try { localStorage.setItem('miau-survivor-best', String(record)); } catch { /* Recorde apenas nesta sessão se localStorage indisponível. */ }
  ui.best.textContent = record;
  setMode('over');
  ui.panel.innerHTML = `<p class="eyebrow">FIM DE PARTIDA</p><h2>Até gatos precisam descansar.</h2><p><b>${game.score} pontos</b> · ${clockText(game.time)} de sobrevivência<br>${game.kills} cachorros derrotados · nível ${game.level}</p><button class="primary" id="restart">Tentar de novo ↻</button><p class="hint">Novo quintal, três vidas e outra chance de bater o recorde.</p>`;
  document.querySelector('#restart').addEventListener('click', start);
  focusPanel();
}
function levelUp() {
  if (game.xp < game.need) return;
  game.xp -= game.need;
  game.level++;
  game.need = 5 + (game.level - 1) * 3;
  // Fisher–Yates: cada nível oferece três das quatro melhorias, sem repetir.
  const pool = [...upgrades];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  choices = pool.slice(0, 3);
  setMode('upgrade');
  ui.panel.innerHTML = `<p class="eyebrow">NÍVEL ${game.level} ALCANÇADO</p><h2>Mais poder nas patinhas.</h2><p>Escolha uma melhoria. A arena espera por você.</p><div class="upgrades">${choices.map((u, i) => `<button class="upgrade" data-choice="${i}"><b>${i + 1}. ${u.icon} ${u.title}</b><span>${u.description}</span></button>`).join('')}</div><p class="hint">Clique, toque ou use 1 / 2 / 3</p>`;
  ui.panel.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => chooseUpgrade(Number(b.dataset.choice))));
  syncHud();
  focusPanel();
}
function chooseUpgrade(index) {
  if (mode !== 'upgrade' || !choices[index]) return;
  choices[index].apply(game.player);
  game.upgrades++;
  setMode('playing');
  canvas.focus({ preventScroll: true });
  levelUp(); // XP excedente é preservado, inclusive se render mais de um nível.
}
function syncHud() {
  ui.lives.textContent = '♥ '.repeat(game.player.lives) + '♡ '.repeat(3 - game.player.lives);
  ui.lives.setAttribute('aria-label', `${game.player.lives} vidas`);
  ui.score.textContent = String(game.score).padStart(5, '0');
  ui.time.textContent = clockText(game.time);
  ui.level.textContent = String(game.level).padStart(2, '0');
  ui['xp-label'].textContent = `XP ${game.xp} / ${game.need}`;
  ui['xp-fill'].style.width = `${Math.min(100, game.xp / game.need * 100)}%`;
  ui['xp-bar'].setAttribute('aria-valuemax', game.need);
  ui['xp-bar'].setAttribute('aria-valuenow', Math.min(game.xp, game.need));
}
function spawnDog() {
  const type = dogs[Math.floor(Math.random() * (game.time < 12 ? 2 : 3))];
  const side = Math.floor(Math.random() * 4);
  const x = side === 0 ? -24 : side === 1 ? W + 24 : Math.random() * W;
  const y = side === 2 ? -24 : side === 3 ? H + 24 : Math.random() * H;
  game.enemies.push({ ...type, x, y, maxHp: type.hp, phase: Math.random() * 6, hit: 0 });
}
function burst(x, y, color, amount = 7) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    game.particles.push({ x, y, vx: Math.cos(angle) * 70, vy: Math.sin(angle) * 70, life: 0.3, color });
  }
}
function update(dt) {
  if (mode !== 'playing') return;
  const p = game.player;
  game.time += dt;
  game.score = game.killPoints + Math.floor(game.time);
  p.invincible = Math.max(0, p.invincible - dt);
  let mx = Number(keys.has('d') || keys.has('ArrowRight')) - Number(keys.has('a') || keys.has('ArrowLeft'));
  let my = Number(keys.has('s') || keys.has('ArrowDown')) - Number(keys.has('w') || keys.has('ArrowUp'));
  const length = Math.hypot(mx, my) || 1;
  if (mx) p.facing = Math.sign(mx);
  p.x = clamp(p.x + mx / length * p.speed * dt, 22, W - 22);
  p.y = clamp(p.y + my / length * p.speed * dt, 24, H - 22);
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    if (game.enemies.length < 110) spawnDog();
    game.spawnIn = Math.max(0.22, 1.1 - game.time * 0.006);
  }
  game.shotIn -= dt;
  if (game.shotIn <= 0 && game.enemies.length) {
    const target = game.enemies.reduce((nearest, e) => distance(e, p) < distance(nearest, p) ? e : nearest);
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    game.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 410, vy: Math.sin(angle) * 410, r: Math.min(30, p.shotSize), damage: p.damage, life: 3 });
    game.shotIn = Math.max(0.08, p.interval);
  }
  for (const enemy of game.enemies) {
    const d = distance(enemy, p) || 1;
    const speed = enemy.speed * (1 + Math.min(0.8, game.time / 240));
    enemy.x += (p.x - enemy.x) / d * speed * dt;
    enemy.y += (p.y - enemy.y) / d * speed * dt;
    enemy.hit = Math.max(0, enemy.hit - dt);
  }
  // Projéteis acertam um inimigo cada; a lista de mortos é removida após a colisão.
  for (const b of game.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of game.enemies) {
      if (e.hp > 0 && distance(b, e) < b.r + e.radius) {
        e.hp -= b.damage; e.hit = 0.1; b.life = 0;
        burst(b.x, b.y, '#f5edb1', 3);
        if (e.hp <= 0) {
          game.kills++; game.killPoints += e.xp * 10;
          game.gems.push({ x: e.x, y: e.y, value: e.xp });
          burst(e.x, e.y, e.color);
        }
        break;
      }
    }
  }
  game.bullets = game.bullets.filter(b => b.life > 0 && b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40);
  game.enemies = game.enemies.filter(e => e.hp > 0);
  for (const e of game.enemies) {
    if (p.invincible <= 0 && distance(e, p) < e.radius + p.r) {
      p.lives--; p.invincible = 1.8;
      const angle = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(angle) * 50; e.y += Math.sin(angle) * 50;
      burst(p.x, p.y, '#ff8d83', 12);
      if (p.lives <= 0) { game.score = game.killPoints + Math.floor(game.time); syncHud(); gameOver(); return; }
    }
  }
  for (const gem of game.gems) {
    const d = distance(gem, p);
    if (d < 90 && d > 0) { gem.x += (p.x - gem.x) / d * 230 * dt; gem.y += (p.y - gem.y) / d * 230 * dt; }
    if (distance(gem, p) < 19) { game.xp += gem.value; gem.collected = true; }
  }
  game.gems = game.gems.filter(g => !g.collected);
  // Mantém a arena estável em partidas longas, preservando o valor do XP.
  if (game.gems.length > 220) { const first = game.gems.shift(); game.gems[0].value += first.value; }
  for (const particle of game.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; }
  game.particles = game.particles.filter(particle => particle.life > 0);
  game.score = game.killPoints + Math.floor(game.time);
  levelUp();
  syncHud();
}

// Os mapas de caracteres são sprites originais; cada caractere vira um quadrado.
const catSprite = ['.a.....a.', '.aa...aa.', '.acaaaca.', '.aaaaaaa.', '.aeaaaea.', '.aaafaaa.', '..aaaaa..', '...aaa...', '..aaaaa..', '.aaaaaaa.', '.aa...aa.'];
const dogSprite = ['.dd...dd.', '.dcdddcd.', '.dcccccd.', '.ccececc.', '.cccaccc.', '..ccfcc..', '..ccccc..', '.ccccccc.', '.ddcccdd.', '.dd...dd.'];
function pixelSprite(rows, palette, x, y, size, facing = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(facing, 1);
  rows.forEach((row, sy) => [...row].forEach((ch, sx) => {
    if (palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect((sx - 4.5) * size, (sy - 5.5) * size, size, size); }
  }));
  ctx.restore();
}
// Fundo pré-renderizado: reduz trabalho por quadro e dispensa arquivos de imagem.
const background = document.createElement('canvas'); background.width = W; background.height = H;
const bg = background.getContext('2d');
bg.fillStyle = '#30483d'; bg.fillRect(0, 0, W, H);
for (let y = 0; y < H; y += 30) for (let x = 0; x < W; x += 30) {
  bg.fillStyle = ((x / 30 + y / 30) % 2) ? '#324a3f' : '#30483d'; bg.fillRect(x, y, 30, 30);
  if ((x * 7 + y * 3) % 110 === 0) { bg.fillStyle = '#4e6550'; bg.fillRect(x + 10, y + 15, 3, 7); bg.fillRect(x + 6, y + 12, 3, 5); }
}
bg.fillStyle = '#5a6351'; bg.fillRect(0, 0, W, 13); bg.fillRect(0, H - 13, W, 13); bg.fillRect(0, 0, 13, H); bg.fillRect(W - 13, 0, 13, H);
for (let x = 0; x < W; x += 32) { bg.fillStyle = '#85917a'; bg.fillRect(x, 0, 3, 13); bg.fillRect(x, H - 13, 3, 13); }
for (let i = 0; i < 24; i++) {
  const x = 35 + (i * 139) % 886, y = 35 + (i * 73) % 465;
  bg.fillStyle = '#63764b'; bg.fillRect(x, y, 3, 9);
  bg.fillStyle = i % 3 ? '#cdb983' : '#dc9b96'; bg.fillRect(x - 2, y - 2, 6, 5);
}
function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(background, 0, 0);
  for (const gem of game.gems) {
    ctx.fillStyle = '#244d49'; ctx.fillRect(gem.x - 6, gem.y + 5, 12, 4);
    ctx.save(); ctx.translate(Math.round(gem.x), Math.round(gem.y)); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#76e4d1'; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = '#d3ffdf'; ctx.fillRect(-3, -3, 3, 3); ctx.restore();
  }
  for (const e of game.enemies) {
    ctx.fillStyle = '#20332ca8'; ctx.fillRect(e.x - e.radius, e.y + 12, e.radius * 2, 6);
    const bob = Math.sin(game.time * 11 + e.phase) > 0 ? 1 : -1;
    pixelSprite(dogSprite, { d: e.dark, c: e.hit ? '#fff3d4' : e.color, e: '#1b252b', a: '#322d30', f: '#da8581' }, e.x, e.y + bob, e.radius / 4.5, game.player.x >= e.x ? 1 : -1);
    if (e.hp < e.maxHp) { ctx.fillStyle = '#1a282c'; ctx.fillRect(e.x - 13, e.y - 25, 26, 3); ctx.fillStyle = '#efb77a'; ctx.fillRect(e.x - 13, e.y - 25, 26 * e.hp / e.maxHp, 3); }
  }
  const p = game.player;
  ctx.fillStyle = '#1b302ba8'; ctx.fillRect(p.x - 15, p.y + 14, 30, 7);
  if (!(p.invincible > 0 && Math.floor(p.invincible * 12) % 2)) {
    pixelSprite(catSprite, { a: '#e9ecd8', c: '#efa6a5', e: '#21323a', d: '#21323a', f: '#c98285' }, p.x, p.y, 3, p.facing);
    ctx.fillStyle = '#d7ef82'; ctx.fillRect(p.x - 7, p.y + 5, 14, 3);
  }
  for (const b of game.bullets) { ctx.fillStyle = '#bd984f'; ctx.fillRect(b.x - b.r - 1, b.y - b.r - 1, b.r * 2 + 2, b.r * 2 + 2); ctx.fillStyle = '#f9e5a2'; ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); ctx.fillStyle = '#fff8d9'; ctx.fillRect(b.x - b.r, b.y - b.r, b.r, b.r); }
  for (const particle of game.particles) { ctx.globalAlpha = Math.max(0, particle.life / 0.3); ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, 4, 4); }
  ctx.globalAlpha = 1;
}
function frame(timestamp) {
  // Limitar delta evita saltos depois de travamentos ou troca de aba.
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.033);
  lastFrame = timestamp;
  update(dt); draw(); requestAnimationFrame(frame);
}
document.addEventListener('keydown', event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)) {
    if (mode === 'playing') { event.preventDefault(); keys.add(key); }
  }
  if (event.repeat) return;
  if (key === 'p' || key === 'Escape') { event.preventDefault(); pause(); }
  if (mode === 'upgrade' && ['1', '2', '3'].includes(key)) chooseUpgrade(Number(key) - 1);
});
document.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
window.addEventListener('blur', () => { keys.clear(); if (mode === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') pause(); });
ui.pause.addEventListener('click', pause);
document.querySelectorAll('[data-move]').forEach(button => {
  button.addEventListener('pointerdown', e => { e.preventDefault(); if (mode === 'playing') { button.setPointerCapture(e.pointerId); keys.add(button.dataset.move); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, () => keys.delete(button.dataset.move)));
});
showStart(); syncHud(); requestAnimationFrame(frame);
