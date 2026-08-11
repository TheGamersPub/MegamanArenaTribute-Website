# Megaman Arena Tribute — Website

Site paralelo que hospeda o build WebGL do jogo **Megaman Arena Tribute**.

## Estrutura

```
src/build/WebGL/   Build WebGL publicada automaticamente pelo CI do repositório do jogo
assets/            Estilos, scripts e ícones do site (loader + painel de debug)
index.html         Página principal (carrega o build e expõe ferramentas de debug)
```

## Deploy

O repositório `MegamanArena-Tribute` publica o build WebGL em `src/build/WebGL/`
via GitHub Actions (workflow `build-webgl-deploy-pages.yml`) usando Pages da
branch `main`.

## Uso

Abrir `index.html` carrega o build de `src/build/WebGL/` com:
- Botão de **tela cheia** (fullscreen)
- **Recarregar** o build
- Painel de **debug** com captura do console da Unity, tráfego e dados do jogo
