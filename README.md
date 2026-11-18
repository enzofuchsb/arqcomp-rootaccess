<div align="center">

<img src="assets/header.svg" alt="ROOT ACCESS — boot do sistema com firewall ativo" width="100%">

<br>

**`> jogo de terminal sobre Arquitetura Computacional`**

[![JOGAR](https://img.shields.io/badge/%3E_JOGAR_AGORA-39FF88?style=for-the-badge&labelColor=06080A)](https://enzofuchsb.github.io/arqcomp-rootaccess/)
![HTML](https://img.shields.io/badge/HTML-puro-5CD8FF?style=for-the-badge&labelColor=0B1013)
![CSS](https://img.shields.io/badge/CSS-puro-5CD8FF?style=for-the-badge&labelColor=0B1013)
![JS](https://img.shields.io/badge/JavaScript-vanilla-FFB547?style=for-the-badge&labelColor=0B1013)

</div>

```
root@sys:~$ cat MISSAO.txt
```

> O computador está desligado e o **firewall travou os 16 módulos de hardware**.
> No **Ato 1** você dá a partida no PC ligando as 6 peças mínimas, uma por uma.
> No **Ato 2** o sistema **ROOT/OS 2002** sobe em **modo de segurança**: as outras
> 10 peças estão escondidas em pastas, arquivos e programas. Encontre as pistas e
> religue tudo antes que o rastreamento chegue a **100%**.

---

## `[ OK ]` Ato 1 · Partida (terminal)

```
[  OK  ] Fonte de energia estabilizada
[ LOCK ] Módulo 01 bloqueado — aguardando chave...
root@sys:~$ _
```

1. **Leia o pacote interceptado:** é a pista sobre o componente bloqueado.
2. **Digite o nome do componente.** As casinhas mostram quantas letras ele tem.
3. **Aperte Enter** ou clique em **`> EXECUTAR SCAN`**.
4. As 6 peças vão **em ordem**: `CPU → ROM → RAM → ADDRESSBUS → DATABUS → MEMORIADEMASSA`.
5. Ao ligar a memória de massa: `[ OK ] Sistema operacional encontrado no disco` → tela de carregamento do **ROOT/OS 2002** → desktop.

> Respostas são conferidas em MAIÚSCULAS, sem acento e sem espaço.
> `arq. comp` vira `ARQCOMP`.

<div align="center">
<img src="assets/modules.svg" alt="Os módulos ficando online em sequência" width="100%">
</div>

---

## `[ SYS ]` Ato 2 · Sistema (desktop ROOT/OS 2002)

Um sistema operacional com cara de anos 2000, mas com identidade própria: papel de
parede de trilhas de placa de circuito, barra de tarefas azul, botão **Iniciar**,
relógio, bandeja com o escudo do **ROOT Defender** e o aviso **"Modo de segurança"**
nos quatro cantos. As janelas abrem com duplo clique, arrastam pela barra de título,
minimizam para a barra de tarefas e, no celular, abrem em tela cheia.

**Como funciona**

- **Tutorial:** ao entrar no desktop, um pop-up avisa que há uma mensagem nova. O e-mail
  do **fuchs** explica o Ato 2 e termina com um exemplo: abrir o e-mail logo abaixo,
  que traz a dica da próxima palavra.
- Explore os programas. Ao abrir o lugar certo pela primeira vez, a pista é
  **coletada**: bipe + balão `Pacote interceptado: PKT#NN`.
- Abra o **Terminal (root.exe)**. À esquerda fica a lista **PACOTES COLETADOS**
  (número, onde foi achado e a pista). O que falta aparece como `PKT#?? — não encontrado`.
- Digite **qualquer resposta, em qualquer ordem**. Se bater com um módulo pendente,
  ele fica **ONLINE**. Dá até para acertar antes de achar a pista.
- **BRUTE FORCE** e **SNIFF** agem sobre o **pacote selecionado** (clique nele na lista).
- No Ato 2 as casinhas ficam **escondidas**: só aparecem depois de usar SNIFF ou BRUTE FORCE no pacote. Na barra lateral, os módulos pendentes aparecem como `▒▒▒`, sem indicar o tamanho.
- Digitar uma resposta que **já está online** conta como erro (`módulo já está online`, +10%).

**Enigmas** (valores sorteados a cada partida)

| Onde | Enigma |
|:--|:--|
| **Painel de Controle › Sistema** | Ordenar os cartões BUSCAR, DECODIFICAR, EXECUTAR, ARMAZENAR (arrastar ou ← →) e Aplicar. Errou: **+3%**. |
| **notas_do_admin.txt + Painel de Controle › BIOS** | As notas têm um mini programa (MOV, ADD, SUB, MUL). O valor final de A é o PIN da BIOS. PIN errado: **+5%**. |
| **Internet** | Sem a CACHE online, as páginas carregam lentas e cortadas. A página certa está no **Histórico**. Com a CACHE online, tudo carrega normal. |
| **Disco removível (E:)** | Só aparece com o DMA online. `leia_me.txt` está em 4 blocos fora de ordem: ordenar pelo número do setor (arrastar ou ↑ ↓) e Montar arquivo. |
| **Gerenciador de Tarefas** | Só abre com a UC online. Em Desempenho, mover processos entre os núcleos até nenhum passar de 100%. |

**LogicNão** (simulador de portas lógicas)

Circuitos já montados: o jogador só liga e desliga as entradas até o LED acender.
Fios verdes carregam 1, cinza carregam 0. O botão **Ajuda** mostra a tabela verdade
das portas do circuito aberto. Cada circuito libera o seguinte.

| Circuito | Expressão | Recompensa |
|:--|:--|:--|
| 1 | `(A OR B) AND (NOT C)` | `calc_unit.exe` volta a responder e a pista da **ULA** é coletada |
| 2 | `(A XOR B) AND (C OR D) AND NOT (A AND D)` | **+1 BRUTE FORCE grátis** (não sobe o trace) |
| 3 | `NAND(A, B) AND (C XOR D) AND NOR(D, E)` | trace **−40%** |

**Camadas extras**

| Onde | O que acontece |
|:--|:--|
| **Lixeira › relatorio_perifericos.txt** | Texto cifrado com **Cifra de César**. Gire a chave no **DECODIFICADOR** (− / +) ou use `decrypt --chave N` no Terminal. A chave é **sorteada a cada partida** e fica no arquivo oculto `.chave_lixeira` (use `ls -a` e `cat .chave_lixeira`). A pista só conta quando o texto fica legível. |
| **Documentos › Confidencial** | Pasta com senha. Senha errada: **+5%** e "acesso negado". A dica está num e-mail do Admin, que só chega depois que a CACHE fica online. Dentro há a `tabela_morse.txt` (A–Z em Morse). |
| **Documentos › NAO_ABRA.exe** | Armadilha (*honeypot*): a tela pisca em vermelho, o alarme toca, o Defender acusa **AMEAÇA DETECTADA** e o trace sobe **+15%**. |
| **Novo hardware** | Quando os outros 9 módulos do Ato 2 estão online, aparece um dispositivo USB desconhecido no Gerenciador de Dispositivos. O LED dele pisca uma palavra em **código Morse**: identifique a placa no campo abaixo. Errou: **+5%**. |
| **Pistas falsas** | `ssd_backup.tmp` (Disco C:), `volatil.log` (Documentos) e `firmware_antigo.bin` (Lixeira) descrevem módulos que já estão online. Não entram nos pacotes. |

---

## `[ SCAN ]` ROOT Defender

O antivírus do ROOT/OS fica na bandeja mostrando o mesmo % do trace.

| Evento | Quando | Efeito |
|:--|:--|:--|
| **Varredura** | aleatória, a cada 60–120 s | pop-up com barra de progresso; por 10 s o trace passivo sobe **2x mais rápido** |
| **Verificação de integridade** | aleatória, a cada 70–110 s, nunca junto da varredura | mostra a pista de um módulo **já ONLINE**; acertou o nome = **−2%** de trace. Errar ou ignorar não custa nada; fecha sozinha em 20 s |

---

## `[ WARN ]` O TRACE

<div align="center">
<img src="assets/trace.svg" alt="Barra de trace subindo de verde para âmbar e vermelho" width="100%">
</div>

| Evento | Trace |
|:--|:--:|
| Tempo passando no Ato 1 | `+1%` a cada 6 s |
| Tempo passando no Ato 2 | `+1%` a cada 10 s (2x durante a varredura) |
| Chave errada | `+10%` |
| BRUTE FORCE | `+10%` |
| SNIFF | `+5%` |
| Senha errada na pasta Confidencial | `+5%` |
| Placa errada no dispositivo USB | `+5%` |
| Ordem errada no ciclo de instrução (UC) | `+3%` |
| PIN errado na BIOS | `+5%` |
| Abrir NAO_ABRA.exe | `+15%` |
| Verificação de integridade correta | `−2%` |
| LogicNão · Circuito 3 resolvido | `−40%` |

- **verde**: abaixo de 40% · **âmbar**: 40% a 79% · **vermelho**: 80% ou mais, com alarme
- **100% = `CONEXÃO RASTREADA`** (game over, nos dois atos)

---

## `[ HINT ]` Dicas

| Ferramenta | Custo | O que faz |
|:--|:--:|:--|
| **`BRUTE FORCE`** | `+10%` | Revela uma letra aleatória da resposta (em âmbar). Nunca revela a última que falta. |
| **`SNIFF`** | `+5%` | Mostra uma dica extra sobre a palavra. Só uma vez por palavra. |

---

## `[ SHELL ]` Comandos do terminal

| Comando | Ação |
|:--|:--|
| `help` | lista os comandos |
| `status` | módulos online, trace, erros, dicas e tempo |
| `brute` | mesmo que o botão BRUTE FORCE |
| `sniff` | mesmo que o botão SNIFF |
| `decrypt --chave N` | aplica a chave N no arquivo cifrado da Lixeira (com ele aberto) |
| `clear` | limpa o log |
| `ls` | lista os arquivos do sistema (Ato 2) |
| `ls -a` | lista também os arquivos ocultos, que começam com ponto |
| `cat <arquivo>` | mostra o conteúdo de um arquivo |
| `reboot` | reinicia o jogo |

Qualquer outra coisa digitada é tratada como uma tentativa de chave.

---

## `[ SYS ]` Tecnologia

```
index.html   estrutura das telas (boot, Ato 1, carregamento, desktop, game over, vitória)
style.css    visual de terminal + estética do ROOT/OS 2002
script.js    núcleo: dados das 16 palavras, Ato 1, trace, dicas, comandos, sons, hall
desktop.js   desktop do ROOT/OS: ícones, menu Iniciar, barra de tarefas, janelas, balões
apps.js      apps do Ato 2: Terminal root.exe, pistas, Lixeira, Confidencial, honeypot
enigmas.js   enigmas do Ato 2: ciclo de instrução, PIN da BIOS, histórico, setores, núcleos
circuitos.js LogicNão: portas lógicas, circuitos descritos como dados
defender.js  ROOT Defender: varredura e verificação de integridade
assets/      SVGs animados deste README
```

- HTML, CSS e JavaScript **puros**: sem frameworks, sem bibliotecas, sem build.
- Ícones e papel de parede desenhados em **SVG/CSS**, originais.
- Sons gerados na hora com a **Web Audio API**, sem nenhum arquivo de áudio.
- **Hall dos Invasores** salvo no `localStorage` do navegador.
- Fontes: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) e [VT323](https://fonts.google.com/specimen/VT323).
- Publicado no **GitHub Pages**.

---

<div align="center">

```
root@sys:~# whoami
root
```

**[`> INICIAR INVASÃO`](https://enzofuchsb.github.io/arqcomp-rootaccess/)**

<sub>Projeto acadêmico · Arquitetura Computacional</sub>

</div>
