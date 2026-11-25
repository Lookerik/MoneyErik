(()=>{
'use strict';
const {DEF,toCents,fmt,fmtShort,fmtDate,today,shiftMonth,monthLabel,uid,summary,dayTotals,daysIn,firstWeekday}=Core;
const KEY='monarch.vault.v1',app=document.getElementById('app');
let key=null,data=null,vault=null,view='home',month=today().slice(0,7),sel=null;
const flt={q:'',type:'',cat:'',from:'',to:''};
const TABS=[['home','Inicio','home'],['calendar','Calendario','cal'],['moves','Movimientos','list'],['settings','Configuración','gear']];
const ICON={home:'M3 11l9-8 9 8M5 10v10h14V10',cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
 gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4',
 plus:'M12 5v14M5 12h14',lock:'M6 11h12v9H6zM9 11V8a3 3 0 016 0v3'};
const NS='http://www.w3.org/2000/svg';
const icon=n=>{const s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','ic');s.setAttribute('aria-hidden','true');p.setAttribute('d',ICON[n]);s.append(p);return s;};
// DOM seguro: el texto siempre se inserta como nodo de texto (sin innerHTML => sin XSS).
const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[n,v]of Object.entries(a)){if(n==='class')e.className=v;else if(n.startsWith('on'))e.addEventListener(n.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(n,v===true?'':v);}
  for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)));return e;};
const clean=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,120);
const signed=s=>{s=String(s).trim();if(s==='')return 0;const n=s.startsWith('-');const c=toCents(n?s.slice(1):s);return c===null?null:(n?-c:c);};
const cats=t=>DEF[t].concat(data.custom[t]);
const amt=(c,cls='')=>el('span',{class:'num '+cls},fmt(c));

// ---- Guardado cifrado (cola para que nunca se pisen dos guardados) ----
let q=Promise.resolve();
const save=()=>q=q.then(async()=>{const e=await MCrypto.encrypt(key,data);vault.iv=e.iv;vault.ct=e.ct;localStorage.setItem(KEY,JSON.stringify(vault));});
function commit(fn){fn();render();save().catch(()=>alert('No se pudo guardar (¿almacenamiento lleno?). Exporta una copia de seguridad.'));}

// ---- Validación de datos (también para copias importadas) ----
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function valid(d){
  return d&&Number.isSafeInteger(d.initial)&&Array.isArray(d.moves)&&d.custom&&Array.isArray(d.custom.income)&&Array.isArray(d.custom.expense)
   &&d.moves.every(m=>m&&['income','expense'].includes(m.type)&&Number.isSafeInteger(m.cents)&&m.cents>0&&DATE.test(m.date)&&!isNaN(Date.parse(m.date))&&typeof m.id==='string'&&typeof m.name==='string'&&typeof m.cat==='string');
}

// ---- Acceso ----
function auth(first){
  const err=el('div',{class:'err',role:'alert'}),pw=el('input',{type:'password',id:'pw',autocomplete:first?'new-password':'current-password'}),
    pw2=el('input',{type:'password',autocomplete:'new-password'}),ini=el('input',{inputmode:'decimal',placeholder:'0,00'});
  const btn=el('button',{class:'btn pri',onclick:go},first?'Crear y empezar':'Desbloquear');
  async function go(){
    err.textContent='';btn.disabled=true;
    try{
      if(first){
        const c=signed(ini.value);
        if(pw.value.length<10)return err.textContent='La contraseña debe tener al menos 10 caracteres.';
        if(pw.value!==pw2.value)return err.textContent='Las contraseñas no coinciden.';
        if(c===null)return err.textContent='El saldo inicial no es válido.';
        const salt=MCrypto.newSalt();key=await MCrypto.deriveKey(pw.value,salt);
        vault={v:1,salt,iter:MCrypto.ITER};data={v:1,initial:c,custom:{income:[],expense:[]},moves:[]};await save();
      }else{
        const k=await MCrypto.deriveKey(pw.value,vault.salt,vault.iter);
        try{const d=await MCrypto.decrypt(k,vault);if(!valid(d))throw 0;data=d;key=k;}catch{return err.textContent='Contraseña incorrecta.';}
      }
      render();
    }finally{btn.disabled=false;pw.value='';pw2.value='';}
  }
  const card=el('div',{class:'card'},el('h1',{},'MONARCH'),el('div',{class:'mut'},'Master your money.'),
    el('label',{for:'pw'},first?'Crea tu contraseña maestra':'Contraseña maestra'),pw,
    first&&[el('label',{},'Repite la contraseña'),pw2,el('label',{},'Saldo inicial (€), opcional'),ini,
      el('div',{class:'note'},'Si pierdes esta contraseña no hay forma de recuperar tus datos. Se guardan cifrados solo en este navegador; GitHub Pages únicamente aloja el código de la aplicación.')],
    err,el('div',{class:'acts'},btn));
  card.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  app.replaceChildren(el('div',{class:'center'},card));pw.focus();
}
function lock(){key=null;data=null;document.querySelector('.ov')?.remove();auth(false);}

// ---- Estructura ----
function render(){
  const nav=el('nav',{'aria-label':'Principal'},el('div',{class:'brand'},el('b',{},'MONARCH'),el('span',{},'Master your money.')),
    TABS.map(([id,n,ic])=>el('button',{'aria-current':view===id?'page':null,onclick:()=>{view=id;render();}},icon(ic),n)),
    el('div',{class:'sp'}),el('button',{onclick:lock},icon('lock'),'Bloquear'));
  const main=el('main');({home,calendar,moves,settings})[view](main);
  app.replaceChildren(el('div',{class:'shell'},nav,main));
}
function monthBar(title){
  const go=d=>{month=shiftMonth(month,d);sel=null;render();};
  return el('div',{class:'bar'},el('h1',{},title),el('div',{class:'grp'},el('button',{class:'btn','aria-label':'Mes anterior',onclick:()=>go(-1)},'‹'),
    el('input',{type:'month',value:month,'aria-label':'Mes y año',onchange:e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)){month=e.target.value;sel=null;render();}}}),
    el('button',{class:'btn','aria-label':'Mes siguiente',onclick:()=>go(1)},'›'),
    el('button',{class:'btn',onclick:()=>{month=today().slice(0,7);sel=null;render();}},'Hoy')));
}
const stat=(l,c,cls,big)=>el('div',{class:'card'+(big?' big':'')},el('small',{},l),el('div',{class:'v'},amt(c,cls)));
function row(m){
  return el('div',{class:'row'},el('div',{class:'g'},el('div',{},m.name||m.cat),el('div',{class:'mut'},fmtDate(m.date)+' · '+m.cat+(m.note?' · '+m.note:''))),
    amt(m.type==='income'?m.cents:-m.cents,m.type==='income'?'inc':'exp'),
    el('button',{class:'btn sm',onclick:()=>form(m.type,m)},'Editar'),
    el('button',{class:'btn sm exp',onclick:()=>{if(confirm('¿Eliminar «'+(m.name||m.cat)+'» ('+fmt(m.cents)+')? No se puede deshacer.'))commit(()=>{data.moves.splice(data.moves.indexOf(m),1);});}},'Eliminar'));
}
const sortDesc=l=>l.slice().sort((a,b)=>b.date.localeCompare(a.date));

// ---- Inicio ----
function home(main){
  const s=summary(data,month);
  main.append(monthBar('Inicio'),
    el('div',{class:'grid'},stat('Saldo disponible (fin de mes)',s.closing,s.closing<0?'exp':'',true),stat('Ingresos del mes',s.income,'inc'),stat('Gastos del mes',s.expense,'exp'),stat('Saldo del mes anterior',s.opening)),
    el('div',{class:'acts'},el('button',{class:'btn inc',onclick:()=>form('income')},icon('plus'),'Añadir ingreso'),el('button',{class:'btn exp',onclick:()=>form('expense')},icon('plus'),'Añadir gasto')),
    el('h2',{},'Últimos movimientos'));
  const l=sortDesc(data.moves.filter(m=>m.date.startsWith(month))).slice(0,8);
  main.append(el('div',{class:'card'},l.length?l.map(row):el('div',{class:'empty'},'Todavía no hay movimientos en este mes.')));
}

// ---- Calendario ----
function calendar(main){
  const t=dayTotals(data,month),n=daysIn(month),cells=[];
  ['L','M','X','J','V','S','D'].forEach(d=>cells.push(el('div',{class:'h'},d)));
  for(let i=0;i<firstWeekday(month);i++)cells.push(el('div',{class:'cd blank'}));
  for(let d=1;d<=n;d++){
    const date=month+'-'+String(d).padStart(2,'0'),x=t[date];
    cells.push(el('button',{class:'cd'+(date===today()?' now':'')+(date===sel?' sel':''),'aria-label':fmtDate(date),onclick:()=>{sel=date;render();}},
      el('b',{},d),x&&x.income?el('span',{class:'ci'},'+'+fmtShort(x.income)):null,x&&x.expense?el('span',{class:'ce'},'-'+fmtShort(x.expense)):null));
  }
  main.append(monthBar('Calendario'),el('div',{class:'cal'},cells));
  if(sel&&sel.startsWith(month)){
    const l=data.moves.filter(m=>m.date===sel);
    main.append(el('div',{class:'card'},el('div',{class:'bar'},el('h2',{},fmtDate(sel)),el('div',{class:'grp'},
      el('button',{class:'btn sm inc',onclick:()=>form('income',null,sel)},'+ Ingreso'),el('button',{class:'btn sm exp',onclick:()=>form('expense',null,sel)},'+ Gasto'))),
      l.length?l.map(row):el('div',{class:'empty'},'Sin movimientos este día.')));
  }
}

// ---- Movimientos ----
function moves(main){
  const box=el('div',{class:'card'}),tot=el('div',{class:'grid'});
  const inp=(a,k,ev='oninput')=>el('input',{...a,value:flt[k],['on'+(ev==='change'?'change':'input')]:e=>{flt[k]=e.target.value;draw();}});
  const all=[...new Set(DEF.income.concat(DEF.expense,data.custom.income,data.custom.expense,data.moves.map(m=>m.cat)))];
  main.append(el('h1',{class:'bar'},'Movimientos'),
    el('div',{class:'fl'},inp({type:'search',placeholder:'Buscar por nombre','aria-label':'Buscar'},'q'),
      el('select',{'aria-label':'Tipo',onchange:e=>{flt.type=e.target.value;draw();}},[['','Ingresos y gastos'],['income','Solo ingresos'],['expense','Solo gastos']].map(([v,n])=>el('option',{value:v,selected:flt.type===v},n))),
      el('select',{'aria-label':'Categoría',onchange:e=>{flt.cat=e.target.value;draw();}},el('option',{value:''},'Todas las categorías'),all.map(c=>el('option',{value:c,selected:flt.cat===c},c))),
      inp({type:'date','aria-label':'Desde'},'from','change'),inp({type:'date','aria-label':'Hasta'},'to','change')),tot,box);
  function draw(){
    const t=flt.q.toLowerCase();
    const l=sortDesc(data.moves.filter(m=>(!flt.type||m.type===flt.type)&&(!flt.cat||m.cat===flt.cat)&&(!flt.from||m.date>=flt.from)&&(!flt.to||m.date<=flt.to)&&(!t||(m.name+' '+m.note).toLowerCase().includes(t))));
    let i=0,e=0;for(const m of l)m.type==='income'?i+=m.cents:e+=m.cents;
    tot.replaceChildren(stat('Total ingresos',i,'inc'),stat('Total gastos',e,'exp'),stat('Diferencia',i-e,i-e<0?'exp':''));
    box.replaceChildren(...(l.length?l.map(row):[el('div',{class:'empty'},'No hay movimientos con estos filtros.')]));
  }
  draw();
}

// ---- Formulario ----
function modal(title,body,onOk,okLabel='Guardar'){
  const ov=el('div',{class:'ov',onclick:e=>{if(e.target===ov)ov.remove();}},el('div',{class:'modal',role:'dialog','aria-modal':'true','aria-label':title},el('h2',{},title),body,
    el('div',{class:'acts'},el('button',{class:'btn',onclick:()=>ov.remove()},'Cancelar'),el('button',{class:'btn pri',onclick:()=>{if(onOk())ov.remove();}},okLabel))));
  ov.addEventListener('keydown',e=>{if(e.key==='Escape')ov.remove();if(e.key==='Enter'&&e.target.tagName==='INPUT'){if(onOk())ov.remove();}});
  document.body.append(ov);ov.querySelector('input')?.focus();
}
function form(type,m,date){
  const edit=!!m,err=el('div',{class:'err',role:'alert'});
  const ty=el('select',{},[['expense','Gasto'],['income','Ingreso']].map(([v,n])=>el('option',{value:v,selected:type===v},n)));
  const am=el('input',{inputmode:'decimal',placeholder:'0,00',value:edit?(m.cents/100).toFixed(2).replace('.',','):''});
  const nm=el('input',{maxlength:120,value:m?.name||'',placeholder:'Ej.: Supermercado'}),dt=el('input',{type:'date',value:m?.date||date||today()});
  const ct=el('select'),nt=el('input',{maxlength:120,value:m?.note||''});
  const fill=()=>{const l=cats(ty.value);if(m&&m.type===ty.value&&!l.includes(m.cat))l.push(m.cat);ct.replaceChildren(...l.map(c=>el('option',{value:c,selected:m?.cat===c&&m.type===ty.value},c)));};ty.onchange=fill;fill();
  modal(edit?'Editar movimiento':'Nuevo movimiento',el('div',{},el('label',{},'Tipo'),ty,el('label',{},'Cantidad (€)'),am,el('label',{},'Descripción'),nm,el('label',{},'Fecha'),dt,el('label',{},'Categoría'),ct,el('label',{},'Nota (opcional)'),nt,err),()=>{
    const c=toCents(am.value);
    if(c===null||c===0)return err.textContent='Escribe una cantidad válida mayor que 0.',false;
    if(!DATE.test(dt.value)||isNaN(Date.parse(dt.value)))return err.textContent='Elige una fecha válida.',false;
    const nv={type:ty.value,name:clean(nm.value),cents:c,date:dt.value,cat:ct.value,note:clean(nt.value)};
    commit(()=>{if(edit)Object.assign(m,nv);else data.moves.push({id:uid(),...nv});});return true;});
}

// ---- Configuración ----
function settings(main){
  const msg=el('div',{class:'ok',role:'status'}),say=(t,bad)=>{msg.className=bad?'err':'ok';msg.textContent=t;};
  const ini=el('input',{inputmode:'decimal',value:(data.initial/100).toFixed(2).replace('.',',')});
  const ctype=el('select',{},el('option',{value:'expense'},'Gasto'),el('option',{value:'income'},'Ingreso')),cname=el('input',{maxlength:40,placeholder:'Nueva categoría'});
  const cur=el('input',{type:'password',autocomplete:'current-password'}),np=el('input',{type:'password',autocomplete:'new-password'}),np2=el('input',{type:'password',autocomplete:'new-password'});
  const custom=['income','expense'].flatMap(t=>data.custom[t].map(c=>[t,c]));
  main.append(el('h1',{class:'bar'},'Configuración'),msg,
    el('div',{class:'card'},el('h2',{},'Saldo inicial'),el('div',{class:'mut'},'Dinero que tenías al empezar a usar MONARCH (puede ser negativo).'),el('label',{},'Importe (€)'),ini,
      el('div',{class:'acts'},el('button',{class:'btn',onclick:()=>{const c=signed(ini.value);if(c===null||ini.value.trim()==='')return say('Importe no válido.',1);commit(()=>{data.initial=c;});say('Saldo inicial guardado.');}},'Guardar'))),
    el('div',{class:'card'},el('h2',{},'Categorías personalizadas'),el('div',{class:'fl'},ctype,cname,el('button',{class:'btn',onclick:()=>{
        const n=clean(cname.value);if(!n)return say('Escribe un nombre.',1);
        if(cats(ctype.value).some(c=>c.toLowerCase()===n.toLowerCase()))return say('Esa categoría ya existe.',1);
        commit(()=>data.custom[ctype.value].push(n));}},'Añadir')),
      custom.length?custom.map(([t,c])=>el('div',{class:'row'},el('div',{class:'g'},c,el('span',{class:'mut'},t==='income'?' · ingreso':' · gasto')),
        el('button',{class:'btn sm exp',onclick:()=>{if(confirm('¿Quitar la categoría «'+c+'»? Los movimientos existentes la conservan.'))commit(()=>{data.custom[t]=data.custom[t].filter(x=>x!==c);});}},'Quitar'))):el('div',{class:'mut'},'Aún no has creado ninguna.')),
    el('div',{class:'card'},el('h2',{},'Contraseña maestra'),el('label',{},'Contraseña actual'),cur,el('label',{},'Nueva contraseña (mín. 10 caracteres)'),np,el('label',{},'Repite la nueva'),np2,
      el('div',{class:'acts'},el('button',{class:'btn',onclick:async()=>{
        try{await MCrypto.decrypt(await MCrypto.deriveKey(cur.value,vault.salt,vault.iter),vault);}catch{return say('La contraseña actual no es correcta.',1);}
        if(np.value.length<10)return say('La nueva contraseña es demasiado corta.',1);if(np.value!==np2.value)return say('Las contraseñas nuevas no coinciden.',1);
        const salt=MCrypto.newSalt();key=await MCrypto.deriveKey(np.value,salt);vault.salt=salt;vault.iter=MCrypto.ITER;await save();cur.value=np.value=np2.value='';say('Contraseña cambiada.');}},'Cambiar contraseña'))),
    el('div',{class:'card'},el('h2',{},'Copia de seguridad'),
      el('div',{class:'note'},'Tus datos están solo en este navegador y dispositivo. Borrar los datos del navegador puede eliminarlos y no hay sincronización automática: para pasarlos al móvil, exporta una copia y restáurala allí con la misma contraseña. Sin la contraseña maestra la copia no se puede abrir.'),
      el('div',{class:'acts'},el('button',{class:'btn pri',onclick:exportBackup},'Exportar copia cifrada'),el('button',{class:'btn',onclick:importBackup},'Importar copia…'))));
}
function exportBackup(){
  const a=el('a',{href:URL.createObjectURL(new Blob([JSON.stringify({app:'monarch',...vault})],{type:'application/json'})),download:'monarch-copia-'+today()+'.json'});
  document.body.append(a);a.click();a.remove();
}
function importBackup(){
  const f=el('input',{type:'file',accept:'.json,application/json'});
  f.onchange=async()=>{
    try{
      const j=JSON.parse(await f.files[0].text());
      if(j.app!=='monarch'||![j.salt,j.iv,j.ct].every(x=>typeof x==='string')||!Number.isInteger(j.iter)||j.iter<100000||j.iter>5000000)throw 0;
      const pw=prompt('Contraseña maestra de esa copia:');if(pw===null)return;
      let d;try{d=await MCrypto.decrypt(await MCrypto.deriveKey(pw,j.salt,j.iter),j);}catch{return alert('Contraseña incorrecta o archivo dañado.');}
      if(!valid(d))throw 0;
      if(!confirm('La copia contiene '+d.moves.length+' movimientos. Se REEMPLAZARÁN los datos actuales de este dispositivo. ¿Continuar? (Exporta antes una copia si quieres conservarlos.)'))return;
      vault={v:1,salt:j.salt,iter:j.iter,iv:j.iv,ct:j.ct};localStorage.setItem(KEY,JSON.stringify(vault));alert('Copia restaurada. Entra con la contraseña de la copia.');lock();
    }catch{alert('El archivo no es una copia válida de MONARCH.');}
  };
  f.click();
}

// ---- Inicio de la app ----
try{vault=JSON.parse(localStorage.getItem(KEY)||'null');}catch{vault=null;}
auth(!vault);
})();
