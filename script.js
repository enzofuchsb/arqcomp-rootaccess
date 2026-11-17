'use strict';

/* =========================================================
   ROOT ACCESS — script principal
   Etapa 1: tela de boot animada + troca para a tela do jogo
   ========================================================= */

const BOOT_LINES = [
  { tag: '[  OK  ]', cls: 'ok',   text: 'Fonte de energia estabilizada' },
  { tag: '[  OK  ]', cls: 'ok',   text: 'Tensão enviada à placa-mãe' },
  { tag: '[  OK  ]', cls: 'ok',   text: '16 módulos de hardware detectados' },
  { tag: '[ LOCK ]', cls: 'lock', text: 'Firewall ativo: 16/16 módulos bloqueados' },
  { tag: '[ WARN ]', cls: 'warn', text: 'Sistema de rastreamento iniciado' }
];

const CHAR_DELAY = 18;   // ms por caractere
const LINE_PAUSE = 260;  // pausa entre linhas

const $ = (id) => document.getElementById(id);

let bootTimers = [];
let bootReady = false;

function later(fn, ms) {
  const t = setTimeout(fn, ms);
  bootTimers.push(t);
}

function clearBootTimers() {
  bootTimers.forEach(clearTimeout);
  bootTimers = [];
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
}

/* Digita uma linha do boot caractere por caractere */
function typeLine(container, line, done) {
  const row = document.createElement('div');
  const tag = document.createElement('span');
  tag.className = line.cls;
  tag.textContent = line.tag + ' ';
  const txt = document.createElement('span');
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.textContent = '█';
  row.append(tag, txt, caret);
  container.appendChild(row);

  let i = 0;
  (function step() {
    if (i < line.text.length) {
      txt.textContent += line.text[i++];
      later(step, CHAR_DELAY);
    } else {
      caret.remove();
      later(done, LINE_PAUSE);
    }
  })();
}

function runBoot() {
  clearBootTimers();
  bootReady = false;
  const log = $('boot-log');
  log.textContent = '';
  $('boot-intro').classList.add('hidden');
  showScreen('boot');

  let idx = 0;
  (function next() {
    if (idx < BOOT_LINES.length) {
      typeLine(log, BOOT_LINES[idx++], next);
    } else {
      $('boot-intro').classList.remove('hidden');
      bootReady = true;
      $('btn-start').focus();
    }
  })();
}

function startGame() {
  if (!bootReady) return;
  bootReady = false;
  clearBootTimers();
  showScreen('game');
}

/* ---------- Eventos ---------- */
$('btn-start').addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && $('screen-boot').classList.contains('active')) {
    e.preventDefault();
    startGame();
  }
});

runBoot();
