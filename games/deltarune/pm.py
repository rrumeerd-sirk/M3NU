# Usage: python patch_music.py final-3.html
# Applies the overworld-music edits to your file and writes final-3.music.html (original is not touched).
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "final-3.html"
out = src.rsplit(".", 1)[0] + ".music.html"
with open(src, encoding="utf-8", newline="") as f:
    s = f.read()

CSS = """
#muteBtn{position:fixed;top:calc(max(8px,env(safe-area-inset-top)) + 40px);left:max(8px,env(safe-area-inset-left));z-index:6;font:inherit;color:#fff;background:rgba(0,0,0,.55);border:2px solid #777;padding:4px 10px;opacity:.75;cursor:pointer;touch-action:manipulation}
#muteBtn:hover{border-color:#ff0}
#owStart{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;z-index:20}
#owStart button{font:inherit;font-size:28px;color:#fff;background:#222;border:3px solid #fff;padding:10px 32px;cursor:pointer}
#owStart button:hover{border-color:#ff0;color:#ff0}"""

HTML = """
<button id="muteBtn" type="button">mute</button>
<div id="owStart"><button type="button">play</button></div>"""

JS = """
// =====================
// overworld muziek (muziek/5.mp3), play knop en mute knop
// =====================
const owStartEl = document.getElementById("owStart"), muteBtn = document.getElementById("muteBtn");
let ow = null, owSrc = "", owStarted = false, muted = false;
// speelt in de ow en de editor, pauze (blijft staan waar hij was) tijdens battle of als er ander lied speelt
function owSync() {
  if (!owStarted) return;
  const src = tracks[4].url || tracks[4].def;
  if (!ow) { ow = new Audio(); ow.loop = true; }
  if (owSrc !== src) { owSrc = src; ow.src = src; }
  ow.volume = musicVol; ow.muted = muted;
  if ((mode === "world" || mode === "edit") && !curAudio) ow.play().catch(() => {});
  else ow.pause();
}
owStartEl.querySelector("button").onclick = () => { owStarted = true; owStartEl.style.display = "none"; owSync(); };
muteBtn.onclick = () => {
  muted = !muted; muteBtn.textContent = muted ? "unmute" : "mute";
  if (ow) ow.muted = muted;
  if (curAudio) curAudio.muted = muted;
  muteBtn.blur();
};"""

A = 'musBtn.onclick = () => { toggleMusic(); musBtn.blur(); };'
EDITS = [
    ("#musBtn:hover{border-color:#ff0}", "#musBtn:hover{border-color:#ff0}" + CSS),
    ('<button id="musBtn" type="button">buster</button>', '<button id="musBtn" type="button">buster</button>' + HTML),
    ('if (mode === "world") { mode = "trans"; tr = 0; dlg = null; }',
     'if (mode === "world") { mode = "trans"; tr = 0; dlg = null; owSync(); }'),
    ('curTrack = 0; if (musicOpen) renderMusic(); }',
     'curTrack = 0; owSync(); if (musicOpen) renderMusic(); }'),
    ('a.loop = true; a.volume = musicVol;', 'a.loop = true; a.volume = musicVol; a.muted = muted;'),
    ('curAudio = a; curTrack = n; if (musicOpen) renderMusic();', 'curAudio = a; curTrack = n; owSync(); if (musicOpen) renderMusic();'),
    ('if (curAudio) curAudio.volume = musicVol; try {', 'if (curAudio) curAudio.volume = musicVol; if (ow) ow.volume = musicVol; try {'),
    (A, A + JS),
]
for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit("STOP: expected 1 match, found %d for: %s" % (n, old[:70]))
    s = s.replace(old, new)
with open(out, "w", encoding="utf-8", newline="") as f:
    f.write(s)
print("ok ->", out)
