const API = 'https://restcountries.com/v3.1/all?fields=name,capital,flags';
const TOTAL = 10;

const el = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  flag: document.getElementById('flag'),
  options: document.getElementById('options'),
  nextBtn: document.getElementById('nextBtn'),
  restartBtn: document.getElementById('restartBtn'),
  current: document.getElementById('current'),
  correct: document.getElementById('correct'),
  wrong: document.getElementById('wrong'),
  message: document.getElementById('message')
};

let countries = [];
let questions = [];
let qIndex = 0;
let score = { correct: 0, wrong: 0 };
let answered = false;

async function init() {
  showLoading(true);
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Hálózati hiba');
    const data = await res.json();
    
    countries = data.filter(c => c.name && c.name.common && c.flags && (c.flags.svg || c.flags.png));

    if (countries.length < 6) throw new Error('Nincs elegendő ország az adatforrásban');

    buildQuestions();
    renderQuestion();
  } catch (err) {
    el.error.textContent = 'Hiba: ' + err.message;
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  el.loading.style.display = show ? 'block' : 'none';
}

function pickRandom(arr, n) {
  const copy = arr.slice();
  const picked = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function buildQuestions() {
  questions = [];
  const pool = countries.filter(c => c.capital && c.capital.length > 0);
  for (let i = 0; i < TOTAL; i++) {
    const correct = pickRandom(pool, 1)[0];
    
    let others = pickRandom(pool.filter(c => c !== correct), 4);
   
    while (others.length < 4) {
      const extra = pickRandom(pool.filter(c => !others.includes(c) && c !== correct), 1)[0];
      if (extra) others.push(extra);
      else break;
    }
    const options = [correct, ...others].map(c => c.capital[0]);
   
    options.sort(() => Math.random() - 0.5);
    questions.push({ correct, options });
  }
}

function renderQuestion() {
  answered = false;
  el.nextBtn.disabled = true;
  el.message.textContent = '';

  if (qIndex >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[qIndex];
  el.current.textContent = qIndex + 1;

  
  const flagUrl = q.correct.flags.svg || q.correct.flags.png;
  el.flag.src = flagUrl;
  el.flag.alt = 'Zászló: ' + q.correct.name.common;

  
  let countryNameElem = document.getElementById('countryName');
  if (!countryNameElem) {
    countryNameElem = document.createElement('div');
    countryNameElem.id = 'countryName';
    countryNameElem.style = 'text-align:center;font-size:1.2em;font-weight:600;margin:8px 0;';
    el.flag.parentNode.appendChild(countryNameElem);
  }
  countryNameElem.textContent = q.correct.name.common;

  
  el.options.innerHTML = '';
  q.options.forEach((capital) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = capital;
    btn.addEventListener('click', () => selectOption(btn, capital));
    el.options.appendChild(btn);
  });
}

function selectOption(button, selectedCapital) {
  if (answered) return;
  answered = true;
  
  const buttons = Array.from(el.options.querySelectorAll('button'));
  buttons.forEach(b => b.disabled = true);

  const q = questions[qIndex];
  const correctCapital = q.correct.capital && q.correct.capital[0] ? q.correct.capital[0] : 'Nincs főváros';
  const isCorrect = selectedCapital === correctCapital;
  if (isCorrect) {
    button.classList.add('correct');
    score.correct++;
    el.correct.textContent = score.correct;
    el.message.textContent = 'Helyes!';
  } else {
    button.classList.add('wrong');
    score.wrong++;
    el.wrong.textContent = score.wrong;
    el.message.textContent = 'Rossz. A helyes válasz: ' + correctCapital;
    
    buttons.forEach(b => {
      if (b.textContent === correctCapital) b.classList.add('correct');
    });
  }

  el.nextBtn.disabled = false;
  if (qIndex >= questions.length - 1) {
    el.nextBtn.textContent = 'Befejezés';
  } else {
    el.nextBtn.textContent = 'Következő';
  }
}

function finishQuiz() {
  el.message.textContent = `Kész! Összesen: ${TOTAL} — Jó: ${score.correct}, Rossz: ${score.wrong}`;
  el.nextBtn.style.display = 'none';
  el.restartBtn.style.display = 'inline-block';
}

el.nextBtn.addEventListener('click', () => {
  qIndex++;
  renderQuestion();
});

el.restartBtn.addEventListener('click', () => {
  
  qIndex = 0;
  score = { correct: 0, wrong: 0 };
  el.correct.textContent = 0;
  el.wrong.textContent = 0;
  el.nextBtn.style.display = 'inline-block';
  el.nextBtn.disabled = true;
  el.restartBtn.style.display = 'none';
  buildQuestions();
  renderQuestion();
});


init();

