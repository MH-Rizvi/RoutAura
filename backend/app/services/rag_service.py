from __future__ import annotations

import logging
import time
import json
from typing import Any, Dict

from app.database import SessionLocal
from app import models
from app.services.groq_client import groq_rotator


logger = logging.getLogger(__name__)


RAG_SYSTEM_PROMPT_v1 = """
You are a helpful AI assistant for the driver mapping app RoutAura.
You answer the driver's questions based ONLY on the context provided.
The context includes their past trip history, currently saved routes, and overall driving statistics.
If the context does not contain the answer or you don't know, say so clearly.
Keep your answers conversational, friendly, and helpful. Aim for 1-3 short sentences.
""".strip()


async def answer_history_question(question: str, user_id: str) -> Dict[str, Any]:
    """
    RAG pipeline using pure SQL for history retrieval.
    """
    logger.info("RAG query | user_id=%s | question=%s", user_id, question[:80])

    db = SessionLocal()
    try:
        # Fetch last 20 TripHistory rows for this user ordered by launched_at DESC
        histories = (
            db.query(models.TripHistory)
            .filter(models.TripHistory.user_id == user_id)
            .order_by(models.TripHistory.launched_at.desc())
            .limit(20)
            .all()
        )

        # Fetch all Trip names for this user — just name column
        saved_trips = db.query(models.Trip.name).filter(models.Trip.user_id == user_id).all()
        trip_names = [t[0] for t in saved_trips]

        # Compute stats
        total_trips = len(histories)
        total_miles = sum(h.total_miles or 0.0 for h in histories)

        # If user has zero trips AND zero history — return early exit message
        if total_trips == 0 and len(trip_names) == 0:
            return {
                "answer": "You haven't completed any trips yet. Once you save and launch routes, I'll be able to answer questions about your driving history!",
                "sources_used": 0,
            }

        # Format context string
        context_lines = [
            f"Driver Stats: Total Lifetime Trips: {total_trips}, Total Lifetime Miles: {total_miles:.2f}"
        ]

        if trip_names:
            context_lines.append("\nRelevant Saved Routes:")
            for name in trip_names:
                context_lines.append(f"- {name}")

        if histories:
            context_lines.append("\nRelevant Past Driven Trip History:")
            for hist in histories:
                try:
                    stops = json.loads(hist.stops_json)
                    stop_labels = " → ".join(str(s.get("label", "")) for s in stops)
                except Exception:
                    stop_labels = ""

                trip_name = hist.trip_name or "Unnamed Trip"
                launched = hist.launched_at.isoformat() if hist.launched_at else "Unknown date"
                context_lines.append(f"- On {launched}, drove {trip_name}: {stop_labels}")

        context = "\n".join(context_lines)

    except Exception as exc:
        logger.error("Failed to fetch SQL data for RAG: %s", exc)
        return {
            "answer": "Sorry, I couldn't process that question right now. Please try again.",
            "sources_used": 0,
        }
    finally:
        db.close()

    # Call LLM
    start_time = time.time()
    error_message = None

    try:
        response = await groq_rotator.async_chat_completion(
            model="llama-3.3-70b-versatile",
            max_tokens=300,
            messages=[
                {"role": "system", "content": RAG_SYSTEM_PROMPT_v1},
                {
                    "role": "user",
                    "content": f"Context (trip history):\n{context}\n\nQuestion: {question}",
                },
            ],
        )
        answer = response.choices[0].message.content
        success = True
        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        output_tokens = getattr(usage, "completion_tokens", None) if usage else None
    except Exception as exc:
        logger.error("RAG Groq call failed: %s", exc)
        answer = "Sorry, I couldn't process that question right now. Please try again."
        success = False
        error_message = str(exc)
        input_tokens = None
        output_tokens = None

    latency_ms = int((time.time() - start_time) * 1000)

    # Log to LLMLog
    db_log = SessionLocal()
    try:
        log = models.LLMLog(
            model="llama-3.3-70b-versatile",
            prompt_version="rag_v1",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            success=success,
            error_message=error_message,
            run_id=None,
            user_id=user_id,
        )
        db_log.add(log)
        db_log.commit()
    except Exception as exc:
        logger.error("Failed to persist RAG LLM log: %s", exc)
        db_log.rollback()
    finally:
        db_log.close()

    return {"answer": answer, "sources_used": len(histories)}
