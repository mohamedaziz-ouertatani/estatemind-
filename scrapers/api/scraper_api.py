"""
FastAPI endpoints for scraper management
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import subprocess
import os
import json
import logging
import tempfile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="EstateMind Scraper API",
    description="API for managing Tunisia real estate web scrapers",
    version="1.0.0"
)

# In-memory job storage (in production, use Redis or database)
jobs = {}
job_counter = 0


class ScraperJobRequest(BaseModel):
    """Request model for starting a scraper"""
    max_pages: Optional[int] = None
    output_format: str = "json"


class ScraperSchedule(BaseModel):
    """Request model for scheduling scrapers"""
    spider_name: str
    cron_expression: str  # e.g., "0 2 * * *" for daily at 2 AM
    max_pages: Optional[int] = None


class JobStatus(BaseModel):
    """Job status response model"""
    job_id: str
    spider_name: str
    status: str  # queued, running, completed, failed
    started_at: Optional[str]
    completed_at: Optional[str]
    items_scraped: int
    error: Optional[str]


def run_scraper(job_id: str, spider_name: str, max_pages: Optional[int] = None):
    """
    Background task to run a scraper
    """
    try:
        jobs[job_id]["status"] = "running"
        jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
        
        # Build scrapy command
        cmd = ["scrapy", "crawl", spider_name]
        
        if max_pages:
            cmd.extend(["-a", f"max_pages={max_pages}"])
        
        # Output file using tempfile
        output_fd, output_file = tempfile.mkstemp(suffix=".json", prefix=f"scraper_{job_id}_")
        os.close(output_fd)  # Close file descriptor, scrapy will open for writing
        cmd.extend(["-o", output_file])
        
        # Get scrapers directory
        scrapers_dir = os.path.join(os.path.dirname(__file__), "..")
        
        # Run scraper
        logger.info(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            cwd=scrapers_dir,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        # Check output
        items_scraped = 0
        if os.path.exists(output_file):
            with open(output_file, "r") as f:
                try:
                    data = json.load(f)
                    items_scraped = len(data) if isinstance(data, list) else 1
                except:
                    pass
        
        if result.returncode == 0:
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["items_scraped"] = items_scraped
            jobs[job_id]["output_file"] = output_file
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = result.stderr
        
        jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        jobs[job_id]["logs"] = result.stdout
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()


@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "EstateMind Scraper API",
        "version": "1.0.0",
        "endpoints": {
            "run_scraper": "POST /api/scraper/run/{spider_name}",
            "get_status": "GET /api/scraper/status/{job_id}",
            "get_logs": "GET /api/scraper/logs/{job_id}",
            "get_stats": "GET /api/scraper/stats",
            "list_jobs": "GET /api/scraper/jobs",
        }
    }


@app.post("/api/scraper/run/{spider_name}", response_model=Dict[str, str])
async def run_scraper_endpoint(
    spider_name: str,
    request: ScraperJobRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger a scraper job
    
    Available spiders: tayara, mubawab, tunisie_annonce
    """
    # Validate spider name
    valid_spiders = ["tayara", "mubawab", "tunisie_annonce"]
    if spider_name not in valid_spiders:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid spider name. Must be one of: {', '.join(valid_spiders)}"
        )
    
    # Create job
    global job_counter
    job_counter += 1
    job_id = f"job_{job_counter}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    jobs[job_id] = {
        "job_id": job_id,
        "spider_name": spider_name,
        "status": "queued",
        "started_at": None,
        "completed_at": None,
        "items_scraped": 0,
        "error": None,
    }
    
    # Start scraper in background
    background_tasks.add_task(
        run_scraper,
        job_id,
        spider_name,
        request.max_pages
    )
    
    return {
        "job_id": job_id,
        "status": "queued",
        "message": f"Scraper {spider_name} started"
    }


@app.get("/api/scraper/status/{job_id}", response_model=JobStatus)
def get_job_status(job_id: str):
    """
    Get status of a scraper job
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatus(**jobs[job_id])


@app.get("/api/scraper/logs/{job_id}")
def get_job_logs(job_id: str):
    """
    Get logs for a scraper job
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    logs = jobs[job_id].get("logs", "No logs available")
    
    return {
        "job_id": job_id,
        "logs": logs
    }


@app.get("/api/scraper/jobs")
def list_jobs(limit: int = 10):
    """
    List recent scraper jobs
    """
    job_list = list(jobs.values())
    job_list.sort(key=lambda x: x.get("started_at") or "", reverse=True)
    
    return {
        "total": len(job_list),
        "jobs": job_list[:limit]
    }


@app.get("/api/scraper/stats")
def get_scraper_stats():
    """
    Get scraper statistics
    """
    total_jobs = len(jobs)
    completed = sum(1 for j in jobs.values() if j["status"] == "completed")
    failed = sum(1 for j in jobs.values() if j["status"] == "failed")
    running = sum(1 for j in jobs.values() if j["status"] == "running")
    total_items = sum(j.get("items_scraped", 0) for j in jobs.values())
    
    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed,
        "failed_jobs": failed,
        "running_jobs": running,
        "total_items_scraped": total_items,
        "success_rate": round((completed / total_jobs * 100) if total_jobs > 0 else 0, 2)
    }


@app.post("/api/scraper/schedule")
def schedule_scraper(schedule: ScraperSchedule):
    """
    Schedule a recurring scraper job (placeholder - requires cron setup)
    """
    # In production, this would integrate with a job scheduler like Celery or APScheduler
    return {
        "message": "Scheduler not yet implemented",
        "schedule": schedule.dict()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
