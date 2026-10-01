from typing import Any, Optional
import httpx
from pydantic import create_model
from langchain_core.tools import StructuredTool

_TYPE_MAP = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "array": list,
    "object": dict,
}


def _build_args_schema(input_schema: dict):
    properties = input_schema.get("properties", {})
    required = set(input_schema.get("required", []))
    fields = {}
    for name, spec in properties.items():
        python_type = _TYPE_MAP.get(spec.get("type", "string"), Any)
        if name in required:
            fields[name] = (python_type, ...)
        else:
            fields[name] = (Optional[python_type], None)
    return create_model("MCPToolArgs", **fields)


def fetch_mcp_tools(mcp_url: str, api_key: str) -> list[StructuredTool]:
    headers = {"Authorization": f"Bearer {api_key}"}

    with httpx.Client(base_url=mcp_url, headers=headers) as client:
        resp = client.get("/tools/list")
        resp.raise_for_status()
        specs = resp.json().get("tools", [])

    def make_caller(tool_name: str):
        def call(**kwargs) -> str:
            with httpx.Client(base_url=mcp_url, headers=headers) as c:
                r = c.post("/tools/call", json={"name": tool_name, "arguments": kwargs})
                r.raise_for_status()
                return str(r.json())
        return call

    return [
        StructuredTool.from_function(
            func=make_caller(spec["name"]),
            name=spec["name"],
            description=spec.get("description", ""),
            args_schema=_build_args_schema(spec.get("inputSchema", {})),
        )
        for spec in specs
    ]
