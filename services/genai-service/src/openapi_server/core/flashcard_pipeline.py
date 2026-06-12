import logging
from typing import Iterator

from weaviate.classes.query import Filter

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from pydantic import BaseModel
import json
import uuid
import datetime

from openapi_server.core.llm_factory import OpenAICompatibleLLM
from openapi_server.core.vector_store import query_vector_store

logger = logging.getLogger(__name__)


class QuestionListOutput(BaseModel):
    questions: list[str]


def generate_flashcards_stream(upload_id: str) -> Iterator[str]:
    """
    Retrieves context for the upload_id, triggers flashcard generation,
    and returns an NDJSON stream of the structured flashcards.
    Phase 1: Generates questions.
    Phase 2: Generates answers iteratively and streams out the result.
    """
    logger.info("[pipeline] Starting flashcard generation for upload_id=%s", upload_id)

    # Retrieve top K documents, filtering by upload_id
    logger.debug("[pipeline] Querying vector store for upload_id=%s", upload_id)
    docs = query_vector_store(
        query="important concepts and facts",
        k=10,
        filters=Filter.by_property("upload_id").equal(upload_id),
    )
    logger.debug("[pipeline] Retrieved %d doc(s) from vector store", len(docs))

    context = "\n\n".join([doc.page_content for doc in docs])
    logger.debug("[pipeline] Assembled context (%d chars)", len(context))

    llm = OpenAICompatibleLLM()
    question_parser = JsonOutputParser(pydantic_object=QuestionListOutput)

    question_prompt = PromptTemplate(
        template="""You are an expert AI tutor.
        Based on the following context, generate 3 highly relevant questions that would make good flashcards.
        Context:
        {context}

        Format your output exactly according to the schema provided. Do not provide answers yet.
        {format_instructions}
        """,
        input_variables=["context"],
        partial_variables={
            "format_instructions": question_parser.get_format_instructions()
        },
    )

    question_chain = question_prompt | llm | question_parser

    logger.debug("[pipeline] Invoking question generation chain")
    try:
        q_response = question_chain.invoke({"context": context})
        questions = q_response.get("questions", [])
        logger.info(
            "[pipeline] Generated %d question(s): %s", len(questions), questions
        )
    except Exception as e:
        logger.error("[pipeline] Failed to generate questions: %s", e)
        raise Exception(f"Failed to generate questions: {e}")

    answer_prompt = PromptTemplate(
        template="""You are an expert AI tutor.
        Based on the following context, provide a concise and clear answer to the question.
        Context:
        {context}

        Question: {question}

        Provide ONLY the answer as plain text, no introductory phrases.""",
        input_variables=["context", "question"],
    )

    answer_chain = answer_prompt | llm | StrOutputParser()

    for i, q in enumerate(questions, start=1):
        logger.debug(
            "[pipeline] Generating answer for question %d/%d: %r", i, len(questions), q
        )
        try:
            ans = answer_chain.invoke({"context": context, "question": q})
            fc = {
                "id": str(uuid.uuid4()),
                "question": q,
                "answer": ans.strip(),
                "source_ref": upload_id,
                "last_updated": datetime.datetime.now(
                    datetime.timezone.utc
                ).isoformat(),
            }
            logger.info(
                "[pipeline] Yielding flashcard %d/%d (id=%s)",
                i,
                len(questions),
                fc["id"],
            )
            yield json.dumps(fc) + "\n"
        except Exception as e:
            logger.warning(
                "[pipeline] Skipping question %d/%d due to error: %s",
                i,
                len(questions),
                e,
            )
            continue

    logger.info("[pipeline] Flashcard generation complete for upload_id=%s", upload_id)
