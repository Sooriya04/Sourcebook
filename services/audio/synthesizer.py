import os
import time
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.config import SAMPLE_RATE

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

    def synthesize_turn(self, text: str, voice_name: str, speed: float = 1.0) -> np.ndarray:
        voice_id = self.DEFAULT_VOICES.get(voice_name.lower(), voice_name)
        samples, _ = self.kokoro.create(text, voice=voice_id, speed=speed)
        return samples

    def synthesize_podcast(self, turns: list[dict], output_path: str, speed: float = 1.0) -> dict:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        all_audio = []
        current_time = 0.0
        timed_turns = []
        pause_samples = np.zeros(int(SAMPLE_RATE * 0.35), dtype=np.float32)

        for turn in turns:
            speaker = turn.get('speaker', 'host1').lower()
            name = turn.get('name', 'Host 1')
            text = turn.get('text', '').strip()
            if not text:
                continue

            voice_id = turn.get('voice') or self.DEFAULT_VOICES.get(speaker, 'am_adam')
            turn_audio = self.synthesize_turn(text, voice_id, speed=speed)
            duration = len(turn_audio) / SAMPLE_RATE

            timed_turns.append({
                'speaker': speaker,
                'name': name,
                'text': text,
                'start_time': round(current_time, 2),
                'end_time': round(current_time + duration, 2),
                'duration': round(duration, 2)
            })

            all_audio.append(turn_audio)
            all_audio.append(pause_samples)
            current_time += duration + 0.35

        if all_audio:
            final_audio = np.concatenate(all_audio)
        else:
            final_audio = np.zeros(SAMPLE_RATE, dtype=np.float32)

        sf.write(output_path, final_audio, SAMPLE_RATE)
        total_duration = len(final_audio) / SAMPLE_RATE

        return {
            'duration': round(total_duration, 2),
            'sample_rate': SAMPLE_RATE,
            'turns': timed_turns
        }
