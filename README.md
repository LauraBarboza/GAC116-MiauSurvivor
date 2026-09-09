# Miau Survivor

Um jogo de sobrevivência em arena com arte pixelada original, feito exclusivamente com HTML, CSS e JavaScript puro para a Atividade Prática 1 de GAC116 — Programação Web.

## Dados do projeto

```json
{
  "nome": "Miau Survivor",
  "descricao": "Controle um gatinho em uma arena pixelada, sobreviva aos cachorros com três vidas e tiros automáticos, colete XP e escolha melhorias para alcançar a maior pontuação possível.",
  "autores": "Laura Costa Sarto Barboza",
  "turma": "14A"
}
```

## Versão publicada

**GitHub Pages:** PREENCHER_APOS_PUBLICAR

Substitua o texto acima pelo endereço real do jogo depois da publicação, por exemplo: `https://SEU-USUARIO.github.io/miau-survivor/`. Esse exemplo é apenas um modelo e não corresponde a uma publicação já realizada.

## Objetivo e regras

Sobreviver pelo maior tempo possível e superar o recorde de pontos. A arena é infinita em duração: a derrota acontece quando as três vidas acabam, sem condição de vitória fixa.

1. Clique em **Começar partida**. Toda partida começa no nível 1, com três vidas e atributos básicos.
2. Mova o gato com **WASD** ou **setas**. O movimento diagonal é normalizado para manter a mesma velocidade. No celular, segure os botões direcionais abaixo da arena; duas direções permitem andar na diagonal.
3. O gato atira sozinho no cachorro mais próximo. Os projéteis seguem a direção definida no disparo e atingem um inimigo cada.
4. Cachorros surgem em posições aleatórias nas bordas e perseguem o jogador. O contato custa uma vida. Depois do dano, o gato pisca e fica invulnerável por **1,8 segundo**, evitando perder todas as vidas de uma vez.
5. Cada cachorro derrotado deixa um cristal de XP. A menos de 90 unidades do gato, ele é atraído; a menos de 19 unidades, é coletado.
6. O primeiro nível exige 5 XP. O custo aumenta em 3 XP a cada nível: 5, 8, 11, 14… O XP excedente é mantido.
7. Ao subir de nível, a partida pausa e oferece **três melhorias aleatórias distintas**. Escolha com clique, toque ou teclas **1, 2 e 3**. As melhorias se acumulam durante a partida.
8. A frequência de surgimento e a velocidade dos cachorros aumentam com o tempo. Bulldogs aparecem depois de 12 segundos.
9. A pontuação é **10 pontos por XP gerado ao derrotar cachorros + 1 ponto por segundo completo sobrevivido**. Não é necessário coletar o XP para receber os pontos da derrota do inimigo.
10. Use **P**, **Esc** ou **Pausar** para pausar e continuar. Ao sair da aba ou perder o foco, a partida pausa automaticamente.
11. Ao perder todas as vidas, veja o resultado e clique em **Tentar de novo**. Tempo, pontos, inimigos, XP e melhorias são reiniciados. Somente o recorde permanece.

### Inimigos

| Cachorro | Aparência | Resistência | Velocidade inicial | XP / Pontos |
| --- | --- | --- | --- | --- |
| Vira-lata | Marrom, médio | 2 de vida | 51 unidades/s | 1 / 10 |
| Caramelo | Dourado, pequeno | 1 de vida | 79 unidades/s | 1 / 10 |
| Bulldog | Cinza, grande | 5 de vida | 33 unidades/s | 3 / 30 |

### Melhorias

| Melhoria | Efeito por escolha |
| --- | --- |
| Tiro gigante | Aumenta o tamanho do projétil em 25%; raio efetivo máximo de 30 unidades. |
| Rajada | Reduz o intervalo de disparo em 15%; intervalo efetivo mínimo de 0,08 segundo. |
| Garras afiadas | Adiciona 1 de dano por projétil. |
| Patas ligeiras | Aumenta a velocidade do gato em 12%. |

O gato começa com 1 de dano, raio de tiro de 5 unidades, intervalo de 0,52 segundo e velocidade de 170 unidades/s. A arena usa coordenadas internas, redimensionadas visualmente conforme a tela. Para preservar desempenho em partidas longas, há até 110 inimigos simultâneos, e cristais excedentes são agrupados sem perder seu valor de XP.

## Como instalar e jogar

1. Extraia **todo o ZIP** para uma pasta.
2. Abra `index.html` no navegador.
3. Clique em **Começar partida**.

Não é necessário instalar pacotes, executar compilação ou usar um servidor. O jogo funciona offline. Mantenha `index.html`, `style.css` e `script.js` juntos. Use um navegador com Canvas 2D e JavaScript habilitado. Em celulares, o acesso pelo GitHub Pages é mais simples que abrir arquivos locais.

O recorde fica no `localStorage` do navegador, quando permitido. Ele pode variar entre navegadores, arquivos locais e a versão publicada. Se o armazenamento estiver bloqueado, o jogo continua funcionando e mantém o recorde apenas durante a sessão. Nenhum dado é enviado a servidores.

## Tecnologias e organização

- **HTML5:** estrutura semântica, HUD, instruções, botões e Canvas.
- **CSS3:** cores, layout responsivo, estados de foco e aparência pixelada.
- **JavaScript puro:** manipulação do DOM, eventos de teclado/toque, estados, colisões, pontuação, XP e animação com `requestAnimationFrame`.
- **Canvas 2D:** arena, sprites e partículas desenhados com formas básicas e mapas de caracteres.
- **Web Storage:** recorde local opcional.

Não há frameworks, bibliotecas, fontes externas, imagens externas, serviços remotos ou dependências. A referência ao gênero survivor/arena é mecânica; os sprites e o cenário são originais deste projeto.

```text
miau-survivor/
├── index.html   # Estrutura e instruções
├── style.css    # Aparência e responsividade
├── script.js    # Mecânica, desenho e eventos
├── README.md    # Dados e documentação
└── LICENSE      # Licença MIT
```

### Organização da lógica

- `freshGame` cria o estado inicial; `setMode` gerencia início, jogando, pausa, melhoria e derrota.
- `update` movimenta entidades e resolve disparos, contato e coleta de XP usando o tempo entre quadros.
- `levelUp` oferece melhorias; `chooseUpgrade` aplica a escolha.
- `draw` desenha a arena e os sprites; o fundo é desenhado uma vez e reutilizado.
- `syncHud` atualiza pontos, vidas, tempo e experiência no DOM.
- `start` também é usado no reinício para evitar sobras da partida anterior.

## Publicar no GitHub Pages

1. Crie um repositório **público**, por exemplo `miau-survivor`.
2. Envie os cinco arquivos desta pasta para a raiz do repositório. O `index.html` deve ficar na raiz, sem uma pasta extra envolvendo os arquivos.
3. Nas configurações do repositório, abra **Pages** e selecione a publicação por branch (**Deploy from a branch**), branch `main` e pasta `/ (root)`.
4. Salve e aguarde a conclusão da publicação. Abra o endereço fornecido pelo GitHub e teste o jogo.
5. Substitua `PREENCHER_APOS_PUBLICAR` neste README pelo endereço real.
6. Envie no Campus Virtual o **link do repositório**, conforme o enunciado.

A publicação e o envio acadêmico não são realizados automaticamente pelo ZIP. Segundo o PDF, o prazo de entrega é **10/09/2026 às 12h**, e a apresentação ocorre em **10/09/2026**, no horário da aula.

## Checklist de verificação

- [ ] Abrir `index.html` após extrair o ZIP e iniciar com três vidas e zero pontos.
- [ ] Mover com WASD e setas; verificar limites da arena e tiro automático.
- [ ] Derrotar cachorros, coletar cristais e escolher uma melhoria.
- [ ] Confirmar que o tempo fica parado durante pausa e escolha de melhoria.
- [ ] Sofrer contato, observar proteção temporária e chegar à derrota após três danos.
- [ ] Reiniciar e confirmar o reset completo da partida e a manutenção do recorde.
- [ ] Testar os botões direcionais no celular.
- [ ] Publicar, preencher o link acima e testar a versão do GitHub Pages.

## Roteiro sugerido para a apresentação (até 3 minutos)

- **0:00–0:30:** apresentar nome, objetivo e tecnologias utilizadas.
- **0:30–1:15:** demonstrar movimento, tiro automático, vidas e inimigos.
- **1:15–2:00:** mostrar coleta de XP, escolha de melhorias e pontuação.
- **2:00–2:40:** demonstrar pausa, derrota e reinício.
- **2:40–3:00:** mostrar a organização dos arquivos e o endereço publicado.

## Licença

MIT — consulte `LICENSE`. Autora: **Laura Costa Sarto Barboza**, turma **14A**.
