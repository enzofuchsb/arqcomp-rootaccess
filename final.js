'use strict';

/* =========================================================
   ROOT ACCESS — final.js
   Final cinematográfico, do último golpe até a volta ao início:
   1. último golpe em câmera lenta → tela branca → silêncio total
   2. desmoronamento: tijolos caem, chamas viram fumaça, o olho
      cai, rola, pisca devagar e sussurra "...acesso... concedido..."
   3. o prompt vira root: invasor@sys:~$ → (glitch) root@sys:~#  · whoami → root
   4. créditos em forma de boot log (as 16 peças com suas pistas)
   5. tela de vitória: LED da plaquinha piscando "OBRIGADO" em Morse
   6. pós-créditos (REBOOT da vitória): o último tijolo, um olhinho,
      "reiniciando em 3... 2..." e corte seco para o boot
   Mesmo sistema de cenas da batalha: async/await + esperar(ms, sinal),
   tudo cancelável (AbortController) e com "pular ›".
   Usa do batalha.js: BT, bt, esperar, ehAbort, posOlho, fxEl, musicaParar,
   RM, DEBUG, encerrar, debugIrParaBatalha.
   Usa do apps.js: MORSE, sequenciaMorse.
   ========================================================= */

const FN = {
  pular: null,      // AbortController do "pular ›" do final
  pos: null,        // AbortController da cena pós-créditos
  led: 0,           // token do loop do LED da vitória
  raf: null,
  btnPular: null
};

const lento = (ms) => (RM ? Math.round(ms * 0.35) : ms);

/* ---------- Tela própria do final (preto, terminal) ---------- */
const fn = {};

function montarFinal() {
  const sec = document.createElement('section');
  sec.id = 'screen-final';
  sec.className = 'screen';
  sec.setAttribute('aria-label', 'Final');
  sec.innerHTML =
    '<div class="fn-term" aria-live="polite"></div>' +
    '<div class="fn-creditos hidden"><h1 class="fn-titulo">ROOT ACCESS</h1>' +
      '<p class="fn-sub">Desenvolvido por Fuchs — Arquitetura Computacional 2026</p></div>' +
    '<div class="fn-tijolo hidden" aria-hidden="true">' +
      '<svg viewBox="0 0 60 30"><rect x="1" y="1" width="58" height="28" rx="2" class="fn-tij-corpo"/>' +
      '<path d="M8 22 l6 -4 4 5" class="fn-tij-rach"/>' +
      '<g class="fn-tij-olho"><ellipse cx="34" cy="14" rx="7" ry="5" class="fn-tij-esclera"/>' +
      '<circle cx="34" cy="14" r="2.4" class="fn-tij-pupila"/></g></svg></div>';
  $('app').appendChild(sec);
  fn.sec = sec;
  fn.term = sec.querySelector('.fn-term');
  fn.creditos = sec.querySelector('.fn-creditos');
  fn.tijolo = sec.querySelector('.fn-tijolo');
  fn.pupila = sec.querySelector('.fn-tij-pupila');
  fn.olhinho = sec.querySelector('.fn-tij-olho');
}

function linhaTerm(html) {
  const d = document.createElement('div');
  d.className = 'fn-linha';
  if (html != null) d.innerHTML = html;
  fn.term.appendChild(d);
  fn.term.scrollTop = fn.term.scrollHeight;
  return d;
}

async function digitarAqui(el, texto, sinal, ms, som) {
  for (const ch of texto) {
    el.textContent += ch;
    if (som && ch.trim()) som();
    await esperar(ms, sinal);
  }
}

/* ---------- "pular ›" do final: vai direto para a tela de vitória ---------- */
function mostrarPularFinal() {
  FN.btnPular = document.createElement('button');
  FN.btnPular.type = 'button';
  FN.btnPular.className = 'bt-pular';
  FN.btnPular.textContent = 'pular ›';
  FN.btnPular.addEventListener('click', () => { if (FN.pular) FN.pular.abort(); });
  document.body.appendChild(FN.btnPular);
}

function tirarPularFinal() {
  if (FN.btnPular) { FN.btnPular.remove(); FN.btnPular = null; }
}

/* =========================================================
   1. O ÚLTIMO GOLPE (câmera lenta)
   ========================================================= */
let branco = null;

async function ultimoGolpe(s) {
  bt.sec.classList.add('fn-final');            // some o HUD: só o chefe e o raio
  BT.alvo = null;
  const o = posOlho();
  const raio = fxEl('bt-raio critico fn-lento', { left: o.x + 'px', top: o.y + 'px', height: (o.h - o.y) + 'px' });
  // zumbido subindo bem devagar
  [180, 240, 320, 420, 560, 740].forEach((f, i) => bipe(f, 0.35, 'sine', 0.035, i * (RM ? 0.08 : 0.35)));
  await esperar(lento(2400), s);
  // atravessa o olho
  raio.classList.add('fn-atravessa');
  raio.style.top = '0px';
  raio.style.height = o.h + 'px';
  bt.boss.classList.add('atingido');
  await esperar(lento(450), s);
  // tela toda branca + silêncio total (a música corta de uma vez)
  branco = document.createElement('div');
  branco.className = 'fn-branco';
  document.body.appendChild(branco);
  musicaParar(0);
  BT.musicaAtiva = false;
  void branco.offsetWidth;
  branco.classList.add('on');
  await esperar(lento(1600), s);
  raio.remove();
  bt.boss.classList.remove('atingido');
}

/* =========================================================
   2. DESMORONAMENTO (em silêncio)
   ========================================================= */
async function desmoronamento(s) {
  branco.classList.add('sai');
  await esperar(lento(1200), s);
  branco.remove();
  branco = null;

  // tijolos caem um por um
  const vivos = bt.tijolos.filter((t) => !t.classList.contains('caido'))
    .sort((a, b) => a.getAttribute('y') - b.getAttribute('y'));
  for (const t of vivos) {
    t.classList.add('caido');
    await esperar(RM ? 10 : 70, s);
  }
  // chamas viram fumaça
  bt.chamas.forEach((c) => c.classList.add('fumaca'));
  bt.bracos.forEach((b) => b.classList.add('desligado'));
  await esperar(lento(1400), s);

  // o olho cai e rola pelo chão
  const st = bt.stage.getBoundingClientRect();
  const r = bt.olho.getBoundingClientRect();
  const olho = document.createElement('div');
  olho.className = 'fn-olho';
  olho.innerHTML = '<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="40" rx="56" ry="36" class="fn-esclera"/>' +
    '<g class="fn-iris-g"><circle cx="60" cy="40" r="20" class="fn-iris"/><circle cx="60" cy="40" r="9" class="fn-pupila"/><circle cx="54" cy="34" r="3.5" fill="#fff"/></g></svg>';
  olho.style.left = (r.left - st.left) + 'px';
  olho.style.top = (r.top - st.top) + 'px';
  olho.style.width = r.width + 'px';
  olho.style.height = r.height + 'px';
  bt.stage.appendChild(olho);
  bt.boss.classList.add('sem-olho');
  void olho.offsetWidth;
  const chao = st.height - r.height - 8;
  olho.classList.add('cai');
  olho.style.top = chao + 'px';
  await esperar(lento(900), s);
  olho.classList.add('rola');
  await esperar(lento(1800), s);

  // última piscada lenta
  olho.classList.add('piscada-lenta');
  await esperar(lento(1400), s);
  olho.classList.remove('piscada-lenta');

  // fala baixinho, letra por letra
  const sussurro = document.createElement('p');
  sussurro.className = 'fn-sussurro';
  sussurro.style.left = (parseFloat(olho.style.left) + r.width / 2 + 140) + 'px';
  sussurro.style.top = (chao - 28) + 'px';
  bt.stage.appendChild(sussurro);
  await digitarAqui(sussurro, '...acesso... concedido...', s, RM ? 40 : 110,
    () => bipe(700 + Math.random() * 80, 0.02, 'sine', 0.006));
  await esperar(lento(1000), s);
  olho.classList.add('fechado');
  await esperar(lento(1800), s);
}

/* =========================================================
   3. VOCÊ VIRA ROOT
   ========================================================= */
async function viraRoot(s) {
  showScreen('final');
  fn.sec.className = 'screen active';
  fn.term.textContent = '';
  fn.creditos.classList.add('hidden');
  fn.tijolo.classList.add('hidden');
  await esperar(lento(900), s);
  const l = linhaTerm('<span class="fn-prompt"><span class="fn-user">invasor</span>@sys:~</span><span class="fn-sinal">$</span><span class="fn-cmd"></span><span class="fn-cursor">█</span>');
  const user = l.querySelector('.fn-user');
  const sinal = l.querySelector('.fn-sinal');
  await esperar(lento(1400), s);

  // "invasor" sofre um glitch rápido...
  user.classList.add('glitch');
  ruido(0.35, 0.18, 2500);
  await esperar(lento(550), s);
  user.classList.remove('glitch');
  // ...é apagado letra por letra...
  while (user.textContent.length) {
    user.textContent = user.textContent.slice(0, -1);
    bipe(500, 0.02, 'square', 0.02);
    await esperar(RM ? 30 : 110, s);
  }
  await esperar(lento(400), s);
  // ...e "root" é digitado no lugar
  user.classList.add('root');
  await digitarAqui(user, 'root', s, RM ? 40 : 170, () => somTecla());
  await esperar(lento(700), s);

  // o $ pisca, apaga e vira #
  sinal.classList.add('pisca');
  await esperar(lento(1600), s);
  sinal.classList.remove('pisca');
  sinal.textContent = '';
  await esperar(lento(500), s);
  sinal.textContent = '#';
  sinal.classList.add('root');
  // som curto e grave de "acesso concedido"
  bipe(98, 0.45, 'square', 0.06);
  bipe(147, 0.55, 'sine', 0.07, 0.12);
  bipe(196, 0.7, 'sine', 0.05, 0.24);
  await esperar(lento(1300), s);
  l.querySelector('.fn-sinal').insertAdjacentText('afterend', ' ');
  await digitarAqui(l.querySelector('.fn-cmd'), 'whoami', s, RM ? 40 : 150, () => somTecla());
  await esperar(lento(500), s);
  l.querySelector('.fn-cursor').remove();
  linhaTerm().textContent = 'root';
  await esperar(lento(2200), s);
}

/* =========================================================
   4. CRÉDITOS EM FORMA DE BOOT
   ========================================================= */
async function creditos(s) {
  fn.sec.classList.add('fn-crt-off');
  await esperar(lento(700), s);
  fn.term.textContent = '';
  fn.sec.classList.remove('fn-crt-off');
  fn.sec.classList.add('fn-crt-on');
  await esperar(lento(600), s);
  fn.sec.classList.remove('fn-crt-on');

  const ok = (texto) => {
    const l = linhaTerm();
    const tag = document.createElement('span');
    tag.className = 'ok';
    tag.textContent = '[  OK  ] ';
    l.append(tag, document.createTextNode(texto));
  };
  for (const et of ETAPAS) {
    ok(et.resposta + ' — ' + et.pista);
    bipe(1200, 0.02, 'square', 0.015);
    await esperar(950, s);                 // leitura confortável
  }
  await esperar(500, s);
  ok('FIREWALL.EXE — encerrado');
  await esperar(1100, s);
  ok('Sistema 100% operacional');
  await esperar(2000, s);
  fn.term.classList.add('some');
  fn.creditos.classList.remove('hidden');
  await esperar(5000, s);
}

/* =========================================================
   ROTEIRO DO FINAL (chamado pela batalha na última camada)
   ========================================================= */
window.finalCinematico = async function (s) {
  FN.pular = new AbortController();
  const p = FN.pular.signal;
  s.addEventListener('abort', () => FN.pular.abort(), { once: true });
  mostrarPularFinal();
  try {
    await ultimoGolpe(p);
    await desmoronamento(p);
    await viraRoot(p);
    await creditos(p);
  } catch (e) {
    if (!ehAbort(e) || s.aborted) { limparFinal(); throw e; }   // pular cai aqui
  }
  musicaParar(0);
  BT.musicaAtiva = false;
  limparFinal();
  encerrar();
  vitoria();
};

function limparFinal() {
  tirarPularFinal();
  if (branco) { branco.remove(); branco = null; }
  bt.sec.classList.remove('fn-final');
  bt.boss.classList.remove('sem-olho');
  bt.chamas.forEach((c) => c.classList.remove('fumaca'));
  bt.stage.querySelectorAll('.fn-olho, .fn-sussurro').forEach((e) => e.remove());
  fn.term.textContent = '';
  fn.term.classList.remove('some');
  fn.creditos.classList.add('hidden');
  fn.sec.classList.remove('fn-crt-off', 'fn-crt-on', 'pos');
}

/* =========================================================
   5. LED DA VITÓRIA: "OBRIGADO" em Morse (código do microcontrolador)
   ========================================================= */
window.finalLed = function () {
  const led = document.querySelector('#screen-win .win-led-luz');
  if (!led || typeof sequenciaMorse !== 'function') return;
  const meu = ++FN.led;
  const seq = sequenciaMorse('OBRIGADO');
  let k = 0;
  (function passo() {
    // para quando sai da tela de vitória ou um novo loop começa
    if (meu !== FN.led || !$('screen-win').classList.contains('active')) { led.classList.remove('on'); return; }
    const [aceso, ms] = seq[k % seq.length];
    led.classList.toggle('on', aceso);
    k++;
    setTimeout(passo, ms);
  })();
};

function montarLed() {
  const box = document.createElement('figure');
  box.className = 'win-led';
  box.innerHTML =
    '<svg viewBox="0 0 120 80" aria-hidden="true">' +
      '<rect x="2" y="6" width="116" height="70" rx="5" class="wl-placa"/>' +
      '<circle cx="10" cy="14" r="3" class="wl-furo"/><circle cx="110" cy="14" r="3" class="wl-furo"/>' +
      '<circle cx="10" cy="68" r="3" class="wl-furo"/><circle cx="110" cy="68" r="3" class="wl-furo"/>' +
      '<rect x="0" y="30" width="18" height="20" rx="2" class="wl-usb"/>' +
      '<rect x="42" y="30" width="36" height="22" rx="2" class="wl-chip"/>' +
      '<path d="M46 30v-4M52 30v-4M58 30v-4M64 30v-4M70 30v-4M74 30v-4M46 52v4M52 52v4M58 52v4M64 52v4M70 52v4M74 52v4" class="wl-pino"/>' +
      '<g class="wl-header">' + Array.from({ length: 10 }, (_, i) => '<rect x="' + (28 + i * 8) + '" y="9" width="5" height="5"/>').join('') + '</g>' +
      '<g class="wl-header">' + Array.from({ length: 8 }, (_, i) => '<rect x="' + (36 + i * 8) + '" y="66" width="5" height="5"/>').join('') + '</g>' +
      '<circle cx="96" cy="40" r="6" class="win-led-luz"/>' +
      '<text x="96" y="56" class="wl-txt">L</text>' +
    '</svg>' +
    '<figcaption>mensagem do dispositivo externo</figcaption>';
  $('screen-win').appendChild(box);
}

/* =========================================================
   6. CENA PÓS-CRÉDITOS (REBOOT da vitória)
   ========================================================= */
function loopOlhinho() {
  if (!FN.pos || FN.pos.signal.aborted) return;
  const r = fn.olhinho.getBoundingClientRect();
  const dx = BT.mouse.x - (r.left + r.width / 2);
  const dy = BT.mouse.y - (r.top + r.height / 2);
  const a = Math.atan2(dy, dx);
  fn.pupila.setAttribute('transform', 'translate(' + (Math.cos(a) * 3.4).toFixed(2) + ' ' + (Math.sin(a) * 2.2).toFixed(2) + ')');
  FN.raf = requestAnimationFrame(loopOlhinho);
}

window.finalPosCreditos = async function () {
  if (FN.pos) FN.pos.abort();
  FN.pos = new AbortController();
  const s = FN.pos.signal;
  FN.led++;                                   // para o LED
  try {
    showScreen('final');
    limparFinal();
    fn.sec.classList.add('pos');
    await esperar(2000, s);                   // preto e silêncio
    fn.tijolo.classList.remove('hidden', 'treme', 'acordado');
    await esperar(lento(700), s);
    fn.tijolo.classList.add('treme');
    bipe(70, 0.25, 'sawtooth', 0.03);
    await esperar(lento(1300), s);
    fn.tijolo.classList.remove('treme');
    fn.tijolo.classList.add('acordado');      // o olhinho abre
    await esperar(lento(600), s);
    loopOlhinho();
    await esperar(lento(1400), s);
    const l1 = linhaTerm();
    l1.classList.add('fn-ameaca');
    await digitarAqui(l1, '> FIREWALL.EXE: reiniciando em 3...', s, RM ? 25 : 55, () => SFX.texto());
    await esperar(800, s);
    const l2 = linhaTerm();
    l2.classList.add('fn-ameaca');
    await digitarAqui(l2, '2...', s, RM ? 25 : 90, () => SFX.texto());
    await esperar(650, s);
  } catch (e) {
    if (!ehAbort(e)) console.error(e);
    return;
  }
  // corte seco (sem esperar o 1) para a tela inicial, com o efeito CRT
  crtReboot();
};

/* chamado por batalhaParar (game over, reboot, nova partida) */
window.finalParar = function () {
  if (FN.pular) FN.pular.abort();
  if (FN.pos) FN.pos.abort();
  cancelAnimationFrame(FN.raf);
  FN.led++;
  limparFinal();
  fn.tijolo.classList.add('hidden');
  fn.tijolo.classList.remove('treme', 'acordado');
};

montarFinal();
montarLed();

/* atalho de teste: ?debug=1 → batalha começa e cai direto no final */
if (DEBUG) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-small bt-debug fn-debug';
  b.textContent = '[debug] ir para o final';
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    BT.irParaFinal = true;
    debugIrParaBatalha();
    if (BT.cine) BT.cine.abort();             // pula a abertura da batalha
  });
  document.body.appendChild(b);
}
