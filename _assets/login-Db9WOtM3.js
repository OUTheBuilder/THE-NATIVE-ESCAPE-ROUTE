import{S as u,o as j,s as g,y as S,r,j as e,N as E,k as h}from"./vendor-CYxKxS8R.js";import{H as v}from"./Helmet-Ba_-bftk.js";import{u as b}from"./index-DNJc6yMG.js";import"./index-BbP3371Q.js";
const CSS=`
.oer-login{position:fixed;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;z-index:50;font-family:Inter,system-ui,sans-serif;color:#fff;
background:radial-gradient(900px 500px at 0% 0%,#0c2a44 0%,rgba(12,42,68,0) 60%),radial-gradient(800px 500px at 100% 20%,#2a0f3d 0%,rgba(42,15,61,0) 60%),linear-gradient(180deg,#050a16 0%,#0b1226 50%,#0a0f20 100%)}
.oer-login:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.35;background-image:linear-gradient(rgba(120,160,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,255,.07) 1px,transparent 1px);background-size:36px 36px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 70%);mask-image:linear-gradient(180deg,#000,transparent 70%)}
.oer-wrap{position:relative;max-width:520px;margin:0 auto;padding:max(28px,env(safe-area-inset-top)) 16px max(28px,env(safe-area-inset-bottom))}
.oer-card{position:relative;border-radius:30px;padding:28px 18px 20px;background:linear-gradient(180deg,rgba(26,31,58,.96),rgba(14,18,38,.96));border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.oer-card:before{content:"";position:absolute;left:34px;right:34px;top:-1px;height:3px;border-radius:3px;background:linear-gradient(90deg,#28c9e8,#7a6cf5,#ec4fa0)}
.oer-brand{display:flex;align-items:center;gap:14px;margin-bottom:26px}
.oer-badge{width:108px;height:108px;flex:none;border-radius:34px;display:grid;place-items:center;background:rgba(40,201,232,.07);border:1px solid rgba(80,200,230,.35)}
.oer-badge i{font-style:normal;width:90px;height:90px;border-radius:28px;display:grid;place-items:center;font-weight:800;font-size:1.5rem;color:#0b1022;background:linear-gradient(135deg,#59d4ff 0%,#9a7cf7 55%,#f063b4 100%)}
.oer-brand h1{margin:0;font-size:1.28rem;font-weight:800;letter-spacing:.2em;line-height:1.2}
.oer-brand p{margin:8px 0 0;color:#8fa0c8;font-size:.74rem;letter-spacing:.22em;text-transform:uppercase}
.oer-h2{margin:0 0 14px;font-size:2rem;font-weight:800;letter-spacing:-.01em}
.oer-lead{margin:0 0 22px;color:#a9b6d6;font-size:1.12rem;line-height:1.55}
.oer-label{display:block;margin:0 0 10px;color:#9fb0d0;font-size:.82rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.oer-input{width:100%;box-sizing:border-box;height:58px;padding:0 24px;border-radius:20px;background:#080c1c;border:1px solid #1d2442;color:#fff;font-size:1.12rem;font-family:inherit;outline:none;margin-bottom:22px}
.oer-input::placeholder{color:#6d7794}
.oer-input:focus{border-color:#3fb4d4;box-shadow:0 0 0 3px rgba(63,180,212,.18)}
.oer-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:9px;margin-bottom:26px;border-radius:24px;background:#0a0f20;border:1px solid #1d2442}
.oer-tab{height:52px;border-radius:16px;border:1px solid transparent;background:#090d1c;color:#b4c0dc;font-size:1.05rem;font-weight:700;font-family:inherit;cursor:pointer}
.oer-tab[aria-selected=true]{color:#fff;border-color:#2f7694;background:linear-gradient(135deg,#143a52,#272852)}
.oer-primary{width:100%;height:58px;border:0;border-radius:20px;font-size:1.15rem;font-weight:800;font-family:inherit;color:#06101f;cursor:pointer;background:linear-gradient(90deg,#5bf2ff 0%,#9fc8ff 55%,#b8a9ff 100%);box-shadow:0 0 22px rgba(91,242,255,.25)}
.oer-primary:disabled{opacity:.65;cursor:default}
.oer-row{display:flex;justify-content:center;gap:28px;margin-top:22px}
.oer-ghost{height:58px;padding:0 26px;border:0;border-radius:4px;background:#6b6b6b;color:#fff;font-size:1.1rem;font-weight:700;font-family:inherit;cursor:pointer}
.oer-note{margin-top:22px;padding:18px 20px;border-radius:20px;background:#221e1b;border:1px solid #3a3129;color:#eadfb4;font-size:.98rem;line-height:1.5}
.oer-hint{margin:-8px 0 18px;color:#8fa0c8;font-size:.9rem;line-height:1.4}
.oer-input:disabled{opacity:.55;cursor:not-allowed}
.oer-err{margin:-6px 0 16px;color:#ff8a8a;font-size:.95rem}
`;
function B(){
const{authState:o,onLogin:i}=b(),nav=S();
const[mode,setMode]=r.useState("email");
const[ident,setIdent]=r.useState("");
const[pw,setPw]=r.useState("");
const[pin,setPin]=r.useState("");
const[busy,setBusy]=r.useState(!1);
const[err,setErr]=r.useState("");
if(o.type==="authenticated")return e.jsx(E,{to:"/",replace:!0});
const submit=async ev=>{ev.preventDefault();setErr("");setBusy(!0);
try{
let path,body;
if(mode==="pin"){if(!/^\d{4,12}$/.test(pin))throw new Error("Enter your 4–12 digit PIN.");path="auth/login_with_pin";body={pin}}
else{path="auth/login_with_password";body={identifier:ident.trim(),password:pw,mode}}
const res=await fetch("/_api/"+path,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:u.stringify(body)});
const text=await res.text();let d=null;try{d=u.parse(text)}catch{}
if(!res.ok||!d||!d.user)throw new Error(d&&(d.error||d.message)||"Sign in failed. Check your details.");
i(d.user);nav("/",{replace:!0})
}catch(ex){setErr(ex instanceof Error&&ex.message?ex.message:"Sign in failed.")}finally{setBusy(!1)}};
const Tab=(k,t)=>e.jsx("button",{type:"button",role:"tab","aria-selected":mode===k,className:"oer-tab",onClick:()=>{setMode(k);setErr("")},children:t});
return e.jsxs("div",{className:"oer-login",children:[
e.jsx(v,{children:e.jsx("title",{children:"Sign in · OU Escape Route"})}),
e.jsx("style",{children:CSS}),
e.jsx("div",{className:"oer-wrap",children:e.jsxs("form",{className:"oer-card",onSubmit:submit,children:[
e.jsxs("div",{className:"oer-brand",children:[
e.jsx("div",{className:"oer-badge",children:e.jsx("i",{children:"ER"})}),
e.jsxs("div",{children:[e.jsx("h1",{children:"OU ESCAPE ROUTE"}),e.jsx("p",{children:"Neon Arcade · Play your way"})]})]}),
e.jsx("h2",{className:"oer-h2",children:"Welcome back"}),
e.jsx("p",{className:"oer-lead",children:"Choose a sign-in method. Your account is stored privately on this device, so no internet or server is needed."}),
e.jsx("label",{className:"oer-label",htmlFor:"oer-server",children:"Account server URL (optional)"}),
e.jsx("input",{id:"oer-server",className:"oer-input",type:"text",disabled:!0,readOnly:!0,placeholder:"Offline mode — no server needed",value:""}),
e.jsxs("div",{className:"oer-tabs",role:"tablist",children:[Tab("email","Email"),Tab("username","Username"),Tab("pin","PIN")]}),
mode!=="pin"&&e.jsxs(e.Fragment,{children:[
e.jsx("label",{className:"oer-label",htmlFor:"oer-ident",children:mode==="email"?"Email":"Username"}),
e.jsx("input",{id:"oer-ident",className:"oer-input",type:mode==="email"?"email":"text",autoComplete:"username",autoCapitalize:"off",placeholder:mode==="email"?"you@example.com":"Username",value:ident,onChange:a=>setIdent(a.target.value),required:!0}),
e.jsx("label",{className:"oer-label",htmlFor:"oer-pw",children:"Password"}),
e.jsx("input",{id:"oer-pw",className:"oer-input",type:"password",autoComplete:"current-password",placeholder:"Password",value:pw,onChange:a=>setPw(a.target.value),required:!0})]}),
mode==="pin"&&e.jsxs(e.Fragment,{children:[
e.jsx("label",{className:"oer-label",htmlFor:"oer-pin",children:"PIN"}),
e.jsx("input",{id:"oer-pin",className:"oer-input",type:"password",inputMode:"numeric",autoComplete:"off",placeholder:"PIN",value:pin,onChange:a=>setPin(a.target.value.replace(/\D/g,"").slice(0,12)),required:!0}),
e.jsx("p",{className:"oer-hint",children:"Use the Premium PIN you set in Settings after signing in with your password."})]}),
err?e.jsx("p",{className:"oer-err",role:"alert",children:err}):null,
e.jsx("button",{type:"submit",className:"oer-primary",disabled:busy,children:busy?"Please wait…":"Enter Game Hub"}),
e.jsxs("div",{className:"oer-row",children:[
e.jsx("button",{type:"button",className:"oer-ghost",onClick:()=>nav("/register"),children:"Create account"}),
e.jsx("button",{type:"button",className:"oer-ghost",onClick:()=>nav("/forgot-password"),children:"Forgot password?"})]}),
e.jsx("div",{className:"oer-note",children:"Offline mode: accounts, scores and your Premium vault are stored only on this phone. New here? Tap Create account — the first account created becomes the administrator."})
]})})]})}
export{B as default};
