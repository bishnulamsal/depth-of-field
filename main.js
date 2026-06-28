// ═══════════════════════════════════════════
// SHARED DATA
// ═══════════════════════════════════════════
const APS=[1,1.2,1.4,1.8,2,2.8,3.5,4,5.6,8,11,16];
const APL=['ƒ/1','ƒ/1.2','ƒ/1.4','ƒ/1.8','ƒ/2','ƒ/2.8','ƒ/3.5','ƒ/4','ƒ/5.6','ƒ/8','ƒ/11','ƒ/16'];
const SSV=[1/8000,1/4000,1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1,2,4,8,15,30];
const SSL=['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1"','2"','4"','8"','15"','30"'];
const ISO=[100,200,400,800,1600,3200,6400,12800,25600,51200,102400,204800,409600];

// ═══════════════════════════════════════════
// LOAD SOURCE IMAGE
// ═══════════════════════════════════════════
const SRC = new Image();
SRC.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjamlvQFwhwNwHPt4nyhpPnMX0Haf-8E4QxJCymwwaA90uqKfsF7gnc3mAtpct4M0oNym73UWiv-JAJA3VbykL2h7VEsRXvLVepB_zmqhm2rKY4yFnQc_QcPl-GfMCzzSnkbD2LJNVLNeihBtBE3jz5upgs7l3aKRxKZFZ1daVk5xIAD_6F6sUq9S_LuEf-/s1600/photography.jpg';
SRC.onload = () => { imgReady=true; renderDof(); renderExp(); renderFL(); };
let imgReady = false;

// ═══════════════════════════════════════════
// TAB SWITCH
// ═══════════════════════════════════════════
function sw(name,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('on'));
  document.getElementById('tab-'+name).classList.add('on');
  btn.classList.add('on');
  setTimeout(()=>{renderDof();renderExp();renderFL();},50);
}

// ═══════════════════════════════════════════
// SHUTTER FLASH
// ═══════════════════════════════════════════
function flash(){
  const f=document.createElement('div');
  f.style.cssText='position:fixed;inset:0;background:#fff;opacity:.8;z-index:9999;pointer-events:none;transition:opacity .06s';
  document.body.appendChild(f);
  setTimeout(()=>{f.style.opacity='0';setTimeout(()=>f.remove(),90)},55);
}

// ═══════════════════════════════════════════
// OFFSCREEN LAYERED BLUR SYSTEM
// ═══════════════════════════════════════════
// We draw the image 3 times on separate offscreen canvases with different blur,
// then composite them using vertical gradient masks:
//   Layer 0: Background  (top portion, blurred)
//   Layer 1: Subject     (middle, sharp or slight blur)
//   Layer 2: Foreground  (bottom strip, blurred)

function makeOff(w,h){
  const c=document.createElement('canvas');
  c.width=w; c.height=h;
  return c;
}

function drawImageFit(ctx,img,W,H){
  const iR=img.naturalWidth/img.naturalHeight;
  const cR=W/H;
  let dx,dy,dw,dh;
  if(iR>cR){dh=H;dw=dh*iR;dx=(W-dw)/2;dy=0;}
  else{dw=W;dh=dw/iR;dx=0;dy=(H-dh)/2;}
  ctx.drawImage(img,dx,dy,dw,dh);
  return {dx,dy,dw,dh};
}

function applyBlurCanvas(src, blurPx){
  // Returns a new canvas with Gaussian-style blur via repeated box blur passes
  if(blurPx<=0) return src;
  const c=makeOff(src.width,src.height);
  const ctx=c.getContext('2d');
  ctx.filter=`blur(${blurPx}px)`;
  ctx.drawImage(src,0,0);
  ctx.filter='none';
  return c;
}

// ═══════════════════════════════════════════
// DOF TAB
// ═══════════════════════════════════════════
let dNear=2,dFar=6,dSubj=3,dAp=1.8,dFl=85;

function calcAndRender(){
  const fl=+document.getElementById('d-fl').value;
  const ai=+document.getElementById('d-ap').value;
  const dist=+document.getElementById('d-dist').value;
  const coc=+document.getElementById('d-sensor').value;
  const ap=APS[ai];
  dAp=ap; dFl=fl;
  document.getElementById('lbl-fl').textContent=fl+' mm';
  document.getElementById('lbl-ap').textContent=APL[ai];
  document.getElementById('lbl-dist').textContent=dist.toFixed(1)+' m';

  const flM=fl/1000;
  const H=(fl*fl)/(ap*coc)/1000;
  const near=(dist*(H-flM))/(H+dist-2*flM);
  const far=dist<H?(dist*(H+flM))/(H-dist+2*flM):Infinity;
  const dof=far===Infinity?Infinity:far-near;
  dNear=Math.max(.05,near); dFar=far; dSubj=dist;

  const fmt=v=>v===Infinity?'∞':v>=1?v.toFixed(1)+'m':(v*100).toFixed(0)+'cm';
  document.getElementById('s-near').textContent=fmt(dNear);
  document.getElementById('s-far').textContent=fmt(dFar);
  document.getElementById('s-dof').textContent=dof===Infinity?'∞':fmt(dof);
  document.getElementById('s-hyp').textContent=H.toFixed(0)+'m';
  document.getElementById('s-coc').textContent=(coc*1000).toFixed(1)+'µm';
  const ch=dof<0.3?'Razor thin':dof<1?'Very shallow':dof<4?'Shallow':dof<15?'Moderate':'Deep';
  document.getElementById('s-ch').textContent=ch;

  // Auto-sync blur sliders based on DoF calculation
  const blurStrength = Math.min(20, Math.round((1/dof)*15 * (dAp/2.8)));
  const bgBlurVal = Math.max(0, Math.min(20, blurStrength));
  document.getElementById('d-bgblur').value = bgBlurVal;

  renderDof();
}

function renderDof(){
  if(!imgReady) return;
  const wrap=document.getElementById('dof-wrap');
  const canvas=document.getElementById('dof-c');
  const W=wrap.clientWidth||700;
  canvas.width=W; canvas.height=W*0.66;
  const H=canvas.height;
  const ctx=canvas.getContext('2d');

  const bgBlur=+document.getElementById('d-bgblur').value;
  const fgBlur=+document.getElementById('d-fgblur').value;
  const subjBlur=+document.getElementById('d-sharp').value;
  const splitPct=+document.getElementById('d-split').value/100;

  // Label updates
  const blurLabels=['none','very soft','soft','medium','strong','very strong','extreme'];
  const bIdx=v=>Math.min(6,Math.round(v/3));
  document.getElementById('lbl-bgblur').textContent=blurLabels[bIdx(bgBlur)];
  document.getElementById('lbl-fgblur').textContent=blurLabels[bIdx(fgBlur)];
  document.getElementById('lbl-sharp').textContent=subjBlur===0?'sharp':blurLabels[bIdx(subjBlur)];

  // ── Layer 0: Background (blurred) ──
  const bg=makeOff(W,H);
  const bgCtx=bg.getContext('2d');
  drawImageFit(bgCtx,SRC,W,H);
  const bgBlurred=applyBlurCanvas(bg,bgBlur);

  // ── Layer 1: Subject (sharp or slight blur) ──
  const subj=makeOff(W,H);
  const sCtx=subj.getContext('2d');
  drawImageFit(sCtx,SRC,W,H);
  const subjBlurred=applyBlurCanvas(subj,subjBlur);

  // ── Layer 2: Foreground (blurred) ──
  const fg=makeOff(W,H);
  const fgCtx=fg.getContext('2d');
  drawImageFit(fgCtx,SRC,W,H);
  const fgBlurred=applyBlurCanvas(fg,fgBlur);

  // ── Composite: background (full canvas, blurred) ──
  ctx.drawImage(bgBlurred,0,0);

  // ── Composite: subject layer via mask ──
  // Subject occupies from top of frame to splitPct (person's feet)
  // We reveal the sharp layer here and blend edges
  const subjectTop=0;
  const subjectBot=H*splitPct;
  const blendSize=H*0.18;

  // Create temp canvas for masked composite
  const maskC=makeOff(W,H);
  const mCtx=maskC.getContext('2d');
  // Draw subject sharp image
  mCtx.drawImage(subjBlurred,0,0);
  // Mask: linear gradient — fade out at bottom
  const grd=mCtx.createLinearGradient(0,subjectBot-blendSize,0,subjectBot+blendSize*0.5);
  grd.addColorStop(0,'rgba(0,0,0,1)');
  grd.addColorStop(1,'rgba(0,0,0,0)');
  mCtx.globalCompositeOperation='destination-in';
  mCtx.fillStyle=grd;mCtx.fillRect(0,0,W,H);
  mCtx.globalCompositeOperation='source-over';
  ctx.drawImage(maskC,0,0);

  // ── Composite: foreground stripe at very bottom if fg blur set ──
  if(fgBlur>0){
    const fgC=makeOff(W,H);
    const fgMCtx=fgC.getContext('2d');
    fgMCtx.drawImage(fgBlurred,0,0);
    const fg2=fgMCtx.createLinearGradient(0,H*.78,0,H*.92);
    fg2.addColorStop(0,'rgba(0,0,0,0)');
    fg2.addColorStop(1,'rgba(0,0,0,1)');
    fgMCtx.globalCompositeOperation='destination-in';
    fgMCtx.fillStyle=fg2;fgMCtx.fillRect(0,0,W,H);
    fgMCtx.globalCompositeOperation='source-over';
    ctx.drawImage(fgC,0,0);
  }

  // ── HUD Overlay ──
  drawDofHUD(ctx,W,H,splitPct);

  // ── Viewfinder ──
  renderVF(bgBlur,fgBlur,subjBlur,splitPct);
}

function drawDofHUD(ctx,W,H,splitPct){
  // DoF bracket on the person
  const subjectCenterX=W*.5;
  const subjectTop=H*.08;
  const subjectBot=H*splitPct;
  const ai=+document.getElementById('d-ap').value;
  const isSharp=+document.getElementById('d-sharp').value<2;
  const fc=isSharp?'rgba(74,220,106,.85)':'rgba(220,74,74,.75)';

  ctx.strokeStyle=fc;ctx.lineWidth=2;
  const bx=W*.28,bw=W*.44,bh=subjectBot-subjectTop;
  const cs=14;
  ctx.beginPath();
  ctx.moveTo(bx,subjectTop+cs);ctx.lineTo(bx,subjectTop);ctx.lineTo(bx+cs,subjectTop);
  ctx.moveTo(bx+bw-cs,subjectTop);ctx.lineTo(bx+bw,subjectTop);ctx.lineTo(bx+bw,subjectTop+cs);
  ctx.moveTo(bx,subjectTop+bh-cs);ctx.lineTo(bx,subjectTop+bh);ctx.lineTo(bx+cs,subjectTop+bh);
  ctx.moveTo(bx+bw-cs,subjectTop+bh);ctx.lineTo(bx+bw,subjectTop+bh);ctx.lineTo(bx+bw,subjectTop+bh-cs);
  ctx.stroke();

  // Focus label
  ctx.font='bold 11px JetBrains Mono,monospace';
  ctx.fillStyle=fc;ctx.textAlign='center';
  ctx.fillText(isSharp?'● SUBJECT IN FOCUS':'● SUBJECT BLURRED',W*.5,subjectTop-8);

  // DoF zone bar at bottom
  const barY=H-36;
  ctx.fillStyle='rgba(0,0,0,.6)';
  ctx.beginPath();ctx.roundRect(10,barY-4,W-20,32,4);ctx.fill();

  // Bar zones
  const barL=20,barR=W-20,barW=barR-barL;
  // Background zone (red)
  ctx.fillStyle='rgba(220,74,74,.3)';
  ctx.fillRect(barL,barY+2,barW*.6,12);
  // Subject zone (green)
  ctx.fillStyle='rgba(74,220,106,.35)';
  ctx.fillRect(barL+barW*.2,barY+2,barW*.25,12);
  // Foreground zone (red)
  ctx.fillStyle='rgba(220,74,74,.2)';
  ctx.fillRect(barL+barW*.8,barY+2,barW*.2,12);

  ctx.font='8.5px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillStyle='rgba(220,74,74,.9)';ctx.fillText('BG BLUR',barL+barW*.12,barY+22);
  ctx.fillStyle='rgba(74,220,106,.9)';ctx.fillText('SUBJECT',barL+barW*.325,barY+22);
  ctx.fillStyle='rgba(220,74,74,.7)';ctx.fillText('FG',barL+barW*.9,barY+22);

  // Lens info
  ctx.fillStyle='rgba(0,0,0,.6)';
  ctx.beginPath();ctx.roundRect(10,8,190,42,5);ctx.fill();
  ctx.font='bold 10.5px JetBrains Mono,monospace';ctx.fillStyle='#d4923a';ctx.textAlign='left';
  ctx.fillText(APL[+document.getElementById('d-ap').value]+' · '+document.getElementById('d-fl').value+'mm',18,24);
  ctx.font='8.5px JetBrains Mono,monospace';ctx.fillStyle='#6a6468';
  ctx.fillText('Dist: '+document.getElementById('d-dist').value+'m · '+document.getElementById('d-sensor').selectedOptions[0].text.split(' ')[0],18,38);
}

// ── VIEWFINDER PREVIEW ──
function renderVF(bgBlur,fgBlur,subjBlur,splitPct){
  const wrap=document.getElementById('vf-wrap');
  const canvas=document.getElementById('vf-c');
  const W=wrap.clientWidth||400;
  canvas.width=W; canvas.height=W*0.5;
  const H=canvas.height;
  const ctx=canvas.getContext('2d');

  // Draw scaled version of same compositing
  const bgB=applyBlurCanvas(makeImgCanvas(W,H),bgBlur*.7);
  ctx.drawImage(bgB,0,0);

  const subjC=makeImgCanvas(W,H);
  const sBlurred=applyBlurCanvas(subjC,subjBlur*.7);
  const m=makeOff(W,H);const mCtx=m.getContext('2d');
  mCtx.drawImage(sBlurred,0,0);
  const g=mCtx.createLinearGradient(0,H*splitPct*0.85,0,H*splitPct*1.1);
  g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');
  mCtx.globalCompositeOperation='destination-in';mCtx.fillStyle=g;mCtx.fillRect(0,0,W,H);
  ctx.drawImage(m,0,0);

  // Vignette
  const vig=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.72);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.65)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

  // AF crosshair
  const isSharp=subjBlur<2;
  const fc=isSharp?'rgba(74,220,106,.85)':'rgba(220,74,74,.8)';
  ctx.strokeStyle=fc;ctx.lineWidth=1.5;
  const cx=W*.5,cy=H*.38,as=20;
  ctx.beginPath();
  ctx.moveTo(cx-as,cy);ctx.lineTo(cx-as*.35,cy);
  ctx.moveTo(cx+as*.35,cy);ctx.lineTo(cx+as,cy);
  ctx.moveTo(cx,cy-as);ctx.lineTo(cx,cy-as*.35);
  ctx.moveTo(cx,cy+as*.35);ctx.lineTo(cx,cy+as);
  ctx.stroke();

  // Bottom info bar
  ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,H-18,W,18);
  ctx.font='7.5px JetBrains Mono,monospace';
  ctx.fillStyle='#d4923a';ctx.textAlign='left';ctx.fillText(APL[+document.getElementById('d-ap').value],6,H-6);
  ctx.fillStyle='#6a6468';ctx.textAlign='center';ctx.fillText(document.getElementById('d-fl').value+'mm',W/2,H-6);
  ctx.fillStyle=isSharp?'#4adc6a':'#dc4a4a';ctx.textAlign='right';ctx.fillText(isSharp?'● AF LOCK':'● HUNTING',W-6,H-6);
}

function makeImgCanvas(W,H){
  const c=makeOff(W,H);
  drawImageFit(c.getContext('2d'),SRC,W,H);
  return c;
}

// ═══════════════════════════════════════════
// EXPOSURE TAB
// ═══════════════════════════════════════════
function calcEV(ss,ap,iso){return Math.log2((ap*ap)/ss)-Math.log2(iso/100)}

function renderExp(){
  if(!imgReady) return;
  const si=+document.getElementById('e-ss').value;
  const ai=+document.getElementById('e-ap').value;
  const ii=+document.getElementById('e-iso').value;
  const wb=+document.getElementById('e-wb').value;
  const ss=SSV[si],ap=APS[ai],iso=ISO[ii];

  document.getElementById('lbl-ss').textContent=SSL[si]+' s';
  document.getElementById('lbl-eap').textContent=APL[ai];
  document.getElementById('lbl-iso').textContent='ISO '+iso;
  document.getElementById('lbl-wb').textContent=wb<-2?'Cool':wb<0?'Slightly cool':wb===0?'Neutral':wb<3?'Warm':'Very warm';
  document.getElementById('e-ss-hud').textContent=SSL[si]+'s';
  document.getElementById('e-ap-hud').textContent=APL[ai];
  document.getElementById('e-iso-hud').textContent='ISO '+iso;
  const ev=calcEV(ss,ap,iso);
  document.getElementById('e-ev-hud').textContent='EV '+ev.toFixed(1);

  const needle=Math.max(2,Math.min(98,((ev-4)/14)*100));
  document.getElementById('e-needle').style.left=needle+'%';

  drawExpCanvas(ss,ap,iso,ev,wb);
  drawExpTriangle(ss,ap,iso);
  buildEquivTable(ss,ap,iso,ev);
}

function drawExpCanvas(ss,ap,iso,ev,wb){
  const wrap=document.getElementById('exp-c').parentElement;
  const canvas=document.getElementById('exp-c');
  const W=wrap.clientWidth||600;
  canvas.width=W; canvas.height=W*0.667;
  const H=canvas.height;
  const ctx=canvas.getContext('2d');

  // Draw base image
  drawImageFit(ctx,SRC,W,H);

  // ── WHITE BALANCE TINT ──
  if(wb!==0){
    if(wb>0){
      ctx.fillStyle=`rgba(255,${Math.round(200-wb*8)},0,${Math.abs(wb)*0.04})`;
    } else {
      ctx.fillStyle=`rgba(0,${Math.round(100+wb*5)},255,${Math.abs(wb)*0.04})`;
    }
    ctx.globalCompositeOperation='multiply';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }

  // ── EXPOSURE BRIGHTNESS ──
  const neutral=11;
  const diff=ev-neutral;
  if(diff<-0.5){
    // Underexposed: darken
    const d=Math.min(0.9,Math.abs(diff+0.5)*0.14);
    ctx.fillStyle=`rgba(0,0,0,${d})`;
    ctx.fillRect(0,0,W,H);
  } else if(diff>1){
    // Overexposed: wash out with haze
    const d=Math.min(0.85,(diff-1)*0.12);
    ctx.fillStyle=`rgba(255,252,240,${d})`;
    ctx.fillRect(0,0,W,H);
    // Highlight clipping: blow out brightest areas
    if(diff>3){
      ctx.fillStyle=`rgba(255,255,255,${(diff-3)*0.1})`;
      ctx.fillRect(0,0,W,H*.4);
    }
  }

  // ── MOTION BLUR (slow shutter) ──
  if(ss>=1/60 && ss<=2){
    const strength=Math.min(1,ss*3);
    // Horizontal motion streaks
    const blurred=applyBlurCanvas(makeImgCanvas(W,H), Math.round(strength*20));
    ctx.globalAlpha=strength*0.55;
    ctx.drawImage(blurred,-Math.round(strength*12),0);
    ctx.drawImage(blurred,Math.round(strength*12),0);
    ctx.globalAlpha=1;
  }
  if(ss>2){
    // Long exposure: ghost trails
    ctx.fillStyle=`rgba(0,0,0,${Math.min(.5,(ss-2)*0.08)})`;
    ctx.fillRect(0,0,W,H);
    const blurred2=applyBlurCanvas(makeImgCanvas(W,H),30);
    ctx.globalAlpha=.3;ctx.drawImage(blurred2,0,0);ctx.globalAlpha=1;
  }

  // ── ISO GRAIN NOISE ──
  if(iso>=800){
    const grain=ctx.createImageData(W,H);
    const d=grain.data;
    const n=Math.min(1,(Math.log2(iso)-9)*0.28);
    for(let i=0;i<d.length;i+=4){
      const g=(Math.random()-.5)*n*90;
      d[i]=Math.max(0,g);d[i+1]=Math.max(0,g);d[i+2]=Math.max(0,g);
      d[i+3]=Math.min(255,Math.abs(g)*2.5);
    }
    ctx.putImageData(grain,0,0);
  }

  // ── BOKEH BLUR (wide aperture) ──
  if(ap<=2){
    const bkAmt=Math.round((2/ap)*10);
    // Blur only background (top half roughly)
    const bgLayer=makeImgCanvas(W,H);
    const bkBlurred=applyBlurCanvas(bgLayer,bkAmt);
    // Blend: show blurred bg through gradient mask
    const msk=makeOff(W,H);const mCtx=msk.getContext('2d');
    mCtx.drawImage(bkBlurred,0,0);
    // Reveal at bottom (bg behind person)
    const grd=mCtx.createLinearGradient(0,H*.52,0,H*.72);
    grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,'rgba(0,0,0,0.75)');
    mCtx.globalCompositeOperation='destination-in';
    mCtx.fillStyle=grd;mCtx.fillRect(0,0,W,H);
    ctx.drawImage(msk,0,0);

    // Bokeh orbs (light circles in background)
    const orbs=[[W*.15,H*.15],[W*.85,H*.12],[W*.08,H*.4],[W*.92,H*.35],[W*.7,H*.08],[W*.3,H*.06]];
    orbs.forEach(([ox,oy])=>{
      const r=8+(2/ap)*18;
      const og=ctx.createRadialGradient(ox,oy,0,ox,oy,r);
      og.addColorStop(0,`rgba(255,230,160,${(2/ap)*0.35})`);
      og.addColorStop(.7,`rgba(200,180,120,${(2/ap)*0.15})`);
      og.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.fillStyle=og;ctx.fill();
    });
  }

  // ── CAMERA HUD ──
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.roundRect(10,10,200,48,5);ctx.fill();
  ctx.font='bold 11px JetBrains Mono,monospace';ctx.fillStyle='#d4923a';ctx.textAlign='left';
  ctx.fillText(SSL[si]+'s · '+APL[ai]+' · ISO '+ISO[ii],17,26);
  ctx.font='8.5px JetBrains Mono,monospace';ctx.fillStyle='#6a6468';
  ctx.fillText('EV '+ev.toFixed(1)+'  '+
    (diff<-2?'⚠ UNDEREXPOSED':diff>2?'⚠ OVEREXPOSED':'✓ BALANCED'),17,40);
  // Metering rect
  ctx.strokeStyle=diff<-2?'#dc4a4a':diff>2?'#f5b85a':'#4adc6a';ctx.lineWidth=2;
  ctx.strokeRect(W*.28,H*.06,W*.44,H*.78);
}

// ── EXPOSURE TRIANGLE ──
function drawExpTriangle(ss,ap,iso){
  const c=document.getElementById('exp-tri');
  const W=c.width,H=c.height,ctx=c.getContext('2d'),cx=W/2,cy=H/2,r=72;
  ctx.clearRect(0,0,W,H);
  ctx.beginPath();ctx.arc(cx,cy,r+10,0,Math.PI*2);
  ctx.strokeStyle='#252530';ctx.lineWidth=1;ctx.stroke();
  const corners=[
    {label:'ISO',val:iso,min:100,max:409600,angle:-Math.PI/2},
    {label:'Shutter',val:1/ss,min:1/30,max:8000,angle:-Math.PI/2+Math.PI*2/3},
    {label:'Aperture',val:ap,min:1,max:16,angle:-Math.PI/2+Math.PI*4/3},
  ];
  const pts=corners.map(({val,min,max,angle})=>{
    const n=(Math.log(val)-Math.log(min))/(Math.log(max)-Math.log(min));
    return{x:cx+Math.cos(angle)*(r*.2+n*r*.8),y:cy+Math.sin(angle)*(r*.2+n*r*.8),angle};
  });
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.closePath();
  ctx.fillStyle='rgba(212,146,58,.09)';ctx.fill();
  ctx.strokeStyle='#d4923a';ctx.lineWidth=1.5;ctx.stroke();
  pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='#d4923a';ctx.fill();});
  corners.forEach(({label,angle})=>{
    const lx=cx+Math.cos(angle)*(r+20),ly=cy+Math.sin(angle)*(r+20)+4;
    ctx.font='bold 9px JetBrains Mono,monospace';ctx.fillStyle='#6a6468';ctx.textAlign='center';ctx.fillText(label,lx,ly);
  });
}

function buildEquivTable(bSS,bAP,bISO,bEV){
  const tbody=document.querySelector('#eq-tbl tbody');tbody.innerHTML='';
  const combos=[];
  for(let si=0;si<SSV.length;si++)
    for(let ii=0;ii<ISO.length;ii+=2)
      for(let ai=0;ai<APS.length;ai++)
        if(Math.abs(calcEV(SSV[si],APS[ai],ISO[ii])-bEV)<.22)
          combos.push({si,ai,ii});
  combos.filter((_,i)=>i%Math.max(1,Math.floor(combos.length/8))===0).slice(0,8).forEach(({si,ai,ii})=>{
    const ss=SSV[si],ap=APS[ai],iso=ISO[ii];
    const isBase=Math.abs(ss-bSS)<.001&&ap===bAP&&iso===bISO;
    const tr=document.createElement('tr');if(isBase)tr.className='hl';
    let ef=ss<1/500?'<span class="tag tg">Freeze</span>':ss>1/60?'<span class="tag ty">Blur risk</span>':'<span class="tag tg">Natural</span>';
    if(iso>=3200)ef+=' <span class="tag tr">Noisy</span>';
    if(ap<=2)ef+=' <span class="tag tg">Bokeh</span>';
    if(ap>=11)ef+=' <span class="tag ty">Diffract.</span>';
    tr.innerHTML=`<td>${SSL[si]}s</td><td>${APL[ai]}</td><td>${iso}</td><td>${ef}</td>`;
    tbody.appendChild(tr);
  });
}

// ═══════════════════════════════════════════
// FOCAL LENGTH TAB
// ═══════════════════════════════════════════
function renderFL(){
  if(!imgReady) return;
  const fl=+document.getElementById('fl-sl').value;
  const crop=+document.getElementById('fl-crop').value;
  const comp=+document.getElementById('fl-comp').value/100;
  document.getElementById('lbl-fl2').textContent=fl+' mm';
  const equiv=fl*crop;
  const hfov=2*Math.atan(36/(2*equiv))*(180/Math.PI);
  const vfov=2*Math.atan(24/(2*equiv))*(180/Math.PI);
  document.getElementById('fl-hfov').textContent=hfov.toFixed(1)+'°';
  document.getElementById('fl-vfov').textContent=vfov.toFixed(1)+'°';
  document.getElementById('fl-eq').textContent=equiv.toFixed(0)+'mm';

  const cat=fl<=24?'Ultra-wide':fl<=35?'Wide':fl<=70?'Normal':fl<=135?'Portrait tele':fl<=300?'Telephoto':'Super-tele';
  document.getElementById('lbl-comp').textContent=cat;

  drawFLCanvas(fl,equiv,hfov,comp);
  drawFLTop(fl,equiv,hfov,crop);
}

function drawFLCanvas(fl,equiv,hfov,comp){
  const wrap=document.getElementById('fl-c').parentElement;
  const canvas=document.getElementById('fl-c');
  const W=wrap.clientWidth||600;
  canvas.width=W; canvas.height=W*0.7;
  const H=canvas.height;
  const ctx=canvas.getContext('2d');

  // Focal length changes the CROP/ZOOM of the image
  // Reference: 50mm FF = "normal". Wider = more of image, tele = zoomed in crop
  const refFL=50; // "normal" at this zoom we show full image
  const zoomFactor=equiv/refFL; // >1 = telephoto (crop), <1 = wide (letterbox/pillarbox)

  // We zoom into the image
  const srcW=SRC.naturalWidth, srcH=SRC.naturalHeight;
  const imgAR=srcW/srcH, canvasAR=W/H;

  // Base draw: fit image to canvas
  let baseW,baseH,baseX,baseY;
  if(imgAR>canvasAR){baseH=H;baseW=H*imgAR;baseX=(W-baseW)/2;baseY=0;}
  else{baseW=W;baseH=W/imgAR;baseX=0;baseY=(H-baseH)/2;}

  // Apply zoom (simulate crop factor / focal length)
  const zoom=Math.max(0.5,Math.min(3.5,zoomFactor));
  const scaledW=baseW/zoom, scaledH=baseH/zoom;
  const scaledX=(W-scaledW)/2, scaledY=(H-scaledH)/2;

  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  // For wide lenses, show more scene (pillarbox padding is black background)
  if(zoom<1){
    ctx.fillStyle='#0d0d10';ctx.fillRect(0,0,W,H);
  }

  // Draw the zoomed image
  ctx.drawImage(SRC,
    srcW*(1-1/zoom)/2, srcH*(1-1/zoom)/2,
    srcW/zoom, srcH/zoom,
    scaledX, scaledY, scaledW, scaledH
  );

  // ── Perspective compression effect for telephoto ──
  if(fl>100&&comp>0){
    // Desaturate bg slightly and add haze (compression look)
    const haze=Math.min(.4,(fl-100)/800)*comp;
    ctx.fillStyle=`rgba(140,160,180,${haze})`;
    ctx.fillRect(0,0,W,H*.55);
  }

  // ── Wide angle distortion hint ──
  if(fl<24){
    const barrel=Math.round(Math.max(0,(24-fl)/6)*comp*8);
    if(barrel>0){
      const blurred=applyBlurCanvas(makeOff(W,H),2);
      const bCtx=blurred.getContext('2d');
      bCtx.drawImage(SRC,scaledX,scaledY,scaledW,scaledH);
      // Subtle corner darkening for wide angle feel
      const corners=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.8);
      corners.addColorStop(0,'rgba(0,0,0,0)');
      corners.addColorStop(1,`rgba(0,0,0,${Math.min(.5,barrel*.04)})`);
      ctx.fillStyle=corners;ctx.fillRect(0,0,W,H);
    }
  }

  // ── OVERLAY: info ──
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.roundRect(10,10,210,48,5);ctx.fill();
  ctx.font='bold 11px JetBrains Mono,monospace';ctx.fillStyle='#d4923a';ctx.textAlign='left';
  ctx.fillText(fl+'mm ('+equiv.toFixed(0)+'mm FF equiv)',17,26);
  ctx.font='8.5px JetBrains Mono,monospace';ctx.fillStyle='#6a6468';
  ctx.fillText('HFoV: '+hfov.toFixed(1)+'°  ·  '+
    (fl<=24?'Ultra-wide':fl<=35?'Wide':fl<=70?'Normal':fl<=135?'Portrait':fl<=300?'Telephoto':'Super-tele'),17,40);

  // FoV arc indicator
  ctx.strokeStyle='rgba(212,146,58,.4)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(scaledX,H/2);ctx.lineTo(scaledX+10,H/2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(scaledX+scaledW-10,H/2);ctx.lineTo(scaledX+scaledW,H/2);ctx.stroke();
  ctx.setLineDash([]);
}

function drawFLTop(fl,equiv,hfov,crop){
  const c=document.getElementById('fl-top');
  const W=c.width=c.offsetWidth||560;
  const H=160; c.height=H;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0d0d10';ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='#1a1a22';ctx.lineWidth=1;
  for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const camX=W*.1,camY=H-20;
  const half=(hfov/2)*Math.PI/180;
  const coneL=H-38;

  // FoV fill
  const cg=ctx.createLinearGradient(camX,camY,camX,camY-coneL);
  cg.addColorStop(0,'rgba(212,146,58,.2)');cg.addColorStop(1,'rgba(212,146,58,.02)');
  ctx.beginPath();ctx.moveTo(camX,camY);
  ctx.lineTo(camX-Math.tan(half)*coneL,camY-coneL);
  ctx.lineTo(camX+Math.tan(half)*coneL,camY-coneL);
  ctx.closePath();ctx.fillStyle=cg;ctx.fill();

  // Cone edges
  ctx.strokeStyle='rgba(212,146,58,.6)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);
  ctx.beginPath();
  ctx.moveTo(camX,camY);ctx.lineTo(camX-Math.tan(half)*coneL,camY-coneL);
  ctx.moveTo(camX,camY);ctx.lineTo(camX+Math.tan(half)*coneL,camY-coneL);
  ctx.stroke();ctx.setLineDash([]);

  // Camera
  ctx.fillStyle='#1e1e28';ctx.beginPath();ctx.roundRect(camX-9,camY-12,18,14,2);ctx.fill();
  ctx.strokeStyle='#d4923a';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(camX+3,camY-5,4,0,Math.PI*2);ctx.fillStyle='#4a9adc';ctx.fill();

  // Subject marker (person in image)
  const subjX=camX+Math.tan((hfov/2)*Math.PI/180)*coneL*.6;
  ctx.strokeStyle='rgba(74,220,106,.7)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(camX,camY-coneL*.6);ctx.lineTo(camX-Math.tan(half)*coneL*.6,camY-coneL*.6);
  ctx.moveTo(camX,camY-coneL*.6);ctx.lineTo(camX+Math.tan(half)*coneL*.6,camY-coneL*.6);
  ctx.stroke();ctx.setLineDash([]);

  // Angle label
  ctx.font='bold 12px JetBrains Mono,monospace';ctx.fillStyle='#d4923a';ctx.textAlign='center';
  ctx.fillText(hfov.toFixed(0)+'°',camX,camY+14);

  // Comparison FLs on right
  const refs=[24,50,85,135,200];
  const slotW=(W*.85)/refs.length;
  refs.forEach((rfl,i)=>{
    const rx=W*.16+i*slotW+slotW/2;
    const rhfov=2*Math.atan(36*crop/(2*rfl))*(180/Math.PI);
    const isActive=Math.abs(rfl-fl)<15;
    const rh=(rhfov/2)*Math.PI/180;
    const rcl=H*.55;
    ctx.strokeStyle=isActive?'rgba(212,146,58,.8)':'rgba(80,80,100,.35)';
    ctx.lineWidth=isActive?1.5:1;
    ctx.setLineDash(isActive?[]:[3,3]);
    ctx.beginPath();
    ctx.moveTo(rx,H-16);ctx.lineTo(rx-Math.tan(rh)*rcl,H-16-rcl);
    ctx.moveTo(rx,H-16);ctx.lineTo(rx+Math.tan(rh)*rcl,H-16-rcl);
    ctx.stroke();ctx.setLineDash([]);
    ctx.font=(isActive?'bold ':'')+' 8px JetBrains Mono,monospace';
    ctx.fillStyle=isActive?'#d4923a':'#404060';ctx.textAlign='center';
    ctx.fillText(rfl+'mm',rx,H-4);
    ctx.fillStyle=isActive?'#f5b85a':'#303050';
    ctx.fillText(rhfov.toFixed(0)+'°',rx,H-16-rcl-4);
  });
}

// ═══════════════════════════════════════════
// SENSOR LIST
// ═══════════════════════════════════════════
function buildSensorList(){
  const sensors=[
    {n:'Medium Format',w:53.7,h:40.2,c:.79,col:'#d4923a'},
    {n:'Full Frame 35mm',w:36,h:24,c:1.0,col:'#f5b85a'},
    {n:'APS-C Nikon',w:23.6,h:15.8,c:1.5,col:'#4ab8a0'},
    {n:'APS-C Canon',w:22.3,h:14.9,c:1.6,col:'#4adc6a'},
    {n:'Micro 4/3',w:17.3,h:13,c:2.0,col:'#4a8adc'},
    {n:'1-inch',w:13.2,h:8.8,c:2.7,col:'#a058a0'},
  ];
  const el=document.getElementById('sl-list');
  sensors.forEach(s=>{
    const sw=Math.round(s.w/53.7*48),sh=Math.round(s.h/53.7*48);
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:9px;padding:7px 9px;background:var(--p);border-radius:6px;border:1px solid transparent;cursor:pointer;transition:.18s';
    d.innerHTML=`<div style="width:${sw}px;height:${sh}px;border:1.5px solid ${s.col};border-radius:2px;flex-shrink:0;background:rgba(0,0,0,.3)"></div><div style="flex:1;font-size:.73rem">${s.n}<br><span style="font-size:.6rem;color:var(--m)">${s.w}×${s.h}mm</span></div><div style="font-family:'JetBrains Mono',monospace;font-size:.68rem;color:${s.col}">×${s.c}</div>`;
    d.onmouseover=()=>d.style.borderColor=s.col;d.onmouseout=()=>d.style.borderColor='transparent';
    el.appendChild(d);
  });
}

// ═══════════════════════════════════════════
// RESIZE & INIT
// ═══════════════════════════════════════════
function resizeAll(){
  ['dof-c','vf-c','exp-c','fl-c'].forEach(id=>{
    const c=document.getElementById(id);
    if(c){c.width=c.parentElement.clientWidth||600;}
  });
  if(imgReady){renderDof();renderExp();renderFL();}
}

window.addEventListener('load',()=>{
  buildSensorList();
  calcAndRender();
  renderExp();
  renderFL();
});
window.addEventListener('resize',resizeAll);
