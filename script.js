/* ============================================
   SOFIA TURISMO — script.js
   ============================================ */

/* ===== CANVAS 3D GLOBAL ===== */
(function(){
    const canvas = document.getElementById('globalCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles, sparks = [], trails = [];
    const mouse = { x: -9999, y: -9999 };
    let mouseActive = false, clickRipples = [];

    function resize(){
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function mkParticle(){
        return {
            x: Math.random()*W, y: Math.random()*H,
            r: Math.random()*1.6+0.3,
            vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3,
            alpha: Math.random()*0.5+0.1,
            gold: Math.random()>0.6
        };
    }

    function mkSpark(x,y,vx,vy){
        return { x, y, vx:vx*0.4+(Math.random()-0.5)*3, vy:vy*0.4+(Math.random()-0.5)*3, life:1.0, r:Math.random()*2+0.5 };
    }

    function mkRipple(x,y){ return {x,y,r:0,life:1.0}; }

    function init(){ resize(); particles = Array.from({length:140}, mkParticle); }

    function drawGrid(){
        const cols=14, rows=9, cw=W/cols, ch=H/rows;
        ctx.strokeStyle='rgba(212,175,55,0.08)';
        ctx.lineWidth=1;
        for(let i=0;i<=cols;i++){ ctx.beginPath();ctx.moveTo(i*cw,0);ctx.lineTo(i*cw,H);ctx.stroke(); }
        for(let i=0;i<=rows;i++){ ctx.beginPath();ctx.moveTo(0,i*ch);ctx.lineTo(W,i*ch);ctx.stroke(); }
    }

    function drawRays(t){
        const cx=W*0.5, cy=H*0.45;
        for(let i=0;i<16;i++){
            const angle=(i/16)*Math.PI*2+t*0.0008;
            const len=Math.max(W,H)*0.9;
            const g=ctx.createLinearGradient(cx,cy,cx+Math.cos(angle)*len,cy+Math.sin(angle)*len);
            g.addColorStop(0,'rgba(212,175,55,0.20)');
            g.addColorStop(1,'rgba(212,175,55,0)');
            ctx.beginPath(); ctx.strokeStyle=g; ctx.lineWidth=0.8;
            ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(angle)*len,cy+Math.sin(angle)*len); ctx.stroke();
        }
    }

    function drawMouseGlow(){
        if(!mouseActive) return;
        const g1=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,200);
        g1.addColorStop(0,'rgba(212,175,55,0.06)'); g1.addColorStop(1,'rgba(212,175,55,0)');
        ctx.beginPath(); ctx.fillStyle=g1; ctx.arc(mouse.x,mouse.y,200,0,Math.PI*2); ctx.fill();
        const g2=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,28);
        g2.addColorStop(0,'rgba(245,226,122,0.55)'); g2.addColorStop(0.3,'rgba(212,175,55,0.2)'); g2.addColorStop(1,'rgba(212,175,55,0)');
        ctx.beginPath(); ctx.fillStyle=g2; ctx.arc(mouse.x,mouse.y,28,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(mouse.x,mouse.y,32,0,Math.PI*2);
        ctx.strokeStyle='rgba(212,175,55,0.25)'; ctx.lineWidth=1.2; ctx.stroke();
    }

    function drawTrail(){
        for(let i=trails.length-1;i>=0;i--){
            const tr=trails[i]; tr.life-=0.08;
            if(tr.life<=0){trails.splice(i,1);continue;}
            const g=ctx.createRadialGradient(tr.x,tr.y,0,tr.x,tr.y,tr.r);
            g.addColorStop(0,`rgba(212,175,55,${tr.life*0.35})`); g.addColorStop(1,'rgba(212,175,55,0)');
            ctx.beginPath(); ctx.fillStyle=g; ctx.arc(tr.x,tr.y,tr.r,0,Math.PI*2); ctx.fill();
        }
    }

    function drawSparks(){
        for(let i=sparks.length-1;i>=0;i--){
            const s=sparks[i]; s.life-=0.025;
            if(s.life<=0){sparks.splice(i,1);continue;}
            s.x+=s.vx; s.y+=s.vy; s.vy+=0.06;
            ctx.beginPath(); ctx.arc(s.x,s.y,s.r*s.life,0,Math.PI*2);
            ctx.fillStyle=`rgba(245,226,122,${s.life*0.9})`; ctx.fill();
        }
    }

    function drawRipples(){
        for(let i=clickRipples.length-1;i>=0;i--){
            const rp=clickRipples[i]; rp.life-=0.018; rp.r+=5;
            if(rp.life<=0){clickRipples.splice(i,1);continue;}
            ctx.beginPath(); ctx.arc(rp.x,rp.y,rp.r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(212,175,55,${rp.life*0.7})`; ctx.lineWidth=2; ctx.stroke();
        }
    }

    function connectParticles(){
        const maxD=120;
        for(let i=0;i<particles.length;i++){
            for(let j=i+1;j<particles.length;j++){
                const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
                const d=Math.sqrt(dx*dx+dy*dy);
                if(d<maxD){ ctx.strokeStyle=`rgba(212,175,55,${(1-d/maxD)*0.15})`; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.stroke(); }
            }
            if(mouseActive){
                const dx=particles[i].x-mouse.x, dy=particles[i].y-mouse.y;
                const d=Math.sqrt(dx*dx+dy*dy);
                if(d<220){ ctx.strokeStyle=`rgba(245,226,122,${(1-d/220)*0.3})`; ctx.lineWidth=(1-d/220)*0.8; ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); }
            }
        }
    }

    function drawRings(t){
        const cx=W*0.5, cy=H*0.45;
        for(let ring=1;ring<=4;ring++){
            const radius=(ring*90)+Math.sin(t*0.018+ring)*14;
            ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2);
            ctx.strokeStyle=`rgba(212,175,55,${0.10-ring*0.015})`; ctx.lineWidth=1; ctx.stroke();
        }
    }

    let t=0, lastMX=-9999, lastMY=-9999;
    function animate(){
        ctx.clearRect(0,0,W,H);
        drawGrid(); drawRays(t); drawRings(t);
        drawTrail(); drawMouseGlow(); drawRipples();
        connectParticles(); drawSparks();
        if(mouseActive){
            trails.push({x:mouse.x,y:mouse.y,r:10+Math.random()*5,life:0.7});
            if(trails.length>28) trails.shift();
            const spd=Math.hypot(mouse.x-lastMX,mouse.y-lastMY);
            if(spd>15&&Math.random()<0.15) sparks.push(mkSpark(mouse.x,mouse.y,mouse.x-lastMX,mouse.y-lastMY));
        }
        lastMX=mouse.x; lastMY=mouse.y;
        particles.forEach(p=>{
            if(mouseActive){
                const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.sqrt(dx*dx+dy*dy);
                if(d<60){p.vx+=(dx/d)*0.7;p.vy+=(dy/d)*0.7;}
                else if(d<180){p.vx-=(dx/d)*0.15;p.vy-=(dy/d)*0.15;}
            }
            p.vx*=0.975; p.vy*=0.975;
            p.x+=p.vx; p.y+=p.vy;
            if(p.x<0)p.x=W; if(p.x>W)p.x=0;
            if(p.y<0)p.y=H; if(p.y>H)p.y=0;
            const pulse=1+Math.sin(t*0.04+p.x*0.01)*0.3;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2);
            ctx.fillStyle=p.gold?`rgba(212,175,55,${p.alpha})`:`rgba(255,255,255,${p.alpha*0.7})`;
            ctx.fill();
        });
        t++; requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; mouseActive=true; });
    document.addEventListener('mouseleave', ()=>{ mouseActive=false; mouse.x=-9999; mouse.y=-9999; });
    window.addEventListener('click', e=>{
        clickRipples.push(mkRipple(e.clientX,e.clientY));
        for(let i=0;i<12;i++) sparks.push(mkSpark(e.clientX,e.clientY,(Math.random()-0.5)*10,(Math.random()-0.5)*10));
    });

    init(); animate();
})();

/* ===== MENU MOBILE ===== */
function toggleMobileMenu(){
    const m = document.getElementById('mobile-menu');
    if(m) m.classList.toggle('hidden');
}

/* ===== FILTRO FROTA ===== */
function filtrarFrota(categoria){
    const cards  = document.querySelectorAll('.frota-card');
    const botoes = document.querySelectorAll('.filtro-btn');
    botoes.forEach(btn=>{
        btn.classList.remove('bg-ns-primary','text-black');
        btn.classList.add('bg-gray-800','text-gray-300');
    });
    const btnAtivo = document.getElementById('filtro-'+categoria);
    if(btnAtivo){ btnAtivo.classList.add('bg-ns-primary','text-black'); btnAtivo.classList.remove('bg-gray-800','text-gray-300'); }
    cards.forEach(card=>{
        card.style.display = (categoria==='todos'||card.dataset.categoria===categoria) ? 'block' : 'none';
    });
}
