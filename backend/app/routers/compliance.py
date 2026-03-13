from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import admin_required
from app.database import get_db
from app.services.compliance_service import ingest_document, query_compliance

router = APIRouter(prefix="/compliance", tags=["compliance"])
logger = logging.getLogger(__name__)

DOCUMENTS_BASE_PATH = os.getenv("DOCUMENTS_PATH", "./documents")

DOCUMENT_MANIFEST = [
    {"filename": "cdl10sec02.pdf", "source": "NY CDL Manual — Driving Safely", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec03.pdf", "source": "NY CDL Manual — Transporting Cargo", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec04.pdf", "source": "NY CDL Manual — Transporting Passengers", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec05.pdf", "source": "NY CDL Manual — Air Brakes", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec06.pdf", "source": "NY CDL Manual — Combination Vehicles", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec07.pdf", "source": "NY CDL Manual — Doubles and Triples", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec09.pdf", "source": "NY CDL Manual — Hazardous Materials", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec10.pdf", "source": "NY CDL Manual — School Bus", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "cdl10sec11-13.pdf", "source": "NY CDL Manual — Pre-Trip Inspection", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "ny_driver_manual.pdf", "source": "NY Driver Manual", "jurisdiction": "NY", "doc_type": "manual"},
    {"filename": "ny_article_19a_guide.pdf", "source": "NY Article 19-A Guide", "jurisdiction": "NY", "doc_type": "article_19a"},
]


@router.post("/ingest")
async def ingest_all_documents(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Admin endpoint — ingests all documents in DOCUMENT_MANIFEST into compliance_chunks.
    Idempotent — skips documents already ingested.
    Requires authenticated user with role='admin'.
    """
    results = []
    errors = []

    for doc in DOCUMENT_MANIFEST:
        file_path = os.path.join(DOCUMENTS_BASE_PATH, doc["filename"])
        try:
            result = ingest_document(
                file_path=file_path,
                jurisdiction=doc["jurisdiction"],
                source=doc["source"],
                doc_type=doc["doc_type"],
                db=db,
            )
            results.append(result)
            logger.info("Ingested: %s", doc["source"])
        except FileNotFoundError:
            error_msg = f"File not found: {file_path}"
            logger.warning(error_msg)
            errors.append(error_msg)
        except Exception as exc:
            error_msg = f"Failed to ingest {doc['source']}: {str(exc)}"
            logger.error(error_msg)
            errors.append(error_msg)

    total_inserted = sum(r.get("inserted", 0) for r in results)
    total_skipped = sum(1 for r in results if r.get("skipped"))

    return {
        "status": "complete",
        "total_inserted": total_inserted,
        "total_skipped": total_skipped,
        "results": results,
        "errors": errors,
    }


@router.get("/query")
async def query_compliance_endpoint(
    question: str,
    state: str = "NY",
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Test endpoint — query compliance docs directly without going through the agent.
    """
    answer = query_compliance(question=question, user_state=state, db=db)
    return {"question": question, "state": state, "answer": answer}


@router.get("/status")
async def compliance_status(db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Returns how many chunks are ingested per source — useful for verifying ingestion.
    """
    from sqlalchemy import text
    rows = db.execute(
        text("SELECT source, jurisdiction, COUNT(*) as chunk_count FROM compliance_chunks GROUP BY source, jurisdiction ORDER BY source")
    ).fetchall()

    return {
        "total_chunks": sum(r.chunk_count for r in rows),
        "breakdown": [
            {"source": r.source, "jurisdiction": r.jurisdiction, "chunks": r.chunk_count}
            for r in rows
        ]
    }
