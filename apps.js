'use strict';

/* =========================================================
   ROOT ACCESS — apps.js
   Conteúdo dos apps do ROOT/OS (Ato 2):
   - Terminal root.exe: pacotes coletados, respostas em qualquer
     ordem, BRUTE FORCE e SNIFF no pacote selecionado.
   - Apps com as pistas: Painel de Controle, Gerenciador de
     Tarefas, Bloco de Notas, Internet, Meu Computador, E-mail.
   Usa do script.js: $, state, ETAPAS, bipe, sons, logLine,
   normalizar, executarComando, addTrace, updateStats,
   renderModules, vitoria, pad2, clock.
   Usa do desktop.js: APPS, appById, dkBalao.
   ========================================================= */

/* ---------- Utilidades de DOM ---------- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const idxDe = (resposta) => ETAPAS.findIndex((e) => e.resposta === resposta);
const ATO2_IDX = ETAPAS.map((e, i) => (e.ato === 2 ? i : -1)).filter((i) => i >= 0);
const pkt = (i) => 'PKT#' + pad2(i + 1);

/* ---------- Estado do Ato 2 ---------- */
const a2 = {
  coletados: new Map(),   // índice → horário em que foi coletado
  sel: null,              // índice do pacote selecionado no Terminal
  revelados: {},          // índice → posições reveladas pelo BRUTE FORCE
  sniffs: new Set(),      // índices que já usaram SNIFF
  vistos: new Set()       // gatilhos de pista já disparados
};

function somPacote() {
  bipe(1568, 0.05, 'square', 0.04);
  bipe(2093, 0.07, 'square', 0.04, 0.07);
}

/* Coleta a pista do módulo (uma vez só): bipe + balão + lista do Terminal */
function coletar(resposta) {
  const i = idxDe(resposta);
  if (i < 0 || a2.coletados.has(i) || !state.rodando) return;
  a2.coletados.set(i, clock());
  somPacote();
  dkBalao('Pacote interceptado: ' + pkt(i), ETAPAS[i].local + ' — abra o Terminal (root.exe) para usar.');
  logLine('[ INFO ]', 'info', 'Pacote ' + pkt(i) + ' interceptado em ' + ETAPAS[i].local);
  renderPacotes();
}

/* =========================================================
   TERMINAL (root.exe)
   O DOM é criado uma vez e reaproveitado: fechar a janela não
   apaga o log nem a lista.
   ========================================================= */
const t2 = {};

function montarTerminal() {
  const root = el('div', 't2');

  const side = el('aside', 't2-pkts');
  const head = el('div', 't2-pkts-head');
  head.append(el('span', null, 'PACOTES COLETADOS'));
  t2.count = el('span', 't2-count', '0/10');
  head.appendChild(t2.count);
  t2.list = el('div', 't2-list');
  side.append(head, t2.list);

  const main = el('div', 't2-main');
  t2.log = el('div', 'log t2-log');
  t2.log.setAttribute('aria-live', 'polite');
  window.t2LogEl = t2.log;

  t2.sel = el('div', 't2-sel');
  t2.sniff = el('p', 'sniff-line hidden');
  t2.slots = el('div', 'slots t2-slots');

  t2.form = el('form', 'term');
  t2.form.autocomplete = 'off';
  const prompt = el('label', 'prompt', 'root@sys:~$');
  prompt.htmlFor = 't2-input';
  const field = el('div', 'term-field');
  t2.input = el('input', 'term-input');
  t2.input.id = 't2-input';
  t2.input.type = 'text';
  t2.input.spellcheck = false;
  t2.input.setAttribute('autocapitalize', 'characters');
  t2.input.setAttribute('aria-label', 'Digite a resposta ou um comando');
  const cur = el('span', 'term-cursor', '█');
  cur.setAttribute('aria-hidden', 'true');
  field.append(t2.input, cur);
  t2.form.append(prompt, field);

  const actions = el('div', 'actions');
  t2.scan = el('button', 'btn btn-primary act', '> EXECUTAR SCAN');
  t2.brute = el('button', 'btn btn-amber act', 'BRUTE FORCE · +10%');
  t2.brute.appendChild(el('small', null, 'revela uma letra do pacote'));
  t2.sniffBtn = el('button', 'btn btn-cyan act', 'SNIFF · +5%');
  t2.sniffBtn.appendChild(el('small', null, 'dica extra do pacote'));
  [t2.scan, t2.brute, t2.sniffBtn].forEach((b) => { b.type = 'button'; actions.appendChild(b); });

  main.append(t2.log, t2.sel, t2.sniff, t2.slots, t2.form, actions);
  root.append(side, main);
  t2.root = root;

  t2.form.addEventListener('submit', (e) => { e.preventDefault(); scan2(); });
  t2.scan.addEventListener('click', scan2);
  t2.brute.addEventListener('click', () => window.t2Brute());
  t2.sniffBtn.addEventListener('click', () => window.t2Sniff());
  t2.input.addEventListener('input', () => {
    somTecla();
    t2.input.style.width = Math.max(1, t2.input.value.length + 1) + 'ch';
    renderSlots2();
  });
  t2.log.addEventListener('click', () => t2.input.focus());
}

function iniciarLogTerminal() {
  // escreve direto no log do root.exe (logLine depende do ato atual)
  t2.log.textContent = '';
  [
    ['[  OK  ]', 'ok', 'root.exe conectado ao ROOT/OS 2002 (modo de segurança)'],
    ['[ INFO ]', 'info', 'Explore o sistema: cada pista encontrada vira um pacote na lista ao lado.'],
    ['[ INFO ]', 'info', 'Digite qualquer componente pendente, em qualquer ordem, e pressione Enter.']
  ].forEach(([tag, cls, txt]) => {
    const row = el('div');
    row.append(el('span', cls, tag), document.createTextNode(' ' + txt));
    t2.log.appendChild(row);
  });
}

function renderPacotes() {
  if (!t2.list) return;
  t2.list.textContent = '';
  let n = 0;
  ATO2_IDX.forEach((i) => {
    const et = ETAPAS[i];
    const achado = a2.coletados.has(i);
    const online = state.online.has(i);
    if (achado) n++;
    const b = el('button', 't2-pkt');
    b.type = 'button';
    if (!achado) {
      b.classList.add('missing');
      b.disabled = true;
      b.textContent = 'PKT#?? — não encontrado';
    } else {
      const top = el('span', 't2-pkt-top');
      top.append(el('strong', null, pkt(i)), el('span', 't2-pkt-loc', et.local));
      if (online) top.appendChild(el('span', 't2-pkt-on', 'ONLINE'));
      b.append(top, el('span', 't2-pkt-clue', et.pista));
      if (online) { b.classList.add('online'); b.disabled = true; }
      if (a2.sel === i) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
      b.addEventListener('click', () => selecionar(i));
    }
    t2.list.appendChild(b);
  });
  t2.count.textContent = n + '/10';
  renderSelecao();
}

function selecionar(i) {
  a2.sel = a2.sel === i ? null : i;
  bipe(900, 0.03, 'square', 0.03);
  renderPacotes();
  t2.input.focus();
}

function renderSelecao() {
  const i = a2.sel;
  if (i == null) {
    t2.sel.textContent = 'Nenhum pacote selecionado — clique num pacote coletado para usar BRUTE FORCE e SNIFF.';
    t2.sel.classList.remove('on');
    t2.sniff.classList.add('hidden');
    t2.brute.disabled = true;
    t2.sniffBtn.disabled = true;
  } else {
    t2.sel.textContent = pkt(i) + ' selecionado · ' + ETAPAS[i].pista;
    t2.sel.classList.add('on');
    const usou = a2.sniffs.has(i);
    t2.sniff.textContent = usou ? '> SNIFF: ' + ETAPAS[i].sniff : '';
    t2.sniff.classList.toggle('hidden', !usou);
    t2.sniffBtn.disabled = usou;
    t2.brute.disabled = faltando(i).length <= 1;
  }
  renderSlots2();
}

function faltando(i) {
  const rev = a2.revelados[i] || [];
  const out = [];
  for (let k = 0; k < ETAPAS[i].resposta.length; k++) if (!rev.includes(k)) out.push(k);
  return out;
}

/* casinhas: só aparecem com pacote selecionado (mostram o tamanho da palavra) */
function renderSlots2() {
  const box = t2.slots;
  box.textContent = '';
  const i = a2.sel;
  if (i == null) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const resp = ETAPAS[i].resposta;
  const rev = a2.revelados[i] || [];
  const typed = normalizar(t2.input.value);
  for (let k = 0; k < resp.length; k++) {
    const s = el('div', 'slot');
    if (typed[k]) { s.textContent = typed[k]; s.classList.add('filled'); }
    else if (rev.includes(k)) { s.textContent = resp[k]; s.classList.add('revealed'); }
    box.appendChild(s);
  }
  box.setAttribute('aria-label', 'Resposta do ' + pkt(i) + ' com ' + resp.length + ' letras');
}

window.t2Brute = function () {
  const i = a2.sel;
  if (!state.rodando) return;
  if (i == null || state.online.has(i)) {
    logLine('[ INFO ]', 'info', 'BRUTE FORCE: selecione um pacote coletado na lista.');
    return;
  }
  const f = faltando(i);
  if (f.length <= 1) {
    logLine('[ INFO ]', 'info', 'BRUTE FORCE recusado: a última letra você precisa digitar.');
    return;
  }
  const k = f[Math.floor(Math.random() * f.length)];
  (a2.revelados[i] = a2.revelados[i] || []).push(k);
  state.dicas++;
  updateStats();
  logLine('[ WARN ]', 'warn', 'BRUTE FORCE ' + pkt(i) + ': posição ' + (k + 1) + ' = "' + ETAPAS[i].resposta[k] + '" — trace +10%');
  renderSelecao();
  addTrace(10);
  if (state.rodando) t2.input.focus();
};

window.t2Sniff = function () {
  const i = a2.sel;
  if (!state.rodando) return;
  if (i == null || state.online.has(i)) {
    logLine('[ INFO ]', 'info', 'SNIFF: selecione um pacote coletado na lista.');
    return;
  }
  if (a2.sniffs.has(i)) {
    logLine('[ INFO ]', 'info', 'SNIFF já usado no ' + pkt(i) + '.');
    return;
  }
  a2.sniffs.add(i);
  state.dicas++;
  updateStats();
  logLine('[ WARN ]', 'warn', 'SNIFF ' + pkt(i) + ': pacote extra capturado — trace +5%');
  renderSelecao();
  addTrace(5);
  if (state.rodando) t2.input.focus();
};

function scan2() {
  if (!state.rodando) return;
  const bruto = t2.input.value.trim();
  if (!bruto) { t2.input.focus(); return; }
  t2.input.value = '';
  t2.input.style.width = '1ch';

  if (executarComando(bruto)) {
    if (state.rodando) { renderSlots2(); t2.input.focus(); }
    return;
  }

  const chave = normalizar(bruto);
  const i = ATO2_IDX.find((k) => !state.online.has(k) && ETAPAS[k].resposta === chave);
  if (i != null) acertou2(i);
  else errou2(bruto);
  if (state.rodando) t2.input.focus();
}

function acertou2(i) {
  state.online.add(i);
  logLine('[  OK  ]', 'ok', ETAPAS[i].logOk);
  somAcerto();
  if (a2.sel === i) a2.sel = null;
  updateStats();
  renderModules();
  renderPacotes();
  if (typeof window.appsOnline === 'function') window.appsOnline(i);

  if (state.online.size >= ETAPAS.length) {
    // etapa 6 troca isto pelo "Sistema otimizado" + glitch
    setTimeout(vitoria, 900);
    state.rodando = false;
  }
}

function errou2(bruto) {
  state.erros++;
  somErro();
  updateStats();
  logLine('[ FAIL ]', 'fail', 'chave "' + bruto.toUpperCase() + '" rejeitada — nenhum módulo pendente corresponde — trace +10%');
  const s = t2.slots;
  s.classList.remove('error');
  void s.offsetWidth;
  s.classList.add('error');
  setTimeout(() => s.classList.remove('error'), 450);
  addTrace(10);
}

/* =========================================================
   APPS COM PISTAS
   ========================================================= */

/* abas simples reaproveitadas pelos apps */
function abas(body, lista, aoTrocar) {
  const bar = el('div', 'os-tabs');
  bar.setAttribute('role', 'tablist');
  const area = el('div', 'os-tabpanel');
  const botoes = lista.map((nome, k) => {
    const b = el('button', 'os-tab', nome);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => trocar(k));
    bar.appendChild(b);
    return b;
  });
  function trocar(k) {
    botoes.forEach((b, j) => {
      b.classList.toggle('on', j === k);
      b.setAttribute('aria-selected', String(j === k));
    });
    area.textContent = '';
    aoTrocar(k, area);
  }
  body.append(bar, area);
  trocar(0);
  return trocar;
}

function caixa(titulo, linhas, alerta) {
  const box = el('div', 'os-box' + (alerta ? ' alert' : ''));
  if (titulo) box.appendChild(el('h4', null, titulo));
  linhas.forEach((l) => box.appendChild(el('p', null, l)));
  return box;
}

/* ---------- Painel de Controle (UC, EEPROM; MICROCONTROLADOR na etapa 4) ---------- */
appById('control').render = function (body) {
  body.classList.add('os-split');
  const nav = el('nav', 'os-nav');
  const area = el('div', 'os-content');
  const secoes = [
    ['Sistema', (a) => {
      a.append(
        el('h3', 'os-h', 'Sistema'),
        caixa('Informações do computador', ['Sistema operacional: ROOT/OS 2002 (modo de segurança)', 'Memória RAM: 256 MB · Disco: 40 GB']),
        caixa('Processador', ['Processador em modo de emergência.', 'Componente que busca, decodifica e coordena as instruções: OFFLINE.'], true)
      );
      coletar('UC');
    }],
    ['BIOS', (a) => {
      a.append(
        el('h3', 'os-h', 'BIOS'),
        caixa('Firmware', ['Versão: RB-2002.04 · Fabricante: genérico']),
        caixa('Configurações', ['As configurações da BIOS ficam numa memória não volátil apagável eletricamente.', 'Status: ilegível.'], true)
      );
      coletar('EEPROM');
    }],
    ['Gerenciador de Dispositivos', (a) => {
      a.appendChild(el('h3', 'os-h', 'Gerenciador de Dispositivos'));
      const ul = el('ul', 'os-devices');
      [
        ['Processador', 'modo de emergência', true],
        ['Disco local (C:)', 'funcionando', false],
        ['Disco removível (E:)', 'não reconhecido', true],
        ['Adaptador de vídeo padrão', 'funcionando', false],
        ['Teclado e mouse', 'funcionando', false]
      ].forEach(([nome, st, ruim]) => {
        const li = el('li', ruim ? 'bad' : null);
        li.append(el('span', null, nome), el('small', null, st));
        ul.appendChild(li);
      });
      a.appendChild(ul);
      if (typeof window.appsDevices === 'function') window.appsDevices(a, ul);
    }]
  ];
  const btns = secoes.map(([nome, fn], k) => {
    const b = el('button', 'os-navbtn', nome);
    b.type = 'button';
    b.addEventListener('click', () => abrir(k));
    nav.appendChild(b);
    return b;
  });
  function abrir(k) {
    btns.forEach((b, j) => b.classList.toggle('on', j === k));
    area.textContent = '';
    secoes[k][1](area);
  }
  // começa numa tela neutra: o jogador precisa clicar nas seções
  area.append(el('h3', 'os-h', 'Painel de Controle'), el('p', 'os-muted', 'Escolha uma categoria à esquerda.'));
  body.append(nav, area);
};

/* ---------- Gerenciador de Tarefas (ULA, DUALCORE) ---------- */
let graficoId = null;

function grafico(ativo) {
  const w = 160;
  const h = 70;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svg.setAttribute('class', 'tm-graph' + (ativo ? '' : ' off'));
  if (ativo) {
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const pts = [];
    for (let x = 0; x <= w; x += 10) pts.push(x + ',' + (10 + Math.random() * (h - 20)).toFixed(1));
    pl.setAttribute('points', pts.join(' '));
    svg.appendChild(pl);
  }
  return svg;
}

function desenharNucleos(box) {
  box.textContent = '';
  const n = window.dkOtimizado ? 4 : 2;
  for (let k = 0; k < n; k++) {
    const ativo = window.dkOtimizado || k === 0;
    const c = el('div', 'tm-core');
    c.append(el('span', 'tm-core-name', 'Núcleo ' + (k + 1)), grafico(ativo));
    if (!ativo) c.appendChild(el('span', 'tm-core-off', 'DESATIVADO'));
    box.appendChild(c);
  }
}

appById('taskmgr').render = function (body) {
  abas(body, ['Processos', 'Desempenho'], (k, area) => {
    clearInterval(graficoId);
    if (k === 0) {
      const tbl = el('table', 'tm-table');
      const thead = el('thead');
      const hr = el('tr');
      ['Nome da imagem', 'CPU', 'Memória', 'Status'].forEach((t) => hr.appendChild(el('th', null, t)));
      thead.appendChild(hr);
      const tb = el('tbody');
      const info = el('p', 'tm-info', 'Clique num processo para ver a descrição.');
      [
        ['sys_kernel.exe', '02', '3.112 K', 'Executando', 'Núcleo do ROOT/OS em modo de segurança.'],
        ['shell_desk.exe', '01', '8.540 K', 'Executando', 'Área de trabalho e barra de tarefas.'],
        ['root.exe', '00', '1.024 K', 'Executando', 'Terminal de acesso remoto.'],
        ['defender.exe', '04', '6.200 K', 'Executando', 'ROOT Defender: monitor de ameaças.'],
        ['calc_unit.exe', '00', '0 K', 'Não respondendo', 'Responsável pelos cálculos e pelas comparações lógicas do processador.']
      ].forEach(([nome, cpu, mem, st, desc]) => {
        const tr = el('tr', st === 'Não respondendo' ? 'hung' : null);
        tr.tabIndex = 0;
        [nome, cpu, mem, st].forEach((t) => tr.appendChild(el('td', null, t)));
        const ver = () => {
          tb.querySelectorAll('tr').forEach((r) => r.classList.remove('sel'));
          tr.classList.add('sel');
          info.textContent = nome + ' — ' + desc;
          info.classList.toggle('alert', nome === 'calc_unit.exe');
          if (nome === 'calc_unit.exe') coletar('ULA');
        };
        tr.addEventListener('click', ver);
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') ver(); });
        tb.appendChild(tr);
      });
      tbl.append(thead, tb);
      area.append(tbl, info);
    } else {
      const cores = el('div', 'tm-cores');
      desenharNucleos(cores);
      const txt = el('p', 'tm-info' + (window.dkOtimizado ? '' : ' alert'),
        window.dkOtimizado ? 'Processador de quatro núcleos: 4 em uso.' : 'Processador de dois núcleos: apenas 1 em uso.');
      area.append(el('h4', 'os-h', 'Histórico de uso da CPU'), cores, txt);
      graficoId = setInterval(() => {
        if (!cores.isConnected) { clearInterval(graficoId); return; }
        desenharNucleos(cores);
      }, 1200);
      if (!window.dkOtimizado) coletar('DUALCORE');
    }
  });
};
appById('taskmgr').onClose = () => clearInterval(graficoId);

/* ---------- Bloco de Notas: notas_do_admin.txt (REGISTRADORES) ---------- */
appById('notes').render = function (body) {
  body.classList.add('np');
  const menu = el('div', 'np-menu');
  ['Arquivo', 'Editar', 'Formatar', 'Ajuda'].forEach((m) => menu.appendChild(el('span', null, m)));
  const txt = el('textarea', 'np-text');
  txt.readOnly = true;
  txt.setAttribute('aria-label', 'Conteúdo de notas_do_admin.txt');
  txt.value = 'Lembrete: as pequenas memórias dentro do processador, as mais rápidas de todas, foram zeradas. Reativar pelo terminal.\n\n— admin';
  body.append(menu, txt);
  coletar('REGISTRADORES');
};

/* ---------- Internet: navegador falso (CACHE) ---------- */
appById('internet').render = function (body) {
  body.classList.add('br');
  const bar = el('div', 'br-bar');
  ['◀', '▶', '⟳'].forEach((s) => {
    const b = el('button', 'br-nav', s);
    b.type = 'button';
    b.disabled = true;
    b.setAttribute('aria-hidden', 'true');
    bar.appendChild(b);
  });
  bar.append(el('span', 'br-label', 'Endereço'), el('span', 'br-url', 'http://inicio.rootos.local/dicas/pc-lento'));
  const page = el('article', 'br-page');
  page.append(
    el('p', 'br-site', 'PORTAL INÍCIO · dicas de informática'),
    el('h2', 'br-title', 'Por que meu PC está tão lento?'),
    el('p', 'br-meta', 'Coluna do técnico · leitura de 1 minuto'),
    el('p', null, 'Toda vez que o processador precisa de um dado, ele procura primeiro numa memória pequena e ultrarrápida que fica entre a CPU e a RAM. Ela guarda o que é mais usado, para a CPU não ter de esperar a RAM, que é bem mais lenta.'),
    el('p', null, 'Essa memória é organizada em níveis: L1, o menor e mais rápido, dentro de cada núcleo; L2, um pouco maior; e L3, compartilhado entre os núcleos.'),
    el('p', 'br-alert', 'Sem ela, cada instrução vai buscar dados direto na RAM — e tudo fica lento. Se o seu sistema está em modo de segurança, é provável que essa memória esteja desativada.')
  );
  body.append(bar, page);
  coletar('CACHE');
};

/* ---------- Meu Computador (FLASH) ---------- */
appById('computer').render = function (body) {
  body.classList.add('mc');
  const drives = [
    { id: 'C', nome: 'Disco local (C:)', tipo: 'Disco rígido', props: ['Tipo: memória de massa (disco rígido)', 'Capacidade: 40 GB · Livre: 12 GB', 'Status: funcionando'] },
    { id: 'D', nome: 'Unidade de CD (D:)', tipo: 'Unidade óptica', props: ['Tipo: leitor de CD', 'Nenhum disco inserido'] },
    { id: 'E', nome: 'Disco removível (E:)', tipo: 'Disco removível', props: ['Tipo de memória: não volátil, regravável em blocos.', 'Status: não reconhecida.'], alerta: true }
  ];
  const grid = el('div', 'mc-grid');
  const det = el('div', 'mc-detail');
  let atual = null;
  const btnProps = el('button', 'os-btn', 'Propriedades');
  btnProps.type = 'button';
  btnProps.disabled = true;
  const props = el('div', 'mc-props');

  drives.forEach((d) => {
    const b = el('button', 'mc-drive');
    b.type = 'button';
    b.innerHTML = '<svg viewBox="0 0 40 28" aria-hidden="true"><rect x="2" y="6" width="36" height="16" rx="3" fill="#D3DBE8" stroke="#3A4F72" stroke-width="2"/><circle cx="31" cy="14" r="2" fill="' + (d.alerta ? '#E8483C' : '#2FC46B') + '"/></svg>';
    b.append(el('span', null, d.nome), el('small', null, d.tipo));
    const sel = () => {
      grid.querySelectorAll('.mc-drive').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      atual = d;
      btnProps.disabled = false;
      props.textContent = '';
    };
    b.addEventListener('click', sel);
    b.addEventListener('dblclick', () => { sel(); mostrarProps(); });
    grid.appendChild(b);
  });

  function mostrarProps() {
    if (!atual) return;
    props.textContent = '';
    props.appendChild(caixa('Propriedades de ' + atual.nome, atual.props, atual.alerta));
    if (atual.id === 'E') coletar('FLASH');
  }
  btnProps.addEventListener('click', mostrarProps);

  det.append(el('span', 'os-muted', 'Selecione uma unidade e clique em Propriedades.'), btnProps);
  body.append(el('h3', 'os-h', 'Unidades de armazenamento'), grid, det, props);
};

/* ---------- E-mail (QUADCORE; dica da senha usada na etapa 4) ---------- */
const EMAILS = [
  { de: 'Suporte TI', assunto: 'Upgrade aprovado', data: '14/03/2002',
    corpo: ['Olá,', 'Aprovamos a troca do seu processador por um de quatro núcleos trabalhando ao mesmo tempo. Ative o módulo novo pelo terminal.', 'Att., Suporte TI'],
    pista: 'QUADCORE' },
  { de: 'Admin', assunto: 'Pasta Confidencial', data: '12/03/2002',
    corpo: ['Para não esquecer:', 'A senha da pasta Confidencial é o nome da memória principal volátil seguido do ano do sistema, tudo junto e em maiúsculas.', '— admin'] },
  { de: 'ROOT/OS', assunto: 'Bem-vindo ao ROOT/OS 2002', data: '01/03/2002',
    corpo: ['Obrigado por usar o ROOT/OS 2002.', 'Dica: o ROOT Defender protege o seu computador 24 horas por dia. Não desative o antivírus.'] }
];

appById('email').render = function (body) {
  body.classList.add('em');
  const lista = el('div', 'em-list');
  lista.setAttribute('role', 'list');
  const leitura = el('div', 'em-read');
  leitura.appendChild(el('p', 'os-muted', 'Selecione uma mensagem.'));
  EMAILS.forEach((m) => {
    const b = el('button', 'em-item' + (a2.vistos.has('mail:' + m.assunto) ? '' : ' unread'));
    b.type = 'button';
    b.append(el('strong', null, m.de), el('span', null, m.assunto), el('small', null, m.data));
    b.addEventListener('click', () => {
      lista.querySelectorAll('.em-item').forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      b.classList.remove('unread');
      a2.vistos.add('mail:' + m.assunto);
      leitura.textContent = '';
      leitura.append(el('h3', 'em-subj', m.assunto), el('p', 'em-from', 'De: ' + m.de + ' · ' + m.data));
      m.corpo.forEach((l) => leitura.appendChild(el('p', null, l)));
      if (m.pista) coletar(m.pista);
    });
    lista.appendChild(b);
  });
  body.append(lista, leitura);
};

/* ---------- Terminal no sistema de janelas ---------- */
const appTerm = appById('terminal');
appTerm.bodyClass = 'rw-body-term';
appTerm.render = function (body) {
  body.appendChild(t2.root);
  renderPacotes();
  t2.log.scrollTop = t2.log.scrollHeight;
  setTimeout(() => t2.input.focus(), 30);
};

/* ---------- Reset (nova invasão) ---------- */
window.appsReset = function () {
  a2.coletados.clear();
  a2.sel = null;
  a2.revelados = {};
  a2.sniffs.clear();
  a2.vistos.clear();
  window.dkOtimizado = false;
  clearInterval(graficoId);
  t2.input.value = '';
  iniciarLogTerminal();
  renderPacotes();
};

/* expostos para as próximas etapas */
window.appsColetar = coletar;
window.appsA2 = a2;
window.appsRenderPacotes = renderPacotes;

montarTerminal();
iniciarLogTerminal();
