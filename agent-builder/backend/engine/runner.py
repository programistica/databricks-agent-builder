import uuid
import json
import time
import base64
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.tools import StructuredTool
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel
from sqlalchemy import text
from config import w, SERVING_BASE, SECRETS_SCOPE
from db import get_session
from models import Agent, Tool
from engine.tools import BUILTIN_TOOLS
from engine.mcp import fetch_mcp_tools

MAX_DEPTH = 3


def _resolve_tools(tool_ids: list) -> list:
    if not tool_ids:
        return []
    with get_session() as session:
        tools_rows = (
            session.query(Tool)
            .filter(Tool.id.in_(tool_ids), Tool.enabled == True)
            .all()
        )
        tool_data = [
            {"name": t.name, "type": t.type, "mcp_url": t.mcp_url, "auth_secret_key": t.auth_secret_key}
            for t in tools_rows
        ]

    lc_tools = []
    for row in tool_data:
        if row["type"] == "builtin":
            lc_tool = BUILTIN_TOOLS.get(row["name"])
            if lc_tool:
                lc_tools.append(lc_tool)
        elif row["type"] == "mcp":
            secret_bytes = w.secrets.get_secret(scope=SECRETS_SCOPE, key=row["auth_secret_key"]).value
            api_key = base64.b64decode(secret_bytes).decode()
            lc_tools.extend(fetch_mcp_tools(row["mcp_url"], api_key))
    return lc_tools


def _make_sub_agent_tool(agent_dict: dict, depth: int) -> StructuredTool:
    class SubAgentInput(BaseModel):
        input: str

    def call(input: str) -> str:
        return run_agent(agent_dict, input, depth=depth + 1)["output"]

    return StructuredTool.from_function(
        func=call,
        name=agent_dict["name"].replace(" ", "_").lower(),
        description=agent_dict.get("system_prompt") or agent_dict.get("description") or f"Delegate to {agent_dict['name']}.",
        args_schema=SubAgentInput,
    )


def _resolve_sub_agents(sub_agent_ids: list, depth: int) -> list:
    if not sub_agent_ids or depth >= MAX_DEPTH:
        return []
    with get_session() as session:
        agents = session.query(Agent).filter(Agent.id.in_(sub_agent_ids)).all()
        agent_dicts = [a.to_dict() for a in agents]
    return [_make_sub_agent_tool(a, depth) for a in agent_dicts]


def run_agent(agent: dict, user_input: str, depth: int = 0, parent_run_id: str = None) -> dict:
    if depth > MAX_DEPTH:
        return {"run_id": None, "output": "[max agent depth reached]",
                "tool_calls": [], "latency_ms": 0, "status": "error"}

    run_id = str(uuid.uuid4())
    start = time.time()
    status = "success"
    output = ""
    tool_calls = []

    try:
        token = w.config.authenticate()["Authorization"].split(" ")[1]
        llm = ChatOpenAI(
            model=agent.get("model_endpoint", "databricks-meta-llama-3-3-70b-instruct"),
            api_key=token,
            base_url=SERVING_BASE,
        )

        tools = (
            _resolve_tools(agent.get("tool_ids") or [])
            + _resolve_sub_agents(agent.get("sub_agent_ids") or [], depth)
        )

        system_prompt = agent.get("system_prompt") or "You are a helpful assistant."
        react_agent = create_react_agent(llm, tools, prompt=SystemMessage(content=system_prompt))

        result = react_agent.invoke({"messages": [{"role": "user", "content": user_input}]})
        messages = result.get("messages", [])
        output = messages[-1].content if messages else ""
        tool_calls = [
            {"tool": tc["name"], "input": tc["args"]}
            for msg in messages
            if isinstance(msg, AIMessage) and msg.tool_calls
            for tc in msg.tool_calls
        ]

    except Exception as exc:
        status = "error"
        output = str(exc)

    latency_ms = int((time.time() - start) * 1000)

    with get_session() as session:
        session.execute(
            text("""
                INSERT INTO run_traces
                  (run_id, agent_id, parent_run_id, input, output, tool_calls,
                   latency_ms, token_count, status, created_at, run_date)
                VALUES (:run_id, :agent_id, :parent_run_id, :input, :output, :tool_calls,
                        :latency_ms, 0, :status, now(), cast(now() as date))
            """),
            {"run_id": run_id, "agent_id": agent["id"], "parent_run_id": parent_run_id,
             "input": user_input, "output": output, "tool_calls": json.dumps(tool_calls),
             "latency_ms": latency_ms, "status": status},
        )

    return {
        "run_id": run_id,
        "output": output,
        "tool_calls": tool_calls,
        "latency_ms": latency_ms,
        "status": status,
    }
