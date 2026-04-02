import asyncio
import json
import math
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy import select, func, or_, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import ComparisonRun, Agreement
from app.schemas import (
    ComparisonRunResponse,
    ComparisonRunDetail,
    RunProgress,
    RerunRequest,
    PaginatedComparisonRuns,
    StatusCounts,
)
from app.config import UPLOAD_DIR
from app.services.comparison_service import run_comparison, compute_match_percentage

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])


def _enrich_run(run: ComparisonRun, agreement: Agreement | None) -> dict:
    """Add agreement display fields to run data."""
    return {
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


def _enrich_run_detail(run: ComparisonRun, agreement: Agreement | None) -> dict:
    data = _enrich_run(run, agreement)
    data["system_one_result"] = json.loads(run.system_one_result) if run.system_one_result else None
    data["system_two_data"] = json.loads(run.system_two_data) if run.system_two_data else None
    data["metadata_construct"] = json.loads(run.metadata_construct) if run.metadata_construct else None
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

    asyncio.create_task(run_comparison(run.id))

    return _enrich_run(run, agreement)


@router.post("/direct", response_model=ComparisonRunDetail, status_code=201)
async def create_direct_comparison(
    baseline_json: UploadFile = File(..., description="Baseline JSON file"),
    llm_output_json: UploadFile = File(..., description="LLM output JSON file"),
    source_name: str = Form(...),
    run_name: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload two JSON files (baseline + LLM output) and create a completed
    comparison run immediately — no PDF, no metadata construct, no simulated
    processing stages.  A dummy agreement is created (or reused) from source_name.
    """
    # Parse uploaded JSON files
    try:
        baseline_data = json.loads(await baseline_json.read())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(400, "baseline_json is not a valid JSON file")

    try:
        llm_output_data = json.loads(await llm_output_json.read())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(400, "llm_output_json is not a valid JSON file")

    # Find or create a dummy agreement keyed by source_name
    agr_id = f"DIRECT_{source_name}"
    result = await db.execute(
        select(Agreement).where(Agreement.agreement_id == agr_id)
    )
    agreement = result.scalar_one_or_none()
    if not agreement:
        agreement = Agreement(
            agreement_id=agr_id,
            name=source_name,
            json_data=json.dumps(baseline_data),
            field_count=0,
        )
        db.add(agreement)
        await db.flush()

    match_pct = compute_match_percentage(llm_output_data, baseline_data)
    now = datetime.now(timezone.utc)

    run = ComparisonRun(
        agreement_id=agreement.id,
        run_name=run_name or f"Direct: {source_name}",
        status="completed",
        current_stage="completed",
        progress_percentage=100,
        system_one_result=json.dumps(llm_output_data),
        system_two_data=json.dumps(baseline_data),
        match_percentage=match_pct,
        started_at=now,
        completed_at=now,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    return _enrich_run_detail(run, agreement)


@router.get("", response_model=PaginatedComparisonRuns)
async def list_comparisons(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    match_min: float | None = Query(None, ge=0, le=100),
    match_max: float | None = Query(None, ge=0, le=100),
    agreement_id: int | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    # Base query
    base = select(ComparisonRun)
    count_q = select(func.count()).select_from(ComparisonRun)

    # Search (requires join)
    needs_join = bool(search)
    if needs_join:
        base = base.outerjoin(Agreement, ComparisonRun.agreement_id == Agreement.id)
        count_q = count_q.outerjoin(Agreement, ComparisonRun.agreement_id == Agreement.id)
        search_filter = or_(
            ComparisonRun.run_name.ilike(f"%{search}%"),
            Agreement.agreement_id.ilike(f"%{search}%"),
            Agreement.name.ilike(f"%{search}%"),
        )
        base = base.where(search_filter)
        count_q = count_q.where(search_filter)

    # Status filter (comma-separated)
    if status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        if statuses:
            base = base.where(ComparisonRun.status.in_(statuses))
            count_q = count_q.where(ComparisonRun.status.in_(statuses))

    # Date range
    if date_from:
        base = base.where(ComparisonRun.created_at >= date_from)
        count_q = count_q.where(ComparisonRun.created_at >= date_from)
    if date_to:
        base = base.where(ComparisonRun.created_at <= date_to)
        count_q = count_q.where(ComparisonRun.created_at <= date_to)

    # Match percentage range
    if match_min is not None:
        base = base.where(ComparisonRun.match_percentage >= match_min)
        count_q = count_q.where(ComparisonRun.match_percentage >= match_min)
    if match_max is not None:
        base = base.where(ComparisonRun.match_percentage <= match_max)
        count_q = count_q.where(ComparisonRun.match_percentage <= match_max)

    # Agreement filter
    if agreement_id is not None:
        base = base.where(ComparisonRun.agreement_id == agreement_id)
        count_q = count_q.where(ComparisonRun.agreement_id == agreement_id)

    # Status counts (unfiltered by status, but filtered by other params)
    count_base = select(
        ComparisonRun.status,
        func.count().label("cnt"),
    ).group_by(ComparisonRun.status)

    # Apply non-status filters to status counts
    if needs_join:
        count_base = count_base.outerjoin(Agreement, ComparisonRun.agreement_id == Agreement.id)
        count_base = count_base.where(search_filter)
    if date_from:
        count_base = count_base.where(ComparisonRun.created_at >= date_from)
    if date_to:
        count_base = count_base.where(ComparisonRun.created_at <= date_to)
    if match_min is not None:
        count_base = count_base.where(ComparisonRun.match_percentage >= match_min)
    if match_max is not None:
        count_base = count_base.where(ComparisonRun.match_percentage <= match_max)
    if agreement_id is not None:
        count_base = count_base.where(ComparisonRun.agreement_id == agreement_id)

    status_result = await db.execute(count_base)
    status_map = {row.status: row.cnt for row in status_result}
    status_counts = StatusCounts(
        queued=status_map.get("queued", 0),
        processing=status_map.get("processing", 0),
        completed=status_map.get("completed", 0),
        failed=status_map.get("failed", 0),
    )

    # Total count (with all filters)
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = max(1, math.ceil(total / page_size))

    # Sort
    sort_column_map = {
        "created_at": ComparisonRun.created_at,
        "match_percentage": ComparisonRun.match_percentage,
        "run_name": ComparisonRun.run_name,
        "status": ComparisonRun.status,
        "id": ComparisonRun.id,
    }
    sort_col = sort_column_map.get(sort_by, ComparisonRun.created_at)
    if sort_order == "asc":
        base = base.order_by(sort_col.asc())
    else:
        base = base.order_by(sort_col.desc())

    # Paginate
    base = base.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base)
    runs = result.scalars().all()

    # Batch load agreements
    agr_ids = {r.agreement_id for r in runs}
    agreements_result = await db.execute(
        select(Agreement).where(Agreement.id.in_(agr_ids))
    )
    agreements_map = {a.id: a for a in agreements_result.scalars().all()}

    return PaginatedComparisonRuns(
        items=[_enrich_run(r, agreements_map.get(r.agreement_id)) for r in runs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        status_counts=status_counts,
    )


@router.post("/batch", response_model=list[ComparisonRunDetail])
async def get_comparisons_batch(
    run_ids: list[int],
    db: AsyncSession = Depends(get_db),
):
    if len(run_ids) > 10:
        raise HTTPException(400, "Maximum 10 runs per batch request")
    if not run_ids:
        return []

    result = await db.execute(
        select(ComparisonRun).where(ComparisonRun.id.in_(run_ids))
    )
    runs = result.scalars().all()

    agr_ids = {r.agreement_id for r in runs}
    agr_result = await db.execute(
        select(Agreement).where(Agreement.id.in_(agr_ids))
    )
    agr_map = {a.id: a for a in agr_result.scalars().all()}

    # Preserve requested order
    run_map = {r.id: r for r in runs}
    ordered = [run_map[rid] for rid in run_ids if rid in run_map]

    return [_enrich_run_detail(r, agr_map.get(r.agreement_id)) for r in ordered]


@router.get("/{run_id}", response_model=ComparisonRunDetail)
async def get_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")

    agreement = await db.get(Agreement, run.agreement_id)
    return _enrich_run_detail(run, agreement)


@router.get("/{run_id}/progress", response_model=RunProgress)
async def get_progress(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")
    return run


@router.post("/{run_id}/rerun", response_model=ComparisonRunResponse, status_code=201)
async def rerun_comparison(
    run_id: int,
    body: RerunRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    original = await db.get(ComparisonRun, run_id)
    if not original:
        raise HTTPException(404, "Comparison run not found")

    agreement = await db.get(Agreement, original.agreement_id)

    if body and body.metadata_construct:
        new_metadata = json.dumps(body.metadata_construct)
    else:
        new_metadata = original.metadata_construct

    new_run_name = (body.run_name if body and body.run_name else None) or f"Rerun of #{run_id}"

    new_run = ComparisonRun(
        agreement_id=original.agreement_id,
        run_name=new_run_name,
        pdf_file_path=original.pdf_file_path,
        metadata_construct=new_metadata,
        system_two_data=agreement.json_data if agreement else original.system_two_data,
    )
    db.add(new_run)
    await db.commit()
    await db.refresh(new_run)

    asyncio.create_task(run_comparison(new_run.id))

    return _enrich_run(new_run, agreement)


@router.delete("/{run_id}", status_code=204)
async def delete_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    run = await db.get(ComparisonRun, run_id)
    if not run:
        raise HTTPException(404, "Comparison run not found")

    if run.pdf_file_path:
        other = await db.execute(
            select(ComparisonRun).where(
                ComparisonRun.pdf_file_path == run.pdf_file_path,
                ComparisonRun.id != run.id,
            )
        )
        if not other.scalars().first():
            pdf_path = UPLOAD_DIR / run.pdf_file_path
            if pdf_path.exists():
                pdf_path.unlink()

    await db.delete(run)
    await db.commit()
