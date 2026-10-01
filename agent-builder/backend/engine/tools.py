from langchain_core.tools import tool
from db import raw_query


@tool
def run_sql(statement: str) -> str:
    """Run a SELECT query against Databricks and return the results as a string."""
    normalized = statement.strip().upper()
    if not normalized.startswith("SELECT"):
        raise ValueError("Only SELECT statements are allowed.")

    safe = statement.rstrip().rstrip(";")
    if "LIMIT" not in normalized:
        safe = f"{safe} LIMIT 1000"

    rows = raw_query(safe)
    return str(rows[:50])


BUILTIN_TOOLS = {
    "run_sql": run_sql,
}
