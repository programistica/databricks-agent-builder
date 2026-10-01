from sqlalchemy import Column, String, Boolean, BigInteger, DateTime, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator

Base = declarative_base()


class DatabricksArray(TypeDecorator):
    """Maps Databricks array<string> ↔ Python list.

    Reads ndarray returned by the SQL connector and converts to list.
    Writes are intentionally blocked — use text() with ARRAY() literal,
    because DBAPI parameterized queries cannot express array types.
    """
    impl = String
    cache_ok = True

    def process_result_value(self, value, dialect):
        if value is None:
            return []
        if hasattr(value, "tolist"):  # numpy ndarray from the connector
            return value.tolist()
        return value if isinstance(value, list) else []

    def process_bind_param(self, value, dialect):
        raise NotImplementedError(
            "Array columns require text() with ARRAY() literal — "
            "use execute() in db.py for INSERT/UPDATE."
        )


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)
    name = Column(String)
    description = Column(String)
    model_endpoint = Column(String)
    system_prompt = Column(Text)
    tool_ids = Column(DatabricksArray)
    sub_agent_ids = Column(DatabricksArray)
    created_by = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model_endpoint": self.model_endpoint,
            "system_prompt": self.system_prompt,
            "tool_ids": self.tool_ids or [],
            "sub_agent_ids": self.sub_agent_ids or [],
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Tool(Base):
    __tablename__ = "tools"

    id = Column(String, primary_key=True)
    name = Column(String)
    type = Column(String)
    description = Column(String)
    mcp_url = Column(String)
    tool_schema = Column(String)
    auth_secret_key = Column(String)
    enabled = Column(Boolean)
    owner = Column(String)
    last_tested_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "mcp_url": self.mcp_url,
            "enabled": self.enabled,
        }


class RunTrace(Base):
    __tablename__ = "run_traces"

    run_id = Column(String, primary_key=True)
    agent_id = Column(String)
    parent_run_id = Column(String)
    user_id = Column(String)
    input = Column(Text)
    output = Column(Text)
    tool_calls = Column(String)
    latency_ms = Column(BigInteger)
    token_count = Column(BigInteger)
    status = Column(String)
    created_at = Column(DateTime)

    def to_dict(self):
        import json
        return {
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "tool_calls": json.loads(self.tool_calls) if self.tool_calls else [],
        }
