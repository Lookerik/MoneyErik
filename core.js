// Lógica financiera pura. Importes siempre en céntimos enteros. Los saldos se derivan de los movimientos.
const Core=(()=>{
  const DEF={income:['Salario','Ventas','Trabajos adicionales','Otros ingresos'],
             expense:['Alimentación','Ropa','Transporte','Estudios','Entretenimiento','Otros gastos']};
  function toCents(input){
    let s=String(input??'').trim().replace(/[€\s]/g,'');
    if(!/^\d[\d.,]*$/.test(s))return null;                     // solo importes positivos
    const last=Math.max(s.lastIndexOf(','),s.lastIndexOf('.'));
    let int=s,dec='';
    if(last>=0){
      const tail=s.slice(last+1),head=s.slice(0,last),single=(s.match(/[.,]/g)||[]).length===1;
      if(tail.length===3&&single)int=s.replace(/[.,]/g,'');      // 1.234 => 1234
      else if(tail.length>=1&&tail.length<=2){int=head.replace(/[.,]/g,'');dec=tail;}
      else return null;
    }
    if(!/^\d+$/.test(int))return null;
    const c=parseInt(int,10)*100+parseInt((dec+'00').slice(0,2),10);
    return Number.isSafeInteger(c)&&c<=1e12?c:null;
  }
  const nf=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
  const fmt=c=>nf.format(c/100);
  const fmtShort=c=>(c/100).toLocaleString('es-ES',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});
  const fmtDate=iso=>iso.split('-').reverse().join('/');
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date());
  const shiftMonth=(m,d)=>{let[y,mo]=m.split('-').map(Number);mo+=d-1;y+=Math.floor(mo/12);mo=((mo%12)+12)%12+1;return y+'-'+String(mo).padStart(2,'0');};
  const monthLabel=m=>{const[y,mo]=m.split('-').map(Number);return new Date(Date.UTC(y,mo-1,1)).toLocaleDateString('es-ES',{month:'long',year:'numeric',timeZone:'UTC'});};
  const uid=()=>crypto.randomUUID();
  function summary(data,month){
    const s=month+'-01',e=month+'-31'; // comparación de cadenas ISO: válida con cualquier mes y año bisiesto
    let opening=data.initial,income=0,expense=0;
    for(const m of data.moves){
      if(m.date<s)opening+=m.type==='income'?m.cents:-m.cents;
      else if(m.date<=e){if(m.type==='income')income+=m.cents;else expense+=m.cents;}
    }
    return {opening,income,expense,closing:opening+income-expense};
  }
  function dayTotals(data,month){
    const t={};
    for(const m of data.moves)if(m.date.startsWith(month)){const d=t[m.date]||(t[m.date]={income:0,expense:0});d[m.type]+=m.cents;}
    return t;
  }
  const daysIn=m=>{const[y,mo]=m.split('-').map(Number);return new Date(Date.UTC(y,mo,0)).getUTCDate();};
  const firstWeekday=m=>{const[y,mo]=m.split('-').map(Number);return (new Date(Date.UTC(y,mo-1,1)).getUTCDay()+6)%7;}; // lunes=0
  return {DEF,toCents,fmt,fmtShort,fmtDate,today,shiftMonth,monthLabel,uid,summary,dayTotals,daysIn,firstWeekday};
})();
if(typeof module!=='undefined')module.exports=Core;
