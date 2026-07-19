(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeHref=v=>{const s=String(v||"").trim();return /^(https?:|mailto:|\/|\.\.\/|\.\/|#)/i.test(s)?s:""};
let data={};
try{data=JSON.parse($("#mm-project-data").textContent)}catch(e){console.error("Dati progetto non validi",e)}
document.title=`${data.title||"Progetto"} — Mannino Maker`;
$("#projectEyebrow").textContent=`${data.category||"Progetto"} · ${data.status||"Progetto"}`;
$("#projectTitle").textContent=data.title||"Progetto";
$("#projectDescription").textContent=data.short_description||data.description||"";
$("#projectCategory").textContent=data.category||"—"; $("#projectStatus").textContent=data.status||"—"; $("#projectLevel").textContent=data.level||"—";
const date=data.date||data.created_at; const parsed=date?new Date(`${date}T12:00:00`):null; $("#projectDate").textContent=parsed&&!Number.isNaN(parsed.getTime())?new Intl.DateTimeFormat("it-IT").format(parsed):"—";
$("#projectTechnologies").innerHTML=(data.technologies||[]).map(x=>`<span>${esc(x)}</span>`).join("");
const visual=$("#projectVisual"); const img=safeHref(data.image_url); visual.innerHTML=img?`<img src="${esc(img)}" alt="${esc(data.title||"")}">`:`<span>${esc(data.icon||"MM")}</span>`;
const features=data.features||[]; $("#projectFeatures").innerHTML=features.map(x=>`<li>${esc(x)}</li>`).join(""); $("#featuresPanel").classList.toggle("hidden",!features.length);
const files=data.files||[]; $("#projectFiles").innerHTML=files.map(x=>`<span>${esc(x)}</span>`).join(""); $("#filesPanel").classList.toggle("hidden",!files.length);
const projectUrl=safeHref(data.project_url); const projectButton=$("#projectButton"); if(projectUrl){projectButton.href=projectUrl;projectButton.classList.remove("disabled");projectButton.removeAttribute("aria-disabled");projectButton.removeAttribute("title");if(/^https?:/i.test(projectUrl)){projectButton.target="_blank";projectButton.rel="noopener"}}else{projectButton.removeAttribute("href");projectButton.classList.add("disabled");projectButton.setAttribute("aria-disabled","true");projectButton.title="Inserisci il link nel campo project_url della pagina"}
const links=(data.links||[]).filter(x=>x&&safeHref(x.url)); $("#projectLinks").innerHTML=links.map(x=>`<a class="button ${x.style==="primary"?"primary":""}" href="${esc(safeHref(x.url))}" ${/^https?:/i.test(x.url)?'target="_blank" rel="noopener"':''}>${esc(x.label||"Apri link")} ↗</a>`).join(""); $("#linksPanel").classList.toggle("hidden",!links.length);
const gallery=(data.gallery||[]).map(x=>typeof x==="string"?{image:x}:x).filter(x=>x&&safeHref(x.image)); if(gallery.length){$("#gallerySection").classList.remove("hidden");$("#projectGallery").innerHTML=gallery.map(x=>`<figure><img src="${esc(safeHref(x.image))}" alt="${esc(x.caption||data.title||"")}">${x.caption?`<figcaption>${esc(x.caption)}</figcaption>`:""}</figure>`).join("")}
const email="wolf_86m@hotmail.it"; $("#projectMail").href=`mailto:${email}?subject=${encodeURIComponent(`Informazioni progetto: ${data.title||""}`)}`;
})();