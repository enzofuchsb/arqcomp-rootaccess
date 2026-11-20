'use strict';

/* =========================================================
   ROOT ACCESS — batalha.js
   Batalha final contra FIREWALL.EXE, "O Paredão".
   Começa quando o 16º módulo fica online (apps.js → sistemaOtimizado).

   Organização:
   - Cenas escritas como roteiro com async/await + esperar(ms, sinal).
   - TUDO é cancelável por AbortController: game over, reboot ou
     "pular ›" abortam o sinal e nenhum timer/animação antiga continua.
     BT.ctl  = a batalha inteira; BT.cine = só a abertura (o "pular").
   - Música: assets/audio/firewall-rootos.mp3 via Web Audio (loop sem corte).
     Efeitos sonoros continuam gerados por código (bipe/ruído).
   - O código digitado nos GOLPES nunca é executado: só regex.
   Usa do script.js: $, state, ETAPAS, bipe, ctx, audioCtx, somLigado,
   normalizar, addTrace, renderTrace, startTrace, vitoria, showScreen.
   Usa do desktop.js: dk, dkBalao.
   ========================================================= */

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEBUG = /[?&]debug=1\b/.test(location.search);
const MUSICA_URL = 'assets/audio/firewall-rootos.mp3';
const TEMPO_RESPOSTA = 15000;   // 15 s para responder uma pista
const TEMPO_GOLPE = 25000;      // 25 s para responder um golpe de código JavaScript

/* ---------- Estado ---------- */
const BT = {
  ctl: null,          // AbortController da batalha
  cine: null,         // AbortController da abertura (pular)
  hp: 6,
  fase: 1,
  errosBt: 0,
  fila: [],           // tipos das próximas camadas ('p' pista, 'g' golpe)
  usadasP: new Set(),
  usadasG: new Set(),
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  alvo: null,         // alvo forçado da pupila (cena "procurando")
  seguir: false,
  raf: null,
  responder: null,
  musicaAtiva: false,
  caidos: []          // tijolos que caíram (para regenerar)
};

/* ---------- Utilidades canceláveis ---------- */
const abortErr = () => new DOMException('cancelado', 'AbortError');
const ehAbort = (e) => e && e.name === 'AbortError';

function esperar(ms, sinal) {
  sinal = sinal || BT.ctl.signal;
  return new Promise((res, rej) => {
    if (sinal.aborted) { rej(abortErr()); return; }
    const t = setTimeout(() => { sinal.removeEventListener('abort', ab); res(); }, ms);
    function ab() { clearTimeout(t); rej(abortErr()); }
    sinal.addEventListener('abort', ab, { once: true });
  });
}

/* intervalo que morre sozinho quando o sinal aborta */
function intervalo(fn, ms, sinal) {
  const id = setInterval(fn, ms);
  sinal.addEventListener('abort', () => clearInterval(id), { once: true });
  return id;
}

const sortear = (arr) => arr[Math.floor(Math.random() * arr.length)];
const embaralhar2 = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Efeitos sonoros (Web Audio, sem arquivos) ---------- */
function ruido(dur, vol, freq, atraso) {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime + (atraso || 0);
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const SFX = {
  texto:     () => bipe(1250 + Math.random() * 250, 0.018, 'square', 0.018),
  pedra:     () => { ruido(0.18, 0.25, 500); bipe(70, 0.12, 'square', 0.04); },
  clack:     () => { bipe(2200, 0.02, 'square', 0.05); bipe(900, 0.04, 'square', 0.04, 0.03); },
  rachadura: () => { ruido(0.6, 0.35, 900); bipe(55, 0.6, 'sawtooth', 0.06); },
  rugido:    () => { ruido(1.3, 0.3, 300); bipe(62, 1.3, 'sawtooth', 0.08); bipe(48, 1.3, 'sawtooth', 0.06, 0.1); },
  raio:      () => { [400, 700, 1100, 1600].forEach((f, i) => bipe(f, 0.07, 'square', 0.04, i * 0.04)); },
  feixe:     () => { [900, 600, 380, 220, 140].forEach((f, i) => bipe(f, 0.1, 'sawtooth', 0.05, i * 0.06)); },
  critico:   () => { bipe(1568, 0.08, 'square', 0.06); bipe(2093, 0.16, 'square', 0.06, 0.08); ruido(0.3, 0.2, 2000, 0.05); },
  carga:     () => { [200, 260, 330, 420].forEach((f, i) => bipe(f, 0.12, 'triangle', 0.04, i * 0.1)); },
  vida:      (i) => bipe(500 + i * 90, 0.06, 'square', 0.04)
};

/* ---------- Música da batalha (arquivo, loop sem corte) ---------- */
const MUS = { buf: null, carregando: null, src: null, gain: null, base: 0.55, rate: 1 };

function musicaPreload() {
  if (MUS.carregando) return MUS.carregando;
  MUS.carregando = (async () => {
    try {
      const r = await fetch(MUSICA_URL);
      if (!r.ok) throw new Error('http ' + r.status);
      const ab = await r.arrayBuffer();
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      MUS.buf = await audioCtx.decodeAudioData(ab);
    } catch (e) {
      MUS.buf = null;   // sem música: o jogo segue normalmente
    }
  })();
  return MUS.carregando;
}

function musicaTocar() {
  if (!MUS.buf || MUS.src) return;
  const ac = ctx();            // respeita o botão de som
  if (!ac) return;
  const src = ac.createBufferSource();
  src.buffer = MUS.buf;
  src.loop = true;
  src.playbackRate.value = MUS.rate;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(MUS.base, ac.currentTime + 1.2);
  src.connect(g).connect(ac.destination);
  src.start();
  MUS.src = src;
  MUS.gain = g;
}

function musicaVolume(frac, dur) {
  if (!MUS.gain) return;
  const t = audioCtx.currentTime;
  const g = MUS.gain.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(MUS.base * frac, t + (dur || 0.4));
}

function musicaRate(r) {
  MUS.rate = r;
  if (!MUS.src) return;
  const t = audioCtx.currentTime;
  const p = MUS.src.playbackRate;
  p.cancelScheduledValues(t);
  p.setValueAtTime(p.value, t);
  p.linearRampToValueAtTime(r, t + 1);
}

function musicaParar(fade) {
  if (!MUS.src) return;
  const src = MUS.src;
  const g = MUS.gain;
  MUS.src = null;
  MUS.gain = null;
  try {
    const t = audioCtx.currentTime;
    if (fade > 0) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
      src.stop(t + fade + 0.05);
    } else {
      src.stop();
    }
  } catch (e) { /* já parado */ }
}

/* =========================================================
   O PERSONAGEM (SVG inline, cada parte num grupo)
   ========================================================= */
const OLHO = { x: 150, y: 150 };

function svgParedao() {
  // tijolos: 8 fileiras, alternando o encaixe
  let tijolos = '';
  let n = 0;
  for (let r = 0; r < 8; r++) {
    const y = 70 + r * 22;
    const off = r % 2 ? -22 : 0;
    for (let x = 40 + off; x < 260; x += 44) {
      const x0 = Math.max(40, x);
      const x1 = Math.min(260, x + 44);
      if (x1 - x0 < 8) continue;
      tijolos += '<rect class="bt-tijolo" data-i="' + (n++) + '" x="' + (x0 + 1) + '" y="' + (y + 1) + '" width="' + (x1 - x0 - 2) + '" height="20" rx="1"/>';
    }
  }
  // chamas no topo (cada uma acende separada)
  const chamas = [60, 100, 150, 200, 240].map((x, i) => {
    const topo = [26, 16, 6, 14, 24][i];
    return '<g class="bt-chama" style="--d:' + (i * 0.13) + 's">' +
      '<path class="c1" d="M' + (x - 18) + ' 74 Q' + (x - 20) + ' 44 ' + x + ' ' + topo + ' Q' + (x + 20) + ' 44 ' + (x + 18) + ' 74Z"/>' +
      '<path class="c2" d="M' + (x - 9) + ' 74 Q' + (x - 10) + ' 56 ' + x + ' ' + (topo + 22) + ' Q' + (x + 10) + ' 56 ' + (x + 9) + ' 74Z"/></g>';
  }).join('');
  return '' +
  '<svg class="bt-svg" viewBox="-30 0 360 300" aria-hidden="true">' +
    '<g id="bt-corpo">' +
      '<g id="bt-braco-e" class="bt-braco"><path d="M40 176 C10 186 4 214 0 238" /><rect x="-9" y="236" width="18" height="22" rx="2"/><path class="pino" d="M-5 258v6M0 258v6M5 258v6"/></g>' +
      '<g id="bt-braco-d" class="bt-braco"><path d="M260 176 C290 186 296 214 300 238" /><rect x="291" y="236" width="18" height="22" rx="2"/><path class="pino" d="M295 258v6M300 258v6M305 258v6"/></g>' +
      '<g id="bt-chamas">' + chamas + '</g>' +
      '<rect class="bt-muro-fundo" x="40" y="70" width="220" height="176"/>' +
      '<g id="bt-tijolos">' + tijolos + '</g>' +
      '<g id="bt-rach2" class="bt-rach"><path d="M62 92 l10 14 -6 10 12 16"/><path d="M236 200 l-12 10 6 12 -10 14"/></g>' +
      '<g id="bt-rach3" class="bt-rach"><path d="M220 80 l-8 16 10 8 -6 20"/><path d="M70 196 l14 8 -4 14 10 12"/><path d="M150 214 l-6 12 8 10"/></g>' +
      '<ellipse class="bt-orbita" cx="150" cy="150" rx="66" ry="46"/>' +
      '<g id="bt-olho">' +
        '<ellipse class="bt-esclera" cx="150" cy="150" rx="58" ry="38"/>' +
        '<g id="bt-veias"><path d="M94 140 q14 4 22 12"/><path d="M98 166 q12 -2 20 -10"/><path d="M206 138 q-14 6 -20 14"/><path d="M204 164 q-12 -4 -18 -12"/></g>' +
        '<g id="bt-iris-g"><circle class="bt-iris" cx="150" cy="150" r="22"/><circle class="bt-pupila" cx="150" cy="150" r="10"/><circle class="bt-brilho" cx="144" cy="144" r="4"/></g>' +
        '<circle id="bt-olho-centro" cx="150" cy="150" r="1" fill="none"/>' +
      '</g>' +
      '<circle id="bt-carga" cx="150" cy="150" r="72"/>' +
      '<path id="bt-sobr" d="M88 104 L212 104"/>' +
    '</g>' +
  '</svg>';
}

const SOBR = { reta: 'M88 104 L212 104', brava: 'M88 90 L150 112 L212 90' };

/* =========================================================
   TELA DA BATALHA
   ========================================================= */
const bt = {};   // referências do DOM

function montarTela() {
  const sec = document.createElement('section');
  sec.id = 'screen-batalha';
  sec.className = 'screen';
  sec.setAttribute('aria-label', 'Batalha final');
  sec.innerHTML =
    '<div class="bt-shell">' +
      '<header class="bt-top">' +
        '<span class="bt-logo">ROOT ACCESS</span>' +
        '<div class="bt-hp" aria-label="Vida do FIREWALL.EXE"><span class="bt-hp-name">FIREWALL.EXE</span>' +
          '<div class="bt-hp-bar">' + '<i></i>'.repeat(6) + '</div><span class="bt-hp-n">0/6</span></div>' +
        '<div class="trace"><span class="trace-label">TRACE</span>' +
          '<div class="trace-bar" role="progressbar" aria-label="Rastreamento" aria-valuemin="0" aria-valuemax="100"><div class="trace-fill bt-trace-fill"></div></div>' +
          '<span class="trace-pct bt-trace-pct">0%</span>' +
          '<button class="btn btn-small btn-sound" type="button" aria-pressed="true">SOM: ON</button></div>' +
      '</header>' +
      '<div class="bt-stage">' +
        '<div class="bt-chao" aria-hidden="true"></div>' +
        '<div class="bt-boss" data-fase="1">' + svgParedao() + '</div>' +
        '<div class="bt-fx" aria-hidden="true"></div>' +
        '<div class="bt-intro hidden"><pre class="bt-intro-txt"></pre></div>' +
        '<div class="bt-cartao hidden"><span>FIREWALL.EXE</span><small>GUARDIÃO DO KERNEL</small></div>' +
      '</div>' +
      '<div class="bt-dialogo"><span class="bt-nome">FIREWALL.EXE</span><p class="bt-fala" aria-live="polite"></p></div>' +
      '<section class="bt-painel hidden" aria-live="polite">' +
        '<div class="bt-painel-head"><span class="bt-tag"></span><span class="bt-camada"></span></div>' +
        '<div class="bt-tempo"><div class="bt-tempo-fill"></div></div>' +
        '<p class="bt-enunciado"></p>' +
        '<form class="bt-form term" autocomplete="off">' +
          '<label class="prompt bt-prompt" for="bt-input">invasor@sys:~$</label>' +
          '<div class="term-field"><input id="bt-input" class="term-input bt-input" type="text" spellcheck="false" autocapitalize="off" aria-label="Sua resposta"></div>' +
          '<button class="btn btn-primary bt-enviar" type="submit">&gt; ATACAR</button>' +
        '</form>' +
        '<p class="bt-feedback"></p>' +
      '</section>' +
    '</div>';
  $('app').appendChild(sec);

  const q = (s) => sec.querySelector(s);
  Object.assign(bt, {
    sec, stage: q('.bt-stage'), boss: q('.bt-boss'), svg: q('.bt-svg'), fx: q('.bt-fx'),
    intro: q('.bt-intro'), introTxt: q('.bt-intro-txt'), cartao: q('.bt-cartao'),
    hpSegs: [...sec.querySelectorAll('.bt-hp-bar i')], hpN: q('.bt-hp-n'),
    fala: q('.bt-fala'), dialogo: q('.bt-dialogo'),
    painel: q('.bt-painel'), tag: q('.bt-tag'), camada: q('.bt-camada'), tempo: q('.bt-tempo-fill'),
    enunciado: q('.bt-enunciado'), form: q('.bt-form'), prompt: q('.bt-prompt'), input: q('.bt-input'),
    feedback: q('.bt-feedback'), traceFill: q('.bt-trace-fill'), tracePct: q('.bt-trace-pct'),
    olho: q('#bt-olho'), iris: q('#bt-iris-g'), centro: q('#bt-olho-centro'), sobr: q('#bt-sobr'),
    tijolos: [...sec.querySelectorAll('.bt-tijolo')], chamas: [...sec.querySelectorAll('.bt-chama')],
    bracos: [...sec.querySelectorAll('.bt-braco')]
  });

  bt.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = bt.input.value;
    if (BT.responder && v.trim()) BT.responder(v);
  });
  bt.input.addEventListener('input', () => somTecla());
  // o botão de som desta tela também funciona
  sec.querySelector('.btn-sound').addEventListener('click', toggleSom);
}

/* trace espelhado no topo da batalha (chamado por renderTrace) */
window.batalhaTrace = function (v, nivel) {
  if (!bt.traceFill) return;
  bt.traceFill.style.width = v + '%';
  bt.traceFill.className = 'trace-fill bt-trace-fill ' + nivel;
  bt.tracePct.className = 'trace-pct bt-trace-pct ' + nivel;
  bt.tracePct.textContent = v + '%';
};

function renderVida() {
  bt.hpSegs.forEach((s, i) => s.classList.toggle('on', i < BT.hp));
  bt.hpN.textContent = BT.hp + '/6';
  bt.hpSegs.forEach((s) => s.parentElement.parentElement.classList.toggle('baixa', BT.hp <= 2));
}

function setFase(f) {
  BT.fase = f;
  bt.boss.dataset.fase = String(f);
  bt.sobr.setAttribute('d', f >= 2 ? SOBR.brava : SOBR.reta);
}

/* ---------- Pupila segue o cursor / toque ---------- */
function onPonteiro(e) {
  const p = e.touches ? e.touches[0] : e;
  if (!p) return;
  BT.mouse.x = p.clientX;
  BT.mouse.y = p.clientY;
}
document.addEventListener('mousemove', onPonteiro, { passive: true });
document.addEventListener('touchstart', onPonteiro, { passive: true });
document.addEventListener('touchmove', onPonteiro, { passive: true });

function loopPupila() {
  if (!BT.ctl || BT.ctl.signal.aborted) return;
  if (BT.seguir && bt.centro && bt.sec.classList.contains('active')) {
    const r = bt.centro.getBoundingClientRect();
    const escala = bt.olho.getBoundingClientRect().width / 116 || 1;
    const alvo = BT.alvo || BT.mouse;
    const dx = alvo.x - (r.left + r.width / 2);
    const dy = alvo.y - (r.top + r.height / 2);
    const ang = Math.atan2(dy, dx);
    const dist = Math.min(18, Math.hypot(dx, dy) / escala * 0.12);
    bt.iris.setAttribute('transform', 'translate(' + (Math.cos(ang) * dist).toFixed(1) + ' ' + (Math.sin(ang) * dist * 0.75).toFixed(1) + ')');
  }
  BT.raf = requestAnimationFrame(loopPupila);
}

/* piscar de vez em quando */
function agendarPiscar(sinal) {
  const t = setTimeout(async () => {
    if (sinal.aborted) return;
    bt.olho.classList.add('piscando');
    setTimeout(() => bt.olho.classList.remove('piscando'), 160);
    agendarPiscar(sinal);
  }, 2500 + Math.random() * 3500);
  sinal.addEventListener('abort', () => clearTimeout(t), { once: true });
}

/* ---------- Texto letra por letra ---------- */
async function digitar(el, texto, sinal, ms) {
  el.textContent = '';
  for (const ch of texto) {
    el.textContent += ch;
    if (ch.trim()) SFX.texto();
    await esperar(ch === '.' || ch === '?' ? (ms || 30) * 4 : (ms || 30), sinal);
  }
}

async function falar(texto, sinal, importante) {
  if (importante) musicaVolume(0.4, 0.3);
  bt.dialogo.classList.add('on');
  await digitar(bt.fala, texto, sinal, 32);
  await esperar(900, sinal);
  if (importante) musicaVolume(1, 0.6);
}

/* =========================================================
   FALAS
   ========================================================= */
function primeiraFala() {
  const st = state.stats || { erros: 0, sniffs: 0, brutes: 0, dicasPorPalavra: {}, errosPorPalavra: {} };
  const dicas = st.sniffs + st.brutes;
  const minutos = Math.max(1, Math.round(state.segundos / 60));
  const ops = [];
  const comSniff = Object.keys(st.dicasPorPalavra).filter((p) => st.dicasPorPalavra[p].sniff > 0);
  const comBrute = Object.keys(st.dicasPorPalavra).filter((p) => st.dicasPorPalavra[p].brute > 0);
  const errosPal = Object.entries(st.errosPorPalavra).sort((a, b) => b[1] - a[1]);
  if (st.erros + dicas > 0) ops.push(st.erros + ' erros. ' + dicas + ' dicas. Eu contei cada um.');
  if (comSniff.length) ops.push('Você precisou de SNIFF pra lembrar o que é ' + sortear(comSniff) + '...');
  if (comBrute.length) ops.push('Forçou as letras de ' + sortear(comBrute) + ' no BRUTE FORCE. Que elegante.');
  if (errosPal.length && errosPal[0][1] >= 2) ops.push(errosPal[0][1] + ' tentativas pra acertar ' + errosPal[0][0] + '. Eu vi todas.');
  if (state.segundos >= 120) ops.push(minutos + ' minutos pra religar um computador. Patético.');
  if (st.erros <= 1 && dicas === 0) {
    ops.push('Sem erros até aqui... Vamos ver quanto isso dura.');
    ops.push('Nenhuma dica. Finalmente um invasor que vale o meu tempo.');
  }
  if (!ops.length) ops.push('Dezesseis módulos. E nenhum deles vai te salvar de mim.');
  return sortear(ops);
}

const FALAS_DOR = ['Isso foi sorte.', 'Meus registradores...!', 'Impossível...', 'Você... acertou?', 'Uma camada a menos não muda nada.', 'Argh! Meu cache!', 'Isso não estava no meu log...'];
const FALAS_DEBOCHE = ['Você nem sabe o que é uma ULA.', 'Previsível.', 'Rastreando...', 'Errou. Eu já sabia.', 'Seu IP está quase na minha tela.', 'Tente de novo... se der tempo.', 'Isso é tudo, hacker?'];

/* =========================================================
   GOLPES DO FIREWALL (desafios de JavaScript, validados por regex)
   Nunca executamos o texto digitado: é só comparação.
   ========================================================= */
// texto sem diferenciar maiúsculas: "root" → [rR][oO][oO][tT]
const ci = (s) => s.replace(/[a-z]/gi, (c) => '[' + c.toLowerCase() + c.toUpperCase() + ']').replace(/ /g, '\\s+');
// string entre aspas simples, duplas ou crase
const str = (s) => '(?:\'' + ci(s) + '\'|"' + ci(s) + '"|`' + ci(s) + '`)';
const LOG = 'console\\s*\\.\\s*log\\s*\\(\\s*';
const FIM = '\\s*\\)';
const DECL = '(?:let|const|var)\\s+';
const re = (corpo) => new RegExp('^\\s*' + corpo + '\\s*;?\\s*$');

const GOLPES = [
  { nome: 'CONSOLE BLOCK', enunciado: 'Escreva "hello world" no console.',
    re: re(LOG + str('hello world') + FIM), exemplo: "console.log('hello world')" },
  { nome: 'VARIABLE LOCK', enunciado: 'Declare uma variável chamada senha com o valor "root".',
    re: re(DECL + 'senha\\s*=\\s*' + str('root')), exemplo: "let senha = 'root'" },
  { nome: 'ALERT STORM', enunciado: 'Mostre um alerta com a mensagem "acesso".',
    re: re('(?:window\\s*\\.\\s*)?alert\\s*\\(\\s*' + str('acesso') + FIM), exemplo: "alert('acesso')" },
  { nome: 'SUM STRIKE', enunciado: 'Mostre no console a soma de 2 e 3.',
    re: re(LOG + '(?:2\\s*\\+\\s*3|3\\s*\\+\\s*2)' + FIM), exemplo: 'console.log(2 + 3)' },
  { nome: 'UPPERCASE CRUSH', enunciado: 'Transforme o texto "root" em maiúsculas.',
    re: re('(?:' + LOG + ')?' + str('root') + '\\s*\\.\\s*toUpperCase\\s*\\(\\s*\\)(?:\\s*\\))?'), exemplo: "'root'.toUpperCase()" },
  { nome: 'LENGTH LASER', enunciado: 'Mostre no console o tamanho do texto "firewall".',
    re: re(LOG + str('firewall') + '\\s*\\.\\s*length' + FIM), exemplo: "console.log('firewall'.length)" },
  { nome: 'DOM GRAB', enunciado: 'Pegue o elemento com id "terminal".',
    re: re('(?:' + DECL + '[A-Za-z_$][\\w$]*\\s*=\\s*)?document\\s*\\.\\s*getElementById\\s*\\(\\s*' + str('terminal') + FIM), exemplo: "document.getElementById('terminal')" },
  { nome: 'FUNCTION FREEZE', enunciado: 'Crie uma função vazia chamada hackear.',
    re: re('(?:function\\s+hackear\\s*\\(\\s*\\)\\s*\\{\\s*\\}|' + DECL + 'hackear\\s*=\\s*(?:function\\s*\\(\\s*\\)|\\(\\s*\\)\\s*=>)\\s*\\{\\s*\\})'), exemplo: 'function hackear() {}' },
  { nome: 'ARRAY WALL', enunciado: "Crie um array chamado portas com 'AND', 'OR' e 'NOT'.",
    re: re(DECL + 'portas\\s*=\\s*\\[\\s*' + str('AND') + '\\s*,\\s*' + str('OR') + '\\s*,\\s*' + str('NOT') + '\\s*,?\\s*\\]'), exemplo: "let portas = ['AND', 'OR', 'NOT']" },
  { nome: 'IF TRAP', enunciado: 'Escreva um if que verifica se a variável trace é maior que 80.',
    re: re('if\\s*\\(\\s*trace\\s*>\\s*80\\s*\\)\\s*\\{[\\s\\S]*\\}'), exemplo: 'if (trace > 80) {}' },
  { nome: 'LOOP LOCKDOWN', enunciado: 'Escreva um for com i indo de 0 enquanto i < 3 (i++), com corpo vazio.',
    re: re('for\\s*\\(\\s*(?:let|var)\\s+i\\s*=\\s*0\\s*;\\s*i\\s*<\\s*3\\s*;\\s*(?:i\\s*\\+\\+|\\+\\+\\s*i|i\\s*\\+=\\s*1)\\s*\\)\\s*\\{[\\s\\S]*\\}'), exemplo: 'for (let i = 0; i < 3; i++) {}' }
];

/* =========================================================
   ABERTURA (cena cinematográfica)
   ========================================================= */
let pularBtn = null;
let cursorFalso = null;

function mostrarPular() {
  pularBtn = document.createElement('button');
  pularBtn.type = 'button';
  pularBtn.className = 'bt-pular';
  pularBtn.textContent = 'pular ›';
  pularBtn.addEventListener('click', () => { if (BT.cine) BT.cine.abort(); });
  document.body.appendChild(pularBtn);
}

async function falsaVitoria(s) {
  // apps.js já mostrou o balão "Sistema otimizado", tirou o "Modo de segurança" e tocou o som
  await esperar(3000, s);
}

async function algoErrado(s) {
  clearInterval(dk.relogioId);                      // o relógio da bandeja para
  dk.relogioId = null;
  cursorFalso = document.createElement('div');
  cursorFalso.className = 'bt-cursor-falso';
  cursorFalso.innerHTML = '<svg viewBox="0 0 16 24" aria-hidden="true"><path d="M1 1v19l5-5 4 8 3-1.5-4-8h7z" fill="#fff" stroke="#000" stroke-width="1.2"/></svg>';
  cursorFalso.style.left = BT.mouse.x + 'px';
  cursorFalso.style.top = BT.mouse.y + 'px';
  document.body.appendChild(cursorFalso);
  document.body.classList.add('bt-congelado');      // cursor real some
  await esperar(1500, s);
  SFX.rachadura();
  await esperar(600, s);
}

async function desmontar(s) {
  const scr = $('screen-desktop');
  const area = $('dk-area');
  if (RM) {
    scr.classList.add('bt-fade-out');
    await esperar(900, s);
    return;
  }
  // ícones caem um por um
  const icones = [...document.querySelectorAll('.dk-icon')];
  icones.forEach((ic, i) => {
    ic.style.transition = 'transform 0.9s cubic-bezier(.55,0,1,.45) ' + (i * 0.13) + 's';
    ic.style.transform = 'translateY(' + (area.clientHeight + 40) + 'px) rotate(' + (Math.random() * 60 - 30) + 'deg)';
    setTimeout(() => SFX.pedra(), i * 130 + 800);
  });
  await esperar(icones.length * 130 + 300, s);
  // janelas racham ao meio
  [...document.querySelectorAll('#dk-windows .rw-win')].forEach((w) => {
    if (w.hidden) return;
    ['esq', 'dir'].forEach((lado) => {
      const m = w.cloneNode(true);
      m.classList.add('bt-metade', lado);
      m.removeAttribute('id');
      w.parentElement.appendChild(m);
      requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('cai')));
    });
    w.style.visibility = 'hidden';
  });
  SFX.rachadura();
  await esperar(1100, s);
  // barra de tarefas despenca
  scr.querySelector('.taskbar').classList.add('bt-cai');
  SFX.pedra();
  await esperar(700, s);
  scr.classList.add('bt-fade-out');
  await esperar(700, s);
}

async function alguemDigitando(s) {
  document.body.classList.remove('bt-congelado');
  if (cursorFalso) { cursorFalso.remove(); cursorFalso = null; }
  showScreen('batalha');
  bt.sec.classList.add('intro');
  bt.intro.classList.remove('hidden');
  bt.introTxt.textContent = '';
  await esperar(900, s);
  const linhas = ['> processo desconhecido detectado: FIREWALL.EXE (PID 0)', '> você achou que tinha acabado?'];
  for (const l of linhas) {
    const span = document.createElement('div');
    bt.introTxt.appendChild(span);
    await digitar(span, l, s, 40);
    await esperar(700, s);
  }
  await esperar(900, s);
  bt.intro.classList.add('hidden');
}

async function chefeSeMonta(s) {
  bt.sec.classList.remove('intro');
  bt.stage.classList.add('tremendo');
  // tijolos sobem de baixo, um por um (de baixo para cima)
  const ordem = bt.tijolos.slice().sort((a, b) => b.getAttribute('y') - a.getAttribute('y'));
  for (let i = 0; i < ordem.length; i++) {
    ordem[i].classList.remove('oculto');
    if (i % 3 === 0) SFX.pedra();
    await esperar(RM ? 15 : 55, s);
  }
  bt.stage.classList.remove('tremendo');
  await esperar(300, s);
  // braços conectam com um "clack"
  for (const b of bt.bracos) {
    b.classList.remove('desligado');
    SFX.clack();
    await esperar(380, s);
  }
  // chamas acendem uma por vez
  for (const c of bt.chamas) {
    c.classList.remove('apagada');
    bipe(180 + Math.random() * 60, 0.15, 'sawtooth', 0.03);
    await esperar(260, s);
  }
  await esperar(400, s);
}

async function olhoAbre(s) {
  bt.olho.classList.add('fresta');
  bt.olho.classList.remove('fechado');
  bipe(140, 0.4, 'sine', 0.05);
  await esperar(1100, s);
  bt.olho.classList.remove('fresta');
  await esperar(500, s);
  // pupila procura pela tela...
  BT.seguir = true;
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const p of [[0.1, 0.3], [0.9, 0.25], [0.2, 0.8], [0.8, 0.75]]) {
    BT.alvo = { x: w * p[0], y: h * p[1] };
    await esperar(420, s);
  }
  // ...e trava no cursor
  BT.alvo = null;
  bipe(880, 0.05, 'square', 0.05);
  await esperar(700, s);
}

async function cartaoTitulo(s) {
  bt.cartao.classList.remove('hidden');
  bt.stage.classList.add('tremendo');
  ruido(0.4, 0.3, 400);
  BT.musicaAtiva = true;
  musicaPreload().then(() => { if (BT.musicaAtiva) musicaTocar(); });
  await esperar(450, s);
  bt.stage.classList.remove('tremendo');
  // barra de vida enche segmento por segmento
  for (let i = 1; i <= 6; i++) {
    BT.hp = i;
    renderVida();
    SFX.vida(i);
    await esperar(220, s);
  }
  await esperar(1500, s);
  bt.cartao.classList.add('hidden');
}

async function abertura(s) {
  mostrarPular();
  await falsaVitoria(s);
  await algoErrado(s);
  await desmontar(s);
  await alguemDigitando(s);
  await chefeSeMonta(s);
  await olhoAbre(s);
  await cartaoTitulo(s);
  await zerarTrace(s);                  // o trace volta a 0% e o chefe comenta
  await falar(primeiraFala(), s, true);
}

/* deixa tudo no estado "pós-abertura" (usado também ao pular) */
function estadoPosAbertura() {
  if (pularBtn) { pularBtn.remove(); pularBtn = null; }
  document.body.classList.remove('bt-congelado');
  if (cursorFalso) { cursorFalso.remove(); cursorFalso = null; }
  showScreen('batalha');
  bt.sec.classList.remove('intro');
  bt.intro.classList.add('hidden');
  bt.cartao.classList.add('hidden');
  bt.stage.classList.remove('tremendo');
  bt.tijolos.forEach((t) => t.classList.remove('oculto'));
  bt.bracos.forEach((b) => b.classList.remove('desligado'));
  bt.chamas.forEach((c) => c.classList.remove('apagada'));
  bt.olho.classList.remove('fechado', 'fresta');
  BT.alvo = null;
  BT.seguir = true;
  BT.hp = 6;
  renderVida();
  if (!BT.musicaAtiva) {
    BT.musicaAtiva = true;
    musicaPreload().then(() => { if (BT.musicaAtiva) musicaTocar(); });
  }
}

/* =========================================================
   A LUTA
   ========================================================= */
function proximaPista() {
  let livres = ETAPAS.map((e, i) => i).filter((i) => !BT.usadasP.has(i));
  if (!livres.length) { BT.usadasP.clear(); livres = ETAPAS.map((e, i) => i); }
  const i = sortear(livres);
  BT.usadasP.add(i);
  return ETAPAS[i];
}

function proximoGolpe() {
  let livres = GOLPES.filter((g) => !BT.usadasG.has(g.nome));
  if (!livres.length) { BT.usadasG.clear(); livres = GOLPES.slice(); }
  const g = sortear(livres);
  BT.usadasG.add(g.nome);
  return g;
}

/* espera a resposta do jogador (string) ou o tempo acabar (null) */
function aguardarResposta(ms, sinal) {
  return new Promise((res, rej) => {
    const fim = Date.now() + ms;
    const tick = setInterval(() => {
      const r = Math.max(0, fim - Date.now());
      bt.tempo.style.width = (r / ms * 100) + '%';
      bt.camada.dataset.seg = Math.ceil(r / 1000) + 's';
      bt.camada.textContent = 'CAMADA ' + (7 - BT.hp) + ' · ' + Math.ceil(r / 1000) + 's';
      if (r <= 0) concluir(null);
    }, 100);
    function concluir(v) {
      clearInterval(tick);
      BT.responder = null;
      sinal.removeEventListener('abort', ab);
      res(v);
    }
    function ab() { clearInterval(tick); BT.responder = null; rej(abortErr()); }
    sinal.addEventListener('abort', ab, { once: true });
    BT.responder = concluir;
  });
}

function prepararPainel(tipo, enunciado, nomeGolpe) {
  const golpe = tipo === 'g';
  bt.painel.classList.remove('hidden');
  bt.painel.classList.toggle('golpe', golpe);
  bt.sec.classList.toggle('alerta', golpe);
  bt.tag.innerHTML = golpe
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" class="bt-alert-ico"><path d="M12 2 1 21h22L12 2z" fill="currentColor"/><path d="M12 9v5M12 17v1" stroke="#06080A" stroke-width="2.4" stroke-linecap="round"/></svg>GOLPE DO FIREWALL · ' + nomeGolpe + ' · JAVASCRIPT'
    : 'PISTA INTERCEPTADA';
  // golpes: deixa claro que a resposta é código JavaScript
  bt.enunciado.textContent = golpe ? 'Escreva em JavaScript: ' + enunciado : enunciado;
  bt.prompt.textContent = golpe ? '>' : 'invasor@sys:~$';
  bt.input.value = '';
  bt.input.disabled = false;
  bt.input.placeholder = golpe ? 'digite aqui o código em JavaScript' : 'nome do componente';
  bt.feedback.textContent = '';
  bt.feedback.className = 'bt-feedback';
  bt.tempo.style.width = '100%';
  setTimeout(() => bt.input.focus(), 30);
}

function fecharPainel() {
  bt.input.disabled = true;
  bt.sec.classList.remove('alerta');
}

/* posição (relativa ao palco) do centro do olho */
function posOlho() {
  const s = bt.stage.getBoundingClientRect();
  const r = bt.centro.getBoundingClientRect();
  return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, h: s.height };
}

function fxEl(cls, css) {
  const e = document.createElement('div');
  e.className = cls;
  Object.assign(e.style, css || {});
  bt.fx.appendChild(e);
  return e;
}

function tijolosQueCaem(n) {
  const vivos = bt.tijolos.filter((t) => !t.classList.contains('caido') &&
    Math.hypot(+t.getAttribute('x') + 20 - OLHO.x, +t.getAttribute('y') + 10 - OLHO.y) > 62);
  embaralhar2(vivos).slice(0, n).forEach((t) => {
    t.classList.add('caido');
    BT.caidos.push(t);
  });
}

/* jogador acerta: raio verde (crítico em golpe) */
async function ataqueJogador(critico, s) {
  const o = posOlho();
  const raio = fxEl('bt-raio' + (critico ? ' critico' : ''), { left: o.x + 'px', top: o.y + 'px', height: (o.h - o.y) + 'px' });
  SFX.raio();
  await esperar(260, s);
  bt.boss.classList.add('atingido');
  if (critico) { bt.sec.classList.add('tremor-forte'); SFX.critico(); }
  tijolosQueCaem(critico ? 4 : 2);
  SFX.pedra();
  const num = fxEl('bt-dano', { left: o.x + 'px', top: (o.y - 30) + 'px' });
  num.textContent = '-1 CAMADA';
  if (critico) {
    const c = fxEl('bt-critico', { left: o.x + 'px', top: (o.y - 80) + 'px' });
    c.textContent = 'CRÍTICO!';
  }
  BT.hp = Math.max(0, BT.hp - 1);
  renderVida();
  await esperar(700, s);
  bt.boss.classList.remove('atingido');
  bt.sec.classList.remove('tremor-forte');
  raio.remove();
  await esperar(500, s);
  bt.fx.textContent = '';
}

/* chefe ataca: olho carrega e dispara o feixe vermelho no painel */
async function ataqueChefe(s) {
  bt.boss.classList.add('carregando');
  SFX.carga();
  await esperar(900, s);
  const o = posOlho();
  const feixe = fxEl('bt-feixe', { left: o.x + 'px', top: o.y + 'px', height: (o.h - o.y + 40) + 'px' });
  SFX.feixe();
  bt.sec.classList.add('dano');
  await esperar(500, s);
  bt.boss.classList.remove('carregando');
  addTrace(15);
  await esperar(500, s);
  bt.sec.classList.remove('dano');
  feixe.remove();
}

async function regenerar(s) {
  await falar('Restaurando backup...', s);
  const volta = BT.caidos.splice(-3);
  for (const t of volta) {
    t.classList.remove('caido');
    t.classList.add('regen');
    SFX.pedra();
    await esperar(200, s);
    t.classList.remove('regen');
  }
  BT.hp = Math.min(6, BT.hp + 1);
  BT.fila.unshift('p');            // a camada regenerada volta como pista
  renderVida();
  SFX.vida(BT.hp);
  await esperar(500, s);
}

/* transições de fase (surpresa) */
async function transicaoFase(f, s) {
  if (f === 2) {
    bt.boss.classList.add('furia');
    bt.stage.classList.add('tremendo');
    SFX.rugido();
    await esperar(2000, s);
    setFase(2);
    tijolosQueCaem(3);
    bt.stage.classList.remove('tremendo');
    bt.boss.classList.remove('furia');
    musicaRate(1.06);
    await falar('Chega de brincadeira.', s, true);
  } else {
    bt.sec.classList.add('glitch');
    ruido(0.8, 0.3, 3000);
    await esperar(900, s);
    setFase(3);
    tijolosQueCaem(4);
    musicaRate(1.12);
    bt.sec.classList.remove('glitch');
    await falar('Se eu cair... o sistema inteiro é seu...', s, true);
  }
}

async function rodada(tipo, s) {
  let certo;
  let exemplo = null;
  if (tipo === 'g') {
    const g = proximoGolpe();
    bt.svg.classList.add('bracos-erguidos');
    SFX.rugido();
    await falar('FIREWALL.EXE usou ' + g.nome + '!', s);
    prepararPainel('g', g.enunciado, g.nome);
    if (DEBUG) console.info('[debug] exemplo:', g.exemplo);
    const v = await aguardarResposta(TEMPO_GOLPE, s);
    certo = v != null && g.re.test(v);
    exemplo = g.exemplo;
    bt.svg.classList.remove('bracos-erguidos');
  } else {
    const et = proximaPista();
    bt.fala.textContent = '';
    prepararPainel('p', et.pista);
    if (DEBUG) console.info('[debug] resposta:', et.resposta);
    const v = await aguardarResposta(TEMPO_RESPOSTA, s);
    certo = v != null && normalizar(v) === et.resposta;
  }
  fecharPainel();

  const st = state.stats;
  if (st) {
    st.batalha = st.batalha || { acertos: 0, erros: 0 };
    st.batalha[certo ? 'acertos' : 'erros']++;
  }

  if (certo) {
    bt.feedback.textContent = tipo === 'g' ? 'CONTRA-ATAQUE!' : 'CAMADA ROMPIDA';
    bt.feedback.className = 'bt-feedback ok';
    // última camada: o golpe final (câmera lenta) é do final.js
    if (BT.hp === 1) { BT.hp = 0; renderVida(); return; }
    await ataqueJogador(tipo === 'g', s);
    if (BT.hp === 0) return;
    if (BT.hp <= 4 && BT.fase < 2) await transicaoFase(2, s);
    else if (BT.hp <= 2 && BT.fase < 3) await transicaoFase(3, s);
    else await falar(sortear(FALAS_DOR), s);
  } else {
    bt.feedback.textContent = exemplo ? 'Exemplo de resposta certa:  ' + exemplo : 'Tempo esgotado ou resposta errada.';
    bt.feedback.className = 'bt-feedback fail';
    await ataqueChefe(s);
    if (exemplo) await esperar(1200, s);   // mostra o exemplo por ~2 s no total
    await falar(sortear(FALAS_DEBOCHE), s);
    BT.errosBt++;
    if (BT.errosBt % 2 === 0 && BT.hp < 6) await regenerar(s);
  }
}

/* O chefe zera o trace no começo da luta e avisa quanto o jogador tinha.
   Roda uma vez por batalha: na abertura, ou no início da luta se a abertura foi pulada. */
function falaTrace(pct) {
  if (pct >= 70) return 'Você chegou aqui com ' + pct + '% de rastro. Quase te peguei. Reiniciei em 0%... para te dar alguma chance.';
  if (pct >= 30) return 'Você estava com ' + pct + '%. Reiniciei em 0% para te dar alguma chance. Vai precisar.';
  return 'Só ' + pct + '% de rastro? Mesmo assim, reiniciei em 0%. Quero uma luta justa antes de te apagar.';
}

async function zerarTrace(s) {
  if (BT.traceZerado) return;
  BT.traceZerado = true;
  const pct = BT.traceAntes;
  state.trace = 0;
  renderTrace();
  [880, 660, 440, 220].forEach((f, i) => bipe(f, 0.08, 'square', 0.04, i * 0.07));
  logLine('[ INFO ]', 'info', 'FIREWALL.EXE zerou o trace: ' + pct + '% → 0%');
  await falar(falaTrace(pct), s, true);
}

async function luta(s) {
  state.ato = 3;              // fora do desktop: o trace passivo segue a +1%/10s
  state.rodando = true;
  startTrace();
  renderTrace();
  BT.fila = embaralhar2(['p', 'p', 'p', 'p', 'g', 'g']);
  if (BT.irParaFinal) { BT.irParaFinal = false; BT.hp = 0; }   // atalho ?debug=1
  else await zerarTrace(s);                                     // se a abertura foi pulada
  while (BT.hp > 0) {
    const tipo = BT.fila.shift() || 'p';
    await rodada(tipo, s);
  }
  await derrota(s);
}

/* última camada: o final cinematográfico (final.js) assume daqui */
async function derrota(s) {
  state.rodando = false;
  stopTimer();                                            // o tempo da partida para no último golpe
  state.segundos = Math.floor((Date.now() - state.inicio) / 1000);
  state.tempoFinal = true;
  bt.dialogo.classList.remove('on');
  bt.painel.classList.add('hidden');
  if (typeof window.finalCinematico === 'function') {
    await window.finalCinematico(s);
    return;
  }
  tijolosQueCaem(99);
  bt.chamas.forEach((c) => c.classList.add('apagada'));
  bt.olho.classList.add('fechado');
  SFX.rugido();
  musicaParar(1.2);
  BT.musicaAtiva = false;
  await esperar(2200, s);
  encerrar();
  vitoria();
}

/* =========================================================
   INÍCIO / FIM / LIMPEZA
   ========================================================= */
function resetVisual() {
  bt.boss.dataset.fase = '1';
  bt.sobr.setAttribute('d', SOBR.reta);
  bt.fx.textContent = '';
  bt.fala.textContent = '';
  bt.dialogo.classList.remove('on');
  bt.painel.classList.add('hidden');
  bt.svg.classList.remove('bracos-erguidos');
  bt.sec.classList.remove('alerta', 'dano', 'glitch', 'tremor-forte', 'intro');
  bt.boss.classList.remove('atingido', 'carregando', 'furia');
  bt.tijolos.forEach((t) => { t.classList.remove('caido', 'regen'); t.classList.add('oculto'); });
  bt.bracos.forEach((b) => b.classList.add('desligado'));
  bt.chamas.forEach((c) => c.classList.add('apagada'));
  bt.olho.classList.add('fechado');
  bt.olho.classList.remove('fresta', 'piscando');
  bt.iris.removeAttribute('transform');
  BT.hp = 0;
  renderVida();
}

/* desfaz o "desmonte" do desktop */
function limparDesktop() {
  document.querySelectorAll('.bt-metade').forEach((m) => m.remove());
  document.querySelectorAll('#dk-windows .rw-win').forEach((w) => { w.style.visibility = ''; });
  const scr = $('screen-desktop');
  scr.classList.remove('bt-fade-out');
  const tb = scr.querySelector('.taskbar');
  if (tb) tb.classList.remove('bt-cai');
  document.querySelectorAll('.dk-icon').forEach((ic) => { ic.style.transition = ''; ic.style.transform = ''; });
}

function encerrar() {
  if (BT.ctl) BT.ctl.abort();
  cancelAnimationFrame(BT.raf);
  BT.responder = null;
  BT.seguir = false;
  if (pularBtn) { pularBtn.remove(); pularBtn = null; }
  if (cursorFalso) { cursorFalso.remove(); cursorFalso = null; }
  document.body.classList.remove('bt-congelado');
  limparDesktop();
}

/* game over, reboot ou nova partida: para tudo (música com fade-out rápido) */
window.batalhaParar = function () {
  if (typeof window.finalParar === 'function') window.finalParar();
  if (!BT.ctl) return;
  encerrar();
  BT.musicaAtiva = false;
  musicaParar(0.35);
};

window.batalhaPreload = musicaPreload;

/* liga/desliga o som no meio da batalha */
window.batalhaSom = function (ligado) {
  if (!ligado) musicaParar(0.15);
  else if (BT.musicaAtiva) musicaTocar();
};

window.batalhaIniciar = async function () {
  window.batalhaParar();
  BT.ctl = new AbortController();
  BT.cine = new AbortController();
  const total = BT.ctl.signal;
  total.addEventListener('abort', () => BT.cine.abort(), { once: true });
  BT.fase = 1;
  BT.errosBt = 0;
  BT.traceZerado = false;
  BT.traceAntes = Math.round(state.trace);   // trace com que o jogador chegou (a abertura não sobe o trace)
  BT.caidos = [];
  BT.usadasP.clear();
  BT.usadasG.clear();
  MUS.rate = 1;
  resetVisual();
  loopPupila();
  agendarPiscar(total);
  try {
    try {
      await abertura(BT.cine.signal);
    } catch (e) {
      if (!ehAbort(e) || total.aborted) throw e;   // "pular ›" cai aqui
    }
    estadoPosAbertura();
    await luta(total);
  } catch (e) {
    if (!ehAbort(e)) console.error(e);
  }
};

/* ---------- Atalho de teste: ?debug=1 → botão que pula direto para a batalha ---------- */
function debugIrParaBatalha() {
  if (!$('screen-boot').classList.contains('active')) { window.batalhaParar(); runBoot(); }
  skipBoot();
  startGame();
  ETAPAS.forEach((e, i) => state.online.add(i));
  state.etapa = 6;
  loadingTimers.forEach(clearTimeout);
  iniciarAto2();
  updateStats();
  renderModules();
  window.dkOtimizado = true;
  $('screen-desktop').classList.add('optimized');
  dkBalao('Sistema otimizado', 'Todos os 16 módulos estão online. 4 núcleos ativos. Firewall desativado.', 4000);
  if (typeof window.defenderStop === 'function') window.defenderStop();
  state.rodando = false;
  window.batalhaIniciar();
}

montarTela();
renderSom();

if (DEBUG) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-small bt-debug';
  b.textContent = '[debug] ir para a batalha';
  b.addEventListener('click', (e) => { e.stopPropagation(); debugIrParaBatalha(); });
  document.body.appendChild(b);
  window.debugBatalha = debugIrParaBatalha;
}
