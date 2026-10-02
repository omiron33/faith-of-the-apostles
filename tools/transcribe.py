# Local Whisper transcription with word times (checks the lyric text, finds the unsupplied tail).
import json, sys, whisper
m = whisper.load_model(sys.argv[1])
r = m.transcribe(sys.argv[2], language='en', word_timestamps=True, condition_on_previous_text=False, no_speech_threshold=0.9)
out = [{'w': w['word'].strip(), 'start': round(w['start'], 3), 'end': round(w['end'], 3)} for s in r['segments'] for w in s.get('words', [])]
json.dump({'segments': [{'start': s['start'], 'end': s['end'], 'text': s['text']} for s in r['segments']], 'words': out}, open(sys.argv[3], 'w'), indent=0)
for s in r['segments']: print(round(s['start'], 1), s['text'])
