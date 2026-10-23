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
  // O Firestore dispara um snapshot depois de cada salvamento. Preserve o foco e
  // os repertórios abertos para que a atualização não feche a aba durante a digitação.
  const ativo = document.activeElement;
  let focoMusica = null;
  if (ativo && ativo.matches && ativo.matches('.music-row input[data-campo]')) {
    const linha = ativo.closest('.music-row');
    const bloco = ativo.closest('.music-block');
    focoMusica = {
      dia: bloco?.dataset.dia, periodo: bloco?.dataset.periodo,
      indice: linha?.dataset.indice, campo: ativo.dataset.campo,
      inicio: typeof ativo.selectionStart === 'number' ? ativo.selectionStart : null,
      fim: typeof ativo.selectionEnd === 'number' ? ativo.selectionEnd : null
    };
  }
  const abertos = new Set([...elGrid.querySelectorAll('.music-details[open]')]
    .map(d => `${d.closest('.music-block')?.dataset.dia}-${d.closest('.music-block')?.dataset.periodo}`));

  elMonthLabel.textContent = MESES[mesAtual];
  elYearLabel.textContent = anoAtual;
  elGrid.innerHTML = '';

  domingosDoMes(anoAtual, mesAtual).forEach(dia => {
    elGrid.appendChild(criarCardDoDia(dia));
  });

  elGrid.querySelectorAll('.music-details').forEach(d => {
    const bloco = d.closest('.music-block');
    if (abertos.has(`${bloco?.dataset.dia}-${bloco?.dataset.periodo}`)) d.open = true;
  });
  if (focoMusica && focoMusica.dia && focoMusica.periodo && focoMusica.indice != null) {
    const seletor = `.music-block[data-dia="${focoMusica.dia}"][data-periodo="${focoMusica.periodo}"] .music-row[data-indice="${focoMusica.indice}"] input[data-campo="${focoMusica.campo}"]`;
    const novoInput = elGrid.querySelector(seletor);
    if (novoInput) {
      novoInput.focus({ preventScroll: true });
      if (focoMusica.inicio !== null && novoInput.setSelectionRange) {
        try { novoInput.setSelectionRange(focoMusica.inicio, focoMusica.fim); } catch (_) {}
      }
    }
  }
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

function quantidadeMusicas(musicas) {
  let ultima = -1;
  (musicas || []).forEach((m, i) => {
    if (m && [m.nome, m.cantor, m.tom, m.link].some(v => String(v || '').trim())) ultima = i;
  });
  return Math.max(0, ultima + 1);
}

function criarBlocoMusicas(dia, periodo, titulo, musicas) {
  const bloco = document.createElement('div');
  bloco.className = `music-block music-block--${periodo}`;
  // Mantém um rascunho local enquanto a pessoa edita; nada é enviado ao Firestore até clicar em Salvar.
  let rascunhoMusicas = (musicas || []).map(m => ({ ...(m || {}) }));
  bloco.dataset.dia = String(dia);
  bloco.dataset.periodo = periodo;

  const topo = document.createElement('div');
  topo.className = 'music-block__top';
  const tituloEl = document.createElement('h4');
  tituloEl.textContent = titulo;
  topo.appendChild(tituloEl);

  const controles = document.createElement('div');
  controles.className = 'music-block__controls';
  const quantidadeLabel = document.createElement('label');
  quantidadeLabel.textContent = 'Músicas:';
  const quantidade = document.createElement('select');
  quantidade.setAttribute('aria-label', `${titulo} — quantidade de músicas`);
  for (let n = 0; n <= 5; n++) {
    const option = document.createElement('option');
    option.value = n;
    option.textContent = n;
    quantidade.appendChild(option);
  }
  quantidade.value = quantidadeMusicas(musicas);
  quantidadeLabel.appendChild(quantidade);
  controles.appendChild(quantidadeLabel);
  const salvar = document.createElement('button');
  salvar.type = 'button';
  salvar.className = 'save-repertoire-btn';
  salvar.textContent = 'Salvar repertório';
  salvar.addEventListener('click', () => salvarRepertorioBloco(dia, periodo, Number(quantidade.value), rascunhoMusicas, salvar));
  controles.appendChild(salvar);
  topo.appendChild(controles);
  bloco.appendChild(topo);

  if (periodo === 'noite') {
    const copiar = document.createElement('button');
    copiar.type = 'button';
    copiar.className = 'copy-morning-btn';
    copiar.textContent = 'Copiar repertório da manhã';
    copiar.addEventListener('click', () => copiarRepertorioManhaParaNoite(dia));
    controles.appendChild(copiar);
  }

  const detalhes = document.createElement('details');
  detalhes.className = 'music-details';
  detalhes.open = false;
  const resumo = document.createElement('summary');
  resumo.textContent = `${quantidade.value} ${Number(quantidade.value) === 1 ? 'música' : 'músicas'} — clique para editar`;
  detalhes.appendChild(resumo);
  const tabela = document.createElement('div');
  tabela.className = 'music-table';
  const cabecalho = document.createElement('div');
  cabecalho.className = 'music-row music-row--header';
  cabecalho.innerHTML = '<span>#</span><span>Música / catálogo</span><span>Cantor</span><span>Tom</span><span>Link</span>';
  tabela.appendChild(cabecalho);

  function atualizarResumo() {
    const n = Number(quantidade.value);
    resumo.textContent = `${n} ${n === 1 ? 'música' : 'músicas'} — clique para ${detalhes.open ? 'recolher' : 'editar'}`;
  }

  function desenharLinhas() {
    [...tabela.querySelectorAll('.music-row:not(.music-row--header)')].forEach(el => el.remove());
    const n = Number(quantidade.value);
    for (let i = 0; i < n; i++) {
      const musica = rascunhoMusicas[i] || {};
      const linha = document.createElement('div');
      linha.className = 'music-row';
      linha.dataset.indice = String(i);
      const numero = document.createElement('span');
      numero.className = 'music-number';
      numero.textContent = i + 1;
      linha.appendChild(numero);

      let linkBtn = null;
      const nomeWrap = document.createElement('div');
      nomeWrap.className = 'music-name-wrap';
      const catalogo = document.createElement('select');
      catalogo.className = 'music-catalog-select';
      catalogo.setAttribute('aria-label', `${titulo} — selecionar música do catálogo ${i + 1}`);
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Escolher do catálogo…';
      catalogo.appendChild(placeholder);
      catalogo.addEventListener('focus', carregarCatalogo);
      catalogo.addEventListener('change', () => {
        const escolhida = catalogo.value;
        if (!escolhida) return;
        let registro;
        try { registro = JSON.parse(escolhida); } catch { return; }
        const nomeInput = linha.querySelector('[data-campo="nome"]');
        const cantorInput = linha.querySelector('[data-campo="cantor"]');
        const linkInput = linha.querySelector('[data-campo="link"]');
        nomeInput.value = registro.nome || '';
        cantorInput.value = registro.cantor || '';
        linkInput.value = registro.link || '';
        atualizarBotaoLink(linha.querySelector('.music-link-btn'), linkInput.value);
        ['nome','cantor','link'].forEach(campo => { rascunhoMusicas[i] = { ...(rascunhoMusicas[i] || {}), [campo]: linha.querySelector(`[data-campo="${campo}"]`).value }; });
      });
      nomeWrap.appendChild(catalogo);

      [
        ['nome', 'Nome da música', 'text'],
        ['cantor', 'Cantor / banda', 'text'],
        ['tom', 'Tom', 'text'],
        ['link', 'https://...', 'url']
      ].forEach(([campo, placeholderTexto, type]) => {
        const input = document.createElement('input');
        input.type = type;
        input.value = musica[campo] || '';
        input.placeholder = placeholderTexto;
        input.dataset.campo = campo;
        input.setAttribute('aria-label', `${titulo} — música ${i + 1} — ${campo}`);
        input.addEventListener('input', () => {
          rascunhoMusicas[i] = { ...(rascunhoMusicas[i] || {}), [campo]: input.value };
          salvar.textContent = 'Salvar repertório *';
          salvar.classList.add('save-repertoire-btn--pending');
          if (campo === 'link') atualizarBotaoLink(linkBtn, input.value);
        });
        if (campo === 'nome') nomeWrap.appendChild(input);
        else if (campo === 'link') {
          const linkWrap = document.createElement('div');
          linkWrap.className = 'music-link-wrap';
          linkBtn = document.createElement('a');
          linkBtn.className = 'music-link-btn';
          linkBtn.target = '_blank';
          linkBtn.rel = 'noopener noreferrer';
          linkBtn.textContent = '🔗 Abrir';
          atualizarBotaoLink(linkBtn, input.value);
          linkWrap.append(input, linkBtn);
          linha.appendChild(linkWrap);
        } else linha.appendChild(input);
      });
      linha.insertBefore(nomeWrap, linha.children[1] || null);
      tabela.appendChild(linha);
    }
    atualizarResumo();
  }
  quantidade.addEventListener('change', () => {
    const n = Number(quantidade.value);
    while (rascunhoMusicas.length < n) rascunhoMusicas.push({});
    rascunhoMusicas = rascunhoMusicas.slice(0, n);
    desenharLinhas();
    salvar.textContent = 'Salvar repertório *';
    salvar.classList.add('save-repertoire-btn--pending');
  });
  detalhes.addEventListener('toggle', atualizarResumo);
  desenharLinhas();
  detalhes.appendChild(tabela);
  bloco.appendChild(detalhes);
  return bloco;
}

async function salvarRepertorioBloco(dia, periodo, quantidade, rascunho, botao) {
  if (!firebaseOk) { alert('O banco de dados ainda não foi configurado.'); return; }
  const bloco = document.querySelector(`.music-block[data-dia="${dia}"][data-periodo="${periodo}"]`);
  const valores = [...(rascunho || [])].slice(0, quantidade).map(m => ({
    nome: String(m.nome || '').trim(),
    cantor: String(m.cantor || '').trim(),
    tom: String(m.tom || '').trim(),
    link: String(m.link || '').trim()
  }));
  while (valores.length < quantidade) valores.push({});
  botao.disabled = true;
  botao.textContent = 'Salvando…';
  try {
    const ref = db.collection('escalas').doc(idDoMes(anoAtual, mesAtual));
    await ref.set({ dias: { [String(dia)]: { musicas: { [periodo]: valores } } } }, { merge: true });
    for (const musica of valores) {
      if (musica.nome) await salvarNoCatalogo(musica);
    }
    botao.textContent = 'Salvo ✓';
    botao.classList.remove('save-repertoire-btn--pending');
  } catch (e) {
    console.error(e);
    botao.textContent = 'Tentar salvar novamente';
    alert('Não foi possível salvar o repertório. Confira a conexão e tente novamente.');
  } finally {
    botao.disabled = false;
  }
}

let catalogoMusicasCache = null;
let carregandoCatalogo = null;
async function carregarCatalogo() {
  if (!firebaseOk || !this) return;
  const selects = document.querySelectorAll('.music-catalog-select');
  if (!catalogoMusicasCache) {
    if (!carregandoCatalogo) {
      carregandoCatalogo = db.collection('catalogoMusicas').get().then(snapshot => {
        catalogoMusicasCache = snapshot.docs.map(doc => doc.data())
          .filter(m => m.nome)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
      }).catch(err => { console.warn('Não foi possível carregar catálogo:', err); catalogoMusicasCache = []; })
        .finally(() => { carregandoCatalogo = null; });
    }
    await carregandoCatalogo;
  }
  document.querySelectorAll('.music-catalog-select').forEach(select => {
    const atual = select.value;
    const jaTem = select.options.length > 1;
    if (jaTem) return;
    (catalogoMusicasCache || []).forEach(m => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ nome: m.nome || '', cantor: m.cantor || '', link: m.link || '' });
      option.textContent = `${m.nome}${m.cantor ? ' — ' + m.cantor : ''}`;
      select.appendChild(option);
    });
    select.value = atual;
  });
}

function chaveCatalogo(nome) {
  return String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

async function salvarNoCatalogo(musica) {
  if (!firebaseOk || !musica.nome || !musica.nome.trim()) return;
  const nome = musica.nome.trim();
  const registro = { nome, cantor: (musica.cantor || '').trim(), link: (musica.link || '').trim(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() };
  const id = chaveCatalogo(nome);
  if (!id) return;
  try {
    await db.collection('catalogoMusicas').doc(id).set(registro, { merge: true });
    catalogoMusicasCache = null;
  } catch (e) { console.warn('Não foi possível atualizar o catálogo de músicas:', e); }
}

async function copiarRepertorioManhaParaNoite(dia) {
  if (!firebaseOk) { alert('O banco de dados ainda não foi configurado.'); return; }
  // Copia o que está visível no formulário, inclusive alterações ainda não salvas.
  const blocoManha = document.querySelector(`.music-block[data-dia="${dia}"][data-periodo="manha"]`);
  let manha = [];
  if (blocoManha) {
    const quantidade = Number(blocoManha.querySelector('.music-block__controls select')?.value || 0);
    manha = [...blocoManha.querySelectorAll('.music-row:not(.music-row--header)')].slice(0, quantidade).map(linha => {
      const valor = campo => linha.querySelector(`[data-campo="${campo}"]`)?.value?.trim() || '';
      return { nome: valor('nome'), cantor: valor('cantor'), tom: valor('tom'), link: valor('link') };
    });
  }
  if (!manha.length) {
    const registro = dadosMes[String(dia)] || {};
    manha = (((registro.musicas || {}).manha) || []).map(m => ({ ...(m || {}) }));
  }
  if (!manha.some(m => [m.nome, m.cantor, m.tom, m.link].some(v => String(v || '').trim()))) {
    alert('Preencha primeiro o repertório do culto da manhã.'); return;
  }
  if (!confirm('Copiar as músicas da manhã para a noite? Isso substituirá o repertório atual da noite.')) return;
  const ref = db.collection('escalas').doc(idDoMes(anoAtual, mesAtual));
  try {
    await ref.set({ dias: { [String(dia)]: { musicas: { noite: manha } } } }, { merge: true });
    for (const musica of manha) if (musica.nome) await salvarNoCatalogo(musica);
  } catch (e) { console.error(e); alert('Não foi possível copiar o repertório.'); }
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

document.getElementById('prevMonth').addEventListener('click', () => mudarMes(-1));
document.getElementById('nextMonth').addEventListener('click', () => mudarMes(1));

function mudarMes(delta) {
  mesAtual += delta;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  ouvirMes(anoAtual, mesAtual);
}

ouvirMes(anoAtual, mesAtual);
