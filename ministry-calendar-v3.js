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
let memberNames = [...cfg.names], unsubscribeMembers = null, remoteMembersReady = false;
const localMembersKey = 'cbo-members-' + ministry;
try { const local = JSON.parse(localStorage.getItem(localMembersKey) || 'null'); if (Array.isArray(local)) memberNames = local; } catch (_) {}
const memberPanel = document.getElementById('membersPanel'), memberList = document.getElementById('memberList'), memberInput = document.getElementById('newMemberName'), memberStatus = document.getElementById('memberStatus');
try {
 if (window.firebaseConfig?.apiKey && window.firebase) { if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig); db = firebase.firestore(); }
} catch (e) { console.error(e); }
function docId(){ return ministry + '-' + year + '-' + String(month+1).padStart(2,'0'); }
function listenMembers(){
 if (!db) { memberStatus.textContent = 'Sem conexão com o banco; alterações serão salvas neste navegador.'; renderMembers(); render(); return; }
 unsubscribeMembers = db.collection('escalas').doc(ministry + '-members').onSnapshot(snap => {
   const saved = snap.exists && Array.isArray(snap.data().names) ? snap.data().names : null;
   if (saved !== null) { memberNames = saved; remoteMembersReady = true; try { localStorage.setItem(localMembersKey, JSON.stringify(memberNames)); } catch (_) {} }
   else if (!remoteMembersReady) { memberNames = memberNames.length ? memberNames : [...cfg.names]; }
   renderMembers(); render();
 }, err => { console.error(err); memberStatus.textContent = 'Falha na sincronização dos membros. A lista local continua disponível neste navegador.'; renderMembers(); });
}
function renderMembers(){
 memberList.innerHTML = '';
 memberNames.forEach(name => {
   const row = document.createElement('div'); row.className='member-row';
   const label = document.createElement('span'); label.textContent=name; label.className='member-name';
   const remove = document.createElement('button'); remove.type='button'; remove.className='remove-member'; remove.textContent='Excluir';
   remove.addEventListener('click', async()=>{
     if(!confirm('Excluir '+name+' da lista? As escalas antigas serão preservadas.')) return;
     const updated = memberNames.filter(n=>n!==name);
     await saveMembers(updated, 'Membro removido da lista.');
   });
   row.append(label,remove); memberList.append(row);
 });
 if (!memberNames.length) { const empty=document.createElement('p'); empty.textContent='Nenhum membro cadastrado.'; memberList.append(empty); }
}
async function saveMembers(updated, successMessage){
 memberNames = updated;
 try { localStorage.setItem(localMembersKey, JSON.stringify(memberNames)); } catch (_) {}
 renderMembers(); render();
 if (!db) { memberStatus.textContent = successMessage + ' Salvo somente neste navegador (sem conexão com o banco).'; return; }
 try {
   await db.collection('escalas').doc(ministry + '-members').set({names:memberNames,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
   remoteMembersReady = true;
   memberStatus.textContent = successMessage + ' Sincronizado com o banco.';
 } catch(e) {
   console.error(e);
   memberStatus.textContent = successMessage + ' Salvo neste navegador, mas não sincronizou com o banco. Pode ser necessário liberar a gravação nas regras do Firestore.';
 }
}
document.getElementById('addMember').addEventListener('click', async()=>{
 const name=memberInput.value.trim();
 if(!name){memberStatus.textContent='Digite o nome do novo membro.';memberInput.focus();return;}
 if(memberNames.some(n=>n.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){memberStatus.textContent='Esse nome já está cadastrado.';return;}
 const updated=[...memberNames,name].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 memberInput.value='';
 await saveMembers(updated, name+' foi cadastrado.');
});
memberInput.addEventListener('keydown', event => { if (event.key === 'Enter') document.getElementById('addMember').click(); });
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
   const key=String(day), assigned=data[key]?.responsavel || '';
   const row=document.createElement('article'); row.className='day day-row';
   const dateText=document.createElement('div'); dateText.className='datebox';
   dateText.innerHTML='<span class="date">'+String(day).padStart(2,'0')+'</span><span class="weekday">'+weekdays[date.getDay()]+'</span>';
   const select=document.createElement('select'); select.className='person'; select.id='person-'+key; select.setAttribute('aria-label','Responsável de '+day+' '+months[month]);
   const blank=document.createElement('option'); blank.value=''; blank.textContent='— Selecionar membro —'; select.append(blank);
   memberNames.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.append(opt);});
   if(assigned&&!memberNames.includes(assigned)){const opt=document.createElement('option');opt.value=assigned;opt.textContent=assigned+' (fora da lista atual)';select.append(opt);}
   select.value=assigned;
   const save=document.createElement('button');save.className='save';save.type='button';save.textContent='Salvar';
   const saved=document.createElement('span');saved.className='saved';saved.setAttribute('aria-live','polite');saved.textContent=assigned?'✓ Salvo':'';
   save.addEventListener('click',async()=>{
     if(!db){saved.textContent='Sem conexão';return;}
     save.disabled=true;save.textContent='…';saved.textContent='';
     try{await db.collection('escalas').doc(docId()).set({dias:{[key]:{responsavel:select.value}}},{merge:true});saved.textContent=select.value?'✓ Salvo':'✓ Limpo';save.textContent='OK';}
     catch(e){console.error(e);saved.textContent='Erro ao salvar';save.textContent='Tentar';}
     finally{save.disabled=false;}
   });
   select.addEventListener('change',()=>{save.textContent='Salvar';saved.textContent='Não salvo';});
   row.append(dateText,select,save,saved);calendar.append(row);
 }
 if(!total){const empty=document.createElement('div');empty.className='empty';empty.textContent='Não há dias de escala deste ministério neste mês.';calendar.append(empty);}
}
document.getElementById('prev').addEventListener('click',()=>{if(month===0){month=11;year--;}else month--;loadMonth();});
document.getElementById('next').addEventListener('click',()=>{if(month===11){month=0;year++;}else month++;loadMonth();});
listenMembers();
loadMonth();
})();