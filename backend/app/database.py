from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrate existing tables: add new nullable columns if missing
        await conn.run_sync(_add_missing_columns)


def _add_missing_columns(conn):
    """Add columns introduced after initial schema creation (SQLite safe)."""
    import sqlalchemy as sa

    inspector = sa.inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("comparison_runs")}
    if "array_keys" not in columns:
        conn.execute(sa.text("ALTER TABLE comparison_runs ADD COLUMN array_keys TEXT"))
