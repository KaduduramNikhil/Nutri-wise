/************ NutriWise JS ************/
const STORAGE_KEY = "nutriwise_demo_v1";

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
function startOfDayISO(date){
  const d = date ? new Date(date) : new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

let state = { meals: [], goal: 2000 };

const mealsListEl = document.getElementById("meals-list");
const todayTotalEl = document.getElementById("today-total");
const goalValueEl = document.getElementById("goal-value");
const progressBarEl = document.getElementById("progress-bar");
const progressTextEl = document.getElementById("progress-text");
const weekSummaryEl = document.getElementById("week-summary");
const weekCtx = document.getElementById("weekChart").getContext("2d");

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ state = JSON.parse(raw) }catch(e){}
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addMeal({name, category, calories, date}){
  const meal = {
    id: uid(),
    name,
    category,
    calories: Number(calories),
    date: date ? new Date(date).toISOString() : new Date().toISOString()
  };
  state.meals.push(meal);
  saveState();
  render();
}

function removeMeal(id){
  state.meals = state.meals.filter(m => m.id !== id);
  saveState();
  render();
}

function clearAll(){
  if(!confirm("Clear all meals and reset demo data?")) return;
  state.meals = [];
  saveState();
  render();
}

function totalsPerDayRange(daysBack = 6){
  const map = {};
  const days = [];
  const now = new Date();
  now.setHours(0,0,0,0);

  for(let i = daysBack; i >= 0; i--){
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0,10);
    map[key] = 0;
    days.push(key);
  }

  state.meals.forEach(m => {
    const key = new Date(m.date).toISOString().slice(0,10);
    if(map[key] !== undefined) map[key] += m.calories;
  });

  return {map, days};
}

function renderMeals(){
  mealsListEl.innerHTML = "";

  if(state.meals.length === 0){
    mealsListEl.innerHTML = '<div class="small muted">No meals logged yet.</div>';
    return;
  }

  const sorted = [...state.meals].sort((a,b)=> new Date(b.date) - new Date(a.date));

  sorted.forEach(m => {
    const div = document.createElement("div");
    div.className = "meal-item";
    div.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(m.name)} 
          <span class="small muted">(${m.category})</span>
        </div>
        <div class="meal-meta">
          ${new Date(m.date).toLocaleString()} — ${m.calories} kcal
        </div>
      </div>

      <button class="ghost" data-id="${m.id}">Delete</button>
    `;

    div.querySelector("button").addEventListener("click", ()=> removeMeal(m.id));
    mealsListEl.appendChild(div);
  });
}

function renderDashboard(){
  const todayKey = startOfDayISO();
  const {map, days} = totalsPerDayRange(6);
  const todayTotal = map[todayKey] || 0;

  todayTotalEl.textContent = todayTotal + " kcal";
  goalValueEl.textContent = state.goal;

  const pct = Math.round((todayTotal / state.goal) * 100);
  const pctClamped = Math.min(100, Math.max(0, pct || 0));

  progressBarEl.style.width = pctClamped + "%";
  progressTextEl.textContent = (pct || 0) + "% of goal";

  const weeklyTotal = Object.values(map).reduce((s, v)=> s + v, 0);

  weekSummaryEl.innerHTML = `
    <div>This week total: <strong>${weeklyTotal} kcal</strong></div>
    <div>Average/day: <strong>${Math.round(weeklyTotal / days.length)}</strong> kcal</div>
  `;
}

let chart = null;

function renderChart(){
  const {map, days} = totalsPerDayRange(6);

  const labels = days.map(d => new Date(d).toLocaleDateString(undefined,{weekday:"short"}));
  const data = days.map(d => map[d] || 0);

  const config = {
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"Calories",
        data,
        borderRadius:6,
        backgroundColor: data.map((v,i)=> i === data.length - 1 ? "#4f46e5" : "#a78bfa")
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ display:false }},
      scales:{ y:{ beginAtZero:true, ticks:{ stepSize:200 }} }
    }
  };

  if(chart){
    chart.data = config.data;
    chart.update();
  } else {
    chart = new Chart(weekCtx, config);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}

document.getElementById("meal-form").addEventListener("submit", e=>{
  e.preventDefault();
  const name = document.getElementById("meal-name").value.trim();
  const category = document.getElementById("meal-cat").value;
  const calories = document.getElementById("meal-cal").value;

  if(!name || !calories) return alert("Please enter meal name and calories");

  addMeal({name, category, calories});
  e.target.reset();
});

document.getElementById("btn-clear").addEventListener("click", clearAll);

document.getElementById("goal-form").addEventListener("submit", e=>{
  e.preventDefault();
  const v = Number(document.getElementById("goal-input").value) || 2000;
  state.goal = v;
  saveState();
  render();
});

document.getElementById("btn-export").addEventListener("click", ()=> window.print());

document.getElementById("btn-export-json").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nutriwise_export.json";
  a.click();
  URL.revokeObjectURL(url);
});

const importFile = document.getElementById("import-file");

document.getElementById("btn-import-json").addEventListener("click", ()=> importFile.click());

importFile.addEventListener("change", async ev=>{
  const f = ev.target.files[0];
  if(!f) return;

  const txt = await f.text();

  try{
    const parsed = JSON.parse(txt);
    if(parsed && Array.isArray(parsed.meals)){
      if(confirm("Import will overwrite current local data. Continue?")){
        state = parsed;
        saveState();
        render();
        alert("Imported.");
      }
    } else alert("Invalid file format.");
  }catch(e){
    alert("Failed to read file: " + e.message);
  }
});

function render(){
  renderMeals();
  renderDashboard();
  renderChart();
}

(function init(){
  loadState();
  state.meals = state.meals || [];
  state.goal = state.goal || 2000;
  document.getElementById("goal-input").value = state.goal;
  render();
})();