'use strict';

/* =========================================================
   ROOT ACCESS — circuitos.js
   LogicNão: simulador de portas lógicas com circuitos prontos.
   O jogador só liga/desliga as entradas; o LED acende quando a
   saída vale 1. Cada circuito é descrito como DADOS (CIRCUITOS):
   para criar outro, basta acrescentar um objeto no array.

   Formato de um circuito:
     nome, dica,
     entradas: [{ id, y }]                      (x fixo à esquerda)
     portas:   [{ id, tipo, x, y, ent: [ids] }] (em ordem de cálculo)
     saida:    { de: id, y }                    (LED à direita)
     recompensa: function ()                    (roda só uma vez)
   Coordenadas no espaço do SVG (LARG × ALT). A porta ocupa 60×40
   a partir de (x, y); entradas em y+10 e y+30 (NOT: y+20); saída em y+20.
   Usa: el, coletar, a2, logLine, dkBalao, bipe, somAcerto, renderTrace,
   state (script.js / apps.js / desktop.js).
   ========================================================= */

const LARG = 640;
const ALT = 360;
const X_ENTRADA = 40;
const X_LED = 592;

/* ---------- Lógica e desenho de cada tipo de porta ---------- */
const PORTAS = {
  AND:  { f: (a, b) => a & b,        nome: 'AND' },
  OR:   { f: (a, b) => a | b,        nome: 'OR' },
  NOT:  { f: (a) => a ^ 1,           nome: 'NOT' },
  XOR:  { f: (a, b) => a ^ b,        nome: 'XOR' },
  NAND: { f: (a, b) => (a & b) ^ 1,  nome: 'NAND' },
  NOR:  { f: (a, b) => (a | b) ^ 1,  nome: 'NOR' }
};

/* ponto onde o fio encosta na entrada k da porta */
function pinoEntrada(p, k) {
  const curva = p.tipo === 'OR' || p.tipo === 'NOR' || p.tipo === 'XOR';
  const y = p.tipo === 'NOT' ? p.y + 20 : p.y + (k === 0 ? 10 : 30);
  return { x: p.x + (curva ? 6 : 0), y };
}
const pinoSaida = (p) => ({ x: p.x + 60, y: p.y + 20 });

/* SVG (string) do corpo da porta em traço preto */
function desenhoPorta(p) {
  const { x, y } = p;
  const bolha = (cx) => '<circle cx="' + cx + '" cy="' + (y + 20) + '" r="5"/>';
  const ou = 'M' + x + ' ' + y + ' Q' + (x + 16) + ' ' + (y + 20) + ' ' + x + ' ' + (y + 40) +
    ' Q' + (x + 36) + ' ' + (y + 40) + ' ' + (x + 50) + ' ' + (y + 20) +
    ' Q' + (x + 36) + ' ' + y + ' ' + x + ' ' + y + 'Z';
  switch (p.tipo) {
    case 'AND':
      return '<path d="M' + x + ' ' + y + 'h30a20 20 0 0 1 0 40h-30z"/><path d="M' + (x + 50) + ' ' + (y + 20) + 'h10"/>';
    case 'NAND':
      return '<path d="M' + x + ' ' + y + 'h30a20 20 0 0 1 0 40h-30z"/>' + bolha(x + 55);
    case 'OR':
      return '<path d="' + ou + '"/><path d="M' + (x + 50) + ' ' + (y + 20) + 'h10"/>';
    case 'NOR':
      return '<path d="' + ou + '"/>' + bolha(x + 55);
    case 'XOR':
      return '<path d="' + ou + '"/><path d="M' + (x - 6) + ' ' + y + ' Q' + (x + 10) + ' ' + (y + 20) + ' ' + (x - 6) + ' ' + (y + 40) + '"/>' +
        '<path d="M' + (x + 50) + ' ' + (y + 20) + 'h10"/>';
    case 'NOT':
      return '<path d="M' + x + ' ' + (y + 4) + 'L' + (x + 44) + ' ' + (y + 20) + 'L' + x + ' ' + (y + 36) + 'z"/>' + bolha(x + 49) +
        '<path d="M' + (x + 54) + ' ' + (y + 20) + 'h6"/>';
  }
  return '';
}

/* ---------- Os circuitos (dados) ---------- */
const CIRCUITOS = [
  {
    nome: 'Circuito 1',
    expr: 'LED = (A OR B) AND (NOT C)',
    entradas: [{ id: 'A', y: 70 }, { id: 'B', y: 140 }, { id: 'C', y: 250 }],
    portas: [
      { id: 'g1', tipo: 'OR',  x: 200, y: 85,  ent: ['A', 'B'] },
      { id: 'g2', tipo: 'NOT', x: 200, y: 230, ent: ['C'] },
      { id: 'g3', tipo: 'AND', x: 390, y: 150, ent: ['g1', 'g2'] }
    ],
    saida: { de: 'g3' },
    recompensa: () => {
      logLine('[  OK  ]', 'ok', 'LogicNão: circuito de cálculo estabilizado — calc_unit.exe voltou a responder');
      dkBalao('Circuito estabilizado', 'calc_unit.exe voltou a responder no Gerenciador de Tarefas.', 5000);
      coletar('ULA');
    }
  },
  {
    nome: 'Circuito 2',
    expr: 'LED = (A XOR B) AND (C OR D) AND NOT (A AND D)',
    entradas: [{ id: 'A', y: 50 }, { id: 'B', y: 110 }, { id: 'C', y: 190 }, { id: 'D', y: 260 }],
    portas: [
      { id: 'g1', tipo: 'XOR', x: 170, y: 60,  ent: ['A', 'B'] },
      { id: 'g2', tipo: 'OR',  x: 170, y: 200, ent: ['C', 'D'] },
      { id: 'g3', tipo: 'AND', x: 170, y: 290, ent: ['A', 'D'] },
      { id: 'g4', tipo: 'AND', x: 310, y: 120, ent: ['g1', 'g2'] },
      { id: 'g5', tipo: 'NOT', x: 310, y: 290, ent: ['g3'] },
      { id: 'g6', tipo: 'AND', x: 450, y: 200, ent: ['g4', 'g5'] }
    ],
    saida: { de: 'g6' },
    recompensa: () => {
      a2.bruteGratis = (a2.bruteGratis || 0) + 1;
      if (typeof window.appsRenderPacotes === 'function') window.appsRenderPacotes();
      logLine('[  OK  ]', 'ok', 'LogicNão: +1 BRUTE FORCE grátis (não aumenta o trace)');
      dkBalao('Circuito estabilizado', 'Você ganhou 1 BRUTE FORCE grátis no Terminal: o trace não sobe ao usá-lo.', 5000);
    }
  },
  {
    nome: 'Circuito 3',
    expr: 'LED = NAND(A, B) AND (C XOR D) AND NOR(D, E)',
    entradas: [{ id: 'A', y: 40 }, { id: 'B', y: 100 }, { id: 'C', y: 170 }, { id: 'D', y: 230 }, { id: 'E', y: 300 }],
    portas: [
      { id: 'g1', tipo: 'NAND', x: 170, y: 50,  ent: ['A', 'B'] },
      { id: 'g2', tipo: 'XOR',  x: 170, y: 170, ent: ['C', 'D'] },
      { id: 'g3', tipo: 'NOR',  x: 170, y: 270, ent: ['D', 'E'] },
      { id: 'g4', tipo: 'AND',  x: 320, y: 110, ent: ['g1', 'g2'] },
      { id: 'g5', tipo: 'AND',  x: 460, y: 190, ent: ['g4', 'g3'] }
    ],
    saida: { de: 'g5' },
    recompensa: () => {
      const antes = state.trace;
      state.trace = Math.max(0, state.trace - 40);
      renderTrace();
      logLine('[  OK  ]', 'ok', 'LogicNão: rastreamento despistado — trace ' + Math.round(antes) + '% → ' + Math.round(state.trace) + '%');
      dkBalao('Circuito estabilizado', 'Rastreamento despistado: trace −40%.', 5000);
    }
  }
];

/* ---------- Estado (por partida) ---------- */
const lb = { atual: 0, resolvidos: [], valores: [], ajuda: false };

function resetLogicNão() {
  lb.atual = 0;
  lb.ajuda = false;
  lb.resolvidos = CIRCUITOS.map(() => false);
  lb.valores = CIRCUITOS.map((c) => Object.fromEntries(c.entradas.map((e) => [e.id, 0])));   // tudo começa em 0
  a2.bruteGratis = 0;
}

/* calcula todos os sinais do circuito (entradas + saída de cada porta) */
function calcular(c, valores) {
  const sinal = Object.assign({}, valores);
  c.portas.forEach((p) => { sinal[p.id] = PORTAS[p.tipo].f(...p.ent.map((id) => sinal[id])); });
  sinal.LED = sinal[c.saida.de];
  return sinal;
}

const liberado = (k) => k === 0 || lb.resolvidos[k - 1];
window.lbResolvido = (k) => !!lb.resolvidos[k];

/* posição de onde sai o sinal de uma entrada ou porta */
function origem(c, id) {
  const e = c.entradas.find((x) => x.id === id);
  if (e) return { x: X_ENTRADA + 24, y: e.y };
  return pinoSaida(c.portas.find((p) => p.id === id));
}
const yLed = (c) => pinoSaida(c.portas.find((p) => p.id === c.saida.de)).y;

/* fio em "L": horizontal, vertical perto do destino, horizontal */
function caminhoFio(a, b, k) {
  if (a.y === b.y) return 'M' + a.x + ' ' + a.y + 'H' + b.x;
  const meio = b.x - 16 - 8 * k;
  return 'M' + a.x + ' ' + a.y + 'H' + meio + 'V' + b.y + 'H' + b.x;
}

/* ---------- Tela do app ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const CADEADO = '<svg viewBox="0 0 16 16" aria-hidden="true" class="lb-lock"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

function renderLogicNão(body) {
  body.textContent = '';
  body.classList.add('lb');
  const c = CIRCUITOS[lb.atual];

  // abas Circuito 1, 2, 3...
  const tabs = el('div', 'os-tabs lb-tabs');
  tabs.setAttribute('role', 'tablist');
  CIRCUITOS.forEach((circ, k) => {
    const b = el('button', 'os-tab' + (k === lb.atual ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(k === lb.atual));
    const ok = liberado(k);
    b.innerHTML = ok ? '' : CADEADO;
    b.appendChild(document.createTextNode(circ.nome + (lb.resolvidos[k] ? ' ✓' : '')));
    if (!ok) {
      b.classList.add('locked');
      b.setAttribute('aria-disabled', 'true');
      b.title = 'Resolva o ' + CIRCUITOS[k - 1].nome + ' para liberar';
    }
    b.addEventListener('click', () => {
      if (!liberado(k)) { somErro(); dkBalao('LogicNão', 'Bloqueado: resolva o ' + CIRCUITOS[k - 1].nome + ' primeiro.'); return; }
      lb.atual = k;
      renderLogicNão(body);
    });
    tabs.appendChild(b);
  });

  const topo = el('div', 'lb-top');
  const expr = el('code', 'lb-expr', c.expr);
  const btnAjuda = el('button', 'os-btn', lb.ajuda ? 'Fechar ajuda' : 'Ajuda');
  btnAjuda.type = 'button';
  btnAjuda.setAttribute('aria-expanded', String(lb.ajuda));
  btnAjuda.addEventListener('click', () => { lb.ajuda = !lb.ajuda; renderLogicNão(body); });
  topo.append(expr, btnAjuda);

  // placa: SVG (fios, portas, LED) + botões HTML das entradas por cima
  const placa = el('div', 'lb-board');
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + LARG + ' ' + ALT);
  svg.setAttribute('class', 'lb-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', c.nome + ': ' + c.expr);
  placa.appendChild(svg);

  const status = el('p', 'lb-status');
  status.setAttribute('aria-live', 'polite');

  function desenhar(piscar) {
    const s = calcular(c, lb.valores[lb.atual]);
    let html = '';
    // fios
    c.portas.forEach((p) => {
      p.ent.forEach((id, k) => {
        html += '<path class="lb-wire' + (s[id] ? ' on' : '') + '" d="' + caminhoFio(origem(c, id), pinoEntrada(p, k), k) + '"/>';
      });
    });
    const ledY = yLed(c);
    html += '<path class="lb-wire' + (s.LED ? ' on' : '') + '" d="' + caminhoFio(pinoSaida(c.portas.find((p) => p.id === c.saida.de)), { x: X_LED - 14, y: ledY }, 0) + '"/>';
    // portas
    c.portas.forEach((p) => {
      html += '<g class="lb-gate">' + desenhoPorta(p) + '</g>';
      html += '<text class="lb-gate-name" x="' + (p.x + 28) + '" y="' + (p.y + 56) + '">' + PORTAS[p.tipo].nome + '</text>';
    });
    // LED
    html += '<g class="lb-led' + (s.LED ? ' on' : '') + (piscar ? ' blink' : '') + '">' +
      '<circle class="lb-led-glow" cx="' + X_LED + '" cy="' + ledY + '" r="22"/>' +
      '<circle class="lb-led-body" cx="' + X_LED + '" cy="' + ledY + '" r="14"/>' +
      '<text class="lb-gate-name" x="' + X_LED + '" y="' + (ledY + 34) + '">LED</text></g>';
    svg.innerHTML = html;

    placa.querySelectorAll('.lb-switch').forEach((b) => {
      const v = lb.valores[lb.atual][b.dataset.id];
      b.classList.toggle('on', !!v);
      b.querySelector('.lb-sw-val').textContent = v;
      b.setAttribute('aria-pressed', String(!!v));
    });

    if (lb.resolvidos[lb.atual]) {
      status.textContent = s.LED ? 'Circuito estabilizado.' : 'Circuito já estabilizado — fique à vontade para testar as entradas.';
      status.className = 'lb-status ok';
    } else {
      status.textContent = 'Ligue e desligue as entradas até o LED acender.';
      status.className = 'lb-status';
    }
    return s.LED;
  }

  c.entradas.forEach((e) => {
    const b = el('button', 'lb-switch');
    b.type = 'button';
    b.dataset.id = e.id;
    b.style.left = (X_ENTRADA / LARG * 100) + '%';
    b.style.top = (e.y / ALT * 100) + '%';
    b.setAttribute('aria-label', 'Entrada ' + e.id);
    b.append(el('span', 'lb-sw-name', e.id), el('span', 'lb-sw-val', '0'));
    b.addEventListener('click', () => {
      if (!state.rodando) return;
      const vals = lb.valores[lb.atual];
      vals[e.id] ^= 1;
      bipe(vals[e.id] ? 1100 : 700, 0.03, 'square', 0.03);
      const aceso = desenhar(false);
      if (aceso && !lb.resolvidos[lb.atual]) resolver();
    });
    placa.appendChild(b);
  });

  function resolver() {
    const k = lb.atual;
    lb.resolvidos[k] = true;
    somAcerto();
    desenhar(true);   // LED pisca 3 vezes
    status.textContent = 'Circuito estabilizado.';
    status.className = 'lb-status ok';
    CIRCUITOS[k].recompensa();
    // atualiza as abas (libera a próxima) sem redesenhar a placa
    const abas = tabs.querySelectorAll('.os-tab');
    abas[k].lastChild.textContent = CIRCUITOS[k].nome + ' ✓';
    if (abas[k + 1]) {
      abas[k + 1].classList.remove('locked');
      abas[k + 1].removeAttribute('aria-disabled');
      abas[k + 1].title = '';
      const cad = abas[k + 1].querySelector('.lb-lock');
      if (cad) cad.remove();
    }
  }

  body.append(tabs, topo, placa, status);
  if (lb.ajuda) body.appendChild(tabelasVerdade(c));
  desenhar(false);
}

/* tabela verdade de cada tipo de porta usado no circuito aberto */
function tabelasVerdade(c) {
  const box = el('div', 'lb-help');
  const tipos = [...new Set(c.portas.map((p) => p.tipo))];
  tipos.forEach((t) => {
    const tbl = el('table', 'lb-tt');
    const cap = el('caption', null, t);
    const head = el('tr');
    const um = t === 'NOT';
    (um ? ['A', 'S'] : ['A', 'B', 'S']).forEach((h) => head.appendChild(el('th', null, h)));
    tbl.append(cap, head);
    const linhas = um ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    linhas.forEach((ent) => {
      const tr = el('tr');
      const s = PORTAS[t].f(...ent);
      ent.forEach((v) => tr.appendChild(el('td', null, String(v))));
      tr.appendChild(el('td', s ? 'one' : null, String(s)));
      tbl.appendChild(tr);
    });
    box.appendChild(tbl);
  });
  return box;
}

appById('logicbox').render = renderLogicNão;

/* reset a cada nova invasão */
const resetAntesLogicNão = window.appsReset;
window.appsReset = function () {
  resetAntesLogicNão();
  resetLogicNão();
};

resetLogicNão();
