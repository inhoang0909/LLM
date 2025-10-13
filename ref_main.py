from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi import Body
from typing import List, Dict

from . import db

app = FastAPI(
    title="GMO021 AI Translate API",
    description="CRUD API for llm_db.trans_logs (ai-translate). See /docs for Swagger UI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- ai-translate trans_logs models ---
from typing import Optional, Any
from datetime import datetime
from fastapi import Query, Path
from pydantic import Json


class TransLogCreate(BaseModel):
    input: str = Field(..., example="Hello, please translate this text")
    source_lang: Optional[str] = Field(None, example="en")
    target_lang: Optional[str] = Field(None, example="fr")
    user_feedback: Optional[Any] = Field(None, example={"msg": "Looks good", "actions": "like"})
    output: Optional[str] = Field(None, example="Bonjour, veuillez traduire ce texte")
    mode: Optional[str] = Field(None, example="current model")


class TransLog(TransLogCreate):
    id: str
    created: datetime


@app.on_event("startup")
def startup():
    db.init_db()



# route return hello world 
@app.get("/")
def read_root():
    return {"Hello": "GMO 021"}


# --- ai-translate prefixed CRUD routes ---
BASE = "/ai-translate/trans_logs"

#test route to make sure it works, just return the current time + current API prefix
@app.get("/ai-translate/test", tags=["ai-translate"])
def test_route():
    import datetime
    now = datetime.datetime.now()
    return {"message": "Test route is working!", "current_time": now.isoformat(), "api_prefix": "/ai-translate"}


@app.post(BASE, response_model=Dict[str, str], tags=["ai-translate"], summary="Create a translation log")
def create_trans_log(payload: TransLogCreate = Body(..., example={
    "input": "Hello, please translate this text",
    "source_lang": "en",
    "target_lang": "fr",
    "user_feedback": {"msg": "Looks good", "actions": "like"},
    "output": "Bonjour, veuillez traduire ce texte",
    "mode": "current model",
} )):
    # validate user_feedback.actions if provided to avoid DB CHECK violations
    if payload.user_feedback is not None and isinstance(payload.user_feedback, dict):
        actions = payload.user_feedback.get("actions")
        # allow empty/null -> normalized by db layer; but reject unknown non-empty values
        if actions is not None and isinstance(actions, str) and actions.strip() != "":
            if actions not in ("like", "dislike"):
                raise HTTPException(status_code=400, detail="user_feedback.actions must be 'like' or 'dislike' if provided")

    row = db.create_trans_log(
        input_text=payload.input,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
        user_feedback=payload.user_feedback,
        output=payload.output,
        mode=payload.mode,
    )
    # row is expected to contain 'id' key
    return {"id": row.get("id") or row.get(0) or str(row)}



@app.get(BASE + "/debug", tags=["ai-translate"], summary="Debug endpoint: DB env and recent rows")
def debug_info():
    import os
    env = {
        "PGHOST": os.environ.get("PGHOST"), 
        "PGPORT": os.environ.get("PGPORT"),
        "PGDATABASE": os.environ.get("PGDATABASE"),
        "PGUSER": os.environ.get("PGUSER"),
    }
    rows = []
    try:
        rows = db.list_trans_logs(limit=5, offset=0)
    except Exception as e:
        rows = [{"error": str(e)}]
    return {"db_env": env, "recent_rows": rows}


@app.get(BASE, response_model=List[TransLog], tags=["ai-translate"], summary="List translation logs")
def list_trans_logs(limit: int = Query(100, description="Maximum number of logs to return", example=100),
                   offset: int = Query(0, description="Number of logs to skip", example=0)):
    rows = db.list_trans_logs(limit=limit, offset=offset)
    return [TransLog(**r) for r in rows]


@app.get(BASE + "/{log_id}", response_model=TransLog, tags=["ai-translate"], summary="Get a translation log by id")
def get_trans_log(log_id: str = Path(..., description="UUID of the trans_log", example="3fa85f64-5717-4562-b3fc-2c963f66afa6")):
    row = db.get_trans_log(log_id)
    if not row:
        raise HTTPException(status_code=404, detail="trans_log not found")
    return TransLog(**row)


@app.put(BASE + "/{log_id}", response_model=TransLog, tags=["ai-translate"], summary="Update a translation log")
def update_trans_log(log_id: str = Path(..., description="UUID of the trans_log to update", example="3fa85f64-5717-4562-b3fc-2c963f66afa6"),
                    payload: TransLogCreate = Body(..., example={
    "input": "Updated input",
    "source_lang": "en",
    "target_lang": "es",
    "user_feedback": {"msg": "Needs improvement", "actions": "dislike"},
    "output": "Texto actualizado",
    "mode": "current model",
} )):
    updated = db.update_trans_log(
        log_id,
        input_text=payload.input,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
    user_feedback=payload.user_feedback,
        output=payload.output,
        mode=payload.mode,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="trans_log not found or no changes provided")
    row = db.get_trans_log(log_id)
    return TransLog(**row)


@app.delete(BASE + "/{log_id}", tags=["ai-translate"], summary="Delete a translation log")
def delete_trans_log(log_id: str = Path(..., description="UUID of the trans_log to delete", example="3fa85f64-5717-4562-b3fc-2c963f66afa6")):
    deleted = db.delete_trans_log(log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="trans_log not found")
    return {"status": "deleted"}