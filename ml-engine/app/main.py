from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from app.services.ranking import RankingService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SmartHire ML Engine",
    description="Local ML service for candidate ranking",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ranking service
ranking_service = RankingService()

# Pydantic models
class Candidate(BaseModel):
    id: str
    name: str
    email: str
    data: Dict[str, Any]

class Job(BaseModel):
    title: str
    description: Optional[str] = None
    requirements: Dict[str, Any] = {}

class RankingRequest(BaseModel):
    job: Job
    candidates: List[Candidate]

class RankedCandidate(BaseModel):
    id: str
    name: str
    score: float
    rationale: str

class RankingResponse(BaseModel):
    ranked_candidates: List[RankedCandidate]
    model_version: str = "1.0.0"

@app.get("/")
def root():
    return {
        "service": "SmartHire ML Engine",
        "status": "running",
        "version": "1.0.0",
        "environment": "local"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    model_loaded = ranking_service.is_model_loaded()
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "model_version": "1.0.0",
        "service": "ml-engine"
    }

@app.post("/rank", response_model=RankingResponse)
async def rank_candidates(request: RankingRequest):
    """
    Rank candidates for a given job using local ML model
    """
    try:
        logger.info(f"Ranking {len(request.candidates)} candidates for job: {request.job.title}")
        
        ranked_candidates = ranking_service.rank_candidates(
            job=request.job.dict(),
            candidates=[c.dict() for c in request.candidates]
        )
        
        logger.info(f"Successfully ranked {len(ranked_candidates)} candidates")
        
        return RankingResponse(ranked_candidates=ranked_candidates)
        
    except Exception as e:
        logger.error(f"Error ranking candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ranking failed: {str(e)}")

@app.post("/train")
async def train_model():
    """
    Train the ranking model with local data
    """
    try:
        logger.info("Starting model training...")
        result = ranking_service.train_model()
        logger.info("Model training completed successfully")
        return {
            "success": True,
            "message": "Model trained successfully",
            **result
        }
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/model/info")
def model_info():
    """Get information about the current model"""
    return ranking_service.get_model_info()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

