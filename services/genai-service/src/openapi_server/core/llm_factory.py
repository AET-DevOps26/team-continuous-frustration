import logging
import os
import requests
from typing import Any, List, Optional
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun


# Logos profile: TUM-hosted gpt-oss-120b.
BASE_URL = "https://logos.aet.cit.tum.de/v1"
LLM_MODEL_NAME = "openai/gpt-oss-120b"
API_KEY = os.getenv("LOGOS_API_KEY")

# Ollama profile
LOCAL_BASE_URL = os.getenv("LLM_BASE_URL", "http://ollama:11434/v1")
LOCAL_LLM_MODEL_NAME = os.getenv("LLM_MODEL", "gemma-4-e2b")
LOCAL_API_KEY = "ollama"


class OpenAICompatibleLLM(LLM):
    """
    LangChain LLM wrapper for any OpenAI-compatible /v1/chat/completions
    endpoint.
    """

    base_url: str = BASE_URL
    api_key: Optional[str] = API_KEY
    model_name: str = LLM_MODEL_NAME
    local_base_url: str = LOCAL_BASE_URL
    local_api_key: str = LOCAL_API_KEY
    local_model_name: str = LOCAL_LLM_MODEL_NAME

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
        if self.api_key:
            try:
                return self._make_api_call(self.base_url, self.api_key, self.model_name, prompt, stop, run_manager, **kwargs)
            except Exception as e:
                logging.error(f"Logos API call failed: {e}")
                logging.info("Falling back to local LLM")
        try:
            return self._make_api_call(self.local_base_url, self.local_api_key, self.local_model_name, prompt, stop, run_manager, **kwargs)
        except Exception as e:
            logging.error(f"Local LLM call failed: {e}")
            raise e
    
    def _make_api_call(
        self,
        base_url: str,
        api_key: str,
        model_name: str,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        messages = [{"role": "user", "content": prompt}]
        payload = {"model": model_name, "messages": messages}

        try:
            response = requests.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            raise Exception(f"LLM request failed: {e}")
