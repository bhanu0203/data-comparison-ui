import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Agreement
from app.schemas import AgreementCreate, AgreementResponse, AgreementDetail

router = APIRouter(prefix="/api/agreements", tags=["agreements"])


def count_leaf_fields(obj: object, depth: int = 0) -> int:
    if depth > 20:
        return 0
    if isinstance(obj, dict):
        total = 0
        for v in obj.values():
            if isinstance(v, (dict, list)):
                total += count_leaf_fields(v, depth + 1)
            else:
                total += 1
        return total
    if isinstance(obj, list):
        total = 0
        for item in obj:
            if isinstance(item, (dict, list)):
                total += count_leaf_fields(item, depth + 1)
            else:
                total += 1
        return total
    return 1


@router.post("", response_model=AgreementResponse, status_code=201)
async def create_agreement(body: AgreementCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Agreement).where(Agreement.agreement_id == body.agreement_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Agreement {body.agreement_id} already exists")

    field_count = count_leaf_fields(body.json_data)
    agreement = Agreement(
        agreement_id=body.agreement_id,
        name=body.name,
        json_data=json.dumps(body.json_data),
        field_count=field_count,
    )
    db.add(agreement)
    await db.commit()
    await db.refresh(agreement)
    return agreement


@router.get("", response_model=list[AgreementResponse])
async def list_agreements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agreement).order_by(Agreement.created_at.desc()))
    return result.scalars().all()


@router.get("/{agreement_id}", response_model=AgreementDetail)
async def get_agreement(agreement_id: int, db: AsyncSession = Depends(get_db)):
    agreement = await db.get(Agreement, agreement_id)
    if not agreement:
        raise HTTPException(404, "Agreement not found")
    # Parse json_data string to dict before validation
    data = {c.key: getattr(agreement, c.key) for c in agreement.__table__.columns}
    data["json_data"] = json.loads(agreement.json_data)
    return AgreementDetail.model_validate(data)


@router.delete("/{agreement_id}", status_code=204)
async def delete_agreement(agreement_id: int, db: AsyncSession = Depends(get_db)):
    agreement = await db.get(Agreement, agreement_id)
    if not agreement:
        raise HTTPException(404, "Agreement not found")
    await db.delete(agreement)
    await db.commit()
