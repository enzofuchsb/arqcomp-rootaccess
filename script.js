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

/* Sons entram na etapa 5 */
function alarme() {}

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
  $('packet-clue').textContent = et.pista;   // cifra de César entra na etapa 4
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
function executarScan() {
  if (!state.rodando) return;
  const inp = $('term-input');
  const bruto = inp.value.trim();
  if (!bruto) { inp.focus(); return; }

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
  fitInput();
  renderSlots();
});

$('btn-scan').addEventListener('click', executarScan);

// clicar em qualquer lugar do terminal foca o input
$('term').addEventListener('click', () => $('term-input').focus());

$('btn-brute').addEventListener('click', bruteForce);
$('btn-sniff').addEventListener('click', sniff);

$('btn-win-reboot').addEventListener('click', runBoot);
$('btn-over-reboot').addEventListener('click', runBoot);

runBoot();
