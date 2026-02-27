
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app import schemas
from app.agent import core as agent_service
from app.database import get_db
from app.services import moderation_service


router = APIRouter(tags=["agent"])


@router.post("/agent/chat", response_model=schemas.AgentChatResponse)
async def chat(
    request: schemas.AgentChatRequest,
    db: Session = Depends(get_db),
) -> schemas.AgentChatResponse:
    is_safe = await moderation_service.is_safe(request.message)
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message not related to route planning.",
        )

    result: dict[str, Any] = await agent_service.run_agent(
        request.message,
        request.conversation_history,  # pyright: ignore[reportArgumentType]
        db,
    )
    return schemas.AgentChatResponse(**result)


