import mlflow

mlflow.set_tracking_uri("databricks")


def register_agent_version(agent: dict) -> str | None:
    try:
        experiment_name = f"/Shared/agent_platform/{agent['name']}"
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run() as run:
            mlflow.log_params({
                "model_endpoint": agent.get("model_endpoint", ""),
                "tool_count": len(agent.get("tool_ids") or []),
                "sub_agent_count": len(agent.get("sub_agent_ids") or []),
            })
            mlflow.log_dict(agent, "agent_config.json")
            return run.info.run_id
    except Exception:
        return None


def log_run(agent: dict, inputs: dict, outputs: dict, metrics: dict = None) -> None:
    try:
        with mlflow.start_run(run_name=agent["name"]):
            mlflow.set_tag("agent_id", agent["id"])
            mlflow.log_params({k: str(v) for k, v in inputs.items()})
            mlflow.log_params({"output": str(outputs)})
            if metrics:
                mlflow.log_metrics(metrics)
    except Exception:
        pass
