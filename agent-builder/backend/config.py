import os
from dotenv import load_dotenv
from databricks.sdk import WorkspaceClient

load_dotenv()

_profile = os.environ.get("DATABRICKS_CONFIG_PROFILE")
w = WorkspaceClient(profile=_profile) if _profile else WorkspaceClient()

CATALOG = "agent_platform"
SCHEMA = "v1"
SECRETS_SCOPE = "agent-platform"

WAREHOUSE_HTTP_PATH = os.environ["WAREHOUSE_HTTP_PATH"]
SERVING_BASE = f"{w.config.host}/ai-gateway/mlflow/v1"


def table(name: str) -> str:
    return name
