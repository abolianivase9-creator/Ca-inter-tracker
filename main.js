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

const STORAGE_KEY = "ca_inter_tracker_v1";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateGlobalProgress(); }

function el(tag, attrs={}, ...children){
  const e = document.createElement(tag);
  for(let k in attrs) e.setAttribute(k, attrs[k]);
  children.forEach(c=>{
    if(typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

const weeksNav = document.getElementById("weeksNav");
const tasksEl = document.getElementById("tasks");
const globalProgress = document.getElementById("globalProgress");

let activeWeek = Object.keys(weeks)[0];

function renderWeeks(){
  weeksNav.innerHTML = "";
  Object.keys(weeks).forEach(w=>{
    const btn = el("button", {class:"week-btn"+(w===activeWeek?" active":"")}, w);
    btn.addEventListener("click", ()=>{
      activeWeek = w;
      renderWeeks();
      renderTasks();
    });
    weeksNav.appendChild(btn);
  });
}

function getChecked(day){ return !!state['d'+day]; }
function toggleDay(day){
  state['d'+day] = !getChecked(day);
  saveState();
  renderTasks();
}

function renderTasks(){
  tasksEl.innerHTML = "";
  const items = weeks[activeWeek];
  items.forEach(task=>{
    const card = el("div",{class:"card "+task.color});
    const head = el("div",{class:"card-head"});
    const left = el("div");
    left.appendChild(el("div",{class:"title"}, "Day "+task.day));
    left.appendChild(el("div",{class:"meta"}, task.title));
    head.appendChild(left);

    const cb = el("div",{class:"checkbox", tabindex:0});
    cb.innerHTML = getChecked(task.day)? "✓": "";
    cb.addEventListener("click", ()=> toggleDay(task.day));
    cb.addEventListener("keydown", (e)=>{ if(e.key==='Enter') toggleDay(task.day); });
    head.appendChild(cb);

    card.appendChild(head);

    const progressWrap = el("div",{class:"progress-wrap"});
    const prog = el("div",{class:"progress"});
    prog.style.width = getChecked(task.day)? "100%":"0%";
    progressWrap.appendChild(prog);

    card.appendChild(progressWrap);
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

renderWeeks();
renderTasks();

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async ()=>{
  installBtn.hidden = true;
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});
