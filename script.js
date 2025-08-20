// Utilities
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------------------------
   Ambient audio toggle
---------------------------- */
const audio = $('#ambient');
const audioToggle = $('.audio-toggle');
let audioOn = false;
audioToggle?.addEventListener('click', async () => {
  if (!audio) return;
  try {
    if (!audioOn) { await audio.play(); audioOn = true; audioToggle.textContent = '🔈'; }
    else { audio.pause(); audioOn = false; audioToggle.textContent = '🔊'; }
  } catch(e){ /* ignore autoplay restrictions */ }
});

/* ---------------------------
   Dynamic gradient per scene
---------------------------- */
const scenes = $$('#scenes .scene');
function setGradient(c1, c2){
  document.documentElement.style.setProperty('--bg1', c1);
  document.documentElement.style.setProperty('--bg2', c2);
}

/* ---------------------------
   Word-by-word reveal — FIXED SPACES
---------------------------- */
function splitWords(el) {
  const text = el.dataset.words || el.textContent;
  el.textContent = '';
  const words = text.trim().split(/\s+/);
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = w;
    span.style.opacity = 0;
    span.style.display = 'inline-block';
    span.style.transform = 'translateY(10px)';
    el.appendChild(span);
    // Add a real space between spans except after the last word
    if (i < words.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });
}
$$('.line').forEach(splitWords);

/* ---------------------------
   Floating emoji stream
---------------------------- */
const emojiLayer = $('.emoji-layer');
const EMOJIS = ['💙','🐈','😺','😻','🍋','🥤','🌆','🌇','✨','💫'];
function spawnEmoji({
  x = Math.random()*100,
  duration = 6 + Math.random()*5,
  char = EMOJIS[Math.floor(Math.random()*EMOJIS.length)],
  sizeScale = 1
} = {}){
  const e = document.createElement('div');
  e.className = 'emoji';
  e.textContent = char;
  e.style.left = x + 'vw';
  e.style.animationDuration = duration + 's';
  e.style.fontSize = `clamp(18px, ${2.2*sizeScale}vw, ${32*sizeScale}px)`;
  emojiLayer.appendChild(e);
  setTimeout(() => e.remove(), duration*1000);
}
let emojiInterval = setInterval(() => spawnEmoji(), 420);

/* Burst on demand */
function burst(x, y, count = 24){
  for (let i=0; i<count; i++){
    spawnEmoji({ x: (x/window.innerWidth)*100 + (Math.random()*10-5), duration: 3 + Math.random()*2, sizeScale: 1.3 });
  }
}
$$('.burst-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    burst(rect.left + rect.width/2, rect.top + rect.height/2, 28);
    const caption = document.createElement('div');
    caption.textContent = 'Because these are all you.';
    Object.assign(caption.style, {
      position:'absolute', left: '50%', transform:'translateX(-50%)',
      marginTop:'10px', fontWeight:'600', opacity:'0.9'
    });
    e.currentTarget.insertAdjacentElement('afterend', caption);
    setTimeout(()=> caption.remove(), 2500);
  });
});

/* ---------------------------
   GSAP Scroll magic + parallax
---------------------------- */
function initGSAP(){
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const dots = $$('.dot');
  scenes.forEach((scene, i) => {
    const [c1,c2] = (scene.dataset.colors || '').split(',');
    const lineWords = $$('.w', scene);
    const photo = $('.photo img', scene);

    ScrollTrigger.create({
      trigger: scene,
      start: 'top center',
      onEnter: () => { if (c1 && c2) setGradient(c1, c2); dots[i]?.classList.add('active'); },
      onEnterBack: () => { if (c1 && c2) setGradient(c1, c2); dots[i]?.classList.add('active'); },
      onLeave: () => { dots[i]?.classList.remove('active'); },
      onLeaveBack: () => { dots[i]?.classList.remove('active'); }
    });

    if (photo){
      gsap.fromTo(photo, { opacity: 0, y: 60, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: scene, start: 'top 80%' }
      });
    }

    if (lineWords.length){
      gsap.to(lineWords, {
        opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: scene, start: 'top 75%' }
      });
    }

    scene.addEventListener('mousemove', (ev) => {
      if (!photo) return;
      const r = scene.getBoundingClientRect();
      const cx = (ev.clientX - r.left) / r.width - 0.5;
      const cy = (ev.clientY - r.top) / r.height - 0.5;
      photo.style.transform = `perspective(800px) rotateX(${cy*-5}deg) rotateY(${cx*5}deg) scale(1.02)`;
    });
    scene.addEventListener('mouseleave', () => {
      if (!photo) return;
      photo.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    });
  });

  // Finale cat walk
  const cat = $('.finale .cat-walk');
  if (cat){
    ScrollTrigger.create({
      trigger: $('.finale'),
      start: 'top 60%',
      onEnter: () => {
        gsap.fromTo(cat, { x: -80, opacity: 0 }, { x: window.innerWidth+80, opacity: 1, duration: 7, ease: 'none' });
      }
    });
  }
}
document.readyState !== 'loading' ? initGSAP() : document.addEventListener('DOMContentLoaded', initGSAP);

/* ---------------------------
   Scroll progress UI update
---------------------------- */
const dots = $$('.dot');
function updateProgress(){
  const viewH = window.innerHeight;
  scenes.forEach((scene, i) => {
    const rect = scene.getBoundingClientRect();
    const inView = rect.top < viewH*0.6 && rect.bottom > viewH*0.4;
    dots[i]?.classList.toggle('active', inView);
  });
  requestAnimationFrame(updateProgress);
}
requestAnimationFrame(updateProgress);

/* ---------------------------
   Accessibility tweaks
---------------------------- */
const mediaReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
function handleReduceMotion(){
  if (mediaReduce.matches){
    clearInterval(emojiInterval);
    $$('.emoji').forEach(e => e.remove());
  } else {
    if (!emojiInterval) emojiInterval = setInterval(() => spawnEmoji(), 420);
  }
}
mediaReduce.addEventListener?.('change', handleReduceMotion);
handleReduceMotion();

/* ---------------------------
   Fun cursor trail sparkles
---------------------------- */
const trailCanvas = document.getElementById('cursor-trail');
if (trailCanvas) {
  const ctx = trailCanvas.getContext('2d');
  let particles = [];
  function resize(){ trailCanvas.width = window.innerWidth; trailCanvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  function createParticle(x, y){
    const colors = ['#4e86ff','#ff9df5','#ffe08f','#7affc1','#ff7f50'];
    particles.push({ x, y, alpha:1, size: 3+Math.random()*3, color: colors[Math.floor(Math.random()*colors.length)] });
  }
  function drawParticles(){
    ctx.clearRect(0,0,trailCanvas.width, trailCanvas.height);
    particles.forEach((p,i)=>{
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      p.y -= 0.5;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i,1);
    });
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
    window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) createParticle(e.clientX, e.clientY);
  });
}
