# ROOT ACCESS — guia do desenvolvedor

> **SPOILER TOTAL.** Este arquivo tem todas as respostas, senhas, enigmas e o final.
> É para quem mantém o jogo, não para quem joga.

---

## 1. Como rodar e testar

O jogo é estático (HTML + CSS + JS puros), mas **precisa de um servidor** para a música da batalha carregar.
Abrindo o `index.html` direto (`file://`), o `fetch` do mp3 é bloqueado: o jogo funciona, só que sem música.

```bash
# na pasta do projeto
python -m http.server
# abrir http://localhost:8000/
```

Também funciona com a extensão **Live Server** do VS Code. Publicado em: https://enzofuchsb.github.io/arqcomp-rootaccess/

### Modo debug: `?debug=1`

Abra `http://localhost:8000/?debug=1`. Aparecem dois botões no canto inferior esquerdo:

| Botão | O que faz |
|:--|:--|
| **[debug] ir para a batalha** | Religa os 16 módulos e começa a batalha final com a abertura completa (tem "pular ›"). |
| **[debug] ir para o final** | Igual, mas pula a abertura e a luta: cai direto no último golpe → final cinematográfico → créditos → vitória. |

Com `?debug=1`, **a resposta de cada camada da batalha aparece no console** (F12), como `[debug] resposta: CPU` ou `[debug] exemplo: console.log('hello world')`.

### Atalhos que já existem no jogo

- **Clique na tela de boot** durante a digitação da BIOS: pula a animação.
- **"pular ›"** (canto superior direito): pula a abertura da batalha e o final (o do final vai direto para a vitória).
- Comando **`status`** no terminal: módulos, trace, erros, dicas, tempo, BRUTE FORCE restantes e custo do próximo erro.

### Truques pelo console do navegador (F12)

Todas as variáveis são globais, então dá para mexer no estado na hora:

```js
state.trace = 0; renderTrace();          // zera o trace
state.brutesRestantes = 99;              // BRUTE FORCE infinito
eg.pin                                   // PIN da BIOS desta partida
DMA_CHAVE                                // chave da cifra da Lixeira desta partida
eg.blocos.map(b => b.setor)              // setores do pendrive
eg.cargas                                // cargas dos processos (DUALCORE)
appsColetar('ULA')                       // coleta a pista de uma palavra
lb.resolvidos = [true, true, false]      // libera circuitos do LogicNão
state.stats                              // estatísticas da partida
```

---

## 2. Estrutura dos arquivos

Carregados nesta ordem no `index.html` (a ordem importa, porque um arquivo usa funções do anterior):

| Arquivo | Responsabilidade |
|:--|:--|
| `script.js` | Núcleo: as 16 palavras (`ETAPAS`), estado (`state`), trace, sons (Web Audio), Ato 1, comandos do terminal, erro progressivo, limite de BRUTE FORCE, estatísticas, game over, vitória, título de hacker, Hall dos Invasores, reboot CRT. |
| `desktop.js` | Desktop do ROOT/OS 2002: ícones (`APPS`, `ICONES`), janelas (abrir, arrastar, focar, minimizar, fechar), menu Iniciar, barra de tarefas, relógio, balões, firewall mexendo nas janelas. |
| `apps.js` | Terminal `root.exe` (pacotes, respostas em qualquer ordem, brute/sniff no pacote), e-mail (tutorial), Lixeira (cifra), Documentos (Confidencial, honeypot), pistas falsas, Morse do microcontrolador, `ls`/`cat`, final do Ato 2. |
| `enigmas.js` | Enigmas sorteados: ciclo de instrução (UC), programa + PIN (REGISTRADORES/EEPROM), navegador e histórico (CACHE), setores do pendrive (FLASH), balanceamento de núcleos (DUALCORE). Substitui o `render` desses apps. |
| `circuitos.js` | LogicNão: portas lógicas, circuitos descritos como dados (`CIRCUITOS`). |
| `defender.js` | ROOT Defender: varredura, verificação de integridade, quarentena, firewall reagindo, pop-ups. |
| `batalha.js` / `batalha.css` | Batalha final contra FIREWALL.EXE. |
| `final.js` / `final.css` | Final cinematográfico, créditos, LED da vitória e cena pós-créditos. |
| `style.css` | Visual de terminal, desktop, apps e enigmas. |
| `assets/audio/firewall-rootos.mp3` | Única música (batalha). Todo o resto do som é gerado por código. |

> **Atenção, armadilha conhecida:** todos os JS dividem o **mesmo escopo global**. Duas funções com o mesmo
> nome em arquivos diferentes fazem a de baixo substituir a de cima, sem erro nenhum.
> Já aconteceu: `restaurar` do Defender quebrou o restaurar janelas. Use nomes específicos.
> Para checar duplicados:
> ```bash
> grep -HnoE "^(async )?function [A-Za-z0-9_$]+|^(const|let|var) [A-Za-z0-9_$]+" *.js \
>   | sed -E 's/:[0-9]+:(async )?(function|const|let|var) / /' | awk '{print $2}' | sort | uniq -d
> ```

---

## 3. Fluxo do jogo

```
BOOT → ATO 1 (terminal, 6 palavras em ordem) → CARREGAMENTO ROOT/OS
     → ATO 2 (desktop, 10 palavras em qualquer ordem)
     → falsa vitória → BATALHA FINAL (6 camadas)
     → final cinematográfico → créditos → VITÓRIA → (REBOOT) pós-créditos → BOOT
GAME OVER (trace 100%) pode acontecer em qualquer ponto → REBOOT → BOOT
```

---

## 4. As 16 palavras

Resposta comparada em MAIÚSCULAS, sem acento e sem espaços (`normalizar()` em `script.js`).

### Ato 1 · Partida (em ordem, no terminal)

| # | Resposta | Pista principal | Dica do SNIFF |
|:-:|:--|:--|:--|
| 01 | `CPU` | Chip principal que executa as instruções de todos os programas. | Sigla de 3 letras; costuma ser chamada de cérebro do computador. |
| 02 | `ROM` | Memória só de leitura que guarda o programa de inicialização de fábrica. | Sigla de 3 letras; vem gravada de fábrica e não perde nada ao desligar. |
| 03 | `RAM` | Memória principal de trabalho, volátil: perde tudo quando o computador desliga. | Sigla de 3 letras; quanto mais dela, mais programas abertos ao mesmo tempo. |
| 04 | `ADDRESSBUS` | Vias que indicam qual posição da memória o processador quer acessar. | Duas palavras em inglês juntas; só indica ONDE, nunca leva o conteúdo. |
| 05 | `DATABUS` | Vias por onde as informações viajam entre processador, memória e periféricos. | Duas palavras em inglês juntas; é o caminho que carrega o conteúdo em si. |
| 06 | `MEMORIADEMASSA` | Onde arquivos e sistema ficam guardados mesmo desligado, como HDs e SSDs. | Três palavras em português juntas; o nome lembra grande quantidade. |

### Ato 2 · Sistema (qualquer ordem, no Terminal `root.exe`)

| # | Resposta | Pista principal | Dica do SNIFF |
|:-:|:--|:--|:--|
| 07 | `UC` | Parte da CPU que busca, decodifica instruções e coordena os outros componentes. | Sigla de 2 letras; funciona como o maestro dentro do processador. |
| 08 | `ULA` | Parte da CPU responsável pelos cálculos e pelas comparações lógicas. | Sigla de 3 letras. É ela que soma, subtrai e decide se um valor é maior que outro. |
| 09 | `REGISTRADORES` | Pequenas memórias dentro do processador, as mais rápidas do computador. | Palavra no plural; guardam os valores que a CPU está usando neste instante. |
| 10 | `EEPROM` | Memória não volátil apagável eletricamente, que guarda configurações da BIOS. | Sigla de 6 letras; versão regravável eletricamente de uma memória só de leitura. |
| 11 | `CACHE` | Memória ultrarrápida entre CPU e RAM que guarda o que é mais usado. | Palavra de origem francesa; existe em níveis chamados L1, L2 e L3. |
| 12 | `FLASH` | Memória não volátil regravável em blocos, usada em pendrives e cartões SD. | Palavra curta em inglês que também significa clarão. |
| 13 | `DUALCORE` | Processador com dois núcleos trabalhando ao mesmo tempo. | Duas palavras em inglês juntas; tem tantos núcleos quanto uma pessoa tem olhos. |
| 14 | `QUADCORE` | Processador com quatro núcleos trabalhando ao mesmo tempo. | Duas palavras em inglês juntas; tem tantos núcleos quanto um carro tem rodas. |
| 15 | `DMA` | Recurso que deixa periféricos lerem e gravarem na RAM sem ocupar a CPU. | Sigla de 3 letras; libera o processador enquanto um periférico copia informações. |
| 16 | `MICROCONTROLADOR` | Chip com processador, memória e entradas/saídas juntos, como o do Arduino. | Palavra longa, com um prefixo que significa muito pequeno. |

Os dados ficam no array `ETAPAS` em `script.js` (`{ ato, resposta, pista, sniff, logOk, local }`).

---

## 5. Onde cada pista do Ato 2 está (passo a passo)

A pista é **coletada** (bipe + balão "Pacote interceptado: PKT#NN" + entra no Terminal) quando o jogador resolve/abre o lugar certo.
O jogador **pode responder uma palavra sem ter a pista**.

| Palavra | Onde / como resolver | Depende de |
|:--|:--|:--|
| **QUADCORE** | E-mail › "Upgrade aprovado" (Suporte TI). É o **exemplo do tutorial**: não mexer. | nada |
| **REGISTRADORES** | Abrir `notas_do_admin.txt` (Bloco de Notas). | nada |
| **UC** | Painel de Controle › Sistema: ordenar os cartões **BUSCAR → DECODIFICAR → EXECUTAR → ARMAZENAR** (arrastar ou ← →) e clicar em Aplicar. Ordem errada: +3%. | nada |
| **EEPROM** | Painel de Controle › BIOS: digitar o **PIN** = valor final de `A` no programa `pin_bios.asm` dentro das notas do admin (sorteado; ver `eg.pin`). PIN errado: +5%. | notas do admin |
| **CACHE** | Internet › botão **Histórico** › "Por que meu PC está tão lento?" (a cópia do histórico abre inteira). Sem CACHE online, as páginas carregam lentas e cortadas. | nada |
| **ULA** | **LogicNão › Circuito 1** resolvido: `calc_unit.exe` volta a responder e a pista é coletada. Ex.: A=1, B=0, C=0. | nada |
| **DUALCORE** | Gerenciador de Tarefas › Desempenho: mover processos entre Núcleo 1 e 2 até nenhum passar de 100%. | **UC online** (senão: "nenhum componente está coordenando as instruções") |
| **DMA** | Lixeira › `relatorio_perifericos.txt` (cifra de César). A chave (1–25, sorteada) está no arquivo oculto: Terminal `ls -a` → `cat .chave_lixeira`. Girar o DECODIFICADOR (− / +) ou `decrypt --chave N` até a chave certa. | nada |
| **FLASH** | Meu Computador › Disco removível (E:) › `leia_me.txt`: ordenar os 4 blocos pelo **número do setor**, do menor para o maior, e clicar em Montar arquivo. | **DMA online** (o E: só aparece depois) |
| **MICROCONTROLADOR** | Depois dos outros 9 do Ato 2: balão "Novo hardware encontrado" → Painel de Controle › Gerenciador de Dispositivos › Abrir dispositivo. O LED pisca **ARDUINO** em Morse; digitar `ARDUINO` em "Identificar placa". Errado: +5%. Passo a passo abaixo. | os outros 9 online |

### Como encontrar o MICROCONTROLADOR (passo a passo)

É a última pista do Ato 2 e a única que **não existe no começo**: ela só aparece quando
os **outros 9 módulos do Ato 2 estão ONLINE** (UC, ULA, REGISTRADORES, EEPROM, CACHE,
FLASH, DUALCORE, QUADCORE e DMA). Coletar as pistas não basta: as 9 palavras precisam ter
sido **respondidas no Terminal**.

1. Responda os 9 módulos no Terminal `root.exe`. Ao ficar online o 9º, toca um bipe e
   aparece o balão **"Novo hardware encontrado — Dispositivo USB desconhecido"** (~1 s depois).
2. Abra o **Painel de Controle** e clique em **Gerenciador de Dispositivos**.
   - Se o Painel já estava aberto nessa seção, clique de novo em "Gerenciador de Dispositivos"
     para atualizar a lista: ela só é montada quando a seção é aberta.
3. No fim da lista aparece **"Dispositivo USB desconhecido — driver ausente"** e, abaixo,
   o botão **Abrir dispositivo**. Clique nele.
4. Um LED desenhado pisca uma palavra em **código Morse**, em loop:
   - sinal **curto** (~0,2 s) = ponto · sinal **longo** (~0,8 s) = traço
   - pausa curta entre sinais, pausa de ~1 s entre letras, pausa longa (~3 s) antes de repetir
   - a palavra é **ARDUINO**: `.-` `.-.` `-..` `..-` `..` `-.` `---`
   - a tabela Morse completa está em Documentos › **Confidencial** › `tabela_morse.txt`
     (senha `RAM2002`, cuja dica chega no e-mail do Admin depois da CACHE online).
5. No campo **"Identificar placa"**, digite `ARDUINO` e clique em Identificar.
   - Certo: "Placa identificada: chip com processador, memória e entradas/saídas juntos." e a pista é coletada.
   - Errado: "Placa não reconhecida." e **+5% de trace**.
6. Responda **`MICROCONTROLADOR`** no Terminal. Com os 16 online, começa o final do Ato 2.

> Atalho: a resposta pode ser digitada no Terminal **a qualquer momento**, mesmo sem ver o
> dispositivo (como todas as do Ato 2). O LED é só a pista.
>
> Para testar rápido pelo console (F12), depois de entrar no desktop:
> `[6,7,8,9,10,11,12,13,14].forEach(i => state.online.add(i)); appsOnline(14); updateStats(); renderModules();` (índices 6–14 = UC até DMA)
> e abra Painel de Controle › Gerenciador de Dispositivos.

### Outros segredos do Ato 2

| Item | Detalhe |
|:--|:--|
| Senha da pasta **Confidencial** (Documentos) | `RAM2002`. Errada: +5%. A dica vem no e-mail do **Admin**, que só chega **depois da CACHE online** (balão "Nova mensagem recebida"). Dentro: `tabela_morse.txt` (A–Z). |
| **NAO_ABRA.exe** (Documentos) | Honeypot: tela pisca vermelho, alarme, pop-up "AMEAÇA DETECTADA", +15%. Toda vez que abrir. |
| **Pistas falsas** (não entram nos pacotes) | `ssd_backup.tmp` (Disco C:) → MEMORIADEMASSA; `volatil.log` (Documentos) → RAM; `firmware_antigo.bin` (Lixeira) → ROM. Digitar resposta já online = erro "módulo já está online". |
| Arquivos do Terminal | `ls`: `notas_do_admin.txt sistema.cfg root.exe` · `ls -a` acrescenta `.chave_lixeira` e `.config_shell` (este é decoy). |
| Tutorial | Ao entrar no desktop, pop-up manda abrir o E-mail; o e-mail do **Fuchs** explica o jogo e aponta o "Upgrade aprovado" como exemplo. |

### LogicNão (circuitos)

| Circuito | Expressão | Uma solução | Recompensa |
|:--|:--|:--|:--|
| 1 | `(A OR B) AND (NOT C)` | A=1, B=0, C=0 | `calc_unit.exe` responde + pista da **ULA** |
| 2 | `(A XOR B) AND (C OR D) AND NOT (A AND D)` | A=1, B=0, C=1, D=0 | +1 BRUTE FORCE (grátis: não sobe o trace) |
| 3 | `NAND(A, B) AND (C XOR D) AND NOR(D, E)` | só C=1 | trace −40% |

Para criar outro circuito: acrescentar um objeto em `CIRCUITOS` (`circuitos.js`) com entradas, portas (tipo, posição, ligações), saída e `recompensa()`.

### Valores sorteados a cada partida

Ordem inicial dos cartões da UC, programa do admin e PIN, 4 setores do pendrive, cargas dos 6 processos, chave da cifra da Lixeira.
Tudo é gerado em `gerarEnigmas()` (`enigmas.js`) e `sortearDma()` (`apps.js`), chamados a cada nova invasão.

---

## 6. Mecânicas e números

| Mecânica | Valor |
|:--|:--|
| Trace passivo | Ato 1: +1% a cada 6 s · Ato 2 e batalha: +1% a cada 10 s |
| Cores do trace | verde < 40 · âmbar 40–79 · vermelho ≥ 80 (alarme ao passar de 80) · 100% = game over |
| Resposta errada (jogo inteiro, progressivo) | +10%, +12%, +15%, +18%, depois +20% fixo |
| BRUTE FORCE | +10% · **3 usos no jogo inteiro** (+1 pelo circuito 2) · nunca revela a última letra |
| SNIFF | +5% · uma vez por palavra |
| Casinhas no Ato 2 | escondidas até usar SNIFF ou BRUTE FORCE no pacote; sidebar mostra `▒▒▒` |
| Ordem errada (UC) / PIN errado / senha errada / placa errada | +3% / +5% / +5% / +5% |
| Honeypot | +15% |
| Restaurar pacote da quarentena | +3% |
| Verificação de integridade correta | −2% |
| LogicNão circuito 3 | −40% |
| Erro na batalha (ou tempo esgotado) | +15% fixo (não entra no progressivo) |

### ROOT Defender (`defender.js`)

| Evento | Quando | Efeito |
|:--|:--|:--|
| Varredura | a cada 60–120 s | pop-up de 10 s; trace passivo 2x |
| Verificação de integridade | a cada 70–110 s (nunca junto da varredura) | pista de um módulo online; acertou = −2%; fecha em 20 s |
| Quarentena | pacote coletado há 3 min sem resposta | some do Terminal; restaurar pelo escudo da bandeja (+3%, timer zera) |
| Firewall reagindo | a cada 25–35 s com trace ≥ 70% | fecha uma janela aleatória e embaralha os ícones |

### Comandos do terminal

`help` · `status` · `brute` · `sniff` · `decrypt --chave N` · `ls` · `ls -a` · `cat <arquivo>` · `clear` · `reboot`.
Qualquer outro texto é testado como resposta.

---

## 7. Batalha final (`batalha.js`)

- Começa quando o 16º módulo fica online (`sistemaOtimizado()` em `apps.js` chama `batalhaIniciar()`).
- Abertura: falsa vitória (~3 s) → relógio para / cursor congela → desktop desmonta → terminal digita → chefe se monta → olho abre e trava no cursor → cartão de título → primeira fala com dados reais.
- **O trace volta a 0%** no começo da luta. O chefe avisa com quanto o jogador chegou ("Você estava com XX%. Reiniciei em 0%..."; a frase muda conforme o valor). Se a abertura for pulada, a fala acontece no início da luta.
- **6 camadas**, sem SNIFF/BRUTE: 4 pistas (sorteadas entre as 16) + 2 golpes de código JavaScript, em posições sorteadas. **15 s** por camada (`TEMPO_RESPOSTA`).
- Erro ou tempo: +15% e o chefe ataca. A cada 2 erros ele **regenera** 1 camada ("Restaurando backup...").
- Fases (surpresa para o jogador): **4 de vida** → chamas vermelhas, "Chega de brincadeira."; **2 de vida** → glitch, chamas azuis, música acelera.
- Música: `assets/audio/firewall-rootos.mp3` em loop via Web Audio; pré-carregada no início do Ato 2; 1,06x na fase 2 e 1,12x na fase 3.
- O código digitado **nunca é executado**: é comparado por regex (aceita aspas simples/duplas/crase, espaços, `;` opcional; mensagens sem diferenciar maiúsculas).

### Os 11 golpes do firewall (respostas de exemplo)

| Golpe | Pedido | Exemplo aceito |
|:--|:--|:--|
| CONSOLE BLOCK | Escreva "hello world" no console | `console.log('hello world')` |
| VARIABLE LOCK | Variável `senha` com o valor "root" | `let senha = 'root'` (let/const/var) |
| ALERT STORM | Alerta com a mensagem "acesso" | `alert('acesso')` |
| SUM STRIKE | Soma de 2 e 3 no console | `console.log(2 + 3)` |
| UPPERCASE CRUSH | "root" em maiúsculas | `'root'.toUpperCase()` |
| LENGTH LASER | Tamanho de "firewall" no console | `console.log('firewall'.length)` |
| DOM GRAB | Elemento com id "terminal" | `document.getElementById('terminal')` |
| FUNCTION FREEZE | Função vazia `hackear` | `function hackear() {}` |
| ARRAY WALL | Array `portas` com 'AND', 'OR', 'NOT' | `let portas = ['AND', 'OR', 'NOT']` |
| IF TRAP | if para trace > 80 | `if (trace > 80) {}` |
| LOOP LOCKDOWN | for de i = 0 enquanto i < 3 | `for (let i = 0; i < 3; i++) {}` |

Para adicionar um golpe: novo objeto no array `GOLPES` com `nome`, `enunciado`, `re` (montado com os helpers `str()`, `LOG`, `DECL`, `re()`) e `exemplo`. Garanta que o `exemplo` passa no próprio `re`.

---

## 8. Final, vitória e pós-créditos (`final.js`)

1. Último golpe em câmera lenta → tela branca → música corta (silêncio).
2. Desmoronamento: tijolos caem, chamas viram fumaça, o olho cai, rola, pisca e sussurra "...acesso... concedido...".
3. `root@sys:~$` → `#` → `whoami` → `root`.
4. Créditos em boot log: as 16 peças com a pista, `FIREWALL.EXE — encerrado`, `Sistema 100% operacional`, "ROOT ACCESS / Desenvolvido por Fuchs — Arquitetura Computacional 2026". "pular ›" vai direto para a vitória.
5. Vitória: **título de hacker** (erros incluem os da batalha; dicas = SNIFF + BRUTE FORCE):

   | Título | Condição | Frase |
   |:--|:--|:--|
   | ROOT LENDÁRIO | até 3 erros e até 2 dicas | "O firewall nem viu você passar." |
   | HACKER | até 8 erros e até 6 dicas | "Invasão limpa. Quase." |
   | SCRIPT KIDDIE | o resto | "Você entrou. Mas o sistema viu tudo." |

   LED da plaquinha no canto pisca **OBRIGADO** em Morse (sem tradução na tela).
6. REBOOT na vitória → pós-créditos: 2 s de preto, um tijolo com um olhinho, "reiniciando em 3... 2..." e corte seco para o boot.

O tempo da partida congela no último golpe (o final não conta no Hall).

---

## 9. Armazenamento local

| Chave do `localStorage` | Conteúdo |
|:--|:--|
| `rootaccess-hall` | Hall dos Invasores: `[{ id, nome, tempo, titulo }]` (top 5 por menor tempo) |
| `rootaccess-som` | `on` / `off` |

Sempre dentro de `try/catch`. Para limpar o Hall: `localStorage.removeItem('rootaccess-hall')`.