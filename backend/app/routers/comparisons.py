import asyncio
import json
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import ComparisonRun, Agreement
from app.schemas import ComparisonRunResponse, ComparisonRunDetail, RunProgress
from app.config import UPLOAD_DIR
from app.services.comparison_service import run_comparison

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])


def _enrich_run(run: ComparisonRun, agreement: Agreement | None) -> dict:
    """Add agreement display fields to run data."""
    data = {
        "id": run.id,
        "agreement_id": run.agreement_id,
        "agreement_display_id": agreement.agreement_id if agreement else None,
        "agreement_name": agreement.name if agreement else None,
        "run_name": run.run_name,
        "status": run.status,
        "current_stage": run.current_stage,
        "progress_percentage": run.progress_percentage,
        "match_percentage": run.match_percentage,
        "created_at": run.created_at,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "error_message": run.error_message,
    }
    return data


@router.post("", response_model=ComparisonRunResponse, status_code=201)
async def create_comparison(
    agreement_id: int = Form(...),
    run_name: str = Form(None),
    metadata_construct: str = Form(None),
    pdf: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    agreement = await db.get(Agreement, agreement_id)
    if not agreement:
        raise HTTPException(404, "Agreement not found")

    # Save PDF
    pdf_filename = f"{uuid.uuid4().hex}_{pdf.filename}"
    pdf_path = UPLOAD_DIR / pdf_filename
    content = await pdf.read()
    pdf_path.write_bytes(content)

    run = ComparisonRun(
        agreement_id=agreement_id,
        run_name=run_name,
        pdf_file_path=pdf_filename,
        metadata_construct=metadata_construct,
        system_two_data=agreement.json_data,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Start background processing
    asyncio.create_task(run_comparison(run.id))

    return _enrich_run(run, agreement)


@router.get("", response_model=list[ComparisonRunResponse])
async def list_comparisons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ComparisonRun).order_by(ComparisonRun.created_at.desc())
    )
    runs = result.scalars().all()

    # Batch load agreements
    agreement_ids = {r.agreement_id for r in runs}
    agreements_result = await db.execute(
        select(Agreement).where(Agreement.id.in_(agreement_ids))
    )
    agreements_map = {a.id: a for a in agreements_result.scalars().all()}

    return [_enrich_run(r, agreements_map.get(r.agreement_id)) for r in runs]


@router.get("/{run_id}", response_model=ComparisonRunDetail)
async def get_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")

    agreement = await db.get(Agreement, run.agreement_id)
    data = _enrich_run(run, agreement)

    # Add full data fields
    data["system_one_result"] = json.loads(run.system_one_result) if run.system_one_result else None
    data["system_two_data"] = json.loads(run.system_two_data) if run.system_two_data else None
    data["metadata_construct"] = json.loads(run.metadata_construct) if run.metadata_construct else None

    return data


@router.get("/{run_id}/progress", response_model=RunProgress)
async def get_progress(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")
    return run


@router.delete("/{run_id}", status_code=204)
async def delete_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")

    # Delete PDF file
    if run.pdf_file_path:
        pdf_path = UPLOAD_DIR / run.pdf_file_path
        if pdf_path.exists():
            pdf_path.unlink()

    await db.delete(run)
    await db.commit()
