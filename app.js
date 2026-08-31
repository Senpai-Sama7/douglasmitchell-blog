const $ = (s,c)=> (c||document).querySelector(s);
const $$ = (s,c)=> Array.from((c||document).querySelectorAll(s));
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const store = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
};
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function toast(msg, icon){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<span class="ic">'+(icon||"\u25C6")+'</span>'+esc(msg);
  $("#toasts").appendChild(t);
  setTimeout(()=>{ t.classList.add("out"); setTimeout(()=>t.remove(),400); }, 3200);
}

let localPosts = store.get("dm_posts_v1", []);
let settings = Object.assign({}, {adminUser:SITE_CONFIG.adminUser, adminPass:SITE_CONFIG.adminPass, consoleGreeting:SITE_CONFIG.consoleGreeting}, store.get("dm_settings_v1", {}));
let videoCfg = Object.assign({}, SITE_CONFIG.video, store.get("dm_video_v1", {}));
let activeTag = "All";
let searchTerm = "";
let editingId = null;
const ACCENTS = {gold:"var(--gold)", teal:"var(--teal)", rose:"var(--rose)", violet:"var(--violet)"};

function allPosts(){ return [...SEED_POSTS, ...localPosts]; }
function publishedPosts(){ return allPosts().filter(p=>p.status==="published"); }
function fmtDate(iso){ try{ return new Date(iso+"T12:00:00").toLocaleString("en-US",{month:"short",year:"numeric"}); }catch(e){ return iso; } }

(function boot(){
  const el = $("#boot");
  if(REDUCED){ el.classList.add("done"); document.body.style.overflow=""; return; }
  document.body.style.overflow = "hidden";
  const lines = $$(".bl", el);
  lines.forEach((l,i)=> setTimeout(()=> l.classList.add("show"), 160 + i*230));
  const finish = ()=> { el.classList.add("done"); document.body.style.overflow=""; };
  setTimeout(finish, 160 + lines.length*230 + 500);
  el.addEventListener("click", finish);
})();

(function splitTitle(){
  const h = $("#heroTitle");
  const parts = [];
  h.childNodes.forEach(n=>{
    if(n.nodeType===3) n.textContent.split(/\s+/).filter(Boolean).forEach(w=> parts.push({t:w, em:false}));
    else if(n.nodeType===1) n.textContent.split(/\s+/).filter(Boolean).forEach(w=> parts.push({t:w, em:true}));
  });
  h.innerHTML = parts.map((p,i)=> (p.em?'<em>':'')+'<span class="w" style="animation-delay:'+(0.35+i*0.09)+'s">'+esc(p.t)+'</span>'+(p.em?'</em>':'')).join(" ");
})();

(function field(){
  const c = $("#fieldCanvas"); if(!c) return;
  const ctx = c.getContext("2d");
  let W,H,pts=[],raf=null;
  const mouse = {x:-9e3,y:-9e3};
  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W*dpr; c.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.min(120, Math.max(30, Math.floor(W*H/13000)));
    pts = Array.from({length:n},()=>({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:Math.random()*1.5+.5, g:Math.random()>.6}));
  }
  function step(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      const dx = mouse.x-p.x, dy = mouse.y-p.y, d2 = dx*dx+dy*dy;
      if(d2 < 32400){ const d = Math.sqrt(d2)||1; p.vx += dx/d*.012; p.vy += dy/d*.012; }
      p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy;
      if(p.x<-20)p.x=W+20; if(p.x>W+20)p.x=-20;
      if(p.y<-20)p.y=H+20; if(p.y>H+20)p.y=-20;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7);
      ctx.fillStyle = p.g ? "rgba(217,164,65,.85)" : "rgba(240,237,228,.5)";
      ctx.fill();
    }
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
        if(d2<14400){
          const al = (1-Math.sqrt(d2)/120)*.22;
          ctx.strokeStyle = (a.g||b.g) ? "rgba(217,164,65,"+al+")" : "rgba(240,237,228,"+al+")";
          ctx.lineWidth = .6;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(step);
  }
  window.addEventListener("resize", resize);
  c.parentElement.addEventListener("mousemove", e=>{ const r=c.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; });
  c.parentElement.addEventListener("mouseleave", ()=>{ mouse.x=-9e3; mouse.y=-9e3; });
  resize();
  if(REDUCED){ step(); cancelAnimationFrame(raf); } else { step(); }
})();

(function cursor(){
  if(!matchMedia("(pointer:fine)").matches || REDUCED) return;
  const dot = $(".cur-dot"), ring = $(".cur-ring");
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  document.addEventListener("mousemove", e=>{ mx=e.clientX; my=e.clientY; dot.style.left=mx+"px"; dot.style.top=my+"px"; });
  (function loop(){ rx+=(mx-rx)*.16; ry+=(my-ry)*.16; ring.style.left=rx+"px"; ring.style.top=ry+"px"; requestAnimationFrame(loop); })();
  document.addEventListener("mouseover", e=>{ if(e.target.closest("a,button,input,textarea,select,video,.pcard,.case,.pcard-post")) document.body.classList.add("cur-hover"); });
  document.addEventListener("mouseout", e=>{ if(e.target.closest("a,button,input,textarea,select,video,.pcard,.case,.pcard-post")) document.body.classList.remove("cur-hover"); });
})();

$$("[data-mag]").forEach(b=>{
  if(REDUCED) return;
  b.addEventListener("mousemove", e=>{
    const r = b.getBoundingClientRect();
    const x = (e.clientX-r.left-r.width/2)/r.width, y=(e.clientY-r.top-r.height/2)/r.height;
    b.style.transform = "translate("+(x*7)+"px,"+(y*5)+"px)";
  });
  b.addEventListener("mouseleave", ()=> b.style.transform="");
});

const io = new IntersectionObserver(es=> es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }), {threshold:.12});
$$(".reveal").forEach(el=> io.observe(el));

const cio = new IntersectionObserver(es=> es.forEach(e=>{
  if(!e.isIntersecting) return;
  const el = e.target, target = +el.dataset.count, t0 = performance.now(), dur = 1400;
  (function tick(t){ const p = Math.min((t-t0)/dur,1), ease = 1-Math.pow(1-p,3);
    el.textContent = Math.round(target*ease); if(p<1) requestAnimationFrame(tick); })(t0);
  cio.unobserve(el);
}), {threshold:.6});
$$("[data-count]").forEach(el=> cio.observe(el));

const spy = new IntersectionObserver(es=> es.forEach(e=>{
  if(e.isIntersecting) $$(".nav-links a").forEach(a=> a.classList.toggle("active", a.dataset.spy===e.target.id));
}), {rootMargin:"-40% 0px -55% 0px"});
["philosophy","journal","screening","book","proof","contact"].forEach(id=>{ const s=$("#"+id); if(s) spy.observe(s); });

window.addEventListener("scroll", ()=>{
  const st = scrollY, dh = document.documentElement.scrollHeight - innerHeight;
  $("#scrollProgress").style.width = (dh>0? (st/dh*100):0) + "%";
  $("#nav").classList.toggle("solid", st > 30);
}, {passive:true});

(function theme(){
  const saved = store.get("dm_theme", null);
  if(saved) document.documentElement.dataset.theme = saved;
  $("#themeToggle").addEventListener("click", ()=>{
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("dm_theme", next);
    $("#themeToggle").textContent = next === "dark" ? "\u263E" : "\u2600";
  });
  $("#themeToggle").textContent = document.documentElement.dataset.theme === "dark" ? "\u263E" : "\u2600";
})();

const mm = $("#mobileMenu");
$("#navToggle").addEventListener("click", ()=> mm.classList.add("open"));
$("#mmClose").addEventListener("click", ()=> mm.classList.remove("open"));
$$("#mobileMenu a").forEach(a=> a.addEventListener("click", ()=> mm.classList.remove("open")));

function renderMD(src){
  function inline(s){
    return s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/`([^`]+)`/g,"<code>$1</code>");
  }
  const lines = String(src).split(/\r?\n/);
  const out = []; let inList=false, para=[];
  const flush = ()=>{ if(para.length){ out.push("<p>"+para.map(inline).join("<br>")+"</p>"); para=[]; } };
  const closeList = ()=>{ if(inList){ out.push("</ul>"); inList=false; } };
  for(const raw of lines){
    const l = raw.trim();
    if(!l){ flush(); closeList(); continue; }
    let m;
    if(m=l.match(/^###\s+(.*)/)){ flush(); closeList(); out.push("<h3>"+inline(m[1])+"</h3>"); }
    else if(m=l.match(/^##\s+(.*)/)){ flush(); closeList(); out.push("<h2>"+inline(m[1])+"</h2>"); }
    else if(m=l.match(/^&gt;\s+(.*)/) || (m=l.match(/^>\s+(.*)/))){ flush(); closeList(); out.push("<blockquote>"+inline(m[1])+"</blockquote>"); }
    else if(m=l.match(/^[-\u2022]\s+(.*)/)){ flush(); if(!inList){ out.push("<ul>"); inList=true; } out.push("<li>"+inline(m[1])+"</li>"); }
    else { closeList(); para.push(l); }
  }
  flush(); closeList();
  return out.join("\n");
}

function renderTagFilters(){
  const tags = ["All", ...new Set(publishedPosts().flatMap(p=>p.tags))];
  $("#tagFilters").innerHTML = tags.map(t=> '<button class="chip'+(t===activeTag?" on":"")+'" data-tag="'+esc(t)+'">'+esc(t)+'</button>').join("");
  $$("#tagFilters .chip").forEach(ch=> ch.addEventListener("click", ()=>{ activeTag = ch.dataset.tag; renderTagFilters(); renderJournal(); }));
}
function renderJournal(){
  const list = publishedPosts()
    .filter(p=> (activeTag==="All"||p.tags.includes(activeTag)) && (!searchTerm || (p.title+" "+p.excerpt+" "+p.tags.join(" ")).toLowerCase().includes(searchTerm)))
    .sort((a,b)=> new Date(b.date)-new Date(a.date));
  const grid = $("#journalGrid");
  if(!list.length){ grid.innerHTML = '<div class="j-empty">\u25C6 NO SIGNAL MATCHES THAT QUERY \u2014 CLEAR THE FILTERS</div>'; return; }
  grid.innerHTML = list.map(p=>{
    const acc = ACCENTS[p.accent]||ACCENTS.gold;
    const tags = p.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("");
    if(p.featured && activeTag==="All" && !searchTerm){
      return '<article class="pcard-post featured reveal in" data-slug="'+esc(p.slug)+'" style="--acc:'+acc+'">'+ 
        '<div class="fleft"><div class="top"><div style="display:flex;gap:8px;flex-wrap:wrap">'+tags+'</div><span class="badge-feat">FEATURED</span></div>'+
        '<h3>'+esc(p.title)+'</h3><p class="ex">'+esc(p.excerpt)+'</p>'+
        '<div class="meta"><span>'+fmtDate(p.date)+'</span><span class="rd">\u25C8 '+p.read+' MIN \u2014 READ</span></div></div>'+
        '<div class="fright"><span class="cmt">// thesis.extract()</span><br>"Stack contextual, lexical, structural,<br>and persona cues until the desired<br>response becomes statistically natural."<br><br><span class="cmt">// status</span><br><span class="kw">\u00BB published \u2014 working paper adapted</span></div></article>';
    }
    return '<article class="pcard-post reveal in" data-slug="'+esc(p.slug)+'" style="--acc:'+acc+'">'+ 
      '<div class="top"><div style="display:flex;gap:6px;flex-wrap:wrap">'+tags+'</div><span class="tag">'+(p.featured?"FEATURED":String(p.read)+" MIN")+'</span></div>'+
      '<h3>'+esc(p.title)+'</h3><p class="ex">'+esc(p.excerpt)+'</p>'+
      '<div class="meta"><span>'+fmtDate(p.date)+'</span><span class="rd">\u25C8 READ</span></div></article>';
  }).join("");
  $$("#journalGrid .pcard-post").forEach(card=> card.addEventListener("click", ()=> openReader(card.dataset.slug)));
}
$("#journalSearch").addEventListener("input", e=>{ searchTerm = e.target.value.trim().toLowerCase(); renderJournal(); });
renderTagFilters(); renderJournal();

function openReader(slug){
  const p = allPosts().find(x=>x.slug===slug && x.status==="published");
  if(!p) return;
  $("#rdBody").innerHTML =
    '<div class="rd-eyebrow">'+p.tags.map(t=>'<span class="tag" style="border-color:'+(ACCENTS[p.accent]||ACCENTS.gold)+'">'+esc(t)+'</span>').join("")+'</div>'+
    '<h1>'+esc(p.title)+'</h1>'+
    '<div class="rd-meta"><span>'+fmtDate(p.date)+'</span><span class="rt">\u25C8 '+p.read+' MIN READ</span><span>DOUGLAS MITCHELL</span></div>'+
    '<div class="rd-art">'+renderMD(p.body)+'</div>'+
    '<div class="rd-foot"><div style="display:flex;gap:6px;flex-wrap:wrap">'+p.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'</div>'+
    '<div class="rd-share"><button class="abtn" id="rdCopy">\u25C6 COPY LINK</button><a class="abtn" href="#journal" id="rdMore">MORE FROM THE JOURNAL \u2192</a></div></div>';
  const rd = $("#reader");
  rd.classList.add("open"); rd.scrollTop = 0; document.body.style.overflow = "hidden";
  history.replaceState(null,"", "#read/"+p.slug);
  $("#rdCopy").addEventListener("click", ()=>{
    const url = location.origin + location.pathname + "#read/" + p.slug;
    (navigator.clipboard? navigator.clipboard.writeText(url): Promise.reject()).then(()=>toast("Article link copied","\u25C6")).catch(()=>toast(url));
  });
  $("#rdMore").addEventListener("click", e=>{ e.preventDefault(); closeReader(); });
}
function closeReader(){
  $("#reader").classList.remove("open");
  document.body.style.overflow = "";
  history.replaceState(null,"", location.pathname + location.search);
}
$("#rdClose").addEventListener("click", closeReader);
$("#reader").addEventListener("scroll", function(){
  const dh = this.scrollHeight - this.clientHeight;
  $("#rdProgress").style.width = (dh>0? this.scrollTop/dh*100 : 0)+"%";
});

function applyVideo(){
  const v = $("#videoPlayer");
  v.src = videoCfg.src || "";
  v.poster = videoCfg.poster || "";
  $("#videoTitle").textContent = videoCfg.title || "Untitled Transmission";
  $("#videoCoverTitle").textContent = videoCfg.title || "Untitled Transmission";
}
applyVideo();
$("#videoPlay").addEventListener("click", ()=>{
  const v = $("#videoPlayer");
  if(!v.src){ toast("No video source set \u2014 add one in Admin \u2192 Media","\u25C6"); return; }
  $("#videoCover").classList.add("hide");
  v.setAttribute("controls","controls");
  v.play().catch(()=>{ $("#videoCover").classList.remove("hide"); toast("Playback blocked \u2014 check the video URL","\u2715"); });
});
$$(".chapter").forEach(ch=> ch.addEventListener("click", ()=>{
  const v = $("#videoPlayer");
  if(!v.src){ toast("No video source set \u2014 add one in Admin \u2192 Media","\u25C6"); return; }
  if(v.readyState>=1){ v.currentTime = v.duration * parseFloat(ch.dataset.seek); $("#videoCover").classList.add("hide"); v.setAttribute("controls","controls"); v.play().catch(()=>{}); }
  else { toast("Load the video first \u2014 press play","\u25B6"); }
}));

const KB = [
  {id:"greet", keys:["hello","hi","hey","yo","sup","good morning","good evening"], reply:()=> "Signal acquired. Ask me about <b>the book</b>, <b>the projects</b>, <b>certifications</b>, <b>the writing</b>, or <b>how to work with Douglas</b>."},
  {id:"who", keys:["who is douglas","about douglas","who are you","about him","tell me about douglas","what does douglas do","douglas mitchell"], reply:()=> "<b>Douglas Mitchell \u2014 the Architect.</b> Operations Analyst, AI Practitioner, and Author based in Houston, TX. He builds calm, premium operating systems that blend operational rigor, AI fluency, and human-centered execution. The through-line: <b>less ambiguity, sharper execution, better human outcomes</b>."},
  {id:"book", keys:["book","confident mind","the confident","read","amazon","manual","author","published","writing the book"], reply:()=> "<b>The Confident Mind \u2014 A Practical Manual to Repair, Build &amp; Sustain Authentic Confidence.</b> A grounded, psychology-aware framework that turns reflection into action and action into internal evidence \u2014 no self-help theater. Five parts: Understanding Confidence \u2192 The Confidence Gap \u2192 Building Internal Evidence \u2192 Practical Application \u2192 Sustaining Growth. Grab it on Amazon from the Book section."},
  {id:"projects", keys:["project","projects","case study","case studies","portfolio","work","automation","toolkit","platform","repos","repositories","github","systems architecture"], reply:()=> "Three flagship case studies: <b>1) AI Workflow Automation</b> \u2014 Python, LangChain, OpenAI, n8n, Redis. <b>2) The Confident Mind Platform</b> \u2014 Next.js, TypeScript, Prisma, Framer Motion. <b>3) Systems Architecture Toolkit</b> \u2014 TypeScript, Node, Docker, AWS. The full archive \u2014 <b>85+ public repositories</b> \u2014 lives on GitHub."},
  {id:"stack", keys:["skills","stack","tech","technologies","languages","tools","code","coding","what does he use","frontend","backend"], reply:()=> "The toolkit: <b>Frontend</b> \u2014 React, Next.js, TypeScript, Tailwind CSS. <b>Backend</b> \u2014 Node.js, Python, Prisma, REST APIs. <b>Infrastructure</b> \u2014 Docker, CI/CD, observability. <b>AI</b> \u2014 applied AI, prompt engineering, human-in-the-loop systems, workflow automation."},
  {id:"creds", keys:["credential","credentials","certification","certifications","certificate","google","anthropic","qualified","verified"], reply:()=> "Two verified credentials: the <b>Google AI Professional Certificate</b> and <b>Anthropic AI Safety</b> \u2014 practical delivery focus, not wallpaper."},
  {id:"philosophy", keys:["philosophy","approach","principles","values","why","mindset","believe","method","how he works"], reply:()=> "Three operating principles: <b>Operational Clarity</b>, <b>Human-First Automation</b>, and <b>Proof Over Posturing</b>. The core belief: technology should amplify human potential."},
  {id:"contact", keys:["contact","hire","work with","reach","email","touch","collaborate","freelance","consult","talk to","connect","linkedin"], reply:()=> "Best move: hit <b>Contact</b> at the bottom of the page, or go straight to <b>GitHub @Senpai-Sama7</b> or LinkedIn \u2014 <b>douglas-mitchell-the-architect</b>. A short brief plus the desired outcome gets the fastest response."},
  {id:"blog", keys:["blog","journal","essay","essays","article","articles","posts","writing","read more","thoughts","insights","rizz"], reply:()=> "The <b>Journal</b> is where he publishes \u2014 essays like <b>Rizz Prompting</b> and <b>Confidence Is a System, Not a Feeling</b>. Filter by tag or search the archive. One to two notes a month \u2014 signal, not spam."},
  {id:"video", keys:["video","watch","film","screening","footage","movie"], reply:()=> "The <b>Screening Room</b> hosts original video \u2014 currently <i>"+esc(videoCfg.title||"a transmission on the operator's craft")+"</i>. Operators can swap the footage from Admin \u2192 Media."},
  {id:"location", keys:["where","location","based","houston","texas","live","from"], reply:()=> "Based in <b>Houston, Texas</b> \u2014 shipping everywhere systems need to hold up."},
  {id:"admin", keys:["admin","password","passphrase","login","portal","dashboard","credentials for","access code"], reply:()=> "There's an operator console for publishing and site control \u2014 <b>Ctrl+Shift+A</b> if you hold credentials. I don't share them, and yes, that includes you, sweet-talker."},
  {id:"thanks", keys:["thank","thanks","appreciated","dope","cool","nice","love it","bet"], reply:()=> "Appreciated. Signal received, signal returned. Anything else from the archive?"},
  {id:"bye", keys:["bye","goodbye","later","see you","peace","deuces"], reply:()=> "Deuces. The archive stays open \u2014 come back anytime."}
];
const REFUSAL = /password|passphrase|address|phone|salary|ssn|social security|birthday|age|personal (info|details)|private (info|details)|home address/i;
const FALLBACK = "That's outside the public archive I answer from \u2014 I only speak from Douglas's public work. Try: <b>the book</b>, <b>the case studies</b>, <b>certifications</b>, <b>the philosophy</b>, or <b>how to start a conversation</b>.";

function consoleAnswer(q){
  if(REFUSAL.test(q)) return "I only answer from public site content \u2014 personal details and private contact info are off the table.";
  const s = q.toLowerCase();
  let best=null, bestScore=0;
  KB.forEach(t=>{ let sc=0; t.keys.forEach(k=>{ if(s.includes(k)) sc += k.length>4?2.2:1.4; }); if(sc>bestScore){ bestScore=sc; best=t; } });
  return (best && bestScore>=1.4) ? best.reply() : FALLBACK;
}
function chatMsg(html, who){
  const d = document.createElement("div");
  d.className = "msg "+who;
  d.innerHTML = html;
  $("#chatLog").appendChild(d);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}
let chatOpened = false;
function openChat(autoAsk){
  $("#chatPanel").classList.add("open");
  if(!chatOpened){
    chatOpened = true;
    try{ sessionStorage.setItem("dm_console_uses", String(1+(+(sessionStorage.getItem("dm_console_uses")||0)))); }catch(e){}
    chatMsg(settings.consoleGreeting || SITE_CONFIG.consoleGreeting, "bot");
    $("#chatChips").innerHTML = ["Tell me about the book","What does Douglas do?","Show me the projects","How do I work with him?"].map(c=>'<button class="ch-chip">'+c+'</button>').join("");
    $$("#chatChips .ch-chip").forEach(ch=> ch.addEventListener("click", ()=> sendChat(ch.textContent)));
  }
  if(autoAsk) setTimeout(()=> sendChat(autoAsk), 350);
  $("#chatInput").focus();
}
function closeChat(){ $("#chatPanel").classList.remove("open"); }
function sendChat(text){
  const q = (text || $("#chatInput").value).trim();
  if(!q) return;
  $("#chatInput").value = "";
  chatMsg(esc(q), "user");
  const ty = document.createElement("div");
  ty.className = "msg bot typing"; ty.innerHTML = "<i></i><i></i><i></i>";
  $("#chatLog").appendChild(ty); $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  setTimeout(()=>{ ty.remove(); chatMsg(consoleAnswer(q), "bot"); }, Math.min(500 + q.length*18, 1400));
}
$("#chatFab").addEventListener("click", ()=> $("#chatPanel").classList.contains("open") ? closeChat() : openChat());
$("#chatClose").addEventListener("click", closeChat);
$("#navConsole").addEventListener("click", ()=> openChat());
$("#heroConsole").addEventListener("click", ()=> openChat());
$("#askBook").addEventListener("click", ()=> openChat("Tell me about The Confident Mind"));
$("#chatSend").addEventListener("click", ()=> sendChat());
$("#chatInput").addEventListener("keydown", e=>{ if(e.key==="Enter") sendChat(); });

const adminRoot = $("#adminRoot");
function adminSession(){ try{ return JSON.parse(sessionStorage.getItem("dm_admin_session")||"null"); }catch(e){ return null; } }
function openAdmin(){
  adminRoot.classList.add("open"); document.body.style.overflow = "hidden";
  const s = adminSession();
  if(s && Date.now()-s.ts < 30*60*1000){ showDash(); } else { $("#adLogin").style.display="grid"; $("#adDash").style.display="none"; }
}
function closeAdmin(){ adminRoot.classList.remove("open"); document.body.style.overflow=""; history.replaceState(null,"",location.pathname+location.search); }
function showDash(){
  $("#adLogin").style.display="none"; $("#adDash").style.display="grid";
  renderOverview(); renderPostsTable(); loadSettingsForm(); loadMediaForm();
}
$("#adForm").addEventListener("submit", e=>{
  e.preventDefault();
  const u = $("#adUser").value.trim(), p = $("#adPass").value;
  if(u===settings.adminUser && p===settings.adminPass){
    sessionStorage.setItem("dm_admin_session", JSON.stringify({user:u, ts:Date.now()}));
    $("#adErr").style.display="none"; $("#adPass").value="";
    toast("Operator authenticated \u2014 welcome back","\u25C6");
    showDash();
  } else {
    $("#adErr").style.display="block";
    const c = $("#adCard"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  }
});
$("#adLogout").addEventListener("click", ()=>{ sessionStorage.removeItem("dm_admin_session"); closeAdmin(); toast("Session terminated","\u23FB"); });
$("#adminHint").addEventListener("click", openAdmin);

function adminTab(name){
  $$(".ad-tab[data-tab]").forEach(t=> t.classList.toggle("on", t.dataset.tab===name));
  $$(".ad-panel").forEach(p=> p.classList.toggle("on", p.id==="tab-"+name));
}
$$(".ad-tab[data-tab]").forEach(t=> t.addEventListener("click", ()=>{ adminTab(t.dataset.tab); if(t.dataset.tab==="compose") resetComposer(); }));
$$("[data-goto]").forEach(b=> b.addEventListener("click", ()=>{ adminTab("compose"); resetComposer(); }));

function renderOverview(){
  const pubs = publishedPosts().length, drafts = allPosts().filter(p=>p.status==="draft").length;
  const local = localPosts.length;
  let uses = 0; try{ uses = +(sessionStorage.getItem("dm_console_uses")||0); }catch(e){}
  const visits = store.get("dm_visits", 0);
  $("#ovStats").innerHTML =
    '<div class="stat"><div class="n">'+pubs+'</div><div class="l">Published posts</div></div>'+
    '<div class="stat"><div class="n">'+drafts+'</div><div class="l">Drafts</div></div>'+
    '<div class="stat"><div class="n">'+local+'</div><div class="l">Locally created</div></div>'+
    '<div class="stat"><div class="n">'+visits+'</div><div class="l">Site visits (this browser)</div></div>';
  $("#ovRecent").innerHTML = publishedPosts().slice(0,5).map(p=>'<tr><td>'+esc(p.title)+'</td><td style="text-align:right;font-family:var(--mono);font-size:11px;color:var(--mut)">'+fmtDate(p.date)+'</td></tr>').join("");
}
function renderPostsTable(){
  const rows = allPosts().sort((a,b)=> new Date(b.date)-new Date(a.date)).map(p=>{
    const isSeed = p.id.startsWith("seed-");
    const acts = isSeed
      ? '<span class="st seed">SEED</span>'
      : '<div class="acts"><button class="abtn" data-edit="'+esc(p.id)+'">EDIT</button><button class="abtn" data-toggle="'+esc(p.id)+'">'+(p.status==="published"?"UNPUBLISH":"PUBLISH")+'</button><button class="abtn danger" data-del="'+esc(p.id)+'">DELETE</button></div>';
    return '<tr><td style="font-weight:600">'+esc(p.title)+'</td><td class="hide-m">'+p.tags.map(esc).join(", ")+'</td><td><span class="st '+(p.status==="published"?"pub":"dft")+'">'+p.status.toUpperCase()+'</span></td><td class="hide-m" style="font-family:var(--mono);font-size:11px;color:var(--mut)">'+fmtDate(p.date)+'</td><td style="text-align:right">'+acts+'</td></tr>';
  }).join("");
  $("#postsTable").innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:var(--mut);padding:40px">No posts yet \u2014 create your first.</td></tr>';
  $$("#postsTable [data-edit]").forEach(b=> b.addEventListener("click", ()=> startEdit(b.dataset.edit)));
  $$("#postsTable [data-toggle]").forEach(b=> b.addEventListener("click", ()=>{
    const p = localPosts.find(x=>x.id===b.dataset.toggle); if(!p) return;
    p.status = p.status==="published" ? "draft":"published";
    store.set("dm_posts_v1", localPosts);
    toast(p.status==="published"?"Published to the journal":"Moved to drafts","\u25C6");
    renderPostsTable(); renderJournal(); renderTagFilters(); renderOverview();
  }));
  $$("#postsTable [data-del]").forEach(b=>{
    let armed=false, t=null;
    b.addEventListener("click", ()=>{
      if(!armed){ armed=true; b.classList.add("armed"); b.textContent="SURE?"; t=setTimeout(()=>{armed=false;b.classList.remove("armed");b.textContent="DELETE";},2600); return; }
      clearTimeout(t);
      localPosts = localPosts.filter(x=>x.id!==b.dataset.del);
      store.set("dm_posts_v1", localPosts);
      toast("Post deleted","\u2715");
      renderPostsTable(); renderJournal(); renderTagFilters(); renderOverview();
    });
  });
}
function resetComposer(){
  editingId = null;
  $("#compTitle").textContent = "New Post";
  $("#cTitle").value=""; $("#cExcerpt").value=""; $("#cBody").value="";
  $("#cTags").value=""; $("#cStatus").value="published"; $("#cAccent").value="gold";
  $("#cDate").value = new Date().toISOString().slice(0,10);
}
function slugify(s){ return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60); }
$("#cSave").addEventListener("click", ()=>{
  const title = $("#cTitle").value.trim();
  if(!title || !$("#cBody").value.trim()){ toast("Title and body are required","\u2715"); return; }
  const data = {
    title, slug: slugify(title) || ("post-"+Date.now()),
    excerpt: $("#cExcerpt").value.trim() || $("#cBody").value.trim().slice(0,150)+"\u2026",
    body: $("#cBody").value.trim(),
    tags: $("#cTags").value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,4),
    status: $("#cStatus").value, accent: $("#cAccent").value,
    date: $("#cDate").value || new Date().toISOString().slice(0,10),
    read: Math.max(2, Math.round($("#cBody").value.trim().split(/\s+/).length/200)),
    featured: false
  };
  if(editingId){
    const i = localPosts.findIndex(x=>x.id===editingId);
    if(i>-1) localPosts[i] = Object.assign({}, localPosts[i], data);
    toast("Post updated","\u25C6");
  } else {
    data.id = "local-"+Date.now();
    localPosts.push(data);
    toast(data.status==="published"?"Published to the journal \u2014 go look":"Saved as draft","\u25C6");
  }
  store.set("dm_posts_v1", localPosts);
  resetComposer(); renderPostsTable(); renderJournal(); renderTagFilters(); renderOverview();
  adminTab("posts");
});
$("#cCancel").addEventListener("click", resetComposer);
function startEdit(id){
  const p = localPosts.find(x=>x.id===id); if(!p) return;
  editingId = id; adminTab("compose"); $("#compTitle").textContent = "Edit Post";
  $("#cTitle").value=p.title; $("#cExcerpt").value=p.excerpt; $("#cBody").value=p.body;
  $("#cTags").value=p.tags.join(", "); $("#cStatus").value=p.status; $("#cAccent").value=p.accent||"gold"; $("#cDate").value=p.date;
}
function loadMediaForm(){
  $("#mSrc").value = videoCfg.src||""; $("#mPoster").value = videoCfg.poster||""; $("#mTitle").value = videoCfg.title||"";
}
$("#mSave").addEventListener("click", ()=>{
  videoCfg = { src:$("#mSrc").value.trim(), poster:$("#mPoster").value.trim(), title:$("#mTitle").value.trim() };
  store.set("dm_video_v1", videoCfg);
  applyVideo();
  toast("Screening Room updated \u2014 footage live","\u25B6");
});
function loadSettingsForm(){
  $("#sUser").value = settings.adminUser; $("#sPass").value = settings.adminPass;
  $("#sGreet").value = settings.consoleGreeting || SITE_CONFIG.consoleGreeting;
}
$("#sSave").addEventListener("click", ()=>{
  settings.adminUser = $("#sUser").value.trim() || settings.adminUser;
  settings.adminPass = $("#sPass").value.trim() || settings.adminPass;
  settings.consoleGreeting = $("#sGreet").value.trim() || SITE_CONFIG.consoleGreeting;
  store.set("dm_settings_v1", settings);
  toast("Settings saved","\u2699");
});

document.addEventListener("keydown", e=>{
  if(e.ctrlKey && e.shiftKey && (e.key==="A"||e.key==="a")){ e.preventDefault(); adminRoot.classList.contains("open") ? closeAdmin() : openAdmin(); }
  if(e.key==="Escape"){
    if($("#reader").classList.contains("open")) closeReader();
    else if($("#chatPanel").classList.contains("open")) closeChat();
    else if(adminRoot.classList.contains("open")) closeAdmin();
    else if(mm.classList.contains("open")) mm.classList.remove("open");
  }
});
(function routeHash(){
  const h = location.hash;
  if(h.startsWith("#admin")) openAdmin();
  else if(h.startsWith("#read/")){ const slug = h.slice(6); setTimeout(()=>openReader(slug), 400); }
})();
window.addEventListener("hashchange", ()=>{ if(location.hash==="#admin") openAdmin(); });
store.set("dm_visits", (store.get("dm_visits",0))+1);
