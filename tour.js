/* =========================================================
   ROOT ACCESS · tour.js
   Tutorial guiado: destaca um elemento da tela, explica o que
   ele faz e, em alguns passos, espera o jogador fazer a ação.
   Enquanto o tour está aberto, o trace passivo e o ROOT
   Defender ficam pausados (window.tourAtivo).
   ========================================================= */

const tour = { passos: [], i: 0, hole: null, card: null, pollId: null, fim: null, os: false };
window.tourAtivo = false;

const TOUR_KEY = 'rootaccess-tour';
function tourVisto(nome) {
  try { return (JSON.parse(localStorage.getItem(TOUR_KEY)) || {})[nome] === true; } catch (e) { return false; }
}
function tourMarcar(nome) {
  try {
    const o = JSON.parse(localStorage.getItem(TOUR_KEY)) || {};
    o[nome] = true;
    localStorage.setItem(TOUR_KEY, JSON.stringify(o));
  } catch (e) { /* sem localStorage: o tour só aparece de novo */ }
}

function tourAlvo(p) {
  if (!p.alvo) return null;
  const e = typeof p.alvo === 'function' ? p.alvo() : document.querySelector(p.alvo);
  if (!e || !e.isConnected) return null;
  const r = e.getBoundingClientRect();
  return r.width || r.height ? e : null;
}

function tourMontar() {
  tour.hole = document.createElement('div');
  tour.hole.className = 'tour-hole';
  tour.hole.setAttribute('aria-hidden', 'true');
  tour.card = document.createElement('section');
  tour.card.className = 'tour-card';
  tour.card.setAttribute('role', 'dialog');
  tour.card.setAttribute('aria-live', 'polite');
  document.body.append(tour.hole, tour.card);
}

function tourPosicionar() {
  const p = tour.passos[tour.i];
  if (!p) return;
  const alvo = tourAlvo(p);
  const card = tour.card;
  const vw = window.innerWidth, vh = window.innerHeight;
  const mobile = vw <= 700;

  if (!alvo) {
    tour.hole.classList.add('center');
    tour.hole.style.cssText = '';
  } else {
    tour.hole.classList.remove('center');
    const r = alvo.getBoundingClientRect();
    const pad = 6;
    tour.hole.style.left = (r.left - pad) + 'px';
    tour.hole.style.top = (r.top - pad) + 'px';
    tour.hole.style.width = (r.width + pad * 2) + 'px';
    tour.hole.style.height = (r.height + pad * 2) + 'px';
  }

  if (mobile) { card.style.cssText = ''; card.classList.add('dock'); return; }
  card.classList.remove('dock');
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let x, y;
  if (!alvo) { x = (vw - cw) / 2; y = (vh - ch) / 2; }
  else {
    const r = alvo.getBoundingClientRect();
    x = r.left + r.width / 2 - cw / 2;
    if (r.bottom + 16 + ch < vh) y = r.bottom + 16;          // embaixo
    else if (r.top - 16 - ch > 0) y = r.top - 16 - ch;       // em cima
    else if (r.right + 16 + cw < vw) { x = r.right + 16; y = r.top; }   // à direita
    else if (r.left - 16 - cw > 0) { x = r.left - 16 - cw; y = r.top; } // à esquerda
    else { x = (vw - cw) / 2; y = vh - ch - 16; }
  }
  card.style.left = Math.max(12, Math.min(vw - cw - 12, x)) + 'px';
  card.style.top = Math.max(12, Math.min(vh - ch - 12, y)) + 'px';
}

function tourRender() {
  const p = tour.passos[tour.i];
  const card = tour.card;
  card.textContent = '';
  const head = document.createElement('div');
  head.className = 'tour-head';
  const passo = document.createElement('span');
  passo.textContent = 'TUTORIAL · ' + (tour.i + 1) + '/' + tour.passos.length;
  const pular = document.createElement('button');
  pular.type = 'button';
  pular.className = 'tour-skip';
  pular.textContent = 'Pular tutorial';
  pular.addEventListener('click', () => tourFechar(true));
  head.append(passo, pular);

  const h = document.createElement('h2');
  h.className = 'tour-title';
  h.textContent = p.titulo;
  card.append(head, h);
  [].concat(p.texto).forEach((t) => {
    const par = document.createElement('p');
    par.textContent = t;
    card.appendChild(par);
  });

  const row = document.createElement('div');
  row.className = 'tour-actions';
  if (p.esperar) {
    const w = document.createElement('p');
    w.className = 'tour-wait';
    w.textContent = p.aguardando || 'Faça a ação destacada para continuar...';
    card.appendChild(w);
  }
  if (p.acao) {
    const a = document.createElement('button');
    a.type = 'button';
    a.className = 'tour-btn alt';
    a.textContent = p.acao.label;
    a.addEventListener('click', p.acao.fn);
    row.appendChild(a);
  }
  if (!p.esperar) {
    const prox = document.createElement('button');
    prox.type = 'button';
    prox.className = 'tour-btn';
    prox.textContent = p.botao || (tour.i === tour.passos.length - 1 ? 'Começar' : 'Próximo ▶');
    prox.addEventListener('click', tourProximo);
    row.appendChild(prox);
    setTimeout(() => { if (prox.isConnected) prox.focus(); }, 30);
  }
  card.appendChild(row);
  if (typeof p.aoEntrar === 'function') p.aoEntrar();
  const alvo = tourAlvo(p);
  if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
  tourPosicionar();
}

function tourProximo() {
  if (tour.i >= tour.passos.length - 1) { tourFechar(false); return; }
  tour.i++;
  tourRender();
}

function tourFechar() {
  clearInterval(tour.pollId);
  tour.pollId = null;
  if (tour.hole) tour.hole.remove();
  if (tour.card) tour.card.remove();
  tour.hole = tour.card = null;
  window.removeEventListener('resize', tourPosicionar);
  window.tourAtivo = false;
  if (typeof window.pausarTrace === 'function') window.pausarTrace(false);
  const fim = tour.fim;
  tour.fim = null;
  if (typeof fim === 'function') fim();
}

/* inicia um tour. opts: { os: estilo ROOT/OS, fim: callback } */
function tourIniciar(passos, opts) {
  if (window.tourAtivo) tourFechar();
  opts = opts || {};
  tour.passos = passos;
  tour.i = 0;
  tour.fim = opts.fim || null;
  window.tourAtivo = true;
  if (typeof window.pausarTrace === 'function') window.pausarTrace(true);
  tourMontar();
  tour.card.classList.toggle('os', !!opts.os);
  window.addEventListener('resize', tourPosicionar);
  // reposiciona sempre (janelas mexem) e confere os passos que esperam ação
  tour.pollId = setInterval(() => {
    if (!state.rodando) { tourFechar(); return; }
    const p = tour.passos[tour.i];
    if (p && p.esperar && p.esperar()) { tourProximo(); return; }
    tourPosicionar();
  }, 250);
  tourRender();
}

/* ---------- ATO 1 ---------- */
function tourAto1() {
  tourIniciar([
    { titulo: 'Bem-vindo, invasor',
      texto: ['O computador está desligado e travado pelo firewall. Para ele ligar, você precisa destravar as 6 peças mínimas, uma de cada vez.',
        'Vou te mostrar cada parte da tela. O trace fica pausado enquanto o tutorial estiver aberto.'] },
    { alvo: '#packet', titulo: '1. A pista',
      texto: 'Este é o pacote interceptado. Ele descreve a peça que está bloqueada agora. Leia com atenção: a resposta é o NOME dessa peça.' },
    { alvo: '#slots', titulo: '2. As casinhas',
      texto: 'Cada casinha é uma letra da resposta. Conte as casinhas: elas dizem o tamanho da palavra.' },
    { alvo: '#term', titulo: '3. O terminal',
      texto: ['Clique aqui, digite a resposta e aperte Enter (ou EXECUTAR SCAN).', 'Pode escrever sem acento e sem espaço. Errar aumenta o trace, então pense antes.'] },
    { alvo: '#btn-brute', titulo: '4. Travou? BRUTE FORCE',
      texto: 'Revela uma letra da palavra numa casinha. Custa +10% de trace e só dá para usar 3 vezes no jogo inteiro.' },
    { alvo: '#btn-sniff', titulo: '5. Ainda travado? SNIFF',
      texto: 'Mostra uma dica extra sobre a palavra. Custa +5% de trace, uma vez por palavra.' },
    { alvo: '#screen-game .trace', titulo: '6. O TRACE',
      texto: ['É o quanto o firewall já te rastreou. Sobe sozinho com o tempo e a cada erro.', 'Verde está tranquilo, âmbar é alerta, vermelho é perigo. Em 100% é GAME OVER.'] },
    { alvo: '.sidebar', titulo: '7. Os módulos',
      texto: 'Aqui você acompanha as 16 peças do computador. Cada acerto deixa uma ONLINE. Com as 6 primeiras, o PC liga e começa o Ato 2.' },
    { titulo: 'Sua vez',
      texto: ['Leia a primeira pista e digite o nome da peça. Dica: ela é chamada de cérebro do computador.',
        'Digite "help" no terminal para ver os comandos, ou "tutorial" para rever este guia.'],
      botao: 'Começar invasão' }
  ], { fim: () => { tourMarcar('ato1'); const i = $('term-input'); if (i) i.focus(); } });
}

/* ---------- ATO 2 (começa depois de abrir o e-mail do tutorial) ---------- */
const tIdx = (r) => ETAPAS.findIndex((e) => e.resposta === r);
const winApp = (id) => document.querySelector('.rw-win[data-app="' + id + '"]');

function tourAto2() {
  const q = tIdx('QUADCORE');
  tourIniciar([
    { alvo: () => winApp('email'), titulo: 'O PC ligou!',
      texto: ['Agora faltam 10 peças. Desta vez NÃO tem pista na tela: elas estão ESCONDIDAS dentro do computador, em pastas, arquivos, e-mails, sites e programas.',
        'Vamos achar a primeira juntos. Leia este e-mail do fuchs se quiser e clique em Próximo.'] },
    { alvo: () => document.querySelector('.rw-win[data-app="email"] .em-item:nth-child(2)'), titulo: '1. Abra este e-mail',
      texto: 'Clique no e-mail "Upgrade aprovado". Ele tem a pista de uma peça.',
      esperar: () => window.appsA2 && window.appsA2.coletados ? window.appsA2.coletados.has(q) : state.online.has(q),
      aguardando: 'Clique no e-mail destacado...',
      acao: { label: 'Abrir o E-mail', fn: () => window.dkAbrirApp('email') } },
    { alvo: '#dk-balloon', titulo: 'Pista encontrada!',
      texto: ['Quando você acha uma pista, toca um bipe e aparece este balão: "Pacote interceptado".',
        'Toda pista encontrada vai automaticamente para o Terminal. É lá que você responde.'] },
    { alvo: () => winApp('terminal') || document.querySelector('.dk-icon[data-app="terminal"]'), titulo: '2. Abra o Terminal',
      texto: 'Dê duplo clique no ícone Terminal (root.exe), ou use o menu Iniciar. No celular, um toque basta.',
      esperar: () => !!winApp('terminal'),
      aguardando: 'Abra o Terminal (root.exe)...',
      acao: { label: 'Abrir para mim', fn: () => window.dkAbrirApp('terminal') } },
    { alvo: () => document.querySelector('.rw-win[data-app="terminal"] .t2-pkts'), titulo: '3. Pacotes coletados',
      texto: ['Aqui ficam as pistas que você já achou. Clique numa para ler e selecionar.',
        'BRUTE FORCE e SNIFF agem sobre o pacote selecionado nesta lista.'] },
    { alvo: () => document.querySelector('.rw-win[data-app="terminal"] .term'), titulo: '4. Responda',
      texto: ['O e-mail falava de um processador de quatro núcleos. Em inglês: QUAD + CORE.',
        'Digite QUADCORE aqui e aperte Enter.'],
      esperar: () => state.online.has(q),
      aguardando: 'Digite a resposta e aperte Enter...' },
    { titulo: 'Módulo online!',
      texto: ['Cada acerto aqui no Ato 2 também DIMINUI o trace: −5%, ou −8% se você não usou nenhuma dica naquela palavra.',
        'Dá para responder em qualquer ordem, e até sem ter achado a pista, se você souber.'] },
    { alvo: '#dk-icons', titulo: '5. Agora é com você: explore',
      texto: ['As outras 9 pistas estão escondidas nestes ícones. Abra tudo: pastas, arquivos .txt, Lixeira, Internet, Painel de Controle, Gerenciador de Tarefas, LogicNão...',
        'Algumas pistas estão à vista; outras são enigmas (ordenar, decifrar, montar circuitos). Leia tudo com calma, inclusive os detalhes.'] },
    { alvo: '#tray-defender', titulo: '6. ROOT Defender',
      texto: ['O antivírus mostra o seu trace. De vez em quando ele faz uma varredura (o trace acelera) ou uma verificação de integridade: acertando, o trace cai 5%.',
        'Cuidado com arquivos-armadilha: tem coisa que pede para não ser aberta.'] },
    { alvo: '#screen-desktop .trace', titulo: 'Boa invasão',
      texto: 'O trace volta a subir quando você fechar este tutorial. Para rever o guia, digite "tutorial" no Terminal.',
      botao: 'Começar a explorar' }
  ], { os: true, fim: () => tourMarcar('ato2') });
}

window.tourAto1 = tourAto1;
window.tourAto2 = tourAto2;
window.tourVisto = tourVisto;
window.tourFechar = tourFechar;
