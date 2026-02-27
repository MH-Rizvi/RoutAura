
from __future__ import annotations

from fastapi import APIRouter  # pyright: ignore[reportMissingImports]

from app import schemas
from app.services import rag_service


router = APIRouter(tags=["rag"])


@router.post("/rag/query", response_model=schemas.HistoryQuestionResponse)
async def ask_history_question(
    request: schemas.HistoryQuestionRequest,
) -> schemas.HistoryQuestionResponse:
    """
    Ask a natural language question about the driver's trip history using the RAG pipeline.
    """
    result = await rag_service.answer_history_question(request.question)  # pyright: ignore[reportAttributeAccessIssue]
    # Expect rag_service to return a dict with answer and sources_used.
    return schemas.HistoryQuestionResponse(**result)


