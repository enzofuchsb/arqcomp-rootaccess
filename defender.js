'use strict';

/* =========================================================
   ROOT ACCESS — defender.js
   ROOT Defender (antivírus do ROOT/OS), só no Ato 2:
   - Varredura: a cada 60–120 s, pop-up com barra de 10 s;
     durante a varredura o trace passivo sobe 2x mais rápido.
   - Verificação de integridade: a cada 70–110 s (nunca junto
     com a varredura), mostra a pista principal de um módulo já
     ONLINE; acertou = −5% de trace. Fecha sozinha em 20 s.
   - defPopup(): pop-up no visual de janela do ROOT/OS com escudo
     (também usado pelo honeypot NAO_ABRA.exe em apps.js).
   Usa do script.js: $, state, ETAPAS, bipe, somAcerto, somErro,
   addTrace, renderTrace, normalizar, logLine.
   ========================================================= */

const ESCUDO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" fill="#2FC46B"/><path d="M12 5v14c-3-1.3-5-4.4-5-8V7l5-2z" fill="rgba(255,255,255,.4)"/></svg>';

const def = {
  scanTimer: null,
  quizTimer: null,
  scanAtivo: false,
  quizAtivo: false,
  boostId: null,
  pops: new Set()
};

const INTEGRIDADE_BONUS = 5;   // verificação de integridade correta: −5% de trace
const aleatorio = (min, max) => (min + Math.random() * (max - min)) * 1000;
const ativo = () => state.rodando && state.ato === 2 && $('screen-desktop').classList.contains('active');

/* ---------- Pop-up no visual de janela do ROOT/OS ---------- */
window.defPopup = function (titulo, corpo, opts) {
  opts = opts || {};
  const win = document.createElement('section');
  win.className = 'rw-win def-pop' + (opts.danger ? ' danger' : '');
  win.setAttribute('role', 'alertdialog');
  win.setAttribute('aria-label', titulo);

  const bar = document.createElement('header');
  bar.className = 'rw-titlebar';
  bar.innerHTML = '<span class="rw-title-ico">' + (opts.icone || ESCUDO) + '</span>';
  const t = document.createElement('span');
  t.className = 'rw-title';
  t.textContent = titulo;
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'rw-btn rw-close';
  x.setAttribute('aria-label', 'Fechar');
  bar.append(t, x);

  const body = document.createElement('div');
  body.className = 'rw-body def-pop-body';
  body.appendChild(corpo);
  win.append(bar, body);
  win.style.zIndex = 9000;
  $('dk-windows').appendChild(win);
  def.pops.add(win);

  let autoId = null;
  function fechar() {
    if (!win.isConnected) return;
    clearTimeout(autoId);
    win.remove();
    def.pops.delete(win);
    if (typeof opts.onClose === 'function') opts.onClose();
  }
  x.addEventListener('click', fechar);
  if (opts.auto) autoId = setTimeout(fechar, opts.auto);
  return { win, fechar };
};

function el2(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* ---------- Varredura ---------- */
function agendarScan() {
  clearTimeout(def.scanTimer);
  def.scanTimer = setTimeout(varredura, aleatorio(60, 120));
}

function varredura() {
  if (!ativo()) return;
  if (def.quizAtivo) { def.scanTimer = setTimeout(varredura, 8000); return; }
  def.scanAtivo = true;

  const corpo = el2('div', 'def-body');
  const barra = el2('div', 'loading-bar def-bar');
  const fill = el2('div', 'loading-fill');
  barra.appendChild(fill);
  const msg = el2('p', 'def-small', 'Analisando C:\\ ...');
  corpo.append(
    el2('p', 'def-title', 'Varredura em andamento…'),
    barra,
    msg,
    el2('p', 'def-warn', 'Enquanto a varredura roda, o rastreamento sobe 2x mais rápido.')
  );
  const pop = window.defPopup('ROOT Defender — varredura em andamento…', corpo, { onClose: fimScan });
  bipe(440, 0.12, 'sine', 0.04);
  logLine('[ WARN ]', 'warn', 'ROOT Defender iniciou uma varredura — trace passivo 2x por 10 s');

  // +1% extra em 10 s (0,2% a cada 2 s) = o dobro do ritmo normal do Ato 2
  const pastas = ['C:\\ROOTOS\\', 'C:\\Documentos\\', 'C:\\Lixeira\\', 'memória RAM', 'setor de boot'];
  let passo = 0;
  def.boostId = setInterval(() => {
    passo++;
    fill.style.width = Math.min(100, passo * 20) + '%';
    msg.textContent = 'Analisando ' + pastas[Math.min(pastas.length - 1, passo - 1)] + ' ...';
    if (ativo()) addTrace(0.2);
    if (passo >= 5) pop.fechar();
  }, 2000);
  requestAnimationFrame(() => { fill.style.width = '2%'; });
}

function fimScan() {
  clearInterval(def.boostId);
  def.boostId = null;
  if (!def.scanAtivo) return;
  def.scanAtivo = false;
  if (ativo()) {
    logLine('[ INFO ]', 'info', 'ROOT Defender: varredura concluída. Nenhuma ameaça encontrada.');
    agendarScan();
  }
}

/* ---------- Verificação de integridade (quiz de revisão) ---------- */
function agendarQuiz() {
  clearTimeout(def.quizTimer);
  def.quizTimer = setTimeout(verificacao, aleatorio(70, 110));
}

function verificacao() {
  if (!ativo()) return;
  // nunca junto com a varredura
  if (def.scanAtivo) { def.quizTimer = setTimeout(verificacao, 6000); return; }
  const online = [...state.online];
  if (!online.length) { agendarQuiz(); return; }
  const i = online[Math.floor(Math.random() * online.length)];
  const et = ETAPAS[i];
  def.quizAtivo = true;

  const corpo = el2('div', 'def-body');
  const form = el2('form', 'def-form');
  form.autocomplete = 'off';
  const inp = el2('input', 'pw-input');
  inp.type = 'text';
  inp.spellcheck = false;
  inp.setAttribute('aria-label', 'Nome do componente');
  const ok = el2('button', 'os-btn', 'Verificar');
  ok.type = 'submit';
  const row = el2('div', 'pw-row');
  row.append(inp, ok);
  const msg = el2('p', 'def-small');
  msg.setAttribute('aria-live', 'polite');
  const tempo = el2('p', 'def-small def-timer', 'Fecha em 20 s');
  form.append(row, msg);
  corpo.append(
    el2('p', 'def-title', 'Verificação de integridade'),
    el2('p', null, 'Confirme qual módulo corresponde a esta descrição:'),
    el2('blockquote', 'def-clue', et.pista),
    form,
    tempo
  );

  let restante = 20;
  let respondido = false;
  const tick = def.tickId = setInterval(() => {
    restante--;
    tempo.textContent = 'Fecha em ' + restante + ' s';
  }, 1000);
  const pop = window.defPopup('ROOT Defender — verificação de integridade', corpo, {
    auto: 20000,
    onClose: () => {
      clearInterval(tick);
      def.quizAtivo = false;
      if (ativo()) agendarQuiz();
    }
  });
  bipe(880, 0.06, 'sine', 0.04); bipe(660, 0.08, 'sine', 0.04, 0.08);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (respondido || !ativo()) return;
    if (normalizar(inp.value) === et.resposta) {
      respondido = true;
      reduzirTrace(INTEGRIDADE_BONUS);
      somAcerto();
      msg.textContent = 'Integridade confirmada — trace −' + INTEGRIDADE_BONUS + '%';
      msg.className = 'def-small def-ok';
      inp.disabled = ok.disabled = true;
      logLine('[  OK  ]', 'ok', 'Integridade confirmada (' + et.resposta + ') — trace −' + INTEGRIDADE_BONUS + '%');
      setTimeout(pop.fechar, 1600);
    } else {
      // errar não custa nada: só avisa
      somErro();
      msg.textContent = 'Resposta não confere.';
      msg.className = 'def-small def-bad';
      inp.select();
    }
  });
  setTimeout(() => inp.focus(), 30);
}

/* ---------- Ganchos ---------- */
/* ---------- Quarentena: pacote coletado há 3 min sem resposta ---------- */
const QUARENTENA_MS = 180000;

function checarQuarentena() {
  if (!ativo()) return;
  const a2 = window.appsA2;
  const agora = Date.now();
  let mudou = false;
  a2.coletadoEm.forEach((t, i) => {
    if (state.online.has(i) || a2.quarentena.has(i) || agora - t < QUARENTENA_MS) return;
    a2.quarentena.add(i);
    if (a2.sel === i) a2.sel = null;
    mudou = true;
    const nome = 'PKT#' + pad2(i + 1);
    logLine('[ WARN ]', 'warn', 'ROOT Defender: ' + nome + ' colocado em quarentena (3 min sem resposta)');
    window.dkBalao('ROOT Defender', 'Pacote ' + nome + ' colocado em quarentena', 5000);
    bipe(330, 0.12, 'square', 0.04); bipe(247, 0.16, 'square', 0.04, 0.12);
  });
  if (mudou) { window.appsRenderPacotes(); renderDefender(); }
}

function restaurarQuarentena(i) {
  const a2 = window.appsA2;
  if (!ativo() || !a2.quarentena.has(i)) return;
  a2.quarentena.delete(i);
  a2.coletadoEm.set(i, Date.now());   // timer zerado
  logLine('[ INFO ]', 'info', 'ROOT Defender: PKT#' + pad2(i + 1) + ' restaurado da quarentena — trace +3%');
  window.appsRenderPacotes();
  renderDefender();
  addTrace(3);
}

/* ---------- Janela do ROOT Defender (aberta pelo escudo da bandeja) ---------- */
let defBody = null;

function renderDefender() {
  if (!defBody || !defBody.isConnected) return;
  defBody.textContent = '';
  abas(defBody, ['Status', 'Quarentena'], (k, area) => {
    if (k === 0) {
      area.append(
        caixa('Proteção ativa', [
          'Rastreamento atual: ' + Math.round(state.trace) + '%.',
          'Varreduras e verificações de integridade acontecem sem aviso.',
          'Pacotes parados por mais de 3 minutos vão para a quarentena.'
        ]),
        el('p', 'os-muted', 'Com o rastreamento acima de 70%, o firewall começa a interferir no sistema.')
      );
      return;
    }
    const a2 = window.appsA2;
    const lista = [...a2.quarentena];
    if (!lista.length) { area.appendChild(el('p', 'os-muted', 'Nenhum pacote em quarentena.')); return; }
    const box = el('div', 'fx-list');
    lista.forEach((i) => {
      const row = el('div', 'fx-item def-q');
      const b = el('button', 'os-btn', 'Restaurar (+3%)');
      b.type = 'button';
      b.addEventListener('click', () => restaurarQuarentena(i));
      row.append(el('span', 'fx-ico bin', ''), el('strong', null, 'PKT#' + pad2(i + 1)), b);
      box.appendChild(row);
    });
    area.appendChild(box);
  });
  // se há algo na quarentena, abre direto nessa aba
  if (window.appsA2.quarentena.size) {
    const aba = [...defBody.querySelectorAll('.os-tab')].find((t) => t.textContent === 'Quarentena');
    if (aba) aba.click();
  }
}

appById('defender').render = function (body) {
  defBody = body;
  renderDefender();
};

/* ---------- Firewall reagindo (trace ≥ 70%) ---------- */
function agendarFirewall() {
  clearTimeout(def.fwTimer);
  def.fwTimer = setTimeout(firewall, aleatorio(25, 35));
}

function firewall() {
  if (!ativo()) return;
  if (state.trace >= 70) {
    const fechada = window.dkFirewall();
    alarme();
    window.dkBalao('Firewall interferindo no sistema', fechada ? 'A janela "' + fechada + '" foi fechada e os ícones mudaram de lugar.' : 'Os ícones da área de trabalho mudaram de lugar.', 5000);
    logLine('[ WARN ]', 'warn', 'Firewall interferindo no sistema (trace ' + Math.round(state.trace) + '%)');
  }
  agendarFirewall();
}

window.defenderStart = function () {
  window.defenderStop();
  agendarScan();
  agendarQuiz();
  agendarFirewall();
  def.qId = setInterval(checarQuarentena, 5000);
};

window.defenderStop = function () {
  clearTimeout(def.scanTimer);
  clearTimeout(def.quizTimer);
  clearInterval(def.boostId);
  clearInterval(def.tickId);
  clearTimeout(def.fwTimer);
  clearInterval(def.qId);
  def.scanTimer = def.quizTimer = def.fwTimer = def.qId = def.tickId = null;
  def.boostId = null;
  def.scanAtivo = false;
  def.quizAtivo = false;
  [...def.pops].forEach((w) => w.remove());
  def.pops.clear();
};
