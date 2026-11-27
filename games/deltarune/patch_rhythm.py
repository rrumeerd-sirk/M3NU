#!/usr/bin/env python3
# gebruik: python3 patch_rhythm.py deltashooter.html rhythm.html deltashooter-rhythm.html
import sys, html
esc = lambda s: html.escape(s, quote=True)
src, rhy_file, out = sys.argv[1:4]
doc = open(src, encoding="utf-8").read()
rhy = open(rhy_file, encoding="utf-8").read()

def rep(text, old, new, label):
    n = text.count(old)
    if n != 1:
        sys.exit(f"FOUT: '{label}' gevonden {n}x (verwacht 1x). Niets weggeschreven.")
    return text.replace(old, new)

# ---- 1. ritmespel: autostart + melding als hij klaar is ----
R = [
 ("state='menu',ac,", "state='idle',ac,", "rhythm state"),
 ("if(state==='menu'||state==='end'){ if(state==='end'&&performance.now()<endLock)return; start();return}",
  "if(state!=='play')return;", "rhythm press"),
 ("state='end';endLock=performance.now()+700;", "state='idle';parent.postMessage('rhythmDone','*');", "rhythm end"),
 ("frame();\n</script>",
  "addEventListener('message',e=>{if(e.data&&e.data.type==='rhythmStart'&&state!=='play'){flash=[0,0,0,0];judge.at=-9;start()}});\nframe();\n</script>",
  "rhythm listener"),
]
for o, n, l in R: rhy = rep(rhy, o, n, l)

# ---- 2. binnenste spel (gemene buster), staat HTML-escaped in srcdoc ----
I = [
 ('combo: false, shooter: true }',
  'combo: false, shooter: true },\n  { id: 6, name: "ritme buster", col: "#ff4fd8", speed: 1.0, chase: 0, chaseSpeed: 0, pats: [0], spd: 1, rate: 1, dmg: 1, time: 30, skip: 0, switch: 0, combo: false, rhythm: true }',
  "ETYPES"),
 ('ETYPES[clamp((e.type | 0) || 1, 1, 5) - 1]', 'ETYPES[clamp((e.type | 0) || 1, 1, 6) - 1]', "etype"),
 ('type: clamp((type | 0) || 1, 1, 5)', 'type: clamp((type | 0) || 1, 1, 6)', "makeEnemy"),
 ('type: clamp((e.type | 0) || 1, 1, 5), mus:', 'type: clamp((e.type | 0) || 1, 1, 6), mus:', "cleanEnemies"),
 ('sel.type = sel.type % 5 + 1;', 'sel.type = sel.type % 6 + 1;', "enemyKind"),
 ('" " + TRACK_NAMES[e.type - 1] + ")"', '" " + (TRACK_NAMES[e.type - 1] || "ritme") + ")"', "musLabel"),
 ('sel.type + "/4  muziek "', 'sel.type + "/6  muziek "', "editor hud"),
 ('const T = fighting ? etype(fighting) : ETYPES[0];',
  'const T = fighting ? etype(fighting) : ETYPES[0]; if (T.rhythm) { mode = "shooter"; owSync(); parent.postMessage({ type: "rhythm" }, "*"); return; }',
  "startBattle"),
 ('function toggle() {',
  'function sfx(n) { const a = new Audio("sounds/" + n + ".mp3"); a.volume = musicVol; a.muted = muted; a.play().catch(() => {}); }\nfunction toggle() {',
  "sfx"),
 ('mode = "trans"; tr = 0; dlg = null; owSync();', 'mode = "trans"; tr = 0; dlg = null; owSync(); sfx("battle-start");', "battle-start"),
 ('mode = "world"; ptr = null; stopMusic();', 'mode = "world"; ptr = null; stopMusic(); sfx("battle-end");', "battle-end"),
]
for o, n, l in I: doc = rep(doc, esc(o), esc(n), l)

# ---- 3. wrapper: derde iframe + schakelen ----
W = [
 ('" style="display:none"></iframe>', '" style="display:none"></iframe>\n<iframe id="g2" srcdoc="' + esc(rhy) + '" style="display:none"></iframe>', "iframe g2"),
 ("document.getElementById('g1')];", "document.getElementById('g1'),document.getElementById('g2')];", "frames"),
 ("var cur=0,arena=null,", "var cur=0,rhy=false,arena=null,", "vars"),
 ("function show(i){cur=i;fr[0].style.display=i?'none':'block';fr[1].style.display=i?'block':'none';fr[i].contentWindow.focus()}",
  "function show(i){cur=i;fr.forEach(function(f,k){f.style.display=k===i?'block':'none'});fr[i].contentWindow.focus()}", "show"),
 ("function swap(){if(arena)return;", "function swap(){if(arena||rhy)return;", "swap"),
 ("else if(e.data&&e.data.type==='arena')startArena(e.data.secs||30);",
  "else if(e.data&&e.data.type==='arena')startArena(e.data.secs||30);\n  else if(e.data&&e.data.type==='rhythm'){rhy=true;show(2);fr[2].contentWindow.postMessage({type:'rhythmStart'},'*')}\n  else if(e.data==='rhythmDone'&&rhy){rhy=false;show(1);fr[1].contentWindow.postMessage('arenaDone','*')}",
  "messages"),
]
for o, n, l in W: doc = rep(doc, o, n, l)

open(out, "w", encoding="utf-8").write(doc)
print("klaar ->", out)
