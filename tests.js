// Ejecutar con: node tests.js
const Core=require('./core.js'),MC=require('./crypto.js');
let fail=0;const t=async(n,f)=>{try{await f();console.log('OK  ',n);}catch(e){fail++;console.log('FAIL',n,e.message);}};
const eq=(a,b)=>{if(a!==b)throw new Error(`esperado ${b}, obtenido ${a}`);};
const mv=(type,cents,date)=>({id:Math.random()+'',type,cents,date,name:'x',cat:'x'});
(async()=>{
await t('Importes',()=>{eq(Core.toCents('1.234,56'),123456);eq(Core.toCents('12,5'),1250);eq(Core.toCents('12.50'),1250);eq(Core.toCents('0,1')+Core.toCents('0,2'),30);eq(Core.toCents('1.234'),123400);eq(Core.toCents('abc'),null);eq(Core.toCents('-5'),null);eq(Core.toCents(''),null);});
await t('Ejemplo noviembre/diciembre',()=>{const d={initial:0,moves:[mv('income',100000,'2026-11-03'),mv('expense',40000,'2026-11-09'),mv('income',120000,'2026-12-01'),mv('expense',50000,'2026-12-15')]};
  const n=Core.summary(d,'2026-11'),c=Core.summary(d,'2026-12');eq(n.closing,60000);eq(c.opening,60000);eq(c.closing,130000);});
await t('Saldo inicial',()=>{const d={initial:25050,moves:[mv('expense',50,'2026-11-01')]};eq(Core.summary(d,'2026-11').closing,25000);eq(Core.summary(d,'2026-10').closing,25050);});
await t('Editar un movimiento antiguo recalcula los meses siguientes',()=>{const m=mv('expense',40000,'2026-11-09'),d={initial:100000,moves:[m]};eq(Core.summary(d,'2027-02').opening,60000);m.cents=10000;eq(Core.summary(d,'2027-02').opening,90000);});
await t('Eliminar un movimiento',()=>{const d={initial:0,moves:[mv('income',500,'2026-11-01')]};d.moves.pop();eq(Core.summary(d,'2026-12').opening,0);});
await t('Bisiesto y cambio de año',()=>{const d={initial:0,moves:[mv('expense',100,'2024-02-29'),mv('expense',200,'2026-12-31')]};
  eq(Core.summary(d,'2024-02').expense,100);eq(Core.summary(d,'2024-03').expense,0);eq(Core.summary(d,'2024-03').opening,-100);eq(Core.summary(d,'2027-01').opening,-300);
  eq(Core.daysIn('2024-02'),29);eq(Core.daysIn('2026-02'),28);eq(Core.shiftMonth('2026-12',1),'2027-01');eq(Core.shiftMonth('2026-01',-1),'2025-12');});
await t('Saldo negativo',()=>eq(Core.summary({initial:0,moves:[mv('expense',1000,'2026-01-01')]},'2026-01').closing,-1000));
await t('Calendario: totales por día',()=>{const d={initial:0,moves:[mv('income',500,'2026-11-05'),mv('expense',200,'2026-11-05')]};const x=Core.dayTotals(d,'2026-11')['2026-11-05'];eq(x.income,500);eq(x.expense,200);});
await t('Cifrado y contraseña incorrecta',async()=>{const s=MC.newSalt(),k=await MC.deriveKey('buena-clave',s,1000),o={a:[1,'é']};
  const v1=await MC.encrypt(k,o),v2=await MC.encrypt(k,o);eq(v1.iv!==v2.iv,true);eq(JSON.stringify(await MC.decrypt(k,v1)),JSON.stringify(o));
  let f=false;try{await MC.decrypt(await MC.deriveKey('mala',s,1000),v1);}catch{f=true;}eq(f,true);});
process.exit(fail?1:0);
})();
