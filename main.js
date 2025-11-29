/* main.js - upgraded CA Inter Tracker
   Features added:
   - loads tasks.json (vivitsu items per day)
   - export/import JSON backup
   - in-app reminder scheduler (checks every minute)
   - simple notifications (Notification API)
   - Pomodoro timer
   - Dark mode
*/

const STORAGE_KEY = "ca_inter_tracker_v2"; // bumped version
const TASKS_FILE = "tasks.json"; // loaded from repo
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

// default weeks/tasks (keeps previous layout)
const weeks = {
  "Week 1": [
    { day: 1, title: "Costing: Marginal Costing", color: "yellow" },
    { day: 2, title: "Costing: Standard Costing", color: "yellow" },
    { day: 3, title: "Costing: Process Costing", color: "yellow" },
    { day: 4, title: "FM: Capital Budgeting", color: "yellow" },
    { day: 5, title: "FM: Leverages + Cost of Capital", color: "yellow" },
    { day: 6, title: "FM: Working Capital", color: "yellow" },
    { day: 7, title: "Audit (Full Focus)", color: "red" }
  ],
  "Week 2": [
    { day: 8, title: "Costing: ABC + Cost Sheet", color: "yellow" },
    { day: 9, title: "Costing: Contract + Operating Costing", color: "yellow" },
    { day: 10, title: "Audit SA Day", color: "red" },
    { day: 11, title: "Audit: Company Audit + Vouching", color: "red" },
    { day: 12, title: "FM: Ratios + Portfolio Theory", color: "yellow" },
    { day: 13, title: "SM: Leadership + Motivation", color: "green" },
    { day: 14, title: "SM: Strategy Models", color: "green" }
  ],
  "Week 3": [
    { day: 15, title: "Costing Full Revision", color: "yellow" },
    { day: 16, title: "FM Full Revision", color: "yellow" },
    { day: 17, title: "Audit Weak Revision Day", color: "red" },
    { day: 18, title: "Special Audits", color: "red" },
    { day: 19, title: "SM Revision", color: "green" },
    { day: 20, title: "Costing + FM Mixed Practice", color: "yellow" },
    { day: 21, title: "Audit Mock (3 hrs)", color: "red" }
  ],
  "Week 4": [
    { day: 22, title: "Costing Final Revision", color: "yellow" },
    { day: 23, title: "FM Final Revision", color: "yellow" },
    { day: 24, title: "Audit Final Revision", color: "red" },
    { day: 25, title: "SM Final Revision", color: "green" }
  ],
  "Final 5 Days": [
    { day: 26, title: "Costing Mock", color: "yellow" },
    { day: 27, title: "Audit Mock", color: "red" },
    { day: 28, title: "FM Mock", color: "yellow" },
    { day: 29, title: "SM Mock", color: "green" },
    { day: 30, title: "Final Revision", color: "green" }
  ]
};

// Helpers for DOM
function el(tag, attrs={}, ...children){
  const e = document.createElement(tag);
  for(let k in attrs) {
    if(k === 'class') e.className = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  children.forEach(c=>{ if(typeof c === 'string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); });
  return e;
}

// load tasks.json (vivitsu hints)
let vivitsuTasks = {};
async function loadVivitsu(){
  try{
    const resp = await fetch(TASKS_FILE);
    if(!resp.ok) return;
    const j = await resp.json();
    if(j && j.days) vivitsuTasks = j.days;
  }catch(e){ console.log("No tasks.json or failed to load:", e); }
}

// initial setup DOM refs
const weeksNav = document.getElementById("weeksNav");
const tasksEl = document.getElementById("tasks");
const globalProgress = document.getElementById("globalProgress");

// UI controls injected to header
function createTopControls(){
  const header = document.querySelector('.topbar');
  const controls = el('div',{class:'top-controls'});
  // Dark mode
  const darkBtn = el('button',{class:'small'}, 'Dark');
  darkBtn.onclick = ()=> {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('ca_dark', isDark ? '1' : '0');
  };
  // Export / Import buttons
  const expBtn = el('button',{class:'small'}, 'Export');
  expBtn.onclick = exportBackup;
  const impBtn = el('button',{class:'small'}, 'Import');
  impBtn.onclick = ()=>{ document.getElementById('fileImport').click(); };
  // Pomodoro
  const pBtn = el('button',{class:'small'}, 'Pomodoro');
  pBtn.onclick = openPomodoro;
  // Reminder
  const remBtn = el('button',{class:'small'}, 'Reminders');
  remBtn.onclick = openReminderPanel;

  controls.appendChild(darkBtn);
  controls.appendChild(expBtn);
  controls.appendChild(impBtn);
  controls.appendChild(pBtn);
  controls.appendChild(remBtn);
  header.appendChild(controls);

  // hidden file input for import
  const fi = el('input',{type:'file', id:'fileImport', accept:'.json', style:'display:none'});
  fi.addEventListener('change', handleImportFile);
  document.body.appendChild(fi);
}

// state helpers
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderTasks(); updateGlobalProgress(); }
function getChecked(day){ return !!state['d'+day]; }
function toggleDay(day){ state['d'+day] = !getChecked(day); saveState(); }

// render weeks + tasks
let activeWeek = Object.keys(weeks)[0];
function renderWeeks(){
  weeksNav.innerHTML = "";
  Object.keys(weeks).forEach(w=>{
    const btn = el("button",{class:'week-btn'+(w===activeWeek?' active':'')}, w);
    btn.addEventListener('click', ()=>{ activeWeek = w; renderWeeks(); renderTasks(); });
    weeksNav.appendChild(btn);
  });
}

function renderTasks(){
  tasksEl.innerHTML = "";
  const items = weeks[activeWeek];
  items.forEach(task=>{
    const card = el("div",{class:'card '+task.color});
    const head = el("div",{class:'card-head'});
    const left = el("div");
    left.appendChild(el("div",{class:'title'}, "Day "+task.day));
    left.appendChild(el("div",{class:'meta'}, task.title));

    // vivitsu quick list (if available)
    const viv = vivitsuTasks[task.day] && vivitsuTasks[task.day].vivitsu ? vivitsuTasks[task.day].vivitsu : [];
    if(viv && viv.length){
      const vwrap = el('div',{class:'vivitsu'});
      vwrap.appendChild(el('strong',{}, 'ICAI repeated: '));
      vwrap.appendChild(el('span',{}, viv.slice(0,3).join(' • ')));
      left.appendChild(vwrap);
    }

    head.appendChild(left);

    const cb = el("div",{class:'checkbox', tabindex:0});
    cb.innerHTML = getChecked(task.day)? "✓": "";
    cb.addEventListener("click", ()=> toggleDay(task.day));
    cb.addEventListener("keydown", (e)=>{ if(e.key==='Enter') toggleDay(task.day); });
    head.appendChild(cb);
    card.appendChild(head);

    // progress bar
    const progressWrap = el("div",{class:'progress-wrap'});
    const prog = el("div",{class:'progress'});
    prog.style.width = getChecked(task.day)? "100%":"0%";
    progressWrap.appendChild(prog);
    card.appendChild(progressWrap);

    // button to view full vivitsu items for day
    const btnRow = el('div',{class:'btn-row'});
    const viewBtn = el('button',{class:'small'}, 'View important sums');
    viewBtn.onclick = ()=> openDayVivitsu(task.day, task.title, viv);
    btnRow.appendChild(viewBtn);
    card.appendChild(btnRow);

    tasksEl.appendChild(card);
  });
  updateGlobalProgress();
}

function updateGlobalProgress(){
  const total = 30;
  let done = 0;
  for(let i=1;i<=30;i++) if(getChecked(i)) done++;
  const pct = Math.round(done/total*100);
  globalProgress.textContent = `Progress: ${pct}%  (${done}/${total} days)`;
}

// export / import
function exportBackup(){
  const payload = { version: STORAGE_KEY, state: state, timestamp: Date.now(), vivitsu: vivitsuTasks };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ca-inter-backup.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function handleImportFile(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = function(){ try{
    const j = JSON.parse(r.result);
    if(j && j.state){ state = j.state; vivitsuTasks = j.vivitsu||vivitsuTasks; saveState(); alert('Imported backup'); }
    else alert('Invalid backup file');
  }catch(ex){ alert('Invalid JSON'); } };
  r.readAsText(f);
}

// Day vivitsu panel
function openDayVivitsu(day, title, vivList){
  const text = (vivList && vivList.length) ? vivList.join('\n\n') : 'No vivitsu items for this day yet.';
  alert(`Day ${day}: ${title}\n\nImportant Vivitsu items:\n\n${text}`);
}

// Pomodoro (simple)
let pom = { running:false, timer:null, remain:25*60, mode:'work' };
function openPomodoro(){
  const minutes = prompt('Pomodoro minutes (work period)', '25');
  if(!minutes) return;
  pom.remain = Math.max(1, parseInt(minutes,10))*60;
  startPomodoro();
}
function startPomodoro(){
  if(pom.running) return;
  pom.running = true;
  const tick = ()=> {
    pom.remain--;
    if(pom.remain<=0){ stopPomodoro(); notify('Pomodoro finished'); return; }
    // we could update UI. For simplicity show remaining as title
    document.title = `(${Math.ceil(pom.remain/60)}m) CA Inter Tracker`;
    pom.timer = setTimeout(tick, 1000);
  };
  tick();
}
function stopPomodoro(){
  pom.running=false;
  if(pom.timer) clearTimeout(pom.timer);
  document.title = 'CA Inter 30-Day Tracker';
  // sound
  try{ const audio = new Audio('/pomodoro-sound.mp3'); audio.play().catch(()=>{}); }catch(e){}
}

function notify(msg){
  if(window.Notification && Notification.permission === "granted"){
    new Notification(msg);
  } else {
    // fallback in-app alert
    console.log("Notify:", msg);
    // small toast:
    const t = el('div',{class:'toast'}, msg);
    document.body.appendChild(t); setTimeout(()=>t.remove(),4000);
  }
}

// Reminder panel + scheduler (in-app)
let reminders = JSON.parse(localStorage.getItem('ca_reminders_v1') || "[]");
function openReminderPanel(){
  const time = prompt("Add reminder time (24h HH:MM). App shows notification when opened and every minute while open.", "19:00");
  if(!time) return;
  reminders.push(time);
  localStorage.setItem('ca_reminders_v1', JSON.stringify(reminders));
  alert('Reminder added: ' + time);
}
function checkReminders(){
  if(reminders.length === 0) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0'), mm = String(now.getMinutes()).padStart(2,'0');
  const t = `${hh}:${mm}`;
  reminders.forEach(r=>{
    if(r === t){
      notify(`Reminder: Study for CA Inter — ${t}`);
    }
  });
}
// check every minute while app is open
setInterval(checkReminders, 60*1000);
window.addEventListener('focus', checkReminders);

// when loaded
(async function init(){
  // apply dark setting
  if(localStorage.getItem('ca_dark') === '1') document.body.classList.add('dark');
  await loadVivitsu();
  createTopControls();
  // attach install button behavior (if present)
  const installBtn = document.getElementById('installBtn');
  if(installBtn){
    window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); window.deferredPrompt=e; installBtn.hidden=false; installBtn.onclick=async ()=>{ window.deferredPrompt.prompt(); await window.deferredPrompt.userChoice; window.deferredPrompt=null; installBtn.hidden=true; }; });
  }
  renderWeeks();
  renderTasks();

  // request Notification permission proactively
  if(window.Notification && Notification.permission !== "granted"){
    try{ Notification.requestPermission().then(p=>console.log('Notification permission', p)); }catch(e){;}
  }

  // load saved state if exists
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ try{ const j = JSON.parse(raw); state = j; }catch(e){} }
  saveState();

  // brief check for missed reminders
  checkReminders();
})();
