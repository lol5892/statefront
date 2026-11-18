import { Battle } from './engine.js';
const $ = (id) => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const hitCtx = document.createElement('canvas').getContext('2d');
const colors = ['#459cf0', '#fa7868', '#b77bda', '#f1c15c', '#57bda4'], dark = ['#24669c', '#ad3c35', '#713d96', '#9a7527', '#287c68'];
const map = await fetch('./map.json').then(r => { if (!r.ok)
    throw Error('map'); return r.json(); });
let progress = { unlocked: 1, completed: [], difficulty: 1, sound: false };
try {
    Object.assign(progress, JSON.parse(localStorage.getItem('statefront-progress') || '{}'));
}
catch { }
let battle = new Battle(map, { level: 1, difficulty: progress.difficulty }), paused = true, selection = [], fraction = .8, zoom = 1, pan = { x: 0, y: 0 }, pointer = null, drag = false, fx = [], last = 0, saveClock = 0, resultShown = false, audio = null;
const paths = map.map(s => { let p = new Path2D(); for (const r of s.rings) {
    r.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
    p.closePath();
} return p; });
let w = 1, h = 1, scale = 1, ox = 0, oy = 0;
function resize() { const r = canvas.getBoundingClientRect(); w = r.width; h = r.height; let d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); ctx.setTransform(d, 0, 0, d, 0, 0); scale = Math.min((w - 20) / 1000, (h - 35) / 650) * zoom; ox = (w - 1000 * scale) / 2 + pan.x; oy = (h - 650 * scale) / 2 + pan.y; }
new ResizeObserver(resize).observe(canvas);
function world(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale }; }
function hit(p) { let closest = -1, d = 12 / scale; for (let i = 0; i < battle.states.length; i++) {
    let s = battle.states[i], dd = Math.hypot(s.x - p.x, s.y - p.y);
    if (dd < d) {
        closest = i;
        d = dd;
    }
} if (closest >= 0)
    return closest; for (let i = 0; i < paths.length; i++)
    if (hitCtx.isPointInPath(paths[i], p.x, p.y))
        return i; return -1; }
function sound(freq = 500) { if (!progress.sound)
    return; try {
    audio ?? (audio = new AudioContext());
    void audio.resume();
    let o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * .6, audio.currentTime + .1);
    g.gain.setValueAtTime(.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .13);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + .14);
}
catch { } }
function persist() { try {
    localStorage.setItem('statefront-progress', JSON.stringify(progress));
    localStorage.setItem('statefront-battle', JSON.stringify({ settings: battle.settings, states: battle.states, units: battle.units, time: battle.time, sent: battle.sent, captures: battle.captures, result: battle.result }));
}
catch { } }
function toast(s) { $('toast').textContent = s; $('toast').style.opacity = '1'; setTimeout(() => $('toast').style.opacity = '0', 2000); }
function start(level, resume = false) {
    battle = new Battle(map, { level, difficulty: progress.difficulty });
    if (resume) {
        try {
            let saved = JSON.parse(localStorage.getItem('statefront-battle') || 'null');
            if (saved && !saved.result) {
                battle = new Battle(map, saved.settings);
                Object.assign(battle, saved);
            }
        }
        catch { }
    }
    paused = false;
    resultShown = false;
    selection = [];
    zoom = 1;
    pan = { x: 0, y: 0 };
    resize();
    $('modal').classList.add('hidden');
    $('levelTitle').textContent = `Уровень ${String(battle.settings.level).padStart(2, '0')}`;
    $('chapter').textContent = `КАМПАНИЯ · ${['ПЕРВЫЕ ГРАНИЦЫ', 'НОВЫЕ ФРОНТЫ', 'БОЛЬШАЯ СТРАТЕГИЯ', 'БОРЬБА ЗА ШТАТЫ', 'КОНТИНЕНТ'][Math.floor((battle.settings.level - 1) / 6)]}`;
    persist();
    sound();
}
function show(html) { paused = true; selection = []; $('modal').innerHTML = `<section class="panel">${html}</section>`; $('modal').classList.remove('hidden'); }
function menu() {
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem('statefront-battle') || 'null');
    }
    catch { }
    show(`<div class="eyebrow">СТРАТЕГИЯ В РЕАЛЬНОМ ВРЕМЕНИ</div><h2>Вся карта.<br>Твой ход.</h2><p>Захватывайте штаты, объединяйте армии и опережайте соперников. Синие территории — ваши.</p><div class="difficulty">${['Легко', 'Обычно', 'Сложно'].map((s, i) => `<button data-diff="${i}" class="${i === progress.difficulty ? 'active' : ''}">${s}</button>`).join('')}</div><button class="primary" id="play">${saved && !saved.result ? 'Продолжить бой' : 'Начать кампанию'} ↗</button><button class="secondary" id="choose">Выбрать уровень</button><p style="font-size:10px">Жест от своего штата к цели отправляет армию. Проведите через несколько своих штатов для общей атаки. Нажмите ＋ для увеличения карты; перетаскивайте фон для обзора.</p>`);
    document.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { progress.difficulty = Number(b.dataset.diff); try {
        localStorage.setItem('statefront-progress', JSON.stringify(progress));
    }
    catch { } menu(); });
    $('play').onclick = () => start(saved?.settings?.level || progress.unlocked, !!saved && !saved.result);
    $('choose').onclick = levelMenu;
}
function levelMenu() { show(`<div class="eyebrow">КАМПАНИЯ</div><h2>30 шагов к победе</h2><p>Побеждайте, чтобы открыть следующий уровень.</p><div class="grid">${Array.from({ length: 30 }, (_, i) => `<button data-level="${i + 1}" ${i + 1 > progress.unlocked ? 'disabled' : ''} class="${progress.completed.includes(i + 1) ? 'completed' : i + 1 <= progress.unlocked ? 'unlocked' : ''}">${i + 1 <= progress.unlocked ? i + 1 : '·'}</button>`).join('')}</div><button id="back" class="secondary">Назад</button>`); document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => start(Number(b.dataset.level))); $('back').onclick = () => { if (battle.time > 0 && !battle.result) {
    paused = false;
    $('modal').classList.add('hidden');
}
else
    menu(); }; }
function finish() { resultShown = true; let win = battle.result === 'victory', l = battle.settings.level; if (win) {
    progress.unlocked = Math.max(progress.unlocked, Math.min(30, l + 1));
    if (!progress.completed.includes(l))
        progress.completed.push(l);
} persist(); sound(win ? 880 : 200); show(`<div class="badge">${win ? '⚑' : '◌'}</div><div class="eyebrow">${win ? 'ТЕРРИТОРИЯ ПОД КОНТРОЛЕМ' : 'ПЕРЕГРУППИРОВКА'}</div><h2>${win ? 'Победа!' : 'Фронт потерян'}</h2><p>${win ? 'Соперники повержены. Следующая карта ждёт вашего решения.' : 'Держите резерв и атакуйте, когда противник отправляет свою армию.'}</p><div class="stats"><span>Время <b>${formatTime(battle.time)}</b></span><span>Отправлено <b>${battle.sent}</b></span></div><button id="next" class="primary">${win && l < 30 ? 'Следующий уровень ↗' : 'Играть снова ↗'}</button><button id="select" class="secondary">Выбор уровня</button>`); $('next').onclick = () => start(win && l < 30 ? l + 1 : l); $('select').onclick = levelMenu; }
function formatTime(t) { return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; }
let down = { x: 0, y: 0 }, panning = false;
canvas.onpointerdown = e => { if (paused)
    return; canvas.setPointerCapture(e.pointerId); pointer = world(e); down = { x: e.clientX, y: e.clientY }; let id = hit(pointer); if (id >= 0 && battle.states[id].owner === 0) {
    if (!selection.includes(id))
        selection.push(id);
    drag = true;
    panning = false;
    sound(450);
}
else if (selection.length && id >= 0) {
    attack(id);
    drag = false;
    pointer = null;
}
else {
    panning = true;
    drag = false;
    selection = [];
} };
canvas.onpointermove = e => { if (paused)
    return; if (panning && e.buttons) {
    pan.x += e.clientX - down.x;
    pan.y += e.clientY - down.y;
    pan.x = Math.max(-w * zoom * .6, Math.min(w * zoom * .6, pan.x));
    pan.y = Math.max(-h * .6, Math.min(h * .6, pan.y));
    down = { x: e.clientX, y: e.clientY };
    resize();
} pointer = world(e); if (drag) {
    let id = hit(pointer);
    if (id >= 0 && battle.states[id].owner === 0 && !selection.includes(id)) {
        selection.push(id);
        sound(550);
    }
} };
function attack(id) { let own = selection.filter(i => battle.states[i].owner === 0 && i !== id); let count = battle.send(own, id, fraction); if (count) {
    sound(650);
    selection = [];
    persist();
}
else
    toast('Накопите хотя бы 2 бойцов'); }
canvas.onpointerup = e => { if (drag) {
    let id = hit(world(e));
    if (id >= 0 && !selection.includes(id))
        attack(id);
} drag = false; panning = false; pointer = null; };
canvas.onpointercancel = () => { drag = false; panning = false; pointer = null; selection = []; };
$('all').onclick = () => { if (paused)
    return; selection = battle.states.map((s, i) => s.owner === 0 ? i : -1).filter(i => i >= 0); toast('Нажмите на цель для общей атаки'); };
$('percent').onclick = () => { fraction = fraction === .8 ? .5 : fraction === .5 ? 1 : .8; $('percent').textContent = `Отправка ${fraction * 100}%`; };
$('zoom').onclick = () => { zoom = zoom === 1 ? 1.7 : zoom === 1.7 ? 2.5 : 1; pan = { x: 0, y: 0 }; resize(); $('zoom').textContent = zoom === 1 ? '＋' : '−'; toast(zoom === 1 ? 'Вся карта' : 'Перетаскивайте фон для обзора'); };
$('sound').onclick = () => { progress.sound = !progress.sound; $('sound').style.opacity = progress.sound ? '1' : '.45'; persist(); sound(); };
$('sound').style.opacity = progress.sound ? '1' : '.45';
$('levelsBtn').onclick = levelMenu;
$('pause').onclick = () => { if (paused)
    return; persist(); show('<div class="eyebrow">ПАУЗА</div><h2>Передышка</h2><p>Бой сохранён на этом устройстве.</p><button id="resume" class="primary">Продолжить ↗</button><button id="restart" class="secondary">Начать уровень заново</button><button id="choose" class="secondary">Выбор уровня</button>'); $('resume').onclick = () => { paused = false; $('modal').classList.add('hidden'); }; $('restart').onclick = () => start(battle.settings.level); $('choose').onclick = levelMenu; };
document.addEventListener('visibilitychange', () => { if (document.hidden) {
    persist();
    if (!paused)
        $('pause').click();
} });
window.addEventListener('pagehide', persist);
let visualOwners = map.map(() => -1), tints = map.map(() => 0);
function frame(now) {
    let dt = Math.min((now - last) / 1000 || 0, .05);
    last = now;
    if (!paused) {
        battle.update(dt);
        saveClock += dt;
        if (saveClock > 2) {
            saveClock = 0;
            persist();
        }
        for (const e of battle.events.slice(0, 15))
            fx.push({ ...e, t: .4, color: colors[e.owner] });
        if (battle.result && !resultShown)
            finish();
    }
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    for (let i = 0; i < battle.states.length; i++) {
        let s = battle.states[i];
        ctx.fillStyle = s.owner < 0 ? '#aeb4b1' : colors[s.owner];
        ctx.strokeStyle = '#e8e9e7';
        ctx.lineWidth = 2 / scale;
        ctx.lineJoin = 'round';
        ctx.fill(paths[i]);
        ctx.stroke(paths[i]);
        if (visualOwners[i] !== s.owner) {
            visualOwners[i] = s.owner;
            tints[i] = 1;
        }
        if (tints[i] > 0) {
            ctx.fillStyle = `rgba(255,255,255,${tints[i] * .3})`;
            ctx.fill(paths[i]);
            tints[i] = Math.max(0, tints[i] - dt * 2);
        }
        if (selection.includes(i)) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3 / scale;
            ctx.stroke(paths[i]);
        }
    }
    for (const u of battle.units) {
        if (u.delay > 0)
            continue;
        ctx.fillStyle = dark[u.owner];
        ctx.beginPath();
        ctx.arc(u.x, u.y, Math.max(2.5, 1.7 / scale), 0, Math.PI * 2);
        ctx.fill();
    }
    if (drag && pointer) {
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.strokeStyle = '#24669c';
        ctx.lineWidth = 2 / scale;
        for (const id of selection) {
            let s = battle.states[id];
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    for (let i = 0; i < battle.states.length; i++) {
        let s = battle.states[i], r = Math.max(12, 8.5 / scale);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = s.owner < 0 ? '#f7f8f5' : dark[s.owner];
        ctx.fill();
        if (selection.includes(i)) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
        }
        ctx.font = `bold ${Math.max(16, 9 / scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = s.owner < 0 ? '#737e79' : '#fff';
        ctx.fillText(String(Math.floor(s.troops)), s.x, s.y + .5 / scale);
    }
    fx = fx.filter(f => f.t > 0);
    for (const f of fx) {
        f.t -= dt;
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = Math.max(0, f.t / .4);
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        ctx.arc(f.x, f.y, (1 - f.t / .4) * 20 + 6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    let totals = colors.map((_, owner) => battle.states.filter(s => s.owner === owner).reduce((a, s) => a + s.troops, 0) + battle.units.filter(u => u.owner === owner).length), total = totals.reduce((a, b) => a + b, 0);
    $('power').innerHTML = totals.map((n, i) => n ? `<div style="background:${colors[i]};width:${n / total * 100}%"></div>` : '').join('');
    $('owned').textContent = `${battle.states.filter(s => s.owner === 0).length} / 48`;
    $('timer').textContent = formatTime(battle.time);
    $('hint').textContent = selection.length ? `Выбрано штатов: ${selection.length}. Укажите цель` : 'Проведите от синего штата к цели';
    requestAnimationFrame(frame);
}
$('loading').remove();
menu();
resize();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(() => toast('Офлайн-режим недоступен'));
// Read-only snapshot for QA; no game cheats in production.
Object.defineProperty(window, 'statefront', { get: () => JSON.parse(JSON.stringify({ settings: battle.settings, states: battle.states.map(({ name, x, y, owner, troops }) => ({ name, x, y, owner, troops })), units: battle.units.length, result: battle.result, paused, selection, view: { scale, ox, oy } })) });
