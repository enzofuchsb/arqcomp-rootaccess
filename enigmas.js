'use strict';

/* =========================================================
   ROOT ACCESS — enigmas.js
   Enigmas do Ato 2 (trocam pistas que antes vinham "de graça"):
   - UC ............ Painel de Controle › Sistema: ordenar o ciclo de instrução
   - REGISTRADORES . notas_do_admin.txt (texto + programa do admin)
   - EEPROM ........ Painel de Controle › BIOS: PIN = resultado do programa
   - CACHE ......... Internet › Histórico
   - FLASH ......... Disco removível (E:): leia_me.txt fragmentado
   - DUALCORE ...... Gerenciador de Tarefas › Desempenho: balancear núcleos
   Tudo que é de arrastar também tem botões (funciona no celular).
   Este arquivo substitui o render desses apps definidos em apps.js.
   Usa de apps.js: el, caixa, abas, coletar, a2, idxDe, ICONES (desktop.js).
   ========================================================= */

const sorteio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const embaralhar = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const online = (resp) => state.online.has(idxDe(resp));
const ordenado = (arr, cmp) => arr.every((v, i) => i === 0 || cmp(arr[i - 1], v) <= 0);

/* estado sorteado a cada partida */
const eg = {};

function gerarEnigmas() {
  // UC: ordem inicial embaralhada, nunca já certa
  const CICLO = ['BUSCAR', 'DECODIFICAR', 'EXECUTAR', 'ARMAZENAR'];
  do { eg.ciclo = embaralhar(CICLO); } while (eg.ciclo.join() === CICLO.join());
  eg.ucOk = false;

  // REGISTRADORES/EEPROM: programa do admin e o PIN
  const prog = gerarPrograma();
  eg.programa = prog.linhas;
  eg.pin = prog.resultado;
  eg.biosOk = false;

  // FLASH: 4 setores distintos, embaralhados, nunca já em ordem
  const setores = new Set();
  while (setores.size < 4) setores.add(sorteio(100, 999));
  const ord = [...setores].sort((a, b) => a - b);
  const TEXTO = [
    'LEIA-ME · pendrive do admin.',
    'Este dispositivo usa uma memória não volátil:',
    'os dados ficam guardados sem energia e são',
    'apagados e regravados em blocos inteiros.'
  ];
  const blocos = ord.map((setor, i) => ({ setor, texto: TEXTO[i] }));
  do { eg.blocos = embaralhar(blocos); } while (ordenado(eg.blocos, (a, b) => a.setor - b.setor));
  eg.flashOk = false;

  // DUALCORE: 6 cargas que somam mais de 100% e sempre têm solução
  eg.cargas = gerarCargas();
  eg.nucleo = eg.cargas.map(() => 1);   // todos começam no Núcleo 1
  eg.dualOk = false;

  // CACHE: página atual do navegador
  eg.pagina = 'inicio';
}

/* ---------- Programa em pseudo-assembly (só MOV, ADD, SUB, MUL; decimais) ---------- */
function gerarPrograma() {
  for (;;) {
    const a = sorteio(2, 9);
    const b = sorteio(2, 9);
    const linhas = [
      ['MOV A, ' + a, 'coloca ' + a + ' no registrador A'],
      ['MOV B, ' + b, 'coloca ' + b + ' no registrador B']
    ];
    let A = a;
    let ok = true;
    const extra = sorteio(2, 4);               // total de 4 a 6 linhas
    for (let k = 0; k < extra; k++) {
      const op = ['ADDB', 'ADDN', 'SUBN', 'SUBB', 'MUL'][sorteio(0, 4)];
      if (op === 'ADDB') { A += b; linhas.push(['ADD A, B', 'A = A + B']); }
      else if (op === 'SUBB') { A -= b; linhas.push(['SUB A, B', 'A = A − B']); }
      else if (op === 'ADDN') { const n = sorteio(1, 9); A += n; linhas.push(['ADD A, ' + n, 'A = A + ' + n]); }
      else if (op === 'SUBN') { const n = sorteio(1, 9); A -= n; linhas.push(['SUB A, ' + n, 'A = A − ' + n]); }
      else { const n = sorteio(2, 5); A *= n; linhas.push(['MUL A, ' + n, 'A = A × ' + n]); }
      if (A < 0) { ok = false; break; }
    }
    if (ok && A >= 10 && A <= 999) return { linhas, resultado: A };
  }
}

/* ---------- Cargas do DUALCORE ---------- */
function temSolucao(cargas) {
  const total = cargas.reduce((s, c) => s + c, 0);
  for (let m = 0; m < 1 << cargas.length; m++) {
    let s1 = 0;
    cargas.forEach((c, i) => { if (m & (1 << i)) s1 += c; });
    if (s1 <= 100 && total - s1 <= 100) return true;
  }
  return false;
}

function gerarCargas() {
  for (;;) {
    const c = Array.from({ length: 6 }, () => sorteio(2, 9) * 5);   // 10% a 45%
    const total = c.reduce((s, x) => s + x, 0);
    if (total > 100 && total <= 190 && temSolucao(c)) return c;
  }
}

/* ---------- Lista reordenável: arrastar (mouse) ou botões ---------- */
function listaOrdenavel(box, itens, render, aoMudar, rotulos) {
  box.textContent = '';
  let origem = null;
  itens.forEach((item, i) => {
    const row = el('div', 'eg-card');
    row.draggable = true;
    row.addEventListener('dragstart', (e) => { origem = i; row.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
    row.addEventListener('dragend', () => row.classList.remove('drag'));
    row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('over'); });
    row.addEventListener('dragleave', () => row.classList.remove('over'));
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('over');
      if (origem == null || origem === i) return;
      const [x] = itens.splice(origem, 1);
      itens.splice(i, 0, x);
      origem = null;
      aoMudar();
    });

    const conteudo = el('div', 'eg-card-body');
    render(item, conteudo, i);
    const ctrl = el('div', 'eg-card-ctrl');
    const antes = el('button', 'os-btn eg-mini', rotulos[0]);
    const depois = el('button', 'os-btn eg-mini', rotulos[1]);
    antes.type = depois.type = 'button';
    antes.setAttribute('aria-label', 'Mover para ' + (rotulos[0] === '←' ? 'a esquerda' : 'cima'));
    depois.setAttribute('aria-label', 'Mover para ' + (rotulos[1] === '→' ? 'a direita' : 'baixo'));
    antes.disabled = i === 0;
    depois.disabled = i === itens.length - 1;
    antes.addEventListener('click', () => { [itens[i - 1], itens[i]] = [itens[i], itens[i - 1]]; aoMudar(); });
    depois.addEventListener('click', () => { [itens[i + 1], itens[i]] = [itens[i], itens[i + 1]]; aoMudar(); });
    ctrl.append(antes, depois);
    row.append(conteudo, ctrl);
    box.appendChild(row);
  });
}

function avisoErro(texto, trace) {
  somErro();
  logLine('[ FAIL ]', 'fail', texto + (trace ? ' — trace +' + trace + '%' : ''));
  dkBalao('ROOT/OS', texto + (trace ? ' (trace +' + trace + '%)' : ''));
  if (trace) addTrace(trace);
}

/* =========================================================
   PAINEL DE CONTROLE: Sistema (UC), BIOS (EEPROM), Dispositivos
   ========================================================= */
function secaoSistema(a) {
  a.append(
    el('h3', 'os-h', 'Sistema'),
    caixa('Informações do computador', ['Sistema operacional: ROOT/OS 2002 (modo de segurança)', 'Memória RAM: 256 MB · Disco: 40 GB'])
  );
  if (eg.ucOk) {
    a.appendChild(caixa('Processador', ['Sequência de instrução restaurada.', 'Componente que busca, decodifica e coordena as instruções: OFFLINE.'], true));
    return;
  }
  a.appendChild(caixa('Processador', ['Processador em modo de emergência. Sequência de instrução corrompida.'], true));
  a.appendChild(el('p', 'os-muted eg-tip', 'Coloque as etapas do ciclo de instrução na ordem em que o processador as executa (arraste ou use ← →) e clique em Aplicar.'));
  const fila = el('div', 'eg-row');
  const desenhar = () => listaOrdenavel(fila, eg.ciclo,
    (nome, box, i) => box.append(el('small', null, 'etapa ' + (i + 1)), el('strong', null, nome)),
    desenhar, ['←', '→']);
  desenhar();
  const aplicar = el('button', 'os-btn os-btn-primary', 'Aplicar');
  aplicar.type = 'button';
  aplicar.addEventListener('click', () => {
    if (!state.rodando) return;
    if (eg.ciclo.join() === 'BUSCAR,DECODIFICAR,EXECUTAR,ARMAZENAR') {
      eg.ucOk = true;
      logLine('[  OK  ]', 'ok', 'Ciclo de instrução restaurado: BUSCAR → DECODIFICAR → EXECUTAR → ARMAZENAR');
      a.textContent = '';
      secaoSistema(a);
      coletar('UC');
    } else {
      avisoErro('Sequência de instrução rejeitada', 3);
    }
  });
  a.append(fila, aplicar);
}

function secaoBios(a) {
  a.append(el('h3', 'os-h', 'BIOS'), caixa('Firmware', ['Versão: RB-2002.04 · Fabricante: genérico']));
  if (eg.biosOk) {
    a.appendChild(caixa('Configurações', ['As configurações da BIOS ficam numa memória não volátil apagável eletricamente.', 'Status: ilegível.'], true));
    return;
  }
  const form = el('form', 'pw-form');
  form.autocomplete = 'off';
  const lbl = el('label', null, 'Configurações protegidas. Digite o PIN da BIOS:');
  lbl.htmlFor = 'bios-pin';
  const inp = el('input', 'pw-input');
  inp.id = 'bios-pin';
  inp.inputMode = 'numeric';
  inp.maxLength = 4;
  const ok = el('button', 'os-btn', 'Desbloquear');
  ok.type = 'submit';
  const row = el('div', 'pw-row');
  row.append(inp, ok);
  const msg = el('p', 'pw-msg');
  msg.setAttribute('aria-live', 'assertive');
  form.append(lbl, row, msg, el('p', 'os-muted eg-tip', 'O admin deixou o PIN anotado em algum arquivo.'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.rodando) return;
    if (inp.value.trim() === String(eg.pin)) {
      eg.biosOk = true;
      logLine('[  OK  ]', 'ok', 'PIN da BIOS aceito');
      a.textContent = '';
      secaoBios(a);
      coletar('EEPROM');
    } else {
      msg.textContent = 'PIN inválido.';
      inp.value = '';
      avisoErro('PIN inválido na BIOS', 5);
      inp.focus();
    }
  });
  a.appendChild(form);
}

function secaoDispositivos(a) {
  a.appendChild(el('h3', 'os-h', 'Gerenciador de Dispositivos'));
  const ul = el('ul', 'os-devices');
  [
    ['Processador', online('UC') ? 'funcionando' : 'modo de emergência', !online('UC')],
    ['Disco local (C:)', 'funcionando', false],
    ['Disco removível (E:)', online('FLASH') ? 'funcionando' : 'não reconhecido', !online('FLASH')],
    ['Adaptador de vídeo padrão', 'funcionando', false],
    ['Teclado e mouse', 'funcionando', false]
  ].forEach(([nome, st, ruim]) => {
    const li = el('li', ruim ? 'bad' : null);
    li.append(el('span', null, nome), el('small', null, st));
    ul.appendChild(li);
  });
  a.appendChild(ul);
  if (typeof window.appsDevices === 'function') window.appsDevices(a, ul);
}

appById('control').render = function (body) {
  body.classList.add('os-split');
  const nav = el('nav', 'os-nav');
  const area = el('div', 'os-content');
  const secoes = [['Sistema', secaoSistema], ['BIOS', secaoBios], ['Gerenciador de Dispositivos', secaoDispositivos]];
  const btns = secoes.map(([nome], k) => {
    const b = el('button', 'os-navbtn', nome);
    b.type = 'button';
    b.addEventListener('click', () => {
      btns.forEach((x, j) => x.classList.toggle('on', j === k));
      area.textContent = '';
      secoes[k][1](area);
    });
    nav.appendChild(b);
    return b;
  });
  area.append(el('h3', 'os-h', 'Painel de Controle'), el('p', 'os-muted', 'Escolha uma categoria à esquerda.'));
  body.append(nav, area);
};

/* =========================================================
   BLOCO DE NOTAS: REGISTRADORES + programa do admin (PIN)
   ========================================================= */
/* texto completo das notas (também usado pelo "cat" do Terminal) */
window.notasTexto = function () {
  const larg = Math.max(...eg.programa.map(([c]) => c.length)) + 4;
  const prog = eg.programa.map(([cod, com]) => cod.padEnd(larg) + '; ' + com).join('\n');
  return 'Lembrete: as pequenas memórias dentro do processador, as mais rápidas de todas, foram zeradas. Reativar pelo terminal.\n' +
    'Obs.: arquivos que começam com ponto ficam escondidos.\n\n' +
    '— admin\n\n' +
    '----------------------------------------\n' +
    'pin_bios.asm  (pra eu não esquecer)\n' +
    '----------------------------------------\n' +
    prog + '\n' +
    '; o PIN da BIOS é o valor final de A\n';
};

appById('notes').render = function (body) {
  body.classList.add('np');
  const menu = el('div', 'np-menu');
  ['Arquivo', 'Editar', 'Formatar', 'Ajuda'].forEach((m) => menu.appendChild(el('span', null, m)));
  const txt = el('textarea', 'np-text');
  txt.readOnly = true;
  txt.setAttribute('aria-label', 'Conteúdo de notas_do_admin.txt');
  txt.value = window.notasTexto();
  body.append(menu, txt);
  coletar('REGISTRADORES');
};

/* =========================================================
   INTERNET: páginas lentas e cortadas sem CACHE; Histórico
   ========================================================= */
const PAGINAS = {
  inicio: {
    url: 'http://inicio.rootos.local/',
    site: 'PORTAL INÍCIO',
    titulo: 'Bem-vindo ao Portal Início',
    meta: 'Sua página inicial',
    texto: [
      'Notícias, previsão do tempo e dicas de informática em um só lugar.',
      'Destaques de hoje: novo processador de quatro núcleos chega às lojas; previsão de chuva no fim de semana; como deixar o computador mais rápido.',
      'Use os links abaixo para navegar.'
    ],
    links: [['noticias', 'Notícias'], ['clima', 'Previsão do tempo']]
  },
  noticias: {
    url: 'http://inicio.rootos.local/noticias',
    site: 'PORTAL INÍCIO · notícias',
    titulo: 'Processadores com mais núcleos chegam às lojas',
    meta: 'Tecnologia · 14/03/2002',
    texto: [
      'Fabricantes anunciaram chips com vários núcleos trabalhando ao mesmo tempo.',
      'Segundo especialistas, dividir as tarefas entre núcleos deixa o sistema muito mais rápido.',
      'Os modelos chegam às lojas no próximo mês.'
    ],
    links: [['inicio', '◀ Página inicial']]
  },
  clima: {
    url: 'http://inicio.rootos.local/clima',
    site: 'PORTAL INÍCIO · clima',
    titulo: 'Previsão do tempo',
    meta: 'Atualizado às 06:00',
    texto: ['Hoje: parcialmente nublado, máxima de 27 °C.', 'Amanhã: chuva à tarde, máxima de 22 °C.', 'Fim de semana: frio, mínima de 12 °C.'],
    links: [['inicio', '◀ Página inicial']]
  },
  lento: {
    url: 'http://inicio.rootos.local/dicas/pc-lento',
    site: 'PORTAL INÍCIO · dicas de informática',
    titulo: 'Por que meu PC está tão lento?',
    meta: 'Coluna do técnico · leitura de 1 minuto',
    texto: [
      'Toda vez que o processador precisa de um dado, ele procura primeiro numa memória pequena e ultrarrápida que fica entre a CPU e a RAM. Ela guarda o que é mais usado, para a CPU não ter de esperar a RAM, que é bem mais lenta.',
      'Essa memória é organizada em níveis: L1, o menor e mais rápido, dentro de cada núcleo; L2, um pouco maior; e L3, compartilhado entre os núcleos.',
      { alerta: 'Sem ela, cada instrução vai buscar dados direto na RAM — e tudo fica lento. Se o seu sistema está em modo de segurança, é provável que essa memória esteja desativada.' }
    ],
    links: [['inicio', '◀ Página inicial']]
  }
};

const HISTORICO = [
  ['lento', '14/03/2002 23:41'],
  ['noticias', '14/03/2002 23:12'],
  ['clima', '14/03/2002 07:58'],
  ['inicio', '14/03/2002 07:57']
];

let navToken = 0;

appById('internet').render = function (body) {
  body.classList.add('br');
  const bar = el('div', 'br-bar');
  const home = el('button', 'br-nav br-home', 'Início');
  const hist = el('button', 'br-nav br-hist', 'Histórico');
  home.type = hist.type = 'button';
  const url = el('span', 'br-url');
  bar.append(home, hist, el('span', 'br-label', 'Endereço'), url);
  const page = el('article', 'br-page');
  body.append(bar, page);

  function link(id, texto) {
    const b = el('button', 'br-link', texto);
    b.type = 'button';
    b.addEventListener('click', () => abrir(id, false));
    return b;
  }

  function desenhar(p, completo) {
    page.textContent = '';
    page.append(el('p', 'br-site', p.site), el('h2', 'br-title', p.titulo), el('p', 'br-meta', p.meta));
    const partes = completo ? p.texto : p.texto.slice(0, 1);
    partes.forEach((t) => {
      if (typeof t === 'string') {
        // sem CACHE, o primeiro parágrafo chega pela metade
        const s = completo ? t : t.slice(0, Math.ceil(t.length * 0.55)) + '…';
        page.appendChild(el('p', null, s));
      } else page.appendChild(el('p', 'br-alert', t.alerta));
    });
    if (!completo) {
      page.appendChild(caixa('Erro: conteúdo incompleto', ['A página demorou demais para carregar e veio cortada.', 'Memória de acesso rápido indisponível (modo de segurança).'], true));
    }
    const nav = el('div', 'br-links');
    p.links.forEach(([id, t]) => nav.appendChild(link(id, t)));
    page.appendChild(nav);
  }

  function abrir(id, doHistorico) {
    const p = PAGINAS[id];
    eg.pagina = id;
    url.textContent = p.url;
    const token = ++navToken;
    const rapido = online('CACHE');
    // a cópia da página no histórico abre inteira, sem depender da rede
    if (rapido || (doHistorico && id === 'lento')) {
      desenhar(p, true);
      if (id === 'lento' && doHistorico) {
        page.insertBefore(el('p', 'br-cache', 'Cópia salva no histórico · visitada em 14/03/2002 23:41'), page.firstChild);
        coletar('CACHE');
      }
      return;
    }
    page.textContent = '';
    const barra = el('div', 'loading-bar br-loading');
    const fill = el('div', 'loading-fill');
    barra.appendChild(fill);
    page.append(el('p', 'os-muted', 'Carregando ' + p.url + ' …'), barra);
    let pct = 0;
    const passo = () => {
      if (token !== navToken || !page.isConnected) return;
      pct = Math.min(92, pct + sorteio(4, 12));
      fill.style.width = pct + '%';
      if (pct < 92) setTimeout(passo, 220);
      else setTimeout(() => { if (token === navToken && page.isConnected) desenhar(p, false); }, 500);
    };
    passo();
  }

  function historico() {
    navToken++;
    url.textContent = 'histórico://';
    page.textContent = '';
    page.append(el('h2', 'br-title', 'Histórico'), el('p', 'br-meta', 'Páginas visitadas antes da queda do sistema'));
    const lista = el('div', 'fx-list');
    HISTORICO.forEach(([id, quando]) => {
      const b = el('button', 'fx-item');
      b.type = 'button';
      b.append(el('span', 'fx-ico txt', ''), el('strong', null, PAGINAS[id].titulo), el('small', null, quando));
      b.addEventListener('click', () => abrir(id, true));
      lista.appendChild(b);
    });
    page.appendChild(lista);
  }

  home.addEventListener('click', () => abrir('inicio', false));
  hist.addEventListener('click', historico);
  abrir('inicio', false);
};

/* =========================================================
   MEU COMPUTADOR: Disco removível (E:) › leia_me.txt fragmentado
   ========================================================= */
function abrirPendrive(area, voltar) {
  area.textContent = '';
  const back = el('button', 'os-btn', '◀ Unidades');
  back.type = 'button';
  back.addEventListener('click', voltar);
  area.append(back, el('h3', 'os-h', 'Disco removível (E:) › leia_me.txt'));

  if (eg.flashOk) {
    const doc = el('div', 'trash-file eg-doc');
    eg.blocos.forEach((b) => doc.appendChild(el('p', null, b.texto)));
    area.append(doc, caixa('Propriedades do dispositivo', ['Tipo de memória: não volátil, regravável em blocos.', 'Status: não reconhecida.'], true));
    return;
  }

  area.appendChild(caixa('Arquivo fragmentado', ['leia_me.txt foi gravado em 4 blocos que ficaram fora de ordem no disco.', 'Ordene os blocos pelo número do setor, do menor para o maior, e monte o arquivo.'], true));
  const lista = el('div', 'eg-col');
  const desenhar = () => listaOrdenavel(lista, eg.blocos,
    (b, box) => box.append(el('small', null, 'setor ' + b.setor), el('span', 'eg-frag', b.texto)),
    desenhar, ['↑', '↓']);
  desenhar();
  const montar = el('button', 'os-btn os-btn-primary', 'Montar arquivo');
  montar.type = 'button';
  montar.addEventListener('click', () => {
    if (!state.rodando) return;
    if (ordenado(eg.blocos, (a, b) => a.setor - b.setor)) {
      eg.flashOk = true;
      logLine('[  OK  ]', 'ok', 'leia_me.txt montado a partir de 4 setores');
      abrirPendrive(area, voltar);
      coletar('FLASH');
    } else {
      avisoErro('Arquivo corrompido: setores fora de ordem', 0);
    }
  });
  area.append(lista, montar);
}

/* Disco local (C:): só a pista falsa ssd_backup.tmp */
function abrirDiscoC(body, voltar) {
  body.textContent = '';
  const back = el('button', 'os-btn', '◀ Unidades');
  back.type = 'button';
  back.addEventListener('click', voltar);
  const lista = el('div', 'fx-list');
  const b = el('button', 'fx-item');
  b.type = 'button';
  b.append(el('span', 'fx-ico txt', ''), el('strong', null, 'ssd_backup.tmp'), el('small', null, 'Arquivo temporário · 4 KB'));
  b.addEventListener('click', () => verTexto(body, 'ssd_backup.tmp', FALSAS['ssd_backup.tmp'], () => abrirDiscoC(body, voltar)));
  lista.appendChild(b);
  body.append(back, el('h3', 'os-h', 'Disco local (C:)'), lista, el('p', 'os-muted', 'As demais pastas estão bloqueadas no modo de segurança.'));
}

appById('computer').render = function (body) {
  body.classList.add('mc');
  const drives = [
    { id: 'C', nome: 'Disco local (C:)', tipo: 'Disco rígido', props: ['Tipo: memória de massa (disco rígido)', 'Capacidade: 40 GB · Livre: 12 GB', 'Status: funcionando'] },
    { id: 'D', nome: 'Unidade de CD (D:)', tipo: 'Unidade óptica', props: ['Tipo: leitor de CD', 'Nenhum disco inserido'] },
    { id: 'E', nome: 'Disco removível (E:)', tipo: 'Disco removível', props: ['Tipo: desconhecido · Status: não reconhecida.', 'Contém 1 arquivo fragmentado: leia_me.txt. Abra a unidade para montá-lo.'], alerta: true }
  ];

  function lista() {
    body.textContent = '';
    const grid = el('div', 'mc-grid');
    const det = el('div', 'mc-detail');
    let atual = null;
    const btnAbrir = el('button', 'os-btn', 'Abrir');
    const btnProps = el('button', 'os-btn', 'Propriedades');
    btnAbrir.type = btnProps.type = 'button';
    btnAbrir.disabled = btnProps.disabled = true;
    const props = el('div', 'mc-props');

    const abrir = () => {
      if (!atual) return;
      if (atual.id === 'E') abrirPendrive(body, lista);
      else if (atual.id === 'D') dkBalao('Meu Computador', 'Insira um disco na unidade D:.');
      else abrirDiscoC(body, lista);
    };

    // o Disco removível (E:) só é detectado com o DMA online
    const visiveis = drives.filter((d) => d.id !== 'E' || online('DMA'));
    visiveis.forEach((d) => {
      const b = el('button', 'mc-drive');
      b.type = 'button';
      b.innerHTML = '<svg viewBox="0 0 40 28" aria-hidden="true"><rect x="2" y="6" width="36" height="16" rx="3" fill="#D3DBE8" stroke="#3A4F72" stroke-width="2"/><circle cx="31" cy="14" r="2" fill="' + (d.alerta && !eg.flashOk ? '#E8483C' : '#2FC46B') + '"/></svg>';
      b.append(el('span', null, d.nome), el('small', null, d.tipo));
      const sel = () => {
        grid.querySelectorAll('.mc-drive').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        atual = d;
        btnAbrir.disabled = btnProps.disabled = false;
        props.textContent = '';
        if (isTouch()) abrir();
      };
      b.addEventListener('click', sel);
      b.addEventListener('dblclick', () => { atual = d; abrir(); });
      grid.appendChild(b);
    });

    btnAbrir.addEventListener('click', abrir);
    btnProps.addEventListener('click', () => {
      if (!atual) return;
      props.textContent = '';
      props.appendChild(caixa('Propriedades de ' + atual.nome, atual.props, atual.alerta && !eg.flashOk));
    });
    const btns = el('div', 'eg-btns');
    btns.append(btnAbrir, btnProps);
    det.append(el('span', 'os-muted', 'Selecione uma unidade.'), btns);
    body.append(el('h3', 'os-h', 'Unidades de armazenamento'), grid, det, props);
    if (!online('DMA')) {
      body.appendChild(caixa('Dispositivos removíveis', ['Uma porta USB está com energia, mas nenhuma unidade foi montada.',
        'Periféricos não conseguem copiar dados para a memória sem ocupar o processador: recurso desativado.'], true));
    }
  }
  lista();
};

/* =========================================================
   GERENCIADOR DE TAREFAS: exige UC online; Desempenho = DUALCORE
   ========================================================= */
function abaProcessos(area) {
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
    // calc_unit.exe só volta a responder depois do Circuito 1 do LogicNão (pista da ULA)
    window.lbResolvido && window.lbResolvido(0)
      ? ['calc_unit.exe', '03', '2.048 K', 'Executando', 'Responsável pelos cálculos e pelas comparações lógicas do processador.']
      : ['calc_unit.exe', '00', '0 K', 'Não respondendo', 'Não respondendo. O circuito de cálculo do processador está instável.']
  ].forEach(([nome, cpu, mem, st, desc]) => {
    const tr = el('tr', st === 'Não respondendo' ? 'hung' : null);
    tr.tabIndex = 0;
    [nome, cpu, mem, st].forEach((t) => tr.appendChild(el('td', null, t)));
    const ver = () => {
      tb.querySelectorAll('tr').forEach((r) => r.classList.remove('sel'));
      tr.classList.add('sel');
      info.textContent = nome + ' — ' + desc;
      info.classList.toggle('alert', nome === 'calc_unit.exe' && st === 'Não respondendo');
    };
    tr.addEventListener('click', ver);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') ver(); });
    tb.appendChild(tr);
  });
  tbl.append(thead, tb);
  area.append(tbl, info);
}

const NOMES_PROC = ['render.exe', 'audio_svc.exe', 'indexador.exe', 'backup.exe', 'update.exe', 'spooler.exe'];

function abaDesempenho(area) {
  // final do jogo: 4 núcleos ativos (gráficos originais de apps.js)
  if (window.dkOtimizado) {
    const cores = el('div', 'tm-cores');
    desenharNucleos(cores);
    area.append(el('h4', 'os-h', 'Histórico de uso da CPU'), cores, el('p', 'tm-info', 'Processador de quatro núcleos: 4 em uso.'));
    graficoId = setInterval(() => {
      if (!cores.isConnected) { clearInterval(graficoId); return; }
      desenharNucleos(cores);
    }, 1200);
    return;
  }

  area.appendChild(el('h4', 'os-h', 'Balanceamento de núcleos'));
  if (!eg.dualOk) area.appendChild(el('p', 'os-muted eg-tip', 'Todos os processos estão no Núcleo 1. Mova processos para o Núcleo 2 (arraste ou use o botão) até nenhum núcleo passar de 100%.'));
  const grade = el('div', 'eg-cores');
  const status = el('p', 'tm-info');
  area.append(grade, status);

  function mover(i) {
    if (eg.dualOk || !state.rodando) return;
    eg.nucleo[i] = eg.nucleo[i] === 1 ? 2 : 1;
    bipe(760, 0.03, 'square', 0.03);
    desenhar();
    checar();
  }

  function desenhar() {
    grade.textContent = '';
    [1, 2].forEach((n) => {
      const soma = eg.cargas.reduce((s, c, i) => s + (eg.nucleo[i] === n ? c : 0), 0);
      const col = el('div', 'eg-core' + (soma > 100 ? ' over' : ''));
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('hover'); });
      col.addEventListener('dragleave', () => col.classList.remove('hover'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('hover');
        const i = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(i) && eg.nucleo[i] !== n) mover(i);
      });
      const head = el('div', 'eg-core-head');
      head.append(el('strong', null, 'Núcleo ' + n), el('span', 'eg-core-sum', soma + '%'));
      const barra = el('div', 'eg-core-bar');
      const fill = el('div', 'eg-core-fill');
      fill.style.width = Math.min(100, soma) + '%';
      barra.appendChild(fill);
      col.append(head, barra);
      const lista = el('div', 'eg-procs');
      eg.cargas.forEach((c, i) => {
        if (eg.nucleo[i] !== n) return;
        const p = el('div', 'eg-proc');
        p.draggable = !eg.dualOk;
        p.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(i)); });
        const b = el('button', 'os-btn eg-mini', n === 1 ? 'mover →' : '← mover');
        b.type = 'button';
        b.disabled = eg.dualOk;
        b.setAttribute('aria-label', 'Mover ' + NOMES_PROC[i] + ' para o Núcleo ' + (n === 1 ? 2 : 1));
        b.addEventListener('click', () => mover(i));
        p.append(el('span', null, NOMES_PROC[i]), el('strong', null, c + '%'), b);
        lista.appendChild(p);
      });
      if (!lista.children.length) lista.appendChild(el('p', 'os-muted', 'vazio'));
      col.appendChild(lista);
      grade.appendChild(col);
    });
    const s1 = eg.cargas.reduce((s, c, i) => s + (eg.nucleo[i] === 1 ? c : 0), 0);
    const s2 = eg.cargas.reduce((s, c, i) => s + (eg.nucleo[i] === 2 ? c : 0), 0);
    if (eg.dualOk) {
      status.textContent = 'Processador de dois núcleos: carga estabilizada.';
      status.className = 'tm-info eg-ok';
    } else {
      status.textContent = (s1 > 100 || s2 > 100) ? 'Sobrecarga: um núcleo passou de 100%.' : '';
      status.className = 'tm-info alert';
    }
  }

  function checar() {
    const s1 = eg.cargas.reduce((s, c, i) => s + (eg.nucleo[i] === 1 ? c : 0), 0);
    const s2 = eg.cargas.reduce((s, c, i) => s + (eg.nucleo[i] === 2 ? c : 0), 0);
    if (s1 <= 100 && s2 <= 100) {
      eg.dualOk = true;
      logLine('[  OK  ]', 'ok', 'Carga distribuída entre 2 núcleos: ' + s1 + '% / ' + s2 + '%');
      desenhar();
      coletar('DUALCORE');
    }
  }

  desenhar();
}

appById('taskmgr').render = function (body) {
  clearInterval(graficoId);
  if (!online('UC')) {
    body.append(
      caixa('Gerenciador de Tarefas', ['Erro: nenhum componente está coordenando as instruções do processador.', 'Sem quem busque e decodifique as instruções, os processos não podem ser listados.'], true)
    );
    const tentar = el('button', 'os-btn', 'Tentar novamente');
    tentar.type = 'button';
    tentar.addEventListener('click', () => {
      body.textContent = '';
      appById('taskmgr').render(body);
      if (!online('UC')) somErro();
    });
    body.appendChild(tentar);
    return;
  }
  abas(body, ['Processos', 'Desempenho'], (k, area) => {
    clearInterval(graficoId);
    if (k === 0) abaProcessos(area);
    else abaDesempenho(area);
  });
};

/* ---------- reset a cada nova invasão ---------- */
const resetApps = window.appsReset;
window.appsReset = function () {
  resetApps();
  navToken++;
  gerarEnigmas();
};

gerarEnigmas();
