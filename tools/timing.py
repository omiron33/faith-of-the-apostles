"""Build data/lyrics.json: CTC forced alignment of the sung lyrics (intake/words-ctc.json), with
the stretch from "still marks the way" to the second "FILL-EE-OH-KWAY" taken from local Whisper
(intake/whisper.json), where the CTC alignment drifted by up to five seconds against the vocal.
Words keep the official spelling; each line takes the start of its first word and the end of its
last. Beats come from data/audio.json."""
import json
C = json.load(open('intake/words-ctc.json'))['words']
Wh = json.load(open('intake/whisper.json'))['words']
A = json.load(open('data/audio.json'))
lines = [l.strip() for l in open('intake/sung-lyrics.txt') if l.strip()]
toks = [(i, t) for i, l in enumerate(lines) for t in l.split()]
assert len(toks) == len(C), (len(toks), len(C))
words = [{'w': t, 'start': c['start'], 'end': c['end'], 'line': i} for (i, t), c in zip(toks, C)]

# the drifted stretch: official lines "still marks the way." .. second "FILL-EE-OH-KWAY."
li0 = lines.index('still marks the way.')
li1 = max(i for i, l in enumerate(lines) if l == 'FILL-EE-OH-KWAY.')
seg = [w for w in words if li0 <= w['line'] <= li1]
wh = [w for w in Wh if 147.0 < w["start"] < 167.0]
j = 0
for w in seg:
    if w['w'].startswith('FILL'):
        span = wh[j:j + 3]; j += 3          # Whisper hears it as three words
        w['start'], w['end'] = span[0]['start'], max(span[-1]['end'], span[0]['start'] + 1.2)
    else:
        w['start'], w['end'] = wh[j]['start'], wh[j]['end']; j += 1
# the last held word rings into the outro; cap it
words[-1]['end'] = min(words[-1]['end'], words[-1]['start'] + 4.0)
# words never overlap the next word, and have at least 60 ms
for a, b in zip(words, words[1:]):
    a['end'] = min(a['end'], b['start'])
    if a['end'] - a['start'] < 0.06: a['end'] = min(b['start'], a['start'] + 0.06)
out_lines = []
for i, l in enumerate(lines):
    ws = [w for w in words if w['line'] == i]
    out_lines.append({'text': l, 'start': round(ws[0]['start'], 3), 'end': round(ws[-1]['end'], 3)})
beats = [b['time'] for b in A['beats']]
json.dump({'source': 'force-aligned to the recording (local torchaudio CTC, Whisper where CTC drifted); machine estimates',
           'duration': A['duration'], 'bpm': A['bpm'], 'beats': beats,
           'lines': out_lines, 'words': [{'w': w['w'], 'start': round(w['start'], 3), 'end': round(w['end'], 3)} for w in words]},
          open('data/lyrics.json', 'w'), indent=0)
for l in out_lines: print(f"{l['start']:7.2f} {l['end']:7.2f}  {l['text']}")
