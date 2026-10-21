import os
import time
import numpy as np
import soundfile as sf
import onnxruntime as rt
from kokoro_onnx import Kokoro
from kokoro_onnx.config import SAMPLE_RATE

# Optimize ONNX runtime threads to 4 threads for fast CPU inference
_orig_inf_sess = rt.InferenceSession
def _throttled_session(model_path, **kwargs):
    opts = rt.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    kwargs['sess_options'] = opts
    return _orig_inf_sess(model_path, **kwargs)
rt.InferenceSession = _throttled_session

# Fix speed dtype compatibility with kokoro v1.0 onnx graph
_orig_create_audio = Kokoro._create_audio

def _safe_create_audio(self, phonemes, voice, speed):
    tokens = np.array(self.tokenizer.tokenize(phonemes), dtype=np.int64)
    voice = voice[len(tokens)]
    tokens = [[0, *tokens, 0]]
    speed_input = next((i for i in self.sess.get_inputs() if i.name == 'speed'), None)
    speed_dtype = np.float32 if speed_input and 'float' in speed_input.type else np.int32
    if 'input_ids' in [i.name for i in self.sess.get_inputs()]:
        inputs = {
            'input_ids': tokens,
            'style': np.array(voice, dtype=np.float32),
            'speed': np.array([speed], dtype=speed_dtype),
        }
    else:
        inputs = {
            'tokens': tokens,
            'style': voice,
            'speed': np.ones(1, dtype=np.float32) * speed,
        }
    audio = self.sess.run(None, inputs)[0]
    return audio, SAMPLE_RATE

Kokoro._create_audio = _safe_create_audio

AVAILABLE_VOICES = [
    {"id": "am_adam", "name": "Adam", "gender": "male", "accent": "American", "style": "Warm & dynamic"},
    {"id": "am_michael", "name": "Michael", "gender": "male", "accent": "American", "style": "Authoritative & clear"},
    {"id": "bm_george", "name": "George", "gender": "male", "accent": "British", "style": "Refined & articulate"},
    {"id": "bm_daniel", "name": "Daniel", "gender": "male", "accent": "British", "style": "Crisp & scholarly"},
    {"id": "af_bella", "name": "Bella", "gender": "female", "accent": "American", "style": "Expressive & conversational"},
    {"id": "af_sarah", "name": "Sarah", "gender": "female", "accent": "American", "style": "Thoughtful & measured"},
    {"id": "af_nicole", "name": "Nicole", "gender": "female", "accent": "American", "style": "Calm & steady"},
    {"id": "bf_alice", "name": "Alice", "gender": "female", "accent": "British", "style": "Engaging & witty"},
    {"id": "bf_emma", "name": "Emma", "gender": "female", "accent": "British", "style": "Curious & warm"}
]

class AudioSynthesizer:
    DEFAULT_VOICES = {
        'austin': 'am_adam',
        'taylor': 'af_bella',
        'host1': 'am_adam',
        'host2': 'af_bella'
    }

    def __init__(self, model_path: str = None, voices_path: str = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = model_path or os.path.join(base_dir, 'models', 'kokoro-v1.0.int8.onnx')
        self.voices_path = voices_path or os.path.join(base_dir, 'models', 'voices-v1.0.bin')
        self.kokoro = Kokoro(self.model_path, self.voices_path)
        self._voice_cache = {}
        for voice in AVAILABLE_VOICES:
            v_id = voice['id']
            if v_id in self.kokoro.voices:
                self._voice_cache[v_id] = self.kokoro.get_voice_style(v_id)

    def synthesize_turn(self, text: str, voice_name: str, speed: float = 1.0) -> np.ndarray:
        voice_id = self.DEFAULT_VOICES.get(voice_name.lower(), voice_name)
        voice_style = self._voice_cache.get(voice_id)
        if voice_style is None:
            voice_style = self.kokoro.get_voice_style(voice_id)
            self._voice_cache[voice_id] = voice_style
        samples, _ = self.kokoro.create(text, voice=voice_style, speed=speed)
        return samples

    def synthesize_podcast_streaming(self, turns: list[dict], output_path: str, speed: float = 1.0):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        all_audio, timed_turns = [], []
        current_time = 0.0
        pause_samples = np.zeros(int(SAMPLE_RATE * 0.35), dtype=np.float32)

        for i, turn in enumerate(turns):
            speaker = turn.get('speaker', 'host1').lower()
            name = turn.get('name', 'Host 1')
            text = turn.get('text', '').strip()
            if not text:
                continue

            voice_id = turn.get('voice') or self.DEFAULT_VOICES.get(speaker, 'am_adam')
            print(f"[Kokoro TTS] Synthesizing turn {i+1}/{len(turns)} ({speaker}): {text[:45]}...", flush=True)
            turn_audio = self.synthesize_turn(text, voice_id, speed=speed)
            duration = len(turn_audio) / SAMPLE_RATE

            timed_turn = {
                'speaker': speaker,
                'name': name,
                'text': text,
                'start_time': round(current_time, 2),
                'end_time': round(current_time + duration, 2),
                'duration': round(duration, 2)
            }
            timed_turns.append(timed_turn)
            all_audio.extend([turn_audio, pause_samples])
            current_time += duration + 0.35

            yield {
                'step': 'turn_done',
                'turn_index': i,
                'total_turns': len(turns),
                'turn': timed_turn
            }

        final_audio = np.concatenate(all_audio) if all_audio else np.zeros(SAMPLE_RATE, dtype=np.float32)
        sf.write(output_path, final_audio, SAMPLE_RATE)
        total_duration = len(final_audio) / SAMPLE_RATE
        print(f"[Kokoro TTS] Finished synthesizing {len(turns)} turns. Total audio: {round(total_duration, 2)}s written to {output_path}", flush=True)

        yield {
            'step': 'complete',
            'duration': round(total_duration, 2),
            'sample_rate': SAMPLE_RATE,
            'turns': timed_turns
        }

    def synthesize_podcast(self, turns: list[dict], output_path: str, speed: float = 1.0) -> dict:
        result = None
        for event in self.synthesize_podcast_streaming(turns, output_path, speed=speed):
            if event['step'] == 'complete':
                result = event
        return result
