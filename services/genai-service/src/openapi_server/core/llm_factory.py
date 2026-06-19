import os
import requests
from typing import Any, List, Optional
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun

LOGOS_API_KEY = os.getenv("LOGOS_API_KEY")

if LOGOS_API_KEY:
    # Logos profile: TUM-hosted gpt-oss-120b.
    BASE_URL = "https://logos.aet.cit.tum.de/v1"
    LLM_MODEL_NAME = "openai/gpt-oss-120b"
    API_KEY = LOGOS_API_KEY
else:
    # LM Studio / Local profile
    BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:1234/v1")
    LLM_MODEL_NAME = os.getenv("LLM_MODEL", "gemma-4-e2b")
    API_KEY = None


class OpenAICompatibleLLM(LLM):
    """
    LangChain LLM wrapper for any OpenAI-compatible /v1/chat/completions
    endpoint.
    """

    base_url: str = BASE_URL
    api_key: Optional[str] = API_KEY
    model_name: str = LLM_MODEL_NAME

    @property
    def _llm_type(self) -> str:
        return "openai_compatible"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        messages = [{"role": "user", "content": prompt}]
        payload = {"model": self.model_name, "messages": messages}

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            raise Exception(f"LLM request failed: {e}")
