# Escala do Louvor 🎵

Sistema web simples para o ministério de louvor marcar a escala do mês.
Cada dia mostra 7 instrumentos (Bateria, Baixo, Violão, Guitarra, Teclado, Voz e
Ministração) e qualquer músico pode clicar para se marcar ou se desmarcar. As
mudanças aparecem **em tempo real** para todos que estiverem com a página aberta.

Não precisa de login: cada pessoa digita o próprio nome uma vez (fica salvo no
navegador dela) e usa para marcar as vagas.

---

## Como funciona por trás dos panos

- O site é só HTML/CSS/JS puro — funciona em qualquer hospedagem estática,
  como o **GitHub Pages** (grátis).
- Os dados da escala (quem está em qual instrumento, em qual dia) ficam
  guardados no **Firebase Firestore** (banco de dados gratuito do Google), que
  também é quem avisa todo mundo em tempo real quando algo muda.

Você vai precisar criar **uma conta gratuita no Firebase** (leva ~5 minutos) e
colar 6 linhas de configuração num arquivo. Sem isso, o site abre mas fica em
"modo offline" e ninguém consegue marcar vaga.

---

## Passo 1 — Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e
   entre com uma conta Google (pode ser a da igreja).
2. Clique em **Adicionar projeto**, dê um nome (ex: `escala-louvor`) e conclua
   a criação (pode desativar o Google Analytics, não é necessário).
3. No menu lateral, vá em **Compilação > Firestore Database** e clique em
   **Criar banco de dados**.
   - Escolha uma localização (ex: `southamerica-east1` se estiver no Brasil).
   - Comece em **modo de teste** (vamos ajustar a regra de segurança no Passo 3).
4. Ainda no console, clique no ícone de engrenagem (⚙️) > **Configurações do
   projeto**. Em **Seus aplicativos**, clique no ícone `</>` (Web) para
   registrar um app.
   - Dê um apelido (ex: `escala-web`) e clique em **Registrar app**.
   - O Firebase vai mostrar um bloco `firebaseConfig = { ... }` — copie esses
     valores.

## Passo 2 — Colar a configuração no projeto

Abra o arquivo **`firebase-config.js`** neste repositório e substitua os
valores de exemplo pelos que você copiou do Firebase:

```js
window.firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "escala-louvor.firebaseapp.com",
  projectId: "escala-louvor",
  storageBucket: "escala-louvor.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

Salve o arquivo. (Esses valores não são secretos — todo app web do Firebase os
expõe no navegador. A segurança de verdade vem das regras do Passo 3.)

## Passo 3 — Configurar as regras de segurança do Firestore

No console do Firebase, vá em **Firestore Database > Regras** e substitua
pelo conteúdo abaixo, depois clique em **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /escalas/{mesId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasOnly(['dias']);
    }
  }
}
```

> ⚠️ **Nota sobre segurança:** como o sistema não usa login (para ficar simples
> para os músicos), essas regras permitem que qualquer pessoa com o link do
> site marque ou desmarque vagas — não há como impedir que alguém digite o
> nome de outra pessoa. Isso é aceitável para uso interno de confiança (grupo
> fechado da igreja), mas **não coloque o link publicamente** sem avisar o
> ministério. Se no futuro quiser exigir login de cada músico, dá para
> evoluir o sistema com **Firebase Authentication** — posso te ajudar com isso
> depois, se quiser.

## Passo 4 — Subir para o GitHub

1. Crie um repositório novo no GitHub (ex: `escala-louvor`).
2. Envie todos os arquivos desta pasta para ele:

```bash
cd escala-louvor
git init
git add .
git commit -m "Sistema de escala do louvor"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/escala-louvor.git
git push -u origin main
```

## Passo 5 — Publicar com GitHub Pages

1. No GitHub, abra o repositório > **Settings > Pages**.
2. Em **Source**, escolha a branch `main` e a pasta `/ (root)`.
3. Clique em **Save**. Em alguns minutos o site estará no ar em:
   `https://SEU_USUARIO.github.io/escala-louvor/`

Compartilhe esse link com o ministério. 🙌

---

## Estrutura dos arquivos

```
escala-louvor/
├── index.html               # estrutura da página
├── styles.css                # visual (tema "quadro de avisos")
├── app.js                    # lógica: calendário + tempo real
├── firebase-config.js        # suas chaves do Firebase (edite este)
└── firebase-config.example.js  # modelo de referência
```

## Personalizações fáceis

- **Trocar os instrumentos:** edite a lista `INSTRUMENTOS` no topo do
  `app.js` (ícone, nome e chave interna de cada um).
- **Cores:** todas as cores estão centralizadas no topo do `styles.css`, em
  `:root { ... }`.
- **Fuso/mês inicial:** o calendário sempre abre no mês atual do computador
  de quem está acessando; use as setas para navegar entre meses.
