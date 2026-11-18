'use strict';

/* =========================================================
   ROOT ACCESS — desktop.js
   Ato 2: área de trabalho do ROOT/OS 2002 (modo de segurança).
   Ícones, menu Iniciar, barra de tarefas, relógio, balões
   e sistema de janelas (abrir, arrastar, focar, minimizar, fechar).
   Usa do script.js: $, state, bipe, pad2, crtReboot.
   ========================================================= */

/* ---------- Ícones originais (SVG inline, 48×48) ---------- */
const ICONES = {
  computer: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="26" rx="3" fill="#D9E2F0" stroke="#3A4F72" stroke-width="2"/><rect x="9" y="11" width="30" height="18" fill="#1B5FD9"/><path d="M9 11h30v7C28 15 18 15 9 21z" fill="#4F8FFF"/><rect x="19" y="33" width="10" height="5" fill="#9AA9C0"/><rect x="12" y="38" width="24" height="4" rx="2" fill="#C3CEDF" stroke="#3A4F72" stroke-width="1.5"/></svg>',
  docs: '<svg viewBox="0 0 48 48"><path d="M4 12a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#E8A92A" stroke="#8A5B0C" stroke-width="2"/><rect x="10" y="15" width="26" height="14" fill="#fff" stroke="#B8B8B8"/><path d="M4 20h40v18a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#F7C64B" stroke="#8A5B0C" stroke-width="2"/></svg>',
  trash: '<svg viewBox="0 0 48 48"><path d="M11 14h26l-3 28H14z" fill="#CFE0EE" stroke="#46607A" stroke-width="2"/><path d="M18 18l1 20M24 18v20M30 18l-1 20" stroke="#7E97AE" stroke-width="2"/><rect x="8" y="9" width="32" height="5" rx="2" fill="#E6EFF7" stroke="#46607A" stroke-width="2"/><path d="M19 9V6h10v3" fill="none" stroke="#46607A" stroke-width="2"/></svg>',
  internet: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#2F7BFF" stroke="#123E8C" stroke-width="2"/><path d="M13 15c5 1 6 5 10 5s3 6 0 8-2 8-6 9c-2-4-1-8-4-10s-3-8 0-12zM30 9c-1 4 3 5 6 6s4 6 2 9c-3-1-5 2-7 0s-5-2-4-6 2-6 3-9z" fill="#2FC46B"/><circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1"/><path d="M8 20c10-6 22-6 32 0" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/></svg>',
  email: '<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="27" rx="3" fill="#F4F7FB" stroke="#3A4F72" stroke-width="2"/><path d="M6 13l18 14 18-14" fill="none" stroke="#3A4F72" stroke-width="2"/><path d="M6 37l13-12M42 37 29 25" stroke="#9AA9C0" stroke-width="2"/><circle cx="39" cy="12" r="6" fill="#E8483C" stroke="#fff" stroke-width="2"/></svg>',
  control: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="3" fill="#E4EAF3" stroke="#3A4F72" stroke-width="2"/><path d="M14 13v22M24 13v22M34 13v22" stroke="#7E8FA8" stroke-width="3"/><rect x="10" y="17" width="8" height="5" rx="1" fill="#2F7BFF"/><rect x="20" y="27" width="8" height="5" rx="1" fill="#2FC46B"/><rect x="30" y="20" width="8" height="5" rx="1" fill="#E8A92A"/></svg>',
  taskmgr: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="3" fill="#0E1A12" stroke="#3A4F72" stroke-width="2"/><path d="M9 14h30M9 22h30M9 30h30" stroke="#1F3A27" stroke-width="1"/><path d="M9 33l6-6 5 3 6-11 5 7 4-4 4 3" fill="none" stroke="#39FF88" stroke-width="2.5"/></svg>',
  logicbox: '<svg viewBox="0 0 48 48"><path d="M16 6v6M24 6v6M32 6v6M16 36v6M24 36v6M32 36v6M6 16h6M6 24h6M6 32h6M36 16h6M36 24h6M36 32h6" stroke="#C9A227" stroke-width="3"/><rect x="11" y="11" width="26" height="26" rx="3" fill="#1F2A33" stroke="#0B1013" stroke-width="2"/><rect x="17" y="17" width="14" height="14" rx="1" fill="#2E3D4A" stroke="#39FF88" stroke-width="1.5"/><circle cx="15" cy="15" r="1.6" fill="#C9A227"/></svg>',
  defender: '<svg viewBox="0 0 48 48"><path d="M24 4 8 10v12c0 10 6.8 18.8 16 22 9.2-3.2 16-12 16-22V10L24 4z" fill="#2FC46B" stroke="#14632F" stroke-width="2"/><path d="M24 10v28c-6-2.6-10-8.8-10-16v-8l10-4z" fill="rgba(255,255,255,.35)"/></svg>',
  terminal: '<svg viewBox="0 0 48 48"><rect x="4" y="8" width="40" height="32" rx="3" fill="#06080A" stroke="#39FF88" stroke-width="2"/><rect x="4" y="8" width="40" height="6" rx="2" fill="#1B2A24"/><path d="M11 21l6 5-6 5" fill="none" stroke="#39FF88" stroke-width="2.5"/><path d="M20 32h10" stroke="#39FF88" stroke-width="2.5"/></svg>',
  notes: '<svg viewBox="0 0 48 48"><path d="M10 4h20l9 9v31H10z" fill="#fff" stroke="#3A4F72" stroke-width="2"/><path d="M30 4v9h9" fill="#DCE4EF" stroke="#3A4F72" stroke-width="2"/><path d="M15 20h18M15 26h18M15 32h18M15 38h12" stroke="#7E97AE" stroke-width="2"/></svg>'
};

/* ---------- Apps (conteúdo das pistas entra nas etapas 3 e 4) ---------- */
const APPS = [
  { id: 'computer', nome: 'Meu Computador',          titulo: 'Meu Computador',                       w: 460, h: 320 },
  { id: 'docs',     nome: 'Documentos',              titulo: 'Documentos',                           w: 460, h: 320 },
  { id: 'trash',    nome: 'Lixeira',                 titulo: 'Lixeira',                              w: 440, h: 300 },
  { id: 'internet', nome: 'Internet',                titulo: 'Navegador — ROOT/OS',                  w: 560, h: 400 },
  { id: 'email',    nome: 'E-mail',                  titulo: 'Correio — caixa de entrada',           w: 540, h: 380 },
  { id: 'control',  nome: 'Painel de Controle',      titulo: 'Painel de Controle',                   w: 500, h: 360 },
  { id: 'taskmgr',  nome: 'Gerenciador de Tarefas',  titulo: 'Gerenciador de Tarefas',               w: 480, h: 380 },
  { id: 'logicbox', nome: 'LogicNão',                titulo: 'LogicNão — simulador de portas lógicas', w: 700, h: 540 },
  { id: 'defender', nome: 'ROOT Defender', titulo: 'ROOT Defender', w: 440, h: 360, oculto: true },
  { id: 'terminal', nome: 'Terminal (root.exe)',     titulo: 'root.exe — Terminal',                  w: 640, h: 440 },
  { id: 'notes',    nome: 'notas_do_admin.txt',      titulo: 'notas_do_admin.txt — Bloco de Notas', w: 420, h: 280 }
];
const appById = (id) => APPS.find((a) => a.id === id);

/* conteúdo provisório: cada app ganha o seu render nas próximas etapas */
function renderApp(app, body) {
  if (typeof app.render === 'function') { app.render(body); return; }
  const p = document.createElement('p');
  p.className = 'rw-empty';
  p.textContent = 'Em modo de segurança este programa ainda não carregou nada.';
  body.appendChild(p);
}

/* ---------- Estado do desktop ---------- */
const dk = {
  janelas: new Map(),   // id do app → { el, taskBtn, min }
  z: 10,
  ativa: null,
  cascata: 0,
  relogioId: null,
  balaoId: null
};

const isMobile = () => window.matchMedia('(max-width: 700px)').matches;
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/* ---------- Ícones da área de trabalho ---------- */
function montarIcones() {
  const box = $('dk-icons');
  box.textContent = '';
  APPS.forEach((app) => {
    if (app.oculto) return;   // apps sem ícone (ex.: ROOT Defender, aberto pela bandeja)
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dk-icon';
    b.setAttribute('role', 'listitem');
    b.dataset.app = app.id;
    b.title = 'Duplo clique para abrir';
    b.innerHTML = '<span class="dk-icon-img" aria-hidden="true">' + ICONES[app.id] + '</span>';
    const label = document.createElement('span');
    label.className = 'dk-icon-label';
    label.textContent = app.nome;
    b.appendChild(label);

    b.addEventListener('click', () => {
      selecionarIcone(b);
      if (isTouch()) abrirApp(app.id);       // no celular, um toque abre
    });
    b.addEventListener('dblclick', () => abrirApp(app.id));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); abrirApp(app.id); }
    });
    box.appendChild(b);
  });
}

function selecionarIcone(el) {
  document.querySelectorAll('.dk-icon.sel').forEach((i) => i.classList.remove('sel'));
  if (el) el.classList.add('sel');
}

/* ---------- Menu Iniciar ---------- */
function montarMenu() {
  const list = $('dk-start-list');
  list.textContent = '';
  APPS.forEach((app) => {
    if (app.oculto) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dk-start-item';
    b.innerHTML = '<span class="dk-start-ico" aria-hidden="true">' + ICONES[app.id] + '</span>';
    b.appendChild(document.createTextNode(app.nome));
    b.addEventListener('click', () => { fecharMenu(); abrirApp(app.id); });
    list.appendChild(b);
  });
}

function abrirMenu() {
  $('dk-start').hidden = false;
  $('dk-start-btn').setAttribute('aria-expanded', 'true');
  $('dk-start-btn').classList.add('on');
  const first = $('dk-start-list').querySelector('button');
  if (first) first.focus();
}

function fecharMenu() {
  $('dk-start').hidden = true;
  $('dk-start-btn').setAttribute('aria-expanded', 'false');
  $('dk-start-btn').classList.remove('on');
}

/* ---------- Janelas ---------- */
function abrirApp(id) {
  const app = appById(id);
  if (!app) return;
  const jaAberta = dk.janelas.get(id);
  if (jaAberta) { restaurar(id); return; }

  const win = document.createElement('section');
  win.className = 'rw-win';
  win.dataset.app = id;
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', app.titulo);

  const bar = document.createElement('header');
  bar.className = 'rw-titlebar';
  bar.innerHTML = '<span class="rw-title-ico" aria-hidden="true">' + ICONES[id] + '</span>';
  const t = document.createElement('span');
  t.className = 'rw-title';
  t.textContent = app.titulo;
  const btnMin = document.createElement('button');
  btnMin.type = 'button';
  btnMin.className = 'rw-btn rw-min';
  btnMin.setAttribute('aria-label', 'Minimizar');
  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.className = 'rw-btn rw-close';
  btnClose.setAttribute('aria-label', 'Fechar');
  bar.append(t, btnMin, btnClose);

  const body = document.createElement('div');
  body.className = 'rw-body' + (app.bodyClass ? ' ' + app.bodyClass : '');
  win.append(bar, body);

  // posição em cascata dentro da área de trabalho
  const area = $('dk-area');
  const W = Math.min(app.w, area.clientWidth - 20);
  const H = Math.min(app.h, area.clientHeight - 20);
  const off = (dk.cascata++ % 6) * 28;
  win.style.width = W + 'px';
  win.style.height = H + 'px';
  win.style.left = Math.max(0, Math.min(area.clientWidth - W, 130 + off)) + 'px';
  win.style.top = Math.max(0, Math.min(area.clientHeight - H, 24 + off)) + 'px';

  $('dk-windows').appendChild(win);

  // botão na barra de tarefas
  const task = document.createElement('button');
  task.type = 'button';
  task.className = 'dk-task';
  task.innerHTML = '<span class="dk-task-ico" aria-hidden="true">' + ICONES[id] + '</span>';
  const tl = document.createElement('span');
  tl.textContent = app.nome;
  task.appendChild(tl);
  task.addEventListener('click', () => {
    const j = dk.janelas.get(id);
    if (!j) return;
    if (j.min) restaurar(id);
    else if (dk.ativa === id) minimizar(id);
    else focar(id);
  });
  $('dk-tasks').appendChild(task);

  dk.janelas.set(id, { el: win, taskBtn: task, min: false });

  btnMin.addEventListener('click', (e) => { e.stopPropagation(); minimizar(id); });
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); fechar(id); });
  win.addEventListener('pointerdown', () => focar(id));
  arrastavel(win, bar);

  renderApp(app, body);
  bipe(660, 0.04, 'sine', 0.03);
  focar(id);
}

function focar(id) {
  const j = dk.janelas.get(id);
  if (!j) return;
  j.el.style.zIndex = ++dk.z;
  dk.ativa = id;
  dk.janelas.forEach((o, k) => {
    o.el.classList.toggle('inactive', k !== id);
    o.taskBtn.classList.toggle('on', k === id && !o.min);
  });
}

function minimizar(id) {
  const j = dk.janelas.get(id);
  if (!j) return;
  j.min = true;
  j.el.hidden = true;
  j.taskBtn.classList.remove('on');
  if (dk.ativa === id) {
    dk.ativa = null;
    focarTopo();
  }
}

function restaurar(id) {
  const j = dk.janelas.get(id);
  if (!j) return;
  j.min = false;
  j.el.hidden = false;
  focar(id);
}

function fechar(id) {
  const j = dk.janelas.get(id);
  if (!j) return;
  const app = appById(id);
  if (app && typeof app.onClose === 'function') app.onClose();
  j.el.remove();
  j.taskBtn.remove();
  dk.janelas.delete(id);
  if (dk.ativa === id) {
    dk.ativa = null;
    focarTopo();
  }
}

/* foca a janela visível mais alta */
function focarTopo() {
  let topo = null;
  let zMax = -1;
  dk.janelas.forEach((o, k) => {
    const z = parseInt(o.el.style.zIndex || '0', 10);
    if (!o.min && z > zMax) { zMax = z; topo = k; }
  });
  if (topo) focar(topo);
  else dk.janelas.forEach((o) => o.taskBtn.classList.remove('on'));
}

/* arrastar pela barra de título (mouse, caneta ou toque) */
function arrastavel(win, bar) {
  let ini = null;
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.rw-btn') || isMobile()) return;
    const area = $('dk-area');
    ini = {
      x: e.clientX, y: e.clientY,
      left: win.offsetLeft, top: win.offsetTop,
      maxL: area.clientWidth - 80, maxT: area.clientHeight - 30
    };
    bar.setPointerCapture(e.pointerId);
    win.classList.add('dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!ini) return;
    const l = Math.max(-win.offsetWidth + 80, Math.min(ini.maxL, ini.left + e.clientX - ini.x));
    const t = Math.max(0, Math.min(ini.maxT, ini.top + e.clientY - ini.y));
    win.style.left = l + 'px';
    win.style.top = t + 'px';
  });
  const soltar = () => { ini = null; win.classList.remove('dragging'); };
  bar.addEventListener('pointerup', soltar);
  bar.addEventListener('pointercancel', soltar);
}

/* ---------- Relógio ---------- */
function atualizarRelogio() {
  const d = new Date();
  $('dk-clock').textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/* ---------- Balão da bandeja ---------- */
function balao(titulo, texto, ms) {
  $('dk-balloon-title').textContent = titulo;
  $('dk-balloon-text').textContent = texto;
  const b = $('dk-balloon');
  b.hidden = false;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  clearTimeout(dk.balaoId);
  dk.balaoId = setTimeout(() => { b.hidden = true; }, ms || 4500);
}

/* ---------- Ganchos chamados pelo script.js ---------- */
window.desktopTrace = function (v, nivel) {
  const fill = $('dtrace-fill');
  const pct = $('dtrace-pct');
  fill.style.width = v + '%';
  fill.className = 'trace-fill ' + nivel;
  pct.className = 'trace-pct ' + nivel;
  pct.textContent = v + '%';
  fill.parentElement.setAttribute('aria-valuenow', v);
  const tray = $('tray-defender');
  $('tray-pct').textContent = v + '%';
  tray.className = 'tray-shield ' + nivel;
  tray.title = 'ROOT Defender · trace ' + v + '%';
};

window.desktopUpdate = function () {
  $('dk-phase').textContent = 'ATO 2 · SISTEMA — MÓDULOS ' + state.online.size + '/16';
};

window.desktopReset = function () {
  dk.janelas.forEach((o, id) => {
    const app = appById(id);
    if (app && typeof app.onClose === 'function') app.onClose();
    o.el.remove();
    o.taskBtn.remove();
  });
  dk.janelas.clear();
  dk.ativa = null;
  dk.cascata = 0;
  montarIcones();   // desfaz a bagunça do firewall
  fecharMenu();
  $('dk-balloon').hidden = true;
  $('screen-desktop').classList.remove('optimized');
  clearInterval(dk.relogioId);
  dk.relogioId = null;
  if (typeof window.appsReset === 'function') window.appsReset();
  if (typeof window.defenderStop === 'function') window.defenderStop();
  $('screen-desktop').classList.remove('alarm', 'glitch-out');
};

window.desktopStart = function () {
  window.desktopReset();
  window.desktopUpdate();
  selecionarIcone(null);
  atualizarRelogio();
  dk.relogioId = setInterval(atualizarRelogio, 5000);
  window.desktopTrace(Math.round(state.trace), state.trace >= 80 ? 'high' : state.trace >= 40 ? 'mid' : '');
  setTimeout(() => balao('ROOT/OS 2002', 'Sistema iniciado em modo de segurança. 10 módulos ainda estão OFFLINE.'), 700);
  if (typeof window.defenderStart === 'function') window.defenderStart();
  if (typeof window.appsTutorial === 'function') setTimeout(window.appsTutorial, 1200);
};

/* expostos para as próximas etapas (apps, Defender) */
window.dkAbrirApp = abrirApp;
window.dkBalao = balao;

/* ---------- Eventos ---------- */
$('dk-start-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if ($('dk-start').hidden) abrirMenu(); else fecharMenu();
});
$('dk-start').addEventListener('click', (e) => e.stopPropagation());
$('dk-reboot').addEventListener('click', () => { fecharMenu(); crtReboot(); });

// clicar no fundo: fecha o menu e tira a seleção dos ícones
$('dk-area').addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.dk-start')) fecharMenu();
  if (!e.target.closest('.dk-icon')) selecionarIcone(null);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('dk-start').hidden) { fecharMenu(); $('dk-start-btn').focus(); }
});
$('tray-defender').addEventListener('click', () => abrirApp('defender'));

/* Firewall reagindo (trace ≥ 70%): fecha uma janela aleatória e embaralha os ícones */
window.dkFirewall = function () {
  const abertas = [...dk.janelas.keys()];
  let fechada = null;
  if (abertas.length) {
    fechada = abertas[Math.floor(Math.random() * abertas.length)];
    fechar(fechada);
  }
  const box = $('dk-icons');
  const icones = [...box.children];
  for (let i = icones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [icones[i], icones[j]] = [icones[j], icones[i]];
  }
  icones.forEach((ic) => box.appendChild(ic));
  return fechada ? appById(fechada).nome : null;
};

montarIcones();
montarMenu();
