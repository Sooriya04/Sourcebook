import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from synthesizer import AudioSynthesizer

app = FastAPI(title="SourceBook Kokoro TTS Audio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

synthesizer = None

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

@app.get("/health")
def health_check():
    synth = get_synthesizer()
    return {
        "status": "ok",
        "service": "audio-tts",
        "model_loaded": synth is not None
    }

@app.post("/synthesize")
def synthesize_podcast(req: SynthesizeRequest):
    if not req.turns:
        raise HTTPException(status_code=400, detail="Turns cannot be empty")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_dir = os.path.join(base_dir, "database", "audio")
    output_path = os.path.join(output_dir, f"{req.notebook_id}.wav")

    synth = get_synthesizer()
    turns_data = [t.model_dump() for t in req.turns]
    meta = synth.synthesize_podcast(turns_data, output_path, speed=req.speed)

    meta_path = os.path.join(output_dir, f"{req.notebook_id}.json")
    try:
        import json
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "success": True,
                "notebook_id": req.notebook_id,
                "audio_url": f"/api/sourcebook/v1/study/audio/{req.notebook_id}",
                "duration": meta["duration"],
                "turns": meta["turns"]
            }, f, indent=2)
    except Exception:
        pass

    return {
        "success": True,
        "notebook_id": req.notebook_id,
        "audio_url": f"/api/sourcebook/v1/study/audio/{req.notebook_id}",
        "duration": meta["duration"],
        "turns": meta["turns"]
    }

@app.get("/meta/{notebook_id}")
def get_audio_meta(notebook_id: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    meta_path = os.path.join(base_dir, "database", "audio", f"{notebook_id}.json")
    if os.path.exists(meta_path):
        import json
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    raise HTTPException(status_code=404, detail="Audio metadata not found")

@app.get("/audio/{notebook_id}")
def serve_audio(notebook_id: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    audio_path = os.path.join(base_dir, "database", "audio", f"{notebook_id}.wav")
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio overview not found")
    return FileResponse(audio_path, media_type="audio/wav")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6003)
