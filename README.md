# Megaman Arena Tribute — Website

Site paralelo que hospeda o build Web (Godot 4.7) do jogo **Megaman Arena Tribute**
(Project UNIT-X). Publicado via GitHub Pages:
<https://thegamerspub.github.io/MegamanArenaTribute-Website/>

Código-fonte do jogo: [TheGamersPub/MegamanArena-Tribute](https://github.com/TheGamersPub/MegamanArena-Tribute)

## Estrutura

```
build/             Export Web do Godot (index.html/js/wasm/pck + audio worklets)
assets/            Estilos, scripts e ícones do site (painel de debug)
index.html         Página principal (embute build/index.html num iframe + ferramentas de debug)
```

## Atualizar o build

No repositório do jogo:

```bash
godot --headless --export-release "Web" build/web/index.html
```

Copie o conteúdo de `build/web/` (sem os arquivos `*.import`) para `build/` aqui e faça o commit.
O build é single-threaded, então não precisa de headers COOP/COEP (funciona no GitHub Pages).

## Uso

Abrir `index.html` carrega o jogo de `build/` com:
- Botão de **tela cheia** (fullscreen)
- **Recarregar** o jogo
- Painel de **debug** com captura do console do Godot, tráfego e dados do jogo

Para testar localmente: `serve.bat` (ou `node serve.js . 8000`) e abra <http://localhost:8000>.
