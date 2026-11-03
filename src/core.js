'use strict';
const Impulso = (() => {
  const DAYS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const GOALS=['Hipertrofia','Força','Condicionamento'], LEVELS=['Iniciante','Intermediário','Avançado'], MODES=['Academia','Calistenia','Ambas'];
  const EQUIPMENT=['Somente peso corporal','Halteres','Barra e anilhas','Máquinas','Barra fixa','Paralelas','Elásticos','Banco'];
  const FOCUSES=['Corpo inteiro','Superiores','Pernas','Peito','Costas','Ombros','Livre','Descanso'];
  const CATALOG=/*CATALOG*/[];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const exercise=id=>{const e=CATALOG.find(x=>x.id===id);if(!e)throw Error('Exercício desconhecido.');return e;};
  const validList=(a,choices,min=1,max=choices.length)=>Array.isArray(a)&&a.length>=min&&a.length<=max&&new Set(a).size===a.length&&a.every(x=>choices.includes(x));
  function equipmentValid(a){return validList(a,EQUIPMENT)&&!(a.includes(EQUIPMENT[0])&&a.length>1);}
  function validateProfile(p){
    if(!p||!GOALS.includes(p.goal)||!LEVELS.includes(p.level)||!MODES.includes(p.mode))throw Error('Escolha objetivo, experiência e modalidade.');
    if(!validList(p.days,DAYS))throw Error('Selecione pelo menos um dia disponível.');
    if(![20,30,45,60,90].includes(p.minutes))throw Error('Escolha uma duração válida.');
    if(!equipmentValid(p.equipment))throw Error('Selecione equipamentos ou somente peso corporal.');
    if(typeof p.limitations!=='string'||p.limitations.length>500)throw Error('Use até 500 caracteres para as limitações.');
    return p;
  }
  function alternatives(p,pattern){return CATALOG.filter(e=>e.pattern===pattern&&e.level<=LEVELS.indexOf(p.level)&&e.equipment.every(x=>p.equipment.includes(x))&&(p.mode!=='Calistenia'||!e.gym)).sort((a,b)=>(p.mode==='Calistenia'?0:Number(b.gym)-Number(a.gym))||b.level-a.level);}
  function estimatedMinutes(d){return d.items.length?Math.ceil((300+d.items.reduce((s,x)=>s+x.sets*45+(x.sets-1)*x.rest+60,0))/60):0;}
  function dayPlan(p,focus,variation=0){
    const d={focus,items:[]};if(['Descanso','Livre'].includes(focus))return d;
    const patterns={Superiores:['push','pull','shoulder'],Pernas:['squat','hinge','calf','core'],Peito:['push','shoulder','core'],Costas:['pull','hinge','core'],Ombros:['shoulder','pull','core']}[focus]||(variation%2?['hinge','pull','push','squat','core']:['squat','push','pull','hinge','core']);
    const sets=p.level==='Iniciante'||p.minutes<=30?2:3, rest=p.goal==='Força'?150:p.goal==='Hipertrofia'?90:60, reps=p.goal==='Força'&&p.level!=='Iniciante'?6:p.goal==='Condicionamento'?12:10;
    patterns.forEach((pattern,i)=>{const options=alternatives(p,pattern);if(!options.length)return;let chosen=options[0];if(p.mode==='Ambas'&&(i+variation)%2)chosen=options.find(e=>!e.gym)||chosen;d.items.push({id:chosen.id,sets,reps,rest});if(estimatedMinutes(d)>p.minutes)d.items.pop();});return d;
  }
  function generate(p){
    validateProfile(p);const available=DAYS.map((x,i)=>p.days.includes(x)?i:-1).filter(x=>x>=0),split=p.level!=='Iniciante'&&available.length>=4;
    let best=0,bestCount=-1,bestScore=-1;
    for(let mask=1;mask<128;mask++){const chosen=DAYS.map((_,i)=>mask&(1<<i)?i:-1).filter(x=>x>=0),count=chosen.length;if(count>(split?4:3))continue;let fits=chosen.every(x=>available.includes(x)),score=0;chosen.forEach((i,a)=>chosen.slice(a+1).forEach(j=>{const distance=Math.min(j-i,7-(j-i));if(!split&&distance===1)fits=false;score+=distance;}));if(fits&&(count>bestCount||count===bestCount&&score>bestScore)){best=mask;bestCount=count;bestScore=score;}}
    let index=0;return {version:1,profileKey:'',days:DAYS.map((_,i)=>{if(!(best&(1<<i)))return {focus:'Descanso',items:[]};const d=dayPlan(p,split?(index%2?'Pernas':'Superiores'):'Corpo inteiro',index);index++;return d;})};
  }
  async function profileKey(p){const parts=[p.goal,p.level,p.mode,String(p.minutes),p.limitations,...[...p.days].sort(),'equipment',...[...p.equipment].sort()];const input=parts.map(s=>s.length+':'+s).join('');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
  function validatePlan(p){
    if(!p||p.version!==1||!Array.isArray(p.days)||p.days.length!==7||typeof p.profileKey!=='string'||!/^([a-f0-9]{64})?$/.test(p.profileKey))throw Error('Semana inválida.');
    for(const d of p.days){if(!FOCUSES.includes(d.focus)||!Array.isArray(d.items)||d.items.length>8||d.focus==='Descanso'&&d.items.length)throw Error('Dia inválido.');const ids=new Set();for(const x of d.items){exercise(x.id);if(ids.has(x.id)||!Number.isInteger(x.sets)||x.sets<1||x.sets>6||!Number.isInteger(x.reps)||x.reps<1||x.reps>30||!Number.isInteger(x.rest)||x.rest<30||x.rest>300)throw Error('Confira séries (1–6), repetições (1–30) e descanso (30–300 s).');ids.add(x.id);}}
    return p;
  }
  function advisory(p,plan){const notes=[];if(plan.days.filter(d=>d.items.length).length<2)notes.push('Sua disponibilidade permite menos de duas sessões na semana.');if(!alternatives(p,'pull').length)notes.push('Sem opção de puxada compatível: o treino não cobre bem costas. Revise os equipamentos disponíveis.');if(plan.days.some(d=>estimatedMinutes(d)>p.minutes))notes.push('Há treino acima do tempo disponível no seu perfil.');if(plan.days.some((d,i)=>d.items.some(x=>plan.days[(i+1)%7].items.some(y=>exercise(x.id).pattern===exercise(y.id).pattern))))notes.push('Há movimentos semelhantes em dias seguidos. Revise a recuperação.');if(plan.days.some((d,i)=>d.items.length&&!p.days.includes(DAYS[i])))notes.push('Há treino em um dia fora da disponibilidade do perfil.');if(p.limitations)notes.push('As limitações anotadas não são interpretadas pelo gerador. Revise os exercícios com um profissional.');return notes;}
  function record(load,reps){if(!Number.isInteger(reps)||reps<1||reps>100)throw Error('Informe de 1 a 100 repetições.');if(typeof load!=='string'||load.length>12||load!==''&&(!/^\d+(?:[.,]\d+)?$/.test(load)||Number(load.replace(',','.'))>1000))throw Error('Informe carga entre 0 e 1000 kg ou deixe em branco.');}
  function createSession(d,p){if(!d.items.length)throw Error('Adicione exercícios a este dia antes de iniciar.');return {version:1,id:crypto.randomUUID(),title:d.focus,mode:p.mode,level:p.level,goal:p.goal,started:Date.now(),ended:0,current:0,restSeconds:d.items[0].rest,synced:false,equipment:[...p.equipment],entries:d.items.map(x=>({pattern:exercise(x.id).pattern,rest:x.rest,rows:Array.from({length:x.sets},()=>({id:x.id,load:'',reps:x.reps,done:false,skipped:false,blocked:false}))}))};}
  const rows=s=>s.entries.flatMap(e=>e.rows);
  function stats(s){const a=rows(s),done=a.filter(r=>r.done).length,skipped=a.filter(r=>r.skipped).length;return {total:a.length,done,skipped,pending:a.length-done-skipped};}
  function complete(s,entry,row,load,reps){const r=s.entries[entry]?.rows[row];if(s.ended||!r||r.done||r.skipped||r.blocked)throw Error('Esta série não está disponível.');record(load,reps);Object.assign(r,{load,reps,done:true});s.synced=false;}
  function adapt(s,mode,equipment){
    if(s.ended||!MODES.includes(mode)||!equipmentValid(equipment))throw Error('Escolha a modalidade e os equipamentos disponíveis.');const reports=new Set(),p={mode,level:s.level,equipment};
    for(const e of s.entries){const options=alternatives(p,e.pattern);for(const r of e.rows){if(r.done||r.skipped)continue;const before=exercise(r.id),preferGym=mode==='Academia'&&mode!==s.mode&&!before.gym&&options[0]?.gym;if(options.some(x=>x.id===r.id)&&!preferGym){r.blocked=false;continue;}if(!options.length){r.blocked=true;reports.add(before.name+' → sem alternativa compatível. Revise os equipamentos ou pule a série.');}else{r.id=options[0].id;r.load='';r.blocked=false;reports.add(before.name+' → '+options[0].name+' (defina a carga).');}}}
    s.mode=mode;s.equipment=[...equipment];s.synced=false;return [...reports];
  }
  function validateSession(s){
    if(!s||s.version!==1||!/^[-a-f0-9]{36}$/.test(s.id)||typeof s.title!=='string'||s.title.length>80||!MODES.includes(s.mode)||!LEVELS.includes(s.level)||!GOALS.includes(s.goal)||!equipmentValid(s.equipment)||!Number.isFinite(s.started)||s.started<=0||!Number.isFinite(s.ended)||s.ended<0||!Number.isInteger(s.restSeconds)||s.restSeconds<30||s.restSeconds>300||!Array.isArray(s.entries)||!s.entries.length||s.entries.length>8||!Number.isInteger(s.current)||s.current<0||s.current>=s.entries.length)throw Error('Registro de treino inválido.');
    for(const e of s.entries){if(!Number.isInteger(e.rest)||e.rest<30||e.rest>300||!Array.isArray(e.rows)||!e.rows.length||e.rows.length>6)throw Error('Séries inválidas.');for(const r of e.rows){if(exercise(r.id).pattern!==e.pattern||['done','skipped','blocked'].some(k=>typeof r[k]!=='boolean')||r.done&&r.skipped)throw Error('Série inválida.');record(r.load,r.reps);}}return s;
  }
  function remaining(t,now=Date.now()){return t.running?Math.max(0,t.deadline-now):Math.max(0,t.paused||0);}
  return {DAYS,GOALS,LEVELS,MODES,EQUIPMENT,FOCUSES,CATALOG,clone,exercise,validateProfile,alternatives,estimatedMinutes,dayPlan,generate,profileKey,validatePlan,advisory,record,createSession,stats,complete,adapt,validateSession,remaining};
})();
if(typeof module!=='undefined')module.exports=Impulso;
