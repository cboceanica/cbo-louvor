// ---------------------------------------------------------------
// Escala do Louvor — lógica principal
// ---------------------------------------------------------------

const INSTRUMENTOS = [
  { key: 'bateria',      label: 'Bateria',      icon: '🥁' },
  { key: 'baixo',        label: 'Baixo',        icon: '🎸' },
  { key: 'violao',       label: 'Violão',       icon: '🎻' },
  { key: 'guitarra',     label: 'Guitarra',     icon: '🎸' },
  { key: 'teclado',      label: 'Teclado',      icon: '🎹' },
  { key: 'voz',          label: 'Voz',          icon: '🎤' },
  { key: 'ministracao',  label: 'Ministração',  icon: '🙏' },
];

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

// ---------------------------------------------------------------
// Estado
// ---------------------------------------------------------------
const hoje = new Date();
let anoAtual = hoje.getFullYear();
let mesAtual = hoje.getMonth(); // 0-indexed
let dadosMes = {}; // { "1": { bateria: "João", ... }, "2": {...} }
let unsubscribe = null;

const elGrid = document.getElementById('calendarGrid');
const elMonthLabel = document.getElementById('monthLabel');
const elYearLabel = document.getElementById('yearLabel');
const elConnStatus = document.getElementById('connStatus');
const elMeuNome = document.getElementById('meuNome');
const elSaveHint = document.getElementById('saveHint');
const pillTemplate = document.getElementById('instrumentPillTemplate');

// ---------------------------------------------------------------
// Nome do usuário (persistido localmente no navegador)
// ---------------------------------------------------------------
elMeuNome.value = localStorage.getItem('escalaLouvor:meuNome') || '';
elMeuNome.addEventListener('input', () => {
  localStorage.setItem('escalaLouvor:meuNome', elMeuNome.value.trim());
  elSaveHint.textContent = 'salvo neste navegador';
  renderCalendar(); // re-render para destacar minhas vagas
});

function meuNome() {
  return elMeuNome.value.trim();
}

// ---------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------
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
    alert('O banco de dados ainda não foi configurado (veja README.md / firebase-config.js).');
    return;
  }

  const diaKey = String(dia);
  const ocupantAtual = (dadosMes[diaKey] || {})[instrumentoKey] || '';

  const ref = db.collection('escalas').doc(idDoMes(anoAtual, mesAtual));

  // Se já é minha vaga -> libero. Se está vaga -> assumo. Se é de outra pessoa -> pergunto antes de tomar.
  let novoValor;
  if (ocupantAtual === nome) {
    novoValor = '';
  } else if (!ocupantAtual) {
    novoValor = nome;
  } else {
    const confirmar = confirm(`Essa vaga já está com ${ocupantAtual}. Deseja assumi-la no lugar?`);
    if (!confirmar) return;
    novoValor = nome;
  }

  const campo = `dias.${diaKey}.${instrumentoKey}`;
  try {
    await ref.set({ dias: { [diaKey]: { [instrumentoKey]: novoValor } } }, { merge: true });
  } catch (e) {
    console.error(e);
    alert('Não foi possível salvar. Verifique sua conexão ou as regras do Firestore.');
  }
}

// ---------------------------------------------------------------
// Renderização do calendário
// ---------------------------------------------------------------
function renderCalendar() {
  elMonthLabel.textContent = MESES[mesAtual];
  elYearLabel.textContent = anoAtual;

  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
  elGrid.innerHTML = '';

  for (let dia = 1; dia <= totalDias; dia++) {
    elGrid.appendChild(criarCardDoDia(dia, totalDias));
  }
}

function criarCardDoDia(dia) {
  const dataObj = new Date(anoAtual, mesAtual, dia);
  const diaSemana = DIAS_SEMANA[dataObj.getDay()];
  const registroDia = dadosMes[String(dia)] || {};

  const preenchidos = INSTRUMENTOS.filter(i => !!registroDia[i.key]).length;
  let statusPreenchimento = 'empty';
  if (preenchidos === INSTRUMENTOS.length) statusPreenchimento = 'full';
  else if (preenchidos > 0) statusPreenchimento = 'partial';

  const card = document.createElement('div');
  card.className = 'day-card';
  card.dataset.fill = statusPreenchimento;

  const head = document.createElement('div');
  head.className = 'day-card__head';
  head.innerHTML = `
    <span class="day-card__number">${String(dia).padStart(2, '0')}</span>
    <span class="day-card__weekday">${diaSemana}</span>
  `;
  card.appendChild(head);

  const progresso = document.createElement('div');
  progresso.className = 'day-card__progress';
  progresso.textContent = `${preenchidos}/${INSTRUMENTOS.length} preenchidos`;
  card.appendChild(progresso);

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

  card.appendChild(lista);
  return card;
}

// ---------------------------------------------------------------
// Navegação de mês
// ---------------------------------------------------------------
document.getElementById('prevMonth').addEventListener('click', () => mudarMes(-1));
document.getElementById('nextMonth').addEventListener('click', () => mudarMes(1));

function mudarMes(delta) {
  mesAtual += delta;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  ouvirMes(anoAtual, mesAtual);
}

// ---------------------------------------------------------------
// Início
// ---------------------------------------------------------------
ouvirMes(anoAtual, mesAtual);
