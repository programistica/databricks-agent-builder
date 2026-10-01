from fastapi import APIRouter
from sqlalchemy import text
from config import w
from db import get_session, rows_to_dicts
from models import Tool, Agent

router = APIRouter()


@router.get("/models")
def list_models():
    return [e.name for e in w.serving_endpoints.list()]


@router.get("/tables")
def list_tables():
    with get_session() as session:
        result = session.execute(text("SHOW TABLES IN v1"))
        return rows_to_dicts(result)


@router.get("/tools")
def list_tools():
    with get_session() as session:
        tools = session.query(Tool).filter(Tool.enabled == True).all()
        return [t.to_dict() for t in tools]


@router.get("/agents")
def list_agents():
    with get_session() as session:
        agents = session.query(Agent).all()
        return [a.to_dict() for a in agents]
