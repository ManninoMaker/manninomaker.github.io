(function(){
"use strict";
const cfg=window.MM_CONFIG||{};let allProjects=[],visibleProjects=[],activeCategory="Tutti";const $=s=>document.querySelector(s);
function normalize(v){let s=String(v||"").toLowerCase();if(s.normalize)s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");return s.replace(/\s+/g," ").trim()}
function arr(v){return Array.isArray(v)?v:(v?String(v).split(/[\n,]+/).map(x=>x.trim()).filter(Boolean):[])}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function safeHref(v){const s=String(v||"").trim();if(!s)return "";if(/^(https?:|mailto:)/i.test(s)||/^(\/|\.\/|\.\.\/|#)/.test(s)||/^[\w.-]+\//.test(s))return s;return ""}
function clean(p){return {...p,technologies:arr(p.technologies),files:arr(p.files),features:arr(p.features),links:Array.isArray(p.links)?p.links:[],featured:Boolean(p.featured),published:p.published!==false,sort_order:Number(p.sort_order??p.order??9999)}}
function resourceCount(p){return p.files.length+p.links.filter(link=>link&&link.url).length+(p.project_url?1:0)}
function iconHtml(p,cls){const img=safeHref(p.image_url);return `<span class="${cls}${img?" has-image":""}">${img?`<img src="${esc(img)}" alt="">`:esc(p.icon||"MM")}</span>`}
function homeAssetPath(value){let s=String(value||"").trim();if(/^(https?:|data:)/i.test(s))return s;while(s.startsWith("../"))s=s.slice(3);if(s.startsWith("./"))s=s.slice(2);return s}
async function discoverLocalProjects(fallback){
  const localHosts=["localhost","127.0.0.1","::1"];
  if(!localHosts.includes(location.hostname))return fallback;
  try{
    const directoryUrl=new URL("progetti/",location.href);
    const listing=await fetch(directoryUrl,{cache:"no-store"});
    if(!listing.ok)return fallback;
    const listingHtml=await listing.text();
    const listingDoc=new DOMParser().parseFromString(listingHtml,"text/html");
    const urls=[...listingDoc.querySelectorAll("a[href]")].map(a=>new URL(a.getAttribute("href"),directoryUrl)).filter(u=>u.origin===location.origin&&/\.html$/i.test(u.pathname));
    const unique=[...new Map(urls.map(u=>[u.pathname,u])).values()];
    if(!unique.length)return fallback;
    const loaded=await Promise.all(unique.map(async u=>{
      try{
        const response=await fetch(u,{cache:"no-store"});if(!response.ok)return null;
        const pageDoc=new DOMParser().parseFromString(await response.text(),"text/html");
        const block=pageDoc.querySelector("#mm-project-data");if(!block)return null;
        const data=JSON.parse(block.textContent);if(data.published===false)return null;
        const filename=decodeURIComponent(u.pathname.split("/").pop());
        data.slug=filename.replace(/\.html$/i,"");data.url=`progetti/${filename}`;data.image_url=homeAssetPath(data.image_url);data.sort_order=Number(data.sort_order??data.order??9999);data.created_at=String(data.created_at||data.date||"");
        return data;
      }catch(error){console.warn("Pagina progetto ignorata:",u.href,error);return null}
    }));
    const projects=loaded.filter(Boolean);
    return projects.length?projects:fallback;
  }catch(error){console.info("Scansione locale non disponibile; uso projects.json",error);return fallback}
}
async function load(){try{const response=await fetch("projects.json",{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);const catalog=await response.json();const data=await discoverLocalProjects(catalog);allProjects=data.map(clean).filter(p=>p.published);renderAll()}catch(error){console.error(error);$("#projectGrid").innerHTML='<div class="empty catalog-error"><h3>Catalogo non disponibile</h3><p>Avvia il sito tramite un server locale. Su GitHub il catalogo viene creato automaticamente; per un server locale senza elenco cartelle puoi eseguire AGGIORNA_CATALOGO.bat.</p></div>';$("#projectGrid").style.display="block"}}
function renderAll(){renderStats();renderFeatured();renderFilters();apply();setupContact()}
function renderStats(){const cats=new Set(allProjects.map(p=>p.category).filter(Boolean));$("#statProjects").textContent=allProjects.length;$("#statCategories").textContent=cats.size;$("#statResources").textContent=allProjects.reduce((n,p)=>n+resourceCount(p),0);$("#statFeatured").textContent=allProjects.filter(p=>p.featured).length}
function renderFeatured(){let list=allProjects.filter(p=>p.featured).slice(0,3);if(!list.length)list=allProjects.slice(0,3);$("#featuredGrid").innerHTML=list.map(p=>`<a class="featured-card" href="${esc(safeHref(p.url))}">${iconHtml(p,"featured-icon")}<span class="featured-category">${esc(p.category)}</span><strong>${esc(p.title)}</strong><small>${esc(p.short_description)}</small><span class="featured-action">Apri progetto ↗</span></a>`).join("")}
function renderFilters(){const cats=["Tutti",...Array.from(new Set(allProjects.map(p=>p.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"it"))];$("#filters").innerHTML=cats.map(c=>`<button type="button" class="filter${c===activeCategory?" active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("")}
function searchable(p){const links=p.links.map(x=>x?`${x.label||""} ${x.url||""}`:"");return normalize([p.title,p.category,p.status,p.level,p.short_description,p.description,...p.technologies,...p.files,...p.features,p.project_url||"",...links].join(" "))}
function apply(){const q=normalize($("#projectSearch").value);const terms=q.split(" ").filter(Boolean);visibleProjects=allProjects.filter(p=>(activeCategory==="Tutti"||p.category===activeCategory)&&terms.every(t=>searchable(p).includes(t)));const mode=$("#projectSort").value;visibleProjects.sort((a,b)=>mode==="az"?a.title.localeCompare(b.title,"it"):mode==="category"?(a.category.localeCompare(b.category,"it")||a.title.localeCompare(b.title,"it")):mode==="newest"?String(b.created_at||b.date||"").localeCompare(String(a.created_at||a.date||"")):(a.sort_order-b.sort_order||a.title.localeCompare(b.title,"it")));renderCards();$("#resultCount").innerHTML=`<b>${visibleProjects.length}</b> progetti visibili`;$("#currentFilter").textContent=`Filtro: ${activeCategory}${q?` · Ricerca: “${$("#projectSearch").value.trim()}”`:""}`;$("#clearSearch").style.display=$("#projectSearch").value?"block":"none";$("#emptyState").style.display=visibleProjects.length?"none":"block"}
function renderCards(){$("#projectGrid").innerHTML=visibleProjects.map(p=>`<a class="project-card" href="${esc(safeHref(p.url))}" aria-label="Apri il progetto ${esc(p.title)}"><div class="card-head">${iconHtml(p,"project-icon")}<span class="status">${esc(p.status||"Progetto")}</span></div><div class="category">${esc(p.category)}</div><h3>${esc(p.title)}</h3><p>${esc(p.short_description||"")}</p><div class="chips">${p.technologies.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join("")}</div><div class="card-info"><span><small>Livello</small>${esc(p.level||"—")}</span><span><small>Risorse</small>${resourceCount(p)}</span></div></a>`).join("")}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2300)}
function setupContact(){const email=cfg.contactEmail||"";$("#emailText").textContent=email;$("#mailLink").href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Contatto da Mannino Maker")}`}
document.addEventListener("click",e=>{const f=e.target.closest("[data-filter]");if(f){activeCategory=f.dataset.filter;renderFilters();apply()}});$("#projectSearch").addEventListener("input",apply);$("#projectSort").addEventListener("change",apply);$("#clearSearch").addEventListener("click",()=>{$("#projectSearch").value="";$("#projectSearch").focus();apply()});$("#resetAll").addEventListener("click",()=>{activeCategory="Tutti";$("#projectSearch").value="";$("#projectSort").value="order";renderFilters();apply()});$("#copyEmail").addEventListener("click",async()=>{const email=cfg.contactEmail||"";try{await navigator.clipboard.writeText(email);toast("Indirizzo email copiato.")}catch{toast(email)}});document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement!==$("#projectSearch")){e.preventDefault();$("#projectSearch").focus()}});load();
})();