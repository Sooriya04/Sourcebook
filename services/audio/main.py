import json
import os
import shutil
import time
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from synthesizer import AVAILABLE_VOICES, AudioSynthesizer

app = FastAPI(title="SourceBook Kokoro TTS Audio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

synthesizer = None

def get_output_dir():
    custom_dir = os.getenv("AUDIO_OUTPUT_DIR")
    if custom_dir:
        return custom_dir
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base_dir, "database", "audio")

def get_synthesizer():
    global synthesizer
    if synthesizer is None:
        synthesizer = AudioSynthesizer()
    return synthesizer

class Turn(BaseModel):
    speaker: str
    name: str = "Host"
    text: str
    voice: str | None = None

class SynthesizeRequest(BaseModel):
    notebook_id: str
    turns: list[Turn]
    speed: float = 1.0
    summary: str = ""
    takeaways: list[str] = []
    episode_id: str | None = None
    length: str | None = "standard"
    format: str | None = "banter"

@app.get("/health")
def health_check():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_exists = os.path.exists(os.path.join(base_dir, "models", "kokoro-v1.0.int8.onnx"))
    return {
        "status": "ok",
        "service": "audio-tts",
        "model_available": model_exists,
        "model_loaded": synthesizer is not None
    }

@app.get("/voices")
def list_voices():
    return {"voices": AVAILABLE_VOICES}

def _save_episode_meta(output_dir: str, notebook_id: str, episode_id: str, meta: dict, summary: str = "", takeaways: list = None, length: str = "standard", fmt: str = "banter"):
    nb_dir = os.path.join(output_dir, notebook_id)
    os.makedirs(nb_dir, exist_ok=True)

    # Archive previous root episode into nb_dir so it remains in playlist
    legacy_json_path = os.path.join(output_dir, f"{notebook_id}.json")
    legacy_wav_path = os.path.join(output_dir, f"{notebook_id}.wav")
    if os.path.exists(legacy_json_path):
        try:
            with open(legacy_json_path, "r", encoding="utf-8") as fp:
                old_data = json.load(fp)
            old_id = old_data.get("id") or f"ep_prev_{int(os.path.getmtime(legacy_json_path))}"
            old_ep_json = os.path.join(nb_dir, f"{old_id}.json")
            if not os.path.exists(old_ep_json) and old_id != episode_id:
                old_data["id"] = old_id
                old_data["audio_url"] = f"/api/sourcebook/v1/study/audio/{notebook_id}?episode={old_id}"
                with open(old_ep_json, "w", encoding="utf-8") as fp:
                    json.dump(old_data, fp, indent=2)
                if os.path.exists(legacy_wav_path):
                    shutil.copyfile(legacy_wav_path, os.path.join(nb_dir, f"{old_id}.wav"))
        except Exception:
            pass

    ep_data = {
        "success": True,
        "id": episode_id,
        "notebook_id": notebook_id,
        "audio_url": f"/api/sourcebook/v1/study/audio/{notebook_id}?episode={episode_id}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "duration": meta["duration"],
        "length": length or meta.get("length", "standard"),
        "format": fmt or meta.get("format", "banter"),
        "summary": summary or meta.get("summary", ""),
        "takeaways": takeaways or meta.get("takeaways", []),
        "turns": meta["turns"]
    }
    with open(os.path.join(nb_dir, f"{episode_id}.json"), "w", encoding="utf-8") as f:
        json.dump(ep_data, f, indent=2)
    # Also write default latest
    with open(os.path.join(output_dir, f"{notebook_id}.json"), "w", encoding="utf-8") as f:
        json.dump(ep_data, f, indent=2)
    return ep_data

@app.post("/synthesize/stream")
def synthesize_podcast_stream(req: SynthesizeRequest):
    if not req.turns:
        raise HTTPException(status_code=400, detail="Turns cannot be empty")

    output_dir = get_output_dir()
    episode_id = req.episode_id or f"ep_{int(time.time())}"
    nb_dir = os.path.join(output_dir, req.notebook_id)
    os.makedirs(nb_dir, exist_ok=True)
    ep_output_path = os.path.join(nb_dir, f"{episode_id}.wav")
    latest_output_path = os.path.join(output_dir, f"{req.notebook_id}.wav")

    synth = get_synthesizer()
    turns_data = [t.model_dump() for t in req.turns]

    def event_stream():
        for event in synth.synthesize_podcast_streaming(turns_data, ep_output_path, speed=req.speed):
            if event['step'] == 'complete':
                try:
                    shutil.copyfile(ep_output_path, latest_output_path)
                except Exception:
                    pass
                ep_data = _save_episode_meta(output_dir, req.notebook_id, episode_id, event, summary=req.summary, takeaways=req.takeaways, length=req.length, fmt=req.format)
                yield f"data: {json.dumps({'step': 'complete', **ep_data})}\n\n"
            else:
                yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/episodes/{notebook_id}")
def list_episodes(notebook_id: str):
    output_dir = get_output_dir()
    nb_dir = os.path.join(output_dir, notebook_id)
    episodes = []
    seen_ids = set()
    if os.path.exists(nb_dir):
        for f in os.listdir(nb_dir):
            if f.endswith(".json"):
                try:
                    with open(os.path.join(nb_dir, f), "r", encoding="utf-8") as fp:
                        data = json.load(fp)
                        eid = data.get("id") or f.replace(".json", "")
                        data["id"] = eid
                        seen_ids.add(eid)
                        episodes.append(data)
                except Exception:
                    pass
    
    # Also include previously generated root episode if present and not yet tracked
    legacy_json = os.path.join(output_dir, f"{notebook_id}.json")
    if os.path.exists(legacy_json):
        try:
            with open(legacy_json, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                eid = data.get("id") or "legacy_1"
                data.setdefault("id", eid)
                data.setdefault("audio_url", f"/api/sourcebook/v1/study/audio/{notebook_id}")
                if eid not in seen_ids:
                    episodes.append(data)
        except Exception:
            pass
    # Sort descending by creation date (Newest First / LIFO)
    episodes.sort(key=lambda x: x.get("created_at", x.get("id", "")), reverse=True)
    return {"episodes": episodes}

@app.get("/audio/{notebook_id}")
def serve_audio(notebook_id: str, episode: str | None = None):
    output_dir = get_output_dir()
    if episode:
        path = os.path.join(output_dir, notebook_id, f"{episode}.wav")
        if os.path.exists(path):
            return FileResponse(path, media_type="audio/wav")
    path = os.path.join(output_dir, f"{notebook_id}.wav")
    if os.path.exists(path):
        return FileResponse(path, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Audio overview not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6003)
