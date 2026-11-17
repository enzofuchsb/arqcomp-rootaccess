'use strict';

/* =========================================================
   ROOT ACCESS — script principal
   Etapa 1: tela de boot
   Etapa 2: etapas, verificação, log, módulos, contadores, vitória
   ========================================================= */

/* ---------- Dados: as 16 etapas ---------- */
const FASES = {
  1: 'ENERGIA E FIRMWARE',
  2: 'TESTE DO PROCESSADOR',
  3: 'MEMÓRIA E COMUNICAÇÃO',
  4: 'SISTEMA'
};

const ETAPAS = [
  { fase: 1, resposta: 'CPU',
    pista: 'Chip principal que executa as instruções de todos os programas.',
    sniff: 'Sigla de 3 letras; costuma ser chamada de cérebro do computador.',
    logOk: 'CPU online — processador central energizado' },
  { fase: 1, resposta: 'ROM',
    pista: 'Memória só de leitura que guarda o programa de inicialização de fábrica.',
    sniff: 'Sigla de 3 letras; vem gravada de fábrica e não perde nada ao desligar.',
    logOk: 'ROM online — firmware de inicialização carregado' },
  { fase: 1, resposta: 'EEPROM',
    pista: 'Memória não volátil apagável eletricamente, que guarda configurações da BIOS.',
    sniff: 'Sigla de 6 letras; versão regravável eletricamente de uma memória só de leitura.',
    logOk: 'EEPROM online — configurações da BIOS restauradas' },
  { fase: 1, resposta: 'FLASH',
    pista: 'Memória não volátil regravável em blocos, usada em pendrives e cartões SD.',
    sniff: 'Palavra curta em inglês que também significa clarão.',
    logOk: 'FLASH online — armazenamento regravável montado' },

  { fase: 2, resposta: 'UC',
    pista: 'Parte da CPU que busca, decodifica instruções e coordena os outros componentes.',
    sniff: 'Sigla de 2 letras; funciona como o maestro dentro do processador.',
    logOk: 'UC online — ciclo de busca e decodificação ativo' },
  { fase: 2, resposta: 'ULA',
    pista: 'Parte da CPU responsável pelos cálculos e pelas comparações lógicas.',
    sniff: 'Sigla de 3 letras. É ela que soma, subtrai e decide se um valor é maior que outro.',
    logOk: 'ULA online — operações aritméticas e lógicas liberadas' },
  { fase: 2, resposta: 'REGISTRADORES',
    pista: 'Pequenas memórias dentro do processador, as mais rápidas do computador.',
    sniff: 'Palavra no plural; guardam os valores que a CPU está usando neste instante.',
    logOk: 'REGISTRADORES online — banco de registradores zerado' },
  { fase: 2, resposta: 'CACHE',
    pista: 'Memória ultrarrápida entre CPU e RAM que guarda o que é mais usado.',
    sniff: 'Palavra de origem francesa; existe em níveis chamados L1, L2 e L3.',
    logOk: 'CACHE online — níveis L1, L2 e L3 sincronizados' },

  { fase: 3, resposta: 'RAM',
    pista: 'Memória principal de trabalho, volátil: perde tudo quando o computador desliga.',
    sniff: 'Sigla de 3 letras; quanto mais dela, mais programas abertos ao mesmo tempo.',
    logOk: 'RAM online — memória principal ativa' },
  { fase: 3, resposta: 'ADDRESSBUS',
    pista: 'Vias que indicam qual posição da memória o processador quer acessar.',
    sniff: 'Duas palavras em inglês juntas; só indica ONDE, nunca leva o conteúdo.',
    logOk: 'ADDRESS BUS online — endereçamento de memória liberado' },
  { fase: 3, resposta: 'DATABUS',
    pista: 'Vias por onde as informações viajam entre processador, memória e periféricos.',
    sniff: 'Duas palavras em inglês juntas; é o caminho que carrega o conteúdo em si.',
    logOk: 'DATA BUS online — tráfego de dados restabelecido' },
  { fase: 3, resposta: 'DMA',
    pista: 'Recurso que deixa periféricos lerem e gravarem na RAM sem ocupar a CPU.',
    sniff: 'Sigla de 3 letras; libera o processador enquanto um periférico copia informações.',
    logOk: 'DMA online — acesso direto à memória habilitado' },

  { fase: 4, resposta: 'MEMORIADEMASSA',
    pista: 'Onde arquivos e sistema ficam guardados mesmo desligado, como HDs e SSDs.',
    sniff: 'Três palavras em português juntas; o nome lembra grande quantidade.',
    logOk: 'MEMÓRIA DE MASSA online — disco do sistema montado' },
  { fase: 4, resposta: 'DUALCORE',
    pista: 'Processador com dois núcleos trabalhando ao mesmo tempo.',
    sniff: 'Duas palavras em inglês juntas; tem tantos núcleos quanto uma pessoa tem olhos.',
    logOk: 'DUAL CORE online — 2 núcleos em paralelo' },
  { fase: 4, resposta: 'QUADCORE',
    pista: 'Processador com quatro núcleos trabalhando ao mesmo tempo.',
    sniff: 'Duas palavras em inglês juntas; tem tantos núcleos quanto um carro tem rodas.',
    logOk: 'QUADCORE online — 4 núcleos em paralelo' },
  { fase: 4, resposta: 'MICROCONTROLADOR',
    pista: 'Chip com processador, memória e entradas/saídas juntos, como o do Arduino.',
    sniff: 'Palavra longa, com um prefixo que significa muito pequeno.',
    logOk: 'Dispositivo externo detectado na porta USB — MICROCONTROLADOR online — Arduino conectado' }
];

/* ---------- Boot ---------- */
const BOOT_LINES = [
  { tag: '[  OK  ]', cls: 'ok',   text: 'Fonte de energia estabilizada' },
  { tag: '[  OK  ]', cls: 'ok',   text: 'Tensão enviada à placa-mãe' },
  { tag: '[  OK  ]', cls: 'ok',   text: '16 módulos de hardware detectados' },
  { tag: '[ LOCK ]', cls: 'lock', text: 'Firewall ativo: 16/16 módulos bloqueados' },
  { tag: '[ WARN ]', cls: 'warn', text: 'Sistema de rastreamento iniciado' }
];

const CHAR_DELAY = 18;
const LINE_PAUSE = 260;

const $ = (id) => document.getElementById(id);

let bootTimers = [];
let bootReady = false;

/* ---------- Estado do jogo ---------- */
const state = {
  etapa: 0,
  erros: 0,
  dicas: 0,
  trace: 0,
  inicio: 0,
  segundos: 0,
  revelados: [],   // índices de letras reveladas pelo BRUTE FORCE
  sniffUsado: false,
  cifra: 0,        // deslocamento secreto da etapa (fase 4)
  chave: 0,        // chave escolhida no decodificador
  rodando: false
};
let timerId = null;
let traceId = null;

/* ---------- Utilidades ---------- */
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

const pad2 = (n) => String(n).padStart(2, '0');

function formatTime(total) {
  return pad2(Math.floor(total / 60)) + ':' + pad2(total % 60);
}

function clock() {
  const d = new Date();
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/* MAIÚSCULAS, sem acento, sem espaços nem símbolos */
function normalizar(txt) {
  return txt
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/* ---------- Tela de boot ---------- */
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
  stopTimer();
  state.rodando = false;
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

/* ---------- Log do terminal ---------- */
function logLine(tag, cls, text) {
  const log = $('log');
  const row = document.createElement('div');
  const t = document.createElement('span');
  t.className = cls;
  t.textContent = tag;
  row.append(t, document.createTextNode(' ' + text));
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
  return t;
}

function logLock() {
  // só o LOCK atual pisca
  document.querySelectorAll('#log .blink').forEach((el) => el.classList.remove('blink'));
  const tag = logLine('[ LOCK ]', 'lock blink', 'Módulo ' + pad2(state.etapa + 1) + ' bloqueado pelo firewall — aguardando chave...');
  return tag;
}

/* ---------- Contadores e tempo ---------- */
function startTimer() {
  stopTimer();
  state.inicio = Date.now();
  state.segundos = 0;
  timerId = setInterval(() => {
    state.segundos = Math.floor((Date.now() - state.inicio) / 1000);
    $('stat-time').textContent = formatTime(state.segundos);
  }, 250);
  // trace sobe +1% a cada 6 segundos
  traceId = setInterval(() => addTrace(1), 6000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  if (traceId) clearInterval(traceId);
  timerId = null;
  traceId = null;
}

/* ---------- TRACE ---------- */
function renderTrace() {
  const v = Math.round(state.trace);
  const nivel = v >= 80 ? 'high' : v >= 40 ? 'mid' : '';
  const fill = $('trace-fill');
  const pct = $('trace-pct');
  fill.style.width = v + '%';
  fill.className = 'trace-fill ' + nivel;
  pct.className = 'trace-pct ' + nivel;
  pct.textContent = v + '%';
  fill.parentElement.setAttribute('aria-valuenow', v);
}

function addTrace(qtd) {
  if (!state.rodando) return;
  const antes = state.trace;
  state.trace = Math.min(100, state.trace + qtd);
  renderTrace();

  if (antes < 80 && state.trace >= 80 && state.trace < 100) {
    logLine('[ WARN ]', 'warn', 'TRACE CRÍTICO: ' + Math.round(state.trace) + '% — o firewall está quase te encontrando');
    alarme();
  }
  if (state.trace >= 100) gameOver();
}

/* ---------- Sons (Web Audio API, sem arquivos) ---------- */
let audioCtx = null;
let somLigado = true;
try { somLigado = localStorage.getItem('rootaccess-som') !== 'off'; } catch (e) { /* sem storage */ }

function ctx() {
  if (!somLigado) return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/* toca um bipe: frequência (Hz), duração (s), forma de onda, volume, atraso (s) */
function bipe(freq, dur, tipo, vol, atraso) {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime + (atraso || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = tipo || 'square';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol || 0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function somTecla()   { bipe(1400 + Math.random() * 300, 0.025, 'square', 0.015); }
function somAcerto()  { bipe(880, 0.08, 'square', 0.05); bipe(1320, 0.12, 'square', 0.05, 0.08); }
function somErro()    { bipe(140, 0.3, 'sawtooth', 0.08); bipe(90, 0.3, 'sawtooth', 0.06, 0.12); }
function alarme() {
  for (let i = 0; i < 4; i++) {
    bipe(960, 0.14, 'square', 0.06, i * 0.3);
    bipe(640, 0.14, 'square', 0.06, i * 0.3 + 0.15);
  }
}
function somVitoria() {
  [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => bipe(f, 0.12, 'square', 0.05, i * 0.11));
}
function somGameOver() {
  [440, 330, 220, 110].forEach((f, i) => bipe(f, 0.25, 'sawtooth', 0.07, i * 0.22));
}

function renderSom() {
  const b = $('btn-sound');
  b.textContent = somLigado ? 'SOM: ON' : 'SOM: OFF';
  b.setAttribute('aria-pressed', String(somLigado));
}

function toggleSom() {
  somLigado = !somLigado;
  try { localStorage.setItem('rootaccess-som', somLigado ? 'on' : 'off'); } catch (e) { /* ignora */ }
  renderSom();
  if (somLigado) bipe(1000, 0.06, 'square', 0.05);
}

/* ---------- Hall dos Invasores (localStorage) ---------- */
const HALL_KEY = 'rootaccess-hall';
let hallSalvo = false;
let hallUltimo = null;

function lerHall() {
  try {
    const dados = JSON.parse(localStorage.getItem(HALL_KEY) || '[]');
    return Array.isArray(dados) ? dados.filter((r) => r && typeof r.nome === 'string' && typeof r.tempo === 'number') : [];
  } catch (e) {
    return [];
  }
}

function salvarHall(lista) {
  try {
    localStorage.setItem(HALL_KEY, JSON.stringify(lista));
    return true;
  } catch (e) {
    return false;
  }
}

function renderHall() {
  const top = lerHall().sort((a, b) => a.tempo - b.tempo).slice(0, 5);
  const body = $('hall-body');
  body.textContent = '';
  if (!top.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'dim';
    td.textContent = 'nenhum invasor registrado ainda';
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }
  top.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (hallUltimo && r.id === hallUltimo) tr.className = 'me';
    [pad2(i + 1), r.nome, formatTime(r.tempo)].forEach((v) => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}

function onSalvarHall(e) {
  e.preventDefault();
  if (hallSalvo) return;
  const nome = $('hall-name').value.trim().replace(/\s+/g, '_').slice(0, 16);
  if (!nome) { $('hall-msg').textContent = 'digite um codinome.'; return; }
  const reg = { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), nome, tempo: state.segundos };
  const lista = lerHall();
  lista.push(reg);
  if (salvarHall(lista)) {
    hallSalvo = true;
    hallUltimo = reg.id;
    $('hall-msg').textContent = 'registro gravado: ' + nome + ' · ' + formatTime(state.segundos);
    $('btn-hall-save').disabled = true;
    $('hall-name').disabled = true;
    somAcerto();
  } else {
    $('hall-msg').textContent = 'não foi possível salvar (armazenamento bloqueado).';
  }
  renderHall();
}

/* ---------- Reboot com efeito CRT ---------- */
let rebootando = false;
function crtReboot() {
  if (rebootando) return;
  rebootando = true;
  state.rodando = false;
  stopTimer();
  bipe(220, 0.4, 'sine', 0.05);
  const app = $('app');
  document.body.classList.add('crt-dark');
  app.classList.add('crt-off');
  setTimeout(() => {
    app.classList.remove('crt-off');
    document.body.classList.remove('crt-dark');
    rebootando = false;
    runBoot();
  }, 750);
}

/* ---------- Dicas ---------- */
function bruteForce() {
  if (!state.rodando) return;
  const et = ETAPAS[state.etapa];
  const faltando = [];
  for (let i = 0; i < et.resposta.length; i++) {
    if (!state.revelados.includes(i)) faltando.push(i);
  }
  if (faltando.length <= 1) {
    logLine('[ INFO ]', 'info', 'BRUTE FORCE recusado: a última letra você precisa digitar.');
    return;
  }
  const idx = faltando[Math.floor(Math.random() * faltando.length)];
  state.revelados.push(idx);
  state.dicas++;
  updateStats();
  renderSlots();
  logLine('[ WARN ]', 'warn', 'BRUTE FORCE: posição ' + (idx + 1) + ' = "' + et.resposta[idx] + '" — trace +10%');
  if (faltando.length - 1 <= 1) $('btn-brute').disabled = true;
  addTrace(10);
  if (state.rodando) $('term-input').focus();
}

function sniff() {
  if (!state.rodando || state.sniffUsado) return;
  state.sniffUsado = true;
  state.dicas++;
  updateStats();
  const linha = $('sniff-line');
  linha.textContent = '> SNIFF: ' + ETAPAS[state.etapa].sniff;
  linha.classList.remove('hidden');
  $('btn-sniff').disabled = true;
  logLine('[ WARN ]', 'warn', 'SNIFF: pacote extra capturado — trace +5%');
  addTrace(5);
  if (state.rodando) $('term-input').focus();
}

/* ---------- Game over ---------- */
function gameOver() {
  state.rodando = false;
  stopTimer();
  state.segundos = Math.floor((Date.now() - state.inicio) / 1000);
  $('over-mods').textContent = state.etapa + '/16';
  $('over-time').textContent = formatTime(state.segundos);
  $('over-errors').textContent = state.erros;
  $('over-hints').textContent = state.dicas;
  somGameOver();
  showScreen('over');
  $('btn-over-reboot').focus();
}

function updateStats() {
  $('stat-time').textContent = formatTime(state.segundos);
  $('stat-errors').textContent = state.erros;
  $('stat-hints').textContent = state.dicas;
  $('online-count').textContent = state.etapa + '/16';
}

/* ---------- Barra lateral de módulos ---------- */
function renderModules() {
  const box = $('modules');
  box.textContent = '';
  [1, 2, 3, 4].forEach((f) => {
    const group = document.createElement('div');
    group.className = 'phase-group';
    const h = document.createElement('h3');
    h.textContent = 'FASE ' + f + ' · ' + FASES[f];
    group.appendChild(h);

    ETAPAS.forEach((et, i) => {
      if (et.fase !== f) return;
      const row = document.createElement('div');
      const name = document.createElement('span');
      name.className = 'mod-name';
      const num = document.createElement('span');
      num.className = 'mod-num';
      num.textContent = pad2(i + 1);
      const st = document.createElement('span');
      st.className = 'mod-state';

      let label;
      if (i < state.etapa) {
        row.className = 'mod online';
        label = et.resposta;
        st.textContent = 'ONLINE';
      } else if (i === state.etapa) {
        row.className = 'mod current';
        label = '???';
        st.textContent = 'LOCK';
      } else {
        row.className = 'mod';
        label = '▒'.repeat(et.resposta.length);
        st.textContent = 'OFFLINE';
      }
      name.append(num, document.createTextNode(label));
      row.append(name, st);
      group.appendChild(row);
    });
    box.appendChild(group);
  });
}

/* ---------- Casinhas da resposta ---------- */
function renderSlots() {
  const et = ETAPAS[state.etapa];
  const typed = normalizar($('term-input').value);
  const box = $('slots');
  box.textContent = '';
  for (let i = 0; i < et.resposta.length; i++) {
    const s = document.createElement('div');
    s.className = 'slot';
    if (typed[i]) {
      s.textContent = typed[i];
      s.classList.add('filled');
    } else if (state.revelados.includes(i)) {
      s.textContent = et.resposta[i];
      s.classList.add('revealed');
    }
    box.appendChild(s);
  }
  box.setAttribute('aria-label', 'Resposta com ' + et.resposta.length + ' letras');
}

function fitInput() {
  const inp = $('term-input');
  inp.style.width = Math.max(1, inp.value.length + 1) + 'ch';
}

/* ---------- Etapa atual ---------- */
function loadStage() {
  const et = ETAPAS[state.etapa];
  const n = pad2(state.etapa + 1);
  state.revelados = [];
  state.sniffUsado = false;
  $('btn-sniff').disabled = false;
  $('btn-brute').disabled = et.resposta.length <= 1;

  $('phase-label').textContent = 'FASE ' + et.fase + ' · ' + FASES[et.fase] + ' — MÓDULO ' + n + '/16';

  const crypto = et.fase === 4;
  $('packet').classList.toggle('crypto', crypto);
  $('packet-head').textContent = 'PKT#' + n + ' · ' + (crypto ? 'PACOTE CRIPTOGRAFADO' : 'PACOTE INTERCEPTADO');
  $('packet-time').textContent = clock();
  if (crypto) {
    state.cifra = 1 + Math.floor(Math.random() * 25);   // 1 a 25
    state.chave = 0;
    $('packet-clue').textContent = cesar(et.pista, state.cifra);
    $('decoder').classList.remove('hidden');
    renderDecoder();
  } else {
    $('packet-clue').textContent = et.pista;
    $('decoder').classList.add('hidden');
  }
  $('sniff-line').classList.add('hidden');
  $('sniff-line').textContent = '';

  $('term-input').value = '';
  fitInput();
  renderSlots();
  renderModules();
  updateStats();
  logLock();
  $('term-input').focus();
}

/* ---------- Verificação ---------- */
/* ---------- Cifra de César ---------- */
/* Desloca só A-Z e a-z; acentos, números e pontuação ficam iguais */
function cesar(texto, desloc) {
  const d = ((desloc % 26) + 26) % 26;
  return texto.replace(/[A-Za-z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + d) % 26) + base);
  });
}

function renderDecoder() {
  const et = ETAPAS[state.etapa];
  const cifrado = cesar(et.pista, state.cifra);
  $('decoder-key').textContent = pad2(state.chave);
  $('decoder-out').textContent = cesar(cifrado, -state.chave);
  const ok = state.chave === state.cifra;
  $('decoder').classList.toggle('solved', ok);
  return ok;
}

function setChave(n) {
  if (ETAPAS[state.etapa].fase !== 4) return false;
  state.chave = ((n % 26) + 26) % 26;
  if (renderDecoder()) {
    logLine('[  OK  ]', 'ok', 'Pacote decifrado com a chave ' + pad2(state.chave));
  }
  return true;
}

/* ---------- Comandos do terminal ---------- */
function executarComando(txt) {
  const partes = txt.trim().toLowerCase().split(/\s+/);
  const cmd = partes[0];
  const comandos = ['help', 'status', 'brute', 'sniff', 'decrypt', 'clear', 'reboot'];
  if (!comandos.includes(cmd)) return false;

  logLine('root@sys:~$', 'dim', txt.trim());

  switch (cmd) {
    case 'help':
      logLine('[ INFO ]', 'info', 'help ............ lista os comandos');
      logLine('[ INFO ]', 'info', 'status .......... módulos, trace, erros, dicas e tempo');
      logLine('[ INFO ]', 'info', 'brute ........... revela uma letra (+10% trace)');
      logLine('[ INFO ]', 'info', 'sniff ........... dica extra sobre a palavra (+5% trace)');
      logLine('[ INFO ]', 'info', 'decrypt --chave N aplica a chave N no decodificador (fase 4)');
      logLine('[ INFO ]', 'info', 'clear ........... limpa o log');
      logLine('[ INFO ]', 'info', 'reboot .......... reinicia o sistema');
      logLine('[ INFO ]', 'info', 'Qualquer outro texto é testado como chave do módulo.');
      break;
    case 'status':
      logLine('[ INFO ]', 'info',
        'módulos ' + state.etapa + '/16 · trace ' + Math.round(state.trace) + '% · erros ' + state.erros +
        ' · dicas ' + state.dicas + ' · tempo ' + formatTime(state.segundos));
      break;
    case 'brute':
      bruteForce();
      break;
    case 'sniff':
      if (state.sniffUsado) logLine('[ INFO ]', 'info', 'SNIFF já usado neste módulo.');
      else sniff();
      break;
    case 'decrypt': {
      const m = txt.match(/--chave\s+(-?\d+)/i);
      if (ETAPAS[state.etapa].fase !== 4) {
        logLine('[ FAIL ]', 'fail', 'decrypt: este pacote não está criptografado.');
      } else if (!m) {
        logLine('[ FAIL ]', 'fail', 'uso: decrypt --chave N   (N de 1 a 25)');
      } else {
        const n = parseInt(m[1], 10);
        if (n < 0 || n > 25) logLine('[ FAIL ]', 'fail', 'decrypt: a chave vai de 0 a 25.');
        else {
          setChave(n);
          logLine('[ INFO ]', 'info', 'chave ' + pad2(n) + ' aplicada no decodificador.');
        }
      }
      break;
    }
    case 'clear':
      $('log').textContent = '';
      break;
    case 'reboot':
      crtReboot();
      return true;
  }
  return true;
}

function executarScan() {
  if (!state.rodando) return;
  const inp = $('term-input');
  const bruto = inp.value.trim();
  if (!bruto) { inp.focus(); return; }

  if (executarComando(bruto)) {
    inp.value = '';
    fitInput();
    if (state.rodando) { renderSlots(); inp.focus(); }
    return;
  }

  const et = ETAPAS[state.etapa];
  const chave = normalizar(bruto);

  if (chave === et.resposta) {
    acertou(et);
  } else {
    errou(bruto);
  }
}

function acertou(et) {
  document.querySelectorAll('#log .blink').forEach((el) => el.classList.remove('blink'));
  logLine('[  OK  ]', 'ok', et.logOk);
  somAcerto();
  state.etapa++;
  updateStats();

  if (state.etapa >= ETAPAS.length) {
    vitoria();
  } else {
    loadStage();
  }
}

function errou(bruto) {
  state.erros++;
  somErro();
  updateStats();
  logLine('[ FAIL ]', 'fail', 'chave "' + bruto.toUpperCase() + '" rejeitada no módulo ' + pad2(state.etapa + 1) + ' — trace +10%');

  const slots = $('slots');
  slots.classList.remove('error');
  void slots.offsetWidth; // reinicia a animação
  slots.classList.add('error');
  setTimeout(() => slots.classList.remove('error'), 450);

  $('term-input').select();
  addTrace(10);
}

/* ---------- Início / fim ---------- */
function startGame() {
  if (!bootReady) return;
  bootReady = false;
  clearBootTimers();

  state.etapa = 0;
  state.erros = 0;
  state.dicas = 0;
  state.trace = 0;
  state.rodando = true;
  renderTrace();

  $('log').textContent = '';
  logLine('[  OK  ]', 'ok', 'Conexão estabelecida com root@sys');
  logLine('[ INFO ]', 'info', 'Digite o nome do componente bloqueado e pressione Enter.');

  showScreen('game');
  startTimer();
  loadStage();
}

function vitoria() {
  state.rodando = false;
  stopTimer();
  state.segundos = Math.floor((Date.now() - state.inicio) / 1000);

  const winLog = $('win-log');
  winLog.textContent = '';
  const linhas = [
    ['[  OK  ]', 'ok', 'QUADCORE online'],
    ['[ INFO ]', 'info', 'Dispositivo externo detectado na porta USB'],
    ['[  OK  ]', 'ok', 'MICROCONTROLADOR online — Arduino conectado'],
    ['[  OK  ]', 'ok', '16/16 módulos online · firewall desativado'],
    ['[  OK  ]', 'ok', 'Sistema operacional carregado']
  ];
  linhas.forEach(([tag, cls, txt]) => {
    const row = document.createElement('div');
    const t = document.createElement('span');
    t.className = cls;
    t.textContent = tag;
    row.append(t, document.createTextNode(' ' + txt));
    winLog.appendChild(row);
  });

  $('win-time').textContent = formatTime(state.segundos);
  $('win-trace').textContent = Math.round(state.trace) + '%';
  $('win-errors').textContent = state.erros;
  $('win-hints').textContent = state.dicas;

  hallSalvo = false;
  hallUltimo = null;
  $('hall-name').value = '';
  $('hall-name').disabled = false;
  $('btn-hall-save').disabled = false;
  $('hall-msg').textContent = '';
  renderHall();
  somVitoria();

  showScreen('win');
  $('btn-win-reboot').focus();
}

/* ---------- Eventos ---------- */
$('btn-start').addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && $('screen-boot').classList.contains('active')) {
    e.preventDefault();
    startGame();
  }
});

$('term').addEventListener('submit', (e) => {
  e.preventDefault();
  executarScan();
});

$('term-input').addEventListener('input', () => {
  somTecla();
  fitInput();
  renderSlots();
});

$('btn-scan').addEventListener('click', executarScan);

// clicar em qualquer lugar do terminal foca o input
$('term').addEventListener('click', () => $('term-input').focus());

$('btn-brute').addEventListener('click', bruteForce);
$('btn-sniff').addEventListener('click', sniff);
$('btn-key-down').addEventListener('click', () => setChave(state.chave - 1));
$('btn-key-up').addEventListener('click', () => setChave(state.chave + 1));

$('btn-win-reboot').addEventListener('click', crtReboot);
$('btn-over-reboot').addEventListener('click', crtReboot);
$('btn-sound').addEventListener('click', toggleSom);
$('hall-form').addEventListener('submit', onSalvarHall);

renderSom();
runBoot();
