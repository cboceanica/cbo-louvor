(() => {
const CONFIG = {
 sonoplastia: { title: 'Sonoplastia', weekdays: [0,2,6], names: ['Judson','Marcelo','Ítalo','Felipe','Vladmir'] },
 midia: { title: 'Mídia', weekdays: [0,6], names: ['Leo','Beth','Cíntia','Miguel','Dayana'] },
 comunicacao: { title: 'Comunicação', weekdays: [0,6], names: ['Ester','GG','Matheus','Greicy','Gabriel','Marcus Vinícius','Pietro','Vitão'] }
};
const ministry = document.querySelector('main')?.dataset.ministry;
const cfg = CONFIG[ministry];
if (!cfg) return;
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
let year = new Date().getFullYear(), month = new Date().getMonth(), data = {}, unsubscribe = null, db = null;
const calendar = document.getElementById('calendar'), label = document.getElementById('monthLabel'), status = document.getElementById('status');
try {
 if (window.firebaseConfig?.apiKey && window.firebase) { if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig); db = firebase.firestore(); }
} catch (e) { console.error(e); }
function docId(){ return ministry + '-' + year + '-' + String(month+1).padStart(2,'0'); }
function loadMonth(){
 if (unsubscribe) unsubscribe();
 data = {};
 label.textContent = months[month] + ' ' + year;
 if (!db) { status.textContent = 'Não foi possível conectar ao banco de dados.'; render(); return; }
 status.textContent = 'Sincronizando escala…';
 unsubscribe = db.collection('escalas').doc(docId()).onSnapshot(snap => {
   data = snap.exists ? (snap.data().dias || {}) : {};
   status.textContent = 'Escala sincronizada';
   render();
 }, err => { console.error(err); status.textContent = 'Erro ao carregar a escala. Verifique a conexão.'; render(); });
}
function render(){
 calendar.innerHTML = '';
 const count = new Date(year, month+1, 0).getDate();
 let total = 0;
 for (let day=1; day<=count; day++){
   const date = new Date(year,month,day);
   if (!cfg.weekdays.includes(date.getDay())) continue;
   total++;
   const key = String(day), assigned = data[key]?.responsavel || '';
   const card = document.createElement('article'); card.className = 'day';
   const head = document.createElement('div'); head.className = 'dayhead';
   const dateText = document.createElement('div');
   dateText.innerHTML = '<div class="date">'+String(day).padStart(2,'0')+'</div><div class="weekday">'+weekdays[date.getDay()]+'</div>';
   const icon = document.createElement('span'); icon.textContent = assigned ? '✓' : '○'; icon.style.color = assigned ? '#1d6256' : '#9ba8a0'; icon.style.fontSize = '1.2rem';
   head.append(dateText,icon); card.append(head);
   const lab = document.createElement('label'); lab.className='selectlabel'; lab.textContent='Responsável'; lab.htmlFor='person-'+key;
   const select = document.createElement('select'); select.className='person'; select.id='person-'+key;
   const blank = document.createElement('option'); blank.value=''; blank.textContent='— Selecione um nome —'; select.append(blank);
   cfg.names.forEach(name => { const opt=document.createElement('option'); opt.value=name; opt.textContent=name; select.append(opt); });
   select.value=assigned;
   const save = document.createElement('button'); save.className='save'; save.type='button'; save.textContent='Salvar';
   const saved = document.createElement('div'); saved.className='saved'; saved.setAttribute('aria-live','polite'); saved.textContent=assigned ? 'Salvo: '+assigned : 'Ainda não salvo';
   save.addEventListener('click', async()=>{
     if(!db){alert('Não foi possível conectar ao banco de dados.');return;}
     save.disabled=true; save.textContent='Salvando…'; saved.textContent='';
     try {
       await db.collection('escalas').doc(docId()).set({dias:{[key]:{responsavel:select.value}}},{merge:true});
       saved.textContent=select.value ? 'Salvo: '+select.value : 'Escala removida';
       save.textContent='Salvo ✓';
     } catch(e){ console.error(e); saved.textContent='Falha ao salvar. Tente novamente.'; save.textContent='Tentar novamente'; }
     finally { save.disabled=false; }
   });
   select.addEventListener('change',()=>{save.textContent='Salvar';saved.textContent='Alteração não salva';});
   card.append(lab,select,save,saved); calendar.append(card);
 }
 if (!total) { const empty=document.createElement('div');empty.className='empty';empty.textContent='Não há dias de escala deste ministério neste mês.';calendar.append(empty); }
}
document.getElementById('prev').addEventListener('click',()=>{if(month===0){month=11;year--;}else month--;loadMonth();});
document.getElementById('next').addEventListener('click',()=>{if(month===11){month=0;year++;}else month++;loadMonth();});
loadMonth();
})();