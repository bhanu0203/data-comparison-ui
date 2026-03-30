from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.enums import RunStatus, RunStage


def utcnow():
    return datetime.now(timezone.utc)


class Agreement(Base):
    __tablename__ = "agreements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agreement_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    json_data: Mapped[str] = mapped_column(Text, nullable=False)
    field_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    runs: Mapped[list["ComparisonRun"]] = relationship(back_populates="agreement", cascade="all, delete-orphan")


class ComparisonRun(Base):
    __tablename__ = "comparison_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agreement_id: Mapped[int] = mapped_column(Integer, ForeignKey("agreements.id"), nullable=False)
    run_name: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default=RunStatus.QUEUED.value)
    current_stage: Mapped[str] = mapped_column(String, default=RunStage.QUEUED.value)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    pdf_file_path: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_construct: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_one_result: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_two_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    match_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    agreement: Mapped["Agreement"] = relationship(back_populates="runs")
