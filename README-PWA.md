# Instalar o sistema de escala como aplicativo (PWA)

Esta versão adiciona suporte a instalação pelo navegador, sem loja de aplicativos. O app continua usando o Firebase atual e não altera os dados existentes.

## Publicação
1. Faça backup do repositório atual.
2. Copie os arquivos desta pasta para a mesma pasta do site publicada no GitHub Pages, substituindo os arquivos existentes.
3. Preserve o `firebase-config.js` que já funciona no site.
4. Faça commit/push e aguarde o GitHub Pages publicar em HTTPS.

## Android (Chrome)
1. Abra o endereço publicado do sistema no Chrome.
2. Abra o menu ⋮ e escolha **Instalar app** ou **Adicionar à tela inicial**.
3. Confirme. O ícone “Escala CBO” aparecerá na tela inicial.

## iPhone (Safari)
1. Abra o endereço publicado no Safari (não dentro de Instagram/WhatsApp).
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início** e confirme.

## Importante
- O PWA precisa ser publicado em HTTPS; GitHub Pages atende esse requisito.
- O service worker armazena apenas arquivos estáticos. Não armazena respostas nem gravações do Firestore, para manter os dados atualizados.
- O app instalado abre numa janela própria, com aparência de aplicativo, mas continua sendo o mesmo site.
- Se o site estiver publicado numa subpasta, mantenha manifest e `sw.js` ao lado do `index.html`.
