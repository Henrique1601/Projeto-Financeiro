import{T as s}from"./index-Dj9mJrhr.js";function r(e,n="error"){s({text:e,duration:3e3,gravity:"top",position:"right",style:{background:n==="success"?"#10b981":n==="warning"?"#f59e0b":"#ef4444",borderRadius:"8px",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}).showToast()}function t(e="Processando..."){const n=document.getElementById("app-spinner");n&&n.remove();const o=document.createElement("div");o.id="app-spinner",o.className="spinner-overlay",o.innerHTML=`
    <div class="spinner"></div>
    <p>${e}</p>
  `,document.body.appendChild(o)}function a(){const e=document.getElementById("app-spinner");e&&e.remove()}export{r as a,a as h,t as s};
