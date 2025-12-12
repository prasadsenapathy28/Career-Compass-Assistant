from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import aiofiles

from services.document_parser import parse_resume, parse_job_description
from services.analysis_service import AnalysisService
from services.deepseek_service import DeepseekService

load_dotenv()

app = FastAPI(title="Career Compass API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analysis_service = AnalysisService()
deepseek_service = DeepseekService()

class AnalysisRequest(BaseModel):
    resume_text: str
    job_description_text: str

class ChatMessage(BaseModel):
    message: str
    session_id: str

class AnalysisResponse(BaseModel):
    match_score: float
    match_level: str
    skills_match: Dict[str, Any]
    gap_analysis: List[Dict[str, Any]]
    strengths: List[str]
    recommendations: List[str]
    actionable_tip: str

sessions = {}



@app.get("/")
async def root():
    return {"message": "Career Compass API", "version": "1.0.0"}

@app.post("/api/analyze")
async def analyze_resume_jd(request: AnalysisRequest):
    try:
        analysis_result = await analysis_service.analyze(
            resume_text=request.resume_text,
            job_description_text=request.job_description_text
        )
        
        return {
            "success": True,
            "data": analysis_result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = parse_resume(content, file.filename)
        
        return {
            "success": True,
            "text": text,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing resume: {str(e)}")



@app.post("/api/upload-jd")
async def upload_jd(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = parse_job_description(content, file.filename)
        
        return {
            "success": True,
            "text": text,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing job description: {str(e)}")



@app.post("/api/chat")
async def chat(message: ChatMessage):
    try:
        session_id = message.session_id
        
        if session_id not in sessions:
            sessions[session_id] = {
                "messages": [],
                "resume_text": None,
                "job_description_text": None
            }
        
        session = sessions[session_id]
        
        session["messages"].append({
            "role": "user",
            "content": message.message
        })
        
        response = await deepseek_service.chat(
            messages=session["messages"],
            context={
                "resume": session.get("resume_text"),
                "job_description": session.get("job_description_text")
            }
        )
        
        session["messages"].append({
            "role": "assistant",
            "content": response
        })
        
        return {
            "success": True,
            "response": response,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/session/create")
async def create_session(resume_text: str = Form(...), job_description_text: str = Form(...)):
    try:
        session_id = f"session_{datetime.now().timestamp()}"
        sessions[session_id] = {
            "messages": [],
            "resume_text": resume_text,
            "job_description_text": job_description_text,
            "created_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "success": True,
        "session": sessions[session_id]
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
