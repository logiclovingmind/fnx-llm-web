// Shared GLSL — inlined as strings so no webpack glsl loader is needed.
// Ported 1:1 from the standalone index.html so the React build matches it.

export const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 pp0=vec3(a0.xy,h.x); vec3 pp1=vec3(a0.zw,h.y); vec3 pp2=vec3(a1.xy,h.z); vec3 pp3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(pp0,pp0),dot(pp1,pp1),dot(pp2,pp2),dot(pp3,pp3)));
  pp0*=norm.x;pp1*=norm.y;pp2*=norm.z;pp3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(pp0,x0),dot(pp1,x1),dot(pp2,x2),dot(pp3,x3)));
}
`;

/* ----------------------------- PARTICLES ----------------------------- */
export const PARTICLE_VERT = /* glsl */ `
uniform float uTime, uProg, uPix;
attribute vec3 aP0,aP1,aP2,aP3,aP4,aP5;
attribute float aSeed;
varying float vA; varying float vHot;
void main(){
  float g = uProg*5.0;                 // 0..5 across the six formations
  vec3 p = aP0;
  p = mix(p, aP1, clamp(g-0.0,0.0,1.0));
  p = mix(p, aP2, clamp(g-1.0,0.0,1.0));
  p = mix(p, aP3, clamp(g-2.0,0.0,1.0));
  p = mix(p, aP4, clamp(g-3.0,0.0,1.0));
  p = mix(p, aP5, clamp(g-4.0,0.0,1.0));
  // gentle life: drift + slow swirl. The per-particle swirl gives the early
  // chaos its organic churn, but it shears the structured late formations
  // (routing lanes, scale field, skyline) — so fade it out past the core beat.
  float calm = 1.0 - smoothstep(0.34, 0.6, uProg) * 0.92;
  // gentle, restrained life — roughly half the previous drift + swirl so the
  // field reads as calm atmosphere rather than churning noise
  p.y += sin(uTime*0.35 + aSeed*12.0) * (0.6 - uProg*0.4) * calm;
  float ang = uTime*0.014*(aSeed-0.5) * calm;
  float c=cos(ang), s=sin(ang);
  p.xz = mat2(c,-s,s,c)*p.xz;
  vHot = clamp(uProg*1.2 + (1.0 - smoothstep(0.0,40.0,length(p)))*0.5, 0.0, 1.0);
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  float size = (0.5 + aSeed*0.9);
  // cap point size: near particles otherwise blow up into large additive
  // quads that hammer fillrate (and bloom into blobs)
  gl_PointSize = min(size * uPix * (165.0/-mv.z), 7.0 * uPix);
  gl_Position = projectionMatrix*mv;
  vA = smoothstep(220.0, 20.0, -mv.z);
}
`;

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;
varying float vA; varying float vHot;
void main(){
  vec2 uv = gl_PointCoord-0.5; float d=length(uv);
  if(d>0.5) discard;
  float core = pow(smoothstep(0.5,0.0,d), 1.6);
  // tightened palette: a muted warm dusk for distant/early points biased
  // strongly toward gold, so the field reads as one coherent material
  vec3 cold = vec3(0.74,0.55,0.62);    // soft warm dusk, not a saturated violet
  vec3 warm = vec3(1.0,0.80,0.46);     // controlled gold
  vec3 col = mix(cold, warm, clamp(vHot*1.15 + 0.15, 0.0, 1.0));
  gl_FragColor = vec4(col, core*vA*(0.55+vHot*0.4));
}
`;

/* ------------------------- AI CORE — ENERGY ------------------------- */
// Living golden-plasma shell: noise displaces the surface, fresnel ignites
// the rim. Bright values push past the bloom threshold for the premium glow.
export const CORE_VERT = /* glsl */ `
uniform float uTime; varying vec3 vN; varying vec3 vView;
${SIMPLEX}
void main(){
  vN = normalize(normalMatrix*normal);
  float n = snoise(normal*1.6 + uTime*0.25);
  float n2 = snoise(normal*4.0 - uTime*0.4);
  vec3 disp = position + normal*(n*0.5 + n2*0.12);
  vec4 mv = modelViewMatrix*vec4(disp,1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}
`;

export const CORE_FRAG = /* glsl */ `
precision highp float;
varying vec3 vN; varying vec3 vView; uniform float uOpacity;
void main(){
  float fres = pow(1.0 - max(dot(vN,vView),0.0), 2.2);
  vec3 gold = vec3(0.98,0.76,0.42);
  vec3 hot  = vec3(1.0,0.93,0.78);
  vec3 col = mix(gold*0.65, gold, fres);
  col += hot * pow(fres,2.0) * 0.55;
  gl_FragColor = vec4(col, (0.5 + fres*0.5) * uOpacity);
}
`;

/* ----------------------- AI CORE — LOGO MARK ----------------------- */
// Lit-looking fresnel for the extruded brand mark. No scene lights needed:
// a forward base tone plus a rim that ignites on glancing faces, so the
// nested chevrons read as solid gold metal with glowing edges as it turns.
export const LOGO_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vView;
void main(){
  vN = normalize(normalMatrix*normal);
  vec4 mv = modelViewMatrix*vec4(position,1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}
`;

export const LOGO_FRAG = /* glsl */ `
precision highp float;
varying vec3 vN; varying vec3 vView;
uniform float uOpacity; uniform vec3 uColor; uniform float uGlow;
void main(){
  float fres = pow(1.0 - max(dot(vN, vView), 0.0), 2.2);
  // emissive brand mark: faces keep their brand colour, edges ignite hot gold.
  // tuned to sit just under bloom blowout so the violet->gold rings survive.
  vec3 rim = vec3(1.0, 0.86, 0.55);
  vec3 col = uColor * (0.85 + fres * 0.55) * uGlow;
  col += rim * pow(fres, 2.8) * 0.8 * uGlow;
  gl_FragColor = vec4(col, uOpacity);
}
`;

/* --------------------------- BACKGROUND --------------------------- */
export const BG_VERT = /* glsl */ `
varying vec3 vP;
void main(){
  vP = position;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`;

export const BG_FRAG = /* glsl */ `
precision highp float;
varying vec3 vP; uniform float uTime, uProg;
void main(){
  vec3 d = normalize(vP);
  float y = d.y*0.5+0.5;
  // deep purple -> warmer toward the journey's end
  vec3 top = mix(vec3(0.027,0.012,0.094), vec3(0.06,0.03,0.12), uProg);
  vec3 bot = mix(vec3(0.015,0.006,0.05), vec3(0.10,0.05,0.06), uProg);
  vec3 col = mix(bot, top, y);
  float glow = smoothstep(0.62,0.0,length(d.xy)) * (0.05+uProg*0.10);
  col += vec3(0.95,0.7,0.35)*glow;
  gl_FragColor = vec4(col,1.0);
}
`;
