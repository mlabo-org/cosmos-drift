# Writes hooks/scene.ts (the Milky Way backdrop). Usage: python3 tools/make_cosmos.py [preview.svg]
import random, math, json, sys
random.seed(11)
W,H=1600,1000; cx,cy=800,500; ang=math.radians(-28)
def band_point(spread):
    t=random.uniform(-1050,1050); o=random.gauss(0,spread)
    return cx+t*math.cos(ang)-o*math.sin(ang), cy+t*math.sin(ang)+o*math.cos(ang)
band=[]
for k in range(1300):
    x,y=band_point(45 if k%3 else 110); r=random.choice([.35,.45,.55,.65,.8,1.0])
    c=random.choice(['#ffffff','#e6e9ff','#fff3dc','#dfe8ff'])
    band.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{c}" opacity="{random.uniform(.35,.95):.2f}"/>')
field=[]
for i in range(170):
    x,y=random.uniform(0,W),random.uniform(0,H); r=random.choice([.6,.8,1.0,1.3,1.7])
    c=random.choice(['#ffffff','#cfd8ff','#ffe9c7','#ffffff'])
    cls=' class="tw"' if i%3==0 else ''
    st=f' style="animation-duration:{random.uniform(2.5,7):.1f}s;animation-delay:-{random.uniform(0,7):.1f}s"' if cls else ''
    field.append(f'<circle{cls} cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{c}"{st}/>')
# a few bright stars with a soft glow
bright="".join(f'<circle class="tw" cx="{x}" cy="{y}" r="2.2" fill="#fff" filter="url(#glow)" style="animation-duration:{d}s"/>' for x,y,d in [(230,180,5.5),(1380,760,6.5),(1210,140,4.8),(380,820,7.2)])
# shooting stars: rare, each visible for ~3% of a long cycle
ss=[]
for x,y,rot,dur,delay in [(1150,120,152,19,-3),(420,90,28,27,-14),(1450,380,160,37,-25)]:
    ss.append(f'<g transform="translate({x} {y}) rotate({rot})"><g class="ss" style="animation-duration:{dur}s;animation-delay:{delay}s">'
              f'<path d="M0 0 L-190 -1.6 L-190 1.6Z" fill="url(#tail)"/><circle r="1.8" fill="#fff" filter="url(#glow)"/></g></g>')
deg=math.degrees(ang)
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03040b"/><stop offset=".5" stop-color="#080b1d"/><stop offset="1" stop-color="#05060f"/></linearGradient>
<linearGradient id="tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb4ff" stop-opacity="0"/></linearGradient>
<filter id="haze" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="38"/></filter>
<filter id="haze2" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>
.tw{{animation-name:tw;animation-timing-function:ease-in-out;animation-iteration-count:infinite}}
@keyframes tw{{0%,100%{{opacity:.95}}50%{{opacity:.25}}}}
.core{{animation:breathe 22s ease-in-out infinite}}
@keyframes breathe{{0%,100%{{opacity:.75}}50%{{opacity:1}}}}
.ss{{opacity:0;animation-name:shoot;animation-timing-function:ease-out;animation-iteration-count:infinite}}
@keyframes shoot{{0%{{transform:translateX(0);opacity:0}}0.6%{{opacity:1}}3.2%{{transform:translateX(520px);opacity:0}}100%{{transform:translateX(520px);opacity:0}}}}
@media (prefers-reduced-motion: reduce){{*{{animation:none!important}}.ss{{display:none}}}}
</style>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<g transform="rotate({deg:.1f} {cx} {cy})">
<g class="core">
<ellipse cx="{cx}" cy="{cy}" rx="1100" ry="150" fill="#2a3170" opacity=".55" filter="url(#haze)"/>
<ellipse cx="{cx}" cy="{cy}" rx="900" ry="85" fill="#5b4f8c" opacity=".5" filter="url(#haze)"/>
<ellipse cx="{cx+120}" cy="{cy}" rx="420" ry="55" fill="#d9c79c" opacity=".38" filter="url(#haze)"/>
<ellipse cx="{cx-380}" cy="{cy+10}" rx="260" ry="40" fill="#b9a6e0" opacity=".3" filter="url(#haze)"/>
</g>
<path d="M{cx-900} {cy+6} C{cx-500} {cy-30} {cx-250} {cy+40} {cx} {cy+4} S{cx+500} {cy-36} {cx+900} {cy+10}" stroke="#05060f" stroke-width="26" fill="none" opacity=".75" filter="url(#haze2)"/>
</g>
{"".join(band)}
{"".join(field)}
{bright}
{"".join(ss)}
</svg>'''
import os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
open(os.path.join(root,"hooks","scene.ts"),"w").write("// Milky Way scene; stars seeded with random.seed(11) in tools/make_cosmos.py.\nexport const SCENE = "+json.dumps(svg)+"\n")
if len(sys.argv)>1: open(sys.argv[1],"w").write(svg)  # optional preview .svg path
print(len(svg))
