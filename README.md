<div align="center">

<img src="assets/header.svg" alt="ROOT ACCESS — boot do sistema com firewall ativo" width="100%">

<br>

**`> jogo de terminal sobre Arquitetura Computacional`**

[![JOGAR](https://img.shields.io/badge/%3E_JOGAR_AGORA-39FF88?style=for-the-badge&labelColor=06080A)](reservado)
![HTML](https://img.shields.io/badge/HTML-puro-5CD8FF?style=for-the-badge&labelColor=0B1013)
![CSS](https://img.shields.io/badge/CSS-puro-5CD8FF?style=for-the-badge&labelColor=0B1013)
![JS](https://img.shields.io/badge/JavaScript-vanilla-FFB547?style=for-the-badge&labelColor=0B1013)

</div>

```
root@sys:~$ cat MISSAO.txt
```

> O computador está desligado e o **firewall travou os 16 módulos de hardware**.
> Seu trabalho é religar a máquina **módulo por módulo**, na ordem, adivinhando o nome
> de cada componente a partir de um **pacote interceptado**, antes que o
> rastreamento chegue a **100%**.

---

## `[ OK ]` Como jogar

```
[  OK  ] Fonte de energia estabilizada
[ LOCK ] Módulo 01 bloqueado — aguardando chave...
root@sys:~$ _
```

1. **Leia o pacote interceptado:** é a pista sobre o componente bloqueado.
2. **Digite o nome do componente** no terminal. As casinhas mostram quantas letras ele tem.
3. **Aperte Enter** ou clique em **`> EXECUTAR SCAN`**.
4. Acertou? O boot continua e o módulo fica **ONLINE**. Errou? O **TRACE** sobe.
5. Libere os 16 módulos e ganhe **ACESSO ROOT**.

> Respostas são conferidas em MAIÚSCULAS, sem acento e sem espaço.
> `arq. comp` vira `ARQCOMP`.

<div align="center">
<img src="assets/modules.svg" alt="Os 16 módulos ficando online em sequência" width="100%">
</div>

---

## `[ WARN ]` O TRACE

<div align="center">
<img src="assets/trace.svg" alt="Barra de trace subindo de verde para âmbar e vermelho" width="100%">
</div>

O firewall está te procurando. A barra de rastreamento sobe sozinha e a cada deslize:

| Evento | Trace |
|:--|:--:|
| A cada 6 segundos | `+1%` |
| Chave errada | `+10%` |
| BRUTE FORCE | `+10%` |
| SNIFF | `+5%` |

- **verde**: abaixo de 40%, seguro
- **âmbar**: de 40% a 79%, alerta
- **vermelho**: 80% ou mais, o alarme toca
- **100% = `CONEXÃO RASTREADA`** (game over)

---

## `[ HINT ]` Dicas

| Ferramenta | Custo | O que faz |
|:--|:--:|:--|
| **`BRUTE FORCE`** | `+10%` | Revela uma letra aleatória da resposta (em âmbar). Nunca revela a última que falta. |
| **`SNIFF`** | `+5%` | Mostra uma dica extra sobre a palavra. Só uma vez por módulo. |

---

## `[ LOCK ]` Fase 4: pacotes criptografados

Nos módulos **13 a 16** a pista chega cifrada com a **Cifra de César**: cada letra
foi deslocada por uma chave secreta entre **1 e 25**, sorteada a cada módulo.

```
PACOTE CRIPTOGRAFADO ── chave ?
  Surfhvvdgru frp grlv qúfohrv...

DECODIFICADOR  [ − ]  chave 03  [ + ]
  Processador com dois núcleos...
```

Use os botões **−** e **+** do **DECODIFICADOR** (ou o comando `decrypt --chave N`)
até o texto ficar legível. Só as letras A–Z mudam: acentos e pontuação ficam como estão.

---

## `[ SHELL ]` Comandos do terminal

| Comando | Ação |
|:--|:--|
| `help` | lista os comandos |
| `status` | módulos online, trace, erros, dicas e tempo |
| `brute` | mesmo que o botão BRUTE FORCE |
| `sniff` | mesmo que o botão SNIFF |
| `decrypt --chave N` | aplica a chave N no decodificador (só na fase 4) |
| `clear` | limpa o log |
| `reboot` | reinicia o jogo |

Qualquer outra coisa digitada é tratada como uma tentativa de chave.

---

## `[ SYS ]` Tecnologia

```
index.html   estrutura das telas (boot, jogo, game over, vitória)
style.css    visual de terminal: paleta, scanlines, glitch, CRT
script.js    lógica: etapas, trace, dicas, cifra, comandos, sons, hall
assets/      SVGs animados deste README
```

- HTML, CSS e JavaScript **puros**: sem frameworks, sem bibliotecas, sem build.
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

**[`> INICIAR INVASÃO`](https://enzofuchsb.github.io/arqcomp-cruzadinha/)**

<sub>Projeto acadêmico · Arquitetura Computacional</sub>

</div>
