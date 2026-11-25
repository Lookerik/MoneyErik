// AES-GCM 256 + PBKDF2-SHA-256. La clave solo existe en memoria durante la sesión.
const MCrypto=(()=>{
  const ITER=600000;
  const b64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const newSalt=()=>b64(crypto.getRandomValues(new Uint8Array(16)));
  async function deriveKey(pw,salt,iter=ITER){
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:unb64(salt),iterations:iter},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function encrypt(key,obj){
    const iv=crypto.getRandomValues(new Uint8Array(12)); // IV nuevo en cada guardado
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj)));
    return {iv:b64(iv),ct:b64(ct)};
  }
  async function decrypt(key,v){ // lanza error si la contraseña es incorrecta
    const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(v.iv)},key,unb64(v.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  return {ITER,newSalt,deriveKey,encrypt,decrypt};
})();
if(typeof module!=='undefined')module.exports=MCrypto;
