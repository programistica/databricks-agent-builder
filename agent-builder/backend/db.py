from contextlib import contextmanager
from databricks import sql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from config import w, WAREHOUSE_HTTP_PATH


def _make_connection():
    token = w.config.authenticate()["Authorization"].split(" ")[1]
    return sql.connect(
        server_hostname=w.config.host.replace("https://", ""),
        http_path=WAREHOUSE_HTTP_PATH,
        access_token=token,
        catalog="agent_platform",
        schema="v1",
    )


engine = create_engine(
    "databricks://",
    creator=_make_connection,
    poolclass=NullPool,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _normalize(value):
    if hasattr(value, "tolist"):
        return value.tolist()
    return value


def rows_to_dicts(result) -> list[dict]:
    """Convert a SQLAlchemy result set to list[dict], normalizing Databricks types."""
    cols = result.keys()
    return [{k: _normalize(v) for k, v in zip(cols, row)} for row in result.fetchall()]


def raw_query(statement: str) -> list[dict]:
    """Run arbitrary SQL via a raw cursor (avoids the dialect's arrow→numpy
    NULL-int conversion bug). Used for agent-generated read queries."""
    conn = engine.raw_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(statement)
            cols = [d[0] for d in cursor.description]
            return [
                {k: _normalize(v) for k, v in zip(cols, row)}
                for row in cursor.fetchall()
            ]
    finally:
        conn.close()
