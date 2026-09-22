// ---------------------------------------------------------------
// Escala do Louvor — lógica principal
// ---------------------------------------------------------------

const INSTRUMENTOS = [
  { key: 'bateria',      label: 'Bateria',      icon: '🥁' },
  { key: 'baixo',        label: 'Baixo',        icon: '🎸' },
  { key: 'violao',       label: 'Violão',       icon: '🎻' },
  { key: 'guitarra',     label: 'Guitarra',     icon: '🎸' },
  { key: 'teclado',      label: 'Teclado',      icon: '🎹' },
  { key: 'voz1',         label: 'Voz 1',        icon: '🎤' },
  { key: 'voz2',         label: 'Voz 2',        icon: '🎤' },
  { key: 'voz3',         label: 'Voz 3',        icon: '🎤' },
  { key: 'voz4',         label: 'Voz 4',        icon: '🎤' },
  { key: 'ministracao',  label: 'Ministração',  icon: '🙏' },
];

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const hoje = new Date();
let anoAtual = hoje.getFullYear();
let mesAtual = hoje.getMonth();
let dadosMes = {};
let unsubscribe = null;
const timersMusicas = new Map();

const elGrid = document.getElementById('calendarGrid');
const elMonthLabel = document.getElementById('monthLabel');
const elYearLabel = document.getElementById('yearLabel');
const elConnStatus = document.getElementById('connStatus');
const elMeuNome = document.getElementById('meuNome');
const elSaveHint = document.getElementById('saveHint');
const pillTemplate = document.getElementById('instrumentPillTemplate');

elMeuNome.value = localStorage.getItem('escalaLouvor:meuNome') || '';
elMeuNome.addEventListener('input', () => {
  localStorage.setItem('escalaLouvor:meuNome', elMeuNome.value.trim());
  elSaveHint.textContent = 'salvo neste navegador';
  renderCalendar();
});

function meuNome() {
  return elMeuNome.value.trim();
}

let db = null;
let firebaseOk = false;

try {
  if (window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.apiKey !== 'SUA_API_KEY') {
    firebase.initializeApp(window.firebaseConfig);
    db = firebase.firestore();
    firebaseOk = true;
  }
} catch (e) {
  console.error('Erro ao iniciar Firebase:', e);
}

if (!firebaseOk) {
  elConnStatus.textContent = 'modo offline — configure firebase-config.js';
  elConnStatus.style.color = '#e08c8c';
}

function idDoMes(ano, mes) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}`;
}

function ouvirMes(ano, mes) {
  if (unsubscribe) unsubscribe();
  dadosMes = {};

  if (!firebaseOk) {
    renderCalendar();
    return;
  }

  const ref = db.collection('escalas').doc(idDoMes(ano, mes));
  elConnStatus.textContent = 'sincronizando…';

  unsubscribe = ref.onSnapshot(
    (snap) => {
      dadosMes = (snap.exists && snap.data().dias) || {};
      elConnStatus.textContent = 'ao vivo';
      elConnStatus.style.color = '';
      renderCalendar();
    },
    (err) => {
      console.error(err);
      elConnStatus.textContent = 'erro de conexão';
      elConnStatus.style.color = '#e08c8c';
    }
  );
}

async function alternarVaga(dia, instrumentoKey) {
  const nome = meuNome();
  if (!nome) {
    alert('Digite seu nome no topo da página antes de marcar sua vaga.');
    elMeuNome.focus();
    return;
  }
  if (!firebaseOk) {
    alert('O banco de dados ainda não foi configurado.');
    return;
  }

  const diaKey = String(dia);
  const ocupanteAtual = (dadosMes[diaKey] || {})[instrumentoKey] || '';
  const ref = db.collection('escalas').doc(idDoMes(anoAtual, mesAtual));

  let novoValor;
  if (ocupanteAtual === nome) {
    novoValor = '';
  } else if (!ocupanteAtual) {
    novoValor = nome;
  } else {
    const confirmar = confirm(`Essa vaga já está com ${ocupanteAtual}. Deseja assumi-la no lugar?`);
    if (!confirmar) return;
    novoValor = nome;
  }

  try {
    await ref.set({ dias: { [diaKey]: { [instrumentoKey]: novoValor } } }, { merge: true });
  } catch (e) {
    console.error(e);
    alert('Não foi possível salvar. Verifique sua conexão ou as regras do Firestore.');
  }
}

function domingosDoMes(ano, mes) {
  const domingos = [];
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  for (let dia = 1; dia <= totalDias; dia++) {
    if (new Date(ano, mes, dia).getDay() === 0) domingos.push(dia);
  }
  return domingos;
}

function renderCalendar() {
  elMonthLabel.textContent = MESES[mesAtual];
  elYearLabel.textContent = anoAtual;
  elGrid.innerHTML = '';

  domingosDoMes(anoAtual, mesAtual).forEach(dia => {
    elGrid.appendChild(criarCardDoDia(dia));
  });
}

function criarCardDoDia(dia) {
  const registroDia = dadosMes[String(dia)] || {};
  const preenchidos = INSTRUMENTOS.filter(i => !!registroDia[i.key]).length;
  let statusPreenchimento = 'empty';
  if (preenchidos === INSTRUMENTOS.length) statusPreenchimento = 'full';
  else if (preenchidos > 0) statusPreenchimento = 'partial';

  const card = document.createElement('section');
  card.className = 'day-card';
  card.dataset.fill = statusPreenchimento;

  const head = document.createElement('div');
  head.className = 'day-card__head';
  head.innerHTML = `
    <div>
      <span class="day-card__number">${String(dia).padStart(2, '0')}</span>
      <span class="day-card__weekday">domingo</span>
    </div>
    <span class="day-card__date">${String(dia).padStart(2, '0')}/${String(mesAtual + 1).padStart(2, '0')}</span>
  `;
  card.appendChild(head);

  const progresso = document.createElement('div');
  progresso.className = 'day-card__progress';
  progresso.textContent = `${preenchidos}/${INSTRUMENTOS.length} funções preenchidas`;
  card.appendChild(progresso);

  const content = document.createElement('div');
  content.className = 'day-card__content';

  const escala = document.createElement('div');
  escala.className = 'escala-section';
  escala.innerHTML = '<h3 class="section-title">Equipe</h3>';

  const lista = document.createElement('div');
  lista.className = 'pill-list';

  INSTRUMENTOS.forEach(inst => {
    const ocupante = registroDia[inst.key] || '';
    const pillFrag = pillTemplate.content.cloneNode(true);
    const btn = pillFrag.querySelector('.pill');
    btn.querySelector('.pill__icon').textContent = inst.icon;
    btn.querySelector('.pill__label').textContent = inst.label;
    btn.querySelector('.pill__name').textContent = ocupante || 'livre';

    if (ocupante) btn.classList.add('pill--filled');
    if (ocupante && ocupante === meuNome()) btn.classList.add('pill--mine');

    btn.title = ocupante
      ? `${inst.label}: ${ocupante} — clique para alterar`
      : `${inst.label}: vaga livre — clique para se marcar`;

    btn.addEventListener('click', () => alternarVaga(dia, inst.key));
    lista.appendChild(btn);
  });

  escala.appendChild(lista);
  content.appendChild(escala);

  const repertorio = document.createElement('div');
  repertorio.className = 'repertorio';
  repertorio.innerHTML = '<h3 class="section-title">Repertório</h3>';
  repertorio.appendChild(criarBlocoMusicas(dia, 'manha', '☀️ Culto da manhã', registroDia.musicas?.manha || []));
  repertorio.appendChild(criarBlocoMusicas(dia, 'noite', '🌙 Culto da noite', registroDia.musicas?.noite || []));
  content.appendChild(repertorio);

  card.appendChild(content);
  return card;
}

function criarBlocoMusicas(dia, periodo, titulo, musicas) {
  const bloco = document.createElement('div');
  bloco.className = `music-block music-block--${periodo}`;

  const tituloEl = document.createElement('h4');
  tituloEl.textContent = titulo;
  bloco.appendChild(tituloEl);

  const tabela = document.createElement('div');
  tabela.className = 'music-table';

  const cabecalho = document.createElement('div');
  cabecalho.className = 'music-row music-row--header';
  cabecalho.innerHTML = `
    <span>#</span><span>Música</span><span>Cantor</span><span>Tom</span><span>Link</span>
  `;
  tabela.appendChild(cabecalho);

  for (let i = 0; i < 5; i++) {
    const musica = musicas[i] || {};
    const linha = document.createElement('div');
    linha.className = 'music-row';

    const numero = document.createElement('span');
    numero.className = 'music-number';
    numero.textContent = i + 1;
    linha.appendChild(numero);

    [
      ['nome', 'Nome da música', 'text'],
      ['cantor', 'Cantor / banda', 'text'],
      ['tom', 'Tom', 'text'],
      ['link', 'https://...', 'url']
    ].forEach(([campo, placeholder, type]) => {
      const input = document.createElement('input');
      input.type = type;
      input.value = musica[campo] || '';
      input.placeholder = placeholder;
      input.dataset.campo = campo;
      input.setAttribute('aria-label', `${titulo} — música ${i + 1} — ${campo}`);
      input.addEventListener('input', () => {
        agendarSalvamentoMusica(dia, periodo, i, campo, input.value);

        if (campo === 'link') {
          atualizarBotaoLink(linkBtn, input.value);
        }
      });

      if (campo === 'link') {
        const linkWrap = document.createElement('div');
        linkWrap.className = 'music-link-wrap';

        const linkBtn = document.createElement('a');
        linkBtn.className = 'music-link-btn';
        linkBtn.target = '_blank';
        linkBtn.rel = 'noopener noreferrer';
        linkBtn.textContent = '🔗 Abrir';
        atualizarBotaoLink(linkBtn, input.value);

        linkWrap.appendChild(input);
        linkWrap.appendChild(linkBtn);
        linha.appendChild(linkWrap);
      } else {
        linha.appendChild(input);
      }
    });

    tabela.appendChild(linha);
  }

  bloco.appendChild(tabela);
  return bloco;
}

function normalizarLink(valor) {
  const link = valor.trim();
  if (!link) return '';

  try {
    const url = new URL(link.match(/^https?:\/\//i) ? link : `https://${link}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

function atualizarBotaoLink(botao, valor) {
  const href = normalizarLink(valor);

  if (href) {
    botao.href = href;
    botao.classList.remove('music-link-btn--disabled');
    botao.removeAttribute('aria-disabled');
    botao.title = 'Abrir música em uma nova aba';
  } else {
    botao.removeAttribute('href');
    botao.classList.add('music-link-btn--disabled');
    botao.setAttribute('aria-disabled', 'true');
    botao.title = valor.trim() ? 'Link inválido' : 'Cole um link para habilitar';
  }
}

function agendarSalvamentoMusica(dia, periodo, indice, campo, valor) {
  if (!firebaseOk) return;

  const chaveTimer = `${anoAtual}-${mesAtual}-${dia}-${periodo}-${indice}-${campo}`;
  clearTimeout(timersMusicas.get(chaveTimer));

  const timer = setTimeout(async () => {
    const ref = db.collection('escalas').doc(idDoMes(anoAtual, mesAtual));
    const diaKey = String(dia);
    const musicasAtuais = [...(((dadosMes[diaKey] || {}).musicas || {})[periodo] || [])];

    while (musicasAtuais.length < 5) musicasAtuais.push({});
    musicasAtuais[indice] = { ...(musicasAtuais[indice] || {}), [campo]: valor.trim() };

    try {
      await ref.set({
        dias: {
          [diaKey]: {
            musicas: {
              [periodo]: musicasAtuais
            }
          }
        }
      }, { merge: true });
    } catch (e) {
      console.error(e);
      alert('Não foi possível salvar o repertório.');
    }
  }, 600);

  timersMusicas.set(chaveTimer, timer);
}

document.getElementById('prevMonth').addEventListener('click', () => mudarMes(-1));
document.getElementById('nextMonth').addEventListener('click', () => mudarMes(1));

function mudarMes(delta) {
  mesAtual += delta;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  ouvirMes(anoAtual, mesAtual);
}

ouvirMes(anoAtual, mesAtual);
