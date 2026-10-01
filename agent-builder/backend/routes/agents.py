import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import text
from db import get_session, rows_to_dicts
from models import Agent, RunTrace
from mlflow_log import register_agent_version, log_run
from engine.runner import run_agent as _run_agent

router = APIRouter()


class AgentCreate(BaseModel):
    name: str
    description: str = ""
    model_endpoint: str = "databricks-meta-llama-3-3-70b-instruct"
    system_prompt: str = ""
    tool_ids: list[str] = []
    sub_agent_ids: list[str] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_endpoint: Optional[str] = None
    system_prompt: Optional[str] = None
    tool_ids: Optional[list[str]] = None
    sub_agent_ids: Optional[list[str]] = None


class RunInput(BaseModel):
    input: str


def _array_literal(items: list) -> str:
    if not items:
        return "ARRAY()"
    quoted = ", ".join(f"'{i}'" for i in items)
    return f"ARRAY({quoted})"


@router.post("", status_code=201)
def create_agent(body: AgentCreate):
    agent_id = str(uuid.uuid4())
    with get_session() as session:
        session.execute(
            text(f"""
                INSERT INTO agents
                  (id, name, description, model_endpoint, system_prompt,
                   tool_ids, sub_agent_ids, created_at)
                VALUES (:id, :name, :desc, :model, :prompt,
                        {_array_literal(body.tool_ids)},
                        {_array_literal(body.sub_agent_ids)},
                        now())
            """),
            {"id": agent_id, "name": body.name, "desc": body.description,
             "model": body.model_endpoint, "prompt": body.system_prompt},
        )
        agent = session.get(Agent, agent_id)
        result = agent.to_dict()
    register_agent_version(result)
    return result


@router.get("")
def list_agents():
    with get_session() as session:
        agents = session.query(Agent).order_by(Agent.created_at.desc()).all()
        return [a.to_dict() for a in agents]


@router.get("/{agent_id}")
def get_agent(agent_id: str):
    with get_session() as session:
        agent = session.get(Agent, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent.to_dict()


@router.put("/{agent_id}")
def update_agent(agent_id: str, body: AgentUpdate):
    with get_session() as session:
        existing = session.get(Agent, agent_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Agent not found")

        tool_ids = body.tool_ids if body.tool_ids is not None else (existing.tool_ids or [])
        sub_agent_ids = body.sub_agent_ids if body.sub_agent_ids is not None else (existing.sub_agent_ids or [])

        session.execute(
            text(f"""
                UPDATE agents
                SET name = :name, description = :desc, model_endpoint = :model,
                    system_prompt = :prompt,
                    tool_ids = {_array_literal(tool_ids)},
                    sub_agent_ids = {_array_literal(sub_agent_ids)},
                    updated_at = now()
                WHERE id = :id
            """),
            {"name": body.name or existing.name,
             "desc": body.description if body.description is not None else (existing.description or ""),
             "model": body.model_endpoint or existing.model_endpoint,
             "prompt": body.system_prompt if body.system_prompt is not None else (existing.system_prompt or ""),
             "id": agent_id},
        )
        updated = session.get(Agent, agent_id)
        result = updated.to_dict()
    register_agent_version(result)
    return result


@router.delete("/{agent_id}", status_code=204)
def delete_agent(agent_id: str):
    with get_session() as session:
        agent = session.get(Agent, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        session.execute(text("DELETE FROM agents WHERE id = :id"), {"id": agent_id})
    return Response(status_code=204)


@router.post("/{agent_id}/run")
def run_agent(agent_id: str, body: RunInput):
    with get_session() as session:
        agent = session.get(Agent, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent_dict = agent.to_dict()

    result = _run_agent(agent_dict, body.input)
    log_run(agent_dict, {"input": body.input}, result)
    return result
