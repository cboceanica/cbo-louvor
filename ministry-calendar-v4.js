(() => {
const CONFIG = {
 sonoplastia: { title: 'Sonoplastia', weekdays: [0,2,6], names: ['Judson','Marcelo','Ítalo','Felipe','Vladmir'] },
 midia: { title: 'Mídia', weekdays: [0,6], names: ['Leo','Beth','Cíntia','Miguel','Dayana'] },
 comunicacao: { title: 'Comunicação', weekdays: [0,6], names: ['Ester','GG','Matheus','Greicy','Gabriel','Marcus Vinícius','Pietro','Vitão'] },
 recepcao: { title: 'Recepção', weekdays: [0,6], maxPeople: 2, names: ['Francine','Marcia','Arquimedes','Vladmir','Sonia','Eunice'] }
};
const ministry = document.querySelector('main')?.dataset.ministry;
const cfg = CONFIG[ministry];
if (!cfg) return;
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const weekdays = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
let year = 2026, month = new Date().getFullYear() === 2026 ? new Date().getMonth() : 0, data = {}, unsubscribe = null, db = null;
const sonoplastiaEvents = new Map([["2026-01-10","Formatura Proami MI"],["2026-01-24","Luau"],["2026-01-25","Assembleia Administrativa"],["2026-01-31","Reunião de Pais - Tarde Alegre"],["2026-02-21","Tarde de Jogos Juventude"],["2026-03-01","Comunhão"],["2026-03-07","Mini-vigília de oração"],["2026-03-14","Clube Vôlei Adolescentes no Gramado"],["2026-03-21","Reunião de liderança; Culto Jovem - Templo"],["2026-03-28","Café com Elas"],["2026-03-29","Cantata Páscoa"],["2026-04-05","Ceia Senhor"],["2026-04-11","Noite de Oração - CR"],["2026-04-25","Clube do Vôlei (Gramado); Futebol em Itaipuaçu - CBO Piratininga X Itaipuaçu"],["2026-04-26","Ceia Comunhão"],["2026-05-02","Noite de Oração"],["2026-05-09","Luau Juventude / Praia Piratininga"],["2026-05-17","Folga Clayton"],["2026-05-24","Assembleia Administrativa; Ceia Comunhão"],["2026-06-06","Noite de oração"],["2026-06-13","Reunião País Adolescentes / Salão Vermelho; Copa do Mundo CBO (Esportes)"],["2026-06-20","Jantar Namorados"],["2026-06-27","Clube do Vôlei / Gramado"],["2026-06-28","Ceia Comunhão"],["2026-07-04","Programação Mensageiras; Noite de Oração"],["2026-07-05","Ceia Senhor"],["2026-07-18","Festa Country"],["2026-07-25","Reunião Liderança; Confraternização Futebol / Anexo; Culto das Mulheres"],["2026-07-26","Assembleia"],["2026-08-01","Aniversário da CBO"],["2026-08-02","Aniversário da CBO; Ceia Senhor"],["2026-08-08","Retiro Inventário CR — não haverá outras programações nesse horário"],["2026-08-15","Congresso Cartas Vivas"],["2026-08-16","Congresso Cartas Vivas Manhã/Noite"],["2026-08-23","Ceia Comunhão"],["2026-09-05","Clube Vôlei Adolescentes / Gramado; Noite Oração / Missões - Salão"],["2026-09-12","Encontro de Mulheres"],["2026-09-19","Ação Social no Gramado"],["2026-09-26","Culto Jovem / Templo"],["2026-09-27","Assembleia"],["2026-10-03","Noite Oração / Ministério Infantil - Salão"],["2026-10-24","Acampadentro Infantil"],["2026-10-31","Programação Esportes / Uso Igreja geral; Noite Oração - Ministério Casais - Salão"],["2026-11-14","Formatura CR"],["2026-11-21","Culto Mulheres"],["2026-11-22","Culto Amigo / Ceia Comunhão"],["2026-11-28","Reconhecimento/Formatura - Mensageiras"],["2026-12-05","Churrasco Curso Teologia"],["2026-12-12","Jantar de Natal"],["2026-12-19","Culto Jovem (Templo)"],["2026-12-27","Culto Amigo / Ceia Comunhão"]].map(([date,title]) => [date,title]));
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
   const remove = document.createElement('button'); remove.type='button'; remove.className='remove-member'; remove.textContent='×'; remove.title='Excluir '+name; remove.setAttribute('aria-label','Excluir '+name);
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
   const key=String(day), assigned=data[key]?.responsavel || '', assigned2=data[key]?.responsavel2 || '';
   const row=document.createElement('article'); row.className='day day-row' + ((cfg.maxPeople || 1) > 1 ? ' two-person-row' : '');
   const dateText=document.createElement('div'); dateText.className='datebox';
   dateText.innerHTML='<span class="date">'+String(day).padStart(2,'0')+'</span><span class="weekday">'+weekdays[date.getDay()]+'</span>';
   if (['sonoplastia','midia','comunicacao','recepcao'].includes(ministry)) {
     const iso = year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
     const eventLabel = document.createElement('span'); eventLabel.className='calendar-event-name';
     eventLabel.textContent = date.getDay() === 2 ? 'Culto de Oração' : (sonoplastiaEvents.get(iso) || '');
     if (eventLabel.textContent) dateText.append(eventLabel);
   }
   if (['sonoplastia','midia','comunicacao','recepcao'].includes(ministry) && date.getDay() === 0) {
     row.classList.add('sunday-split');
     const periods = document.createElement('div'); periods.className = 'sunday-periods';
     const legacyAssigned = data[key]?.responsavel || '';
     [
       {label:'Manhã', field:'responsavelManha', id:'morning'},
       {label:'Noite', field:'responsavelNoite', id:'night'}
     ].forEach(period => {
       const line = document.createElement('div'); line.className = 'sunday-period';
       const periodLabel = document.createElement('strong'); periodLabel.className='period-label'; periodLabel.textContent=period.label;
       const pick = document.createElement('select'); pick.className='person'; pick.setAttribute('aria-label',period.label+' de domingo '+day+' · '+cfg.title);
       const blankOption = document.createElement('option'); blankOption.value=''; blankOption.textContent= ministry === 'sonoplastia' ? '— Selecionar técnico —' : '— Selecionar membro —'; pick.append(blankOption);
       memberNames.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;pick.append(opt);});
       const current = data[key]?.[period.field] ?? legacyAssigned;
       if(current && !memberNames.includes(current)){const opt=document.createElement('option');opt.value=current;opt.textContent=current+' (fora da lista atual)';pick.append(opt);}
       pick.value=current;
       const savePeriod = document.createElement('button'); savePeriod.className='save'; savePeriod.type='button'; savePeriod.textContent='Salvar';
       const savedPeriod = document.createElement('span'); savedPeriod.className='saved'; savedPeriod.setAttribute('aria-live','polite'); savedPeriod.textContent=current?'✓ Salvo':'';
       savePeriod.addEventListener('click',async()=>{
         if(!db){savedPeriod.textContent='Sem conexão';return;}
         savePeriod.disabled=true;savePeriod.textContent='…';savedPeriod.textContent='';
         try{
           await db.collection('escalas').doc(docId()).set({dias:{[key]:{[period.field]:pick.value}}},{merge:true});
           savedPeriod.textContent=pick.value?'✓ Salvo':'✓ Limpo';savePeriod.textContent='OK';
         }catch(e){console.error(e);savedPeriod.textContent='Erro ao salvar';savePeriod.textContent='Tentar';}
         finally{savePeriod.disabled=false;}
       });
       pick.addEventListener('change',()=>{savePeriod.textContent='Salvar';savedPeriod.textContent='Não salvo';});
       line.append(periodLabel,pick,savePeriod,savedPeriod); periods.append(line);
     });
     row.append(dateText,periods); calendar.append(row);
     continue;
   }
   const select=document.createElement('select'); select.className='person'; select.id='person-'+key; select.setAttribute('aria-label','Responsável de '+day+' '+months[month]);
   const blank=document.createElement('option'); blank.value=''; blank.textContent='— Selecionar membro —'; select.append(blank);
   memberNames.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.append(opt);});
   if(assigned&&!memberNames.includes(assigned)){const opt=document.createElement('option');opt.value=assigned;opt.textContent=assigned+' (fora da lista atual)';select.append(opt);}
   select.value=assigned;
   let select2=null;
   if ((cfg.maxPeople || 1) > 1) {
     select2=document.createElement('select'); select2.className='person person-second'; select2.id='person2-'+key; select2.setAttribute('aria-label','Segundo responsável de '+day+' '+months[month]);
     const blank2=document.createElement('option'); blank2.value=''; blank2.textContent='— 2ª pessoa —'; select2.append(blank2);
     memberNames.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;select2.append(opt);});
     if(assigned2&&!memberNames.includes(assigned2)){const opt=document.createElement('option');opt.value=assigned2;opt.textContent=assigned2+' (fora da lista atual)';select2.append(opt);}
     select2.value=assigned2;
   }
   const save=document.createElement('button');save.className='save';save.type='button';save.textContent='Salvar';
   const saved=document.createElement('span');saved.className='saved';saved.setAttribute('aria-live','polite');saved.textContent=(assigned || assigned2)?'✓ Salvo':'';
   save.addEventListener('click',async()=>{
     if(!db){saved.textContent='Sem conexão';return;}
     save.disabled=true;save.textContent='…';saved.textContent='';
     try{const dayData={responsavel:select.value}; if(select2) dayData.responsavel2=select2.value;
     await db.collection('escalas').doc(docId()).set({dias:{[key]:dayData}},{merge:true});saved.textContent=(select.value || (select2&&select2.value))?'✓ Salvo':'✓ Limpo';save.textContent='OK';}
     catch(e){console.error(e);saved.textContent='Erro ao salvar';save.textContent='Tentar';}
     finally{save.disabled=false;}
   });
   select.addEventListener('change',()=>{save.textContent='Salvar';saved.textContent='Não salvo';});
   if(select2) select2.addEventListener('change',()=>{save.textContent='Salvar';saved.textContent='Não salvo';});
   row.append(dateText,select); if(select2) row.append(select2); row.append(save,saved);calendar.append(row);
 }
 if(!total){const empty=document.createElement('div');empty.className='empty';empty.textContent='Não há dias de escala deste ministério neste mês.';calendar.append(empty);}
}
document.getElementById('prev').addEventListener('click',()=>{if(month===0)return;month--;loadMonth();});
document.getElementById('next').addEventListener('click',()=>{if(month===11)return;month++;loadMonth();});
listenMembers();
loadMonth();
})();