"""
RoutAura CDL Compliance RAG Evaluation Script
Run from backend/ directory:
    python scripts/evaluate_compliance_rag.py

Requirements:
    uv add ragas datasets
"""

from __future__ import annotations

import json
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.compliance_service import query_compliance

# ─────────────────────────────────────────────
# STEP 1 — TEST SET
# 30 questions grounded in your actual CDL manual chunks
# Answer is what you expect the RAG to return
# Source is the document it should retrieve from
# ─────────────────────────────────────────────

TEST_SET = [
    # Air Brakes
    {
        "question": "What do I check on air brakes during pre-trip inspection?",
        "ground_truth": "Check air pressure build-up rate, low air warning signal, spring brakes, air leakage rate, brake pedal travel, and parking brake.",
        "expected_source": "NY CDL Manual — Air Brakes",
    },
    {
        "question": "What is the air leakage rate for a single vehicle?",
        "ground_truth": "The air leakage rate for a single vehicle should not be more than 3 psi per minute with the engine off and brakes released.",
        "expected_source": "NY CDL Manual — Air Brakes",
    },
    {
        "question": "What are slack adjusters?",
        "ground_truth": "Slack adjusters are part of the air brake system that connect the push rod to the brake camshaft. They adjust the distance the push rod travels.",
        "expected_source": "NY CDL Manual — Air Brakes",
    },
    {
        "question": "How do you test the low pressure warning signal?",
        "ground_truth": "With the engine off, reduce air pressure by fanning the brakes. The warning signal should activate before pressure drops below 60 psi.",
        "expected_source": "NY CDL Manual — Air Brakes",
    },
    {
        "question": "What is a dual air brake system?",
        "ground_truth": "A dual air brake system has two separate air brake systems that use a single set of brake controls. One system operates the rear axle brakes and the other operates the front axle brakes.",
        "expected_source": "NY CDL Manual — Air Brakes",
    },

    # Railroad Crossings
    {
        "question": "What is the protocol when approaching a railroad crossing with passengers?",
        "ground_truth": "Stop between 15 and 50 feet before the nearest rail. Turn off noisy equipment, open the door and window, listen and look in both directions before proceeding. Never shift gears while crossing.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "When must a bus driver stop at a railroad crossing?",
        "ground_truth": "A bus driver must always stop at railroad crossings, unless the crossing is marked as exempt.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "Can you shift gears while crossing railroad tracks?",
        "ground_truth": "No. Never shift gears while crossing railroad tracks.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },

    # Pre-Trip Inspection
    {
        "question": "What are the steps of a pre-trip inspection?",
        "ground_truth": "A pre-trip inspection covers engine compartment, cab check, lights, steering, brakes, tires, mirrors, coupling devices, and cargo securement.",
        "expected_source": "NY CDL Manual — Pre-Trip Inspection",
    },
    {
        "question": "What do you check in the engine compartment during pre-trip?",
        "ground_truth": "Check oil level, coolant level, power steering fluid, windshield washer fluid, battery, belts and hoses, and look for leaks.",
        "expected_source": "NY CDL Manual — Pre-Trip Inspection",
    },
    {
        "question": "How do you check tire condition during pre-trip inspection?",
        "ground_truth": "Check for minimum tread depth, cuts or damage, proper inflation, and ensure no tires are flat or leaking. Check that valve stems are not damaged.",
        "expected_source": "NY CDL Manual — Pre-Trip Inspection",
    },
    {
        "question": "What brake check is done during pre-trip inspection?",
        "ground_truth": "Test parking brake by pulling against it in low gear. Test service brakes at 5 mph and apply firmly, noting any pulling or delayed stopping.",
        "expected_source": "NY CDL Manual — Pre-Trip Inspection",
    },

    # School Bus / Article 19-A
    {
        "question": "What is Article 19-A?",
        "ground_truth": "Article 19-A is a New York State law that establishes safety requirements for school bus drivers, including annual physical examinations and road tests.",
        "expected_source": "NY Article 19-A Guide",
    },
    {
        "question": "What are the requirements for school bus drivers under Article 19-A?",
        "ground_truth": "School bus drivers must pass an annual physical examination, annual road test, and meet other safety requirements established under Article 19-A.",
        "expected_source": "NY Article 19-A Guide",
    },
    {
        "question": "What should a school bus driver do when students are crossing the road?",
        "ground_truth": "The driver must ensure students cross at least 10 feet in front of the bus, activate warning lights, and watch that all students clear the roadway before moving.",
        "expected_source": "NY CDL Manual — School Bus",
    },
    {
        "question": "What is the evacuation procedure for a school bus?",
        "ground_truth": "In an emergency, students should evacuate through the rear emergency door. The driver should direct students at least 100 feet from the bus to a safe location.",
        "expected_source": "NY CDL Manual — School Bus",
    },

    # Cargo / Combination Vehicles
    {
        "question": "How often should cargo be inspected during a trip?",
        "ground_truth": "Cargo must be inspected within the first 50 miles of the trip, then every 3 hours or 150 miles, and after every break.",
        "expected_source": "NY CDL Manual — Transporting Cargo",
    },
    {
        "question": "What is the minimum number of tie-downs for cargo?",
        "ground_truth": "Use at least one tie-down for every 10 feet of cargo. All cargo must have at least two tie-downs regardless of length.",
        "expected_source": "NY CDL Manual — Transporting Cargo",
    },
    {
        "question": "What is a converter dolly?",
        "ground_truth": "A converter dolly is a vehicle with one or two axles and a fifth wheel used to convert a semi-trailer to a full trailer.",
        "expected_source": "NY CDL Manual — Doubles and Triples",
    },
    {
        "question": "What is the correct order for uncoupling a double?",
        "ground_truth": "Park on level ground, apply brakes, chock wheels of rear trailer, lower landing gear, disconnect air and electrical lines, then release fifth wheel latch.",
        "expected_source": "NY CDL Manual — Doubles and Triples",
    },

    # Driving Safely
    {
        "question": "What is the proper following distance for a commercial vehicle?",
        "ground_truth": "Allow one second for every 10 feet of vehicle length at speeds below 40 mph. Add one more second for speeds above 40 mph.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "What should you do if your brakes fail on a downhill grade?",
        "ground_truth": "Look for an escape ramp. If none is available, try to slow the vehicle using engine braking, friction, or sideswiping a guardrail as a last resort.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "What is hydroplaning and how do you correct it?",
        "ground_truth": "Hydroplaning occurs when tires ride on a thin film of water. To correct, ease off the accelerator and avoid braking until the vehicle slows and tires regain contact.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "What are the signs of tire failure while driving?",
        "ground_truth": "Signs include a loud bang, thumping sound, vehicle pulling to one side, and vibration. React by holding the steering wheel firmly and slowing gradually.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },
    {
        "question": "What is the proper way to use turn signals when changing lanes?",
        "ground_truth": "Signal early, check mirrors, check blind spots, and only change lanes when it is safe. Cancel the signal after completing the lane change.",
        "expected_source": "NY CDL Manual — Driving Safely",
    },

    # Combination Vehicles
    {
        "question": "What is the tractor protection valve?",
        "ground_truth": "The tractor protection valve keeps air in the tractor if the trailer breaks away or develops a bad leak. It closes automatically if air pressure drops too low.",
        "expected_source": "NY CDL Manual — Combination Vehicles",
    },
    {
        "question": "How do you check fifth wheel coupling?",
        "ground_truth": "After coupling, tug the tractor forward with the trailer brakes on. Check that the fifth wheel jaws are closed around the kingpin and the locking lever is in the locked position.",
        "expected_source": "NY CDL Manual — Combination Vehicles",
    },
    {
        "question": "What is offtracking?",
        "ground_truth": "Offtracking is when the rear wheels of a vehicle follow a different path than the front wheels during a turn. Longer vehicles offtrack more.",
        "expected_source": "NY CDL Manual — Combination Vehicles",
    },

    # Out of scope — should trigger refusal
    {
        "question": "What is the speed limit on the New Jersey Turnpike?",
        "ground_truth": "REFUSAL_EXPECTED",
        "expected_source": None,
    },
    {
        "question": "How do I change a car tire?",
        "ground_truth": "REFUSAL_EXPECTED",
        "expected_source": None,
    },
]


# ─────────────────────────────────────────────
# STEP 2 — RETRIEVAL EVALUATION
# ─────────────────────────────────────────────

def evaluate_retrieval(db: Session) -> dict:
    """
    Tests whether the correct source document is retrieved
    in the top 5 results for each question.
    """
    print("\n" + "="*60)
    print("STEP 2: RETRIEVAL EVALUATION")
    print("="*60)

    hits = 0
    misses = []
    refusal_correct = 0
    refusal_incorrect = 0

    in_scope = [q for q in TEST_SET if q["ground_truth"] != "REFUSAL_EXPECTED"]
    out_of_scope = [q for q in TEST_SET if q["ground_truth"] == "REFUSAL_EXPECTED"]

    for item in in_scope:
        from sqlalchemy import text
        from app.services.compliance_service import SIMILARITY_THRESHOLD
        from app.services.vector_service import embed

        question_embedding = embed(item["question"])
        state = "NY"

        rows = db.execute(
            text("""
                SELECT
                    source,
                    1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
                FROM compliance_chunks
                WHERE jurisdiction IN ('federal', 'all', :state)
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT 5
            """),
            {
                "embedding": str(question_embedding),
                "state": state,
            }
        ).fetchall()

        sources_returned = [r.source for r in rows]
        best_similarity = float(rows[0].similarity) if rows else 0.0

        if item["expected_source"] in sources_returned:
            hits += 1
            status = "✅ HIT"
        else:
            misses.append({
                "question": item["question"],
                "expected": item["expected_source"],
                "got": sources_returned,
                "best_similarity": best_similarity
            })
            status = "❌ MISS"

        print(f"{status} | sim={best_similarity:.3f} | {item['question'][:60]}")

    # Out of scope — should be refused (similarity below threshold)
    for item in out_of_scope:
        result = query_compliance(item["question"], "NY", db)
        if "cannot find" in result.lower():
            refusal_correct += 1
            print(f"✅ CORRECTLY REFUSED | {item['question'][:60]}")
        else:
            refusal_incorrect += 1
            print(f"❌ SHOULD HAVE REFUSED | {item['question'][:60]}")

    hit_rate = hits / len(in_scope)

    print(f"\n--- RETRIEVAL RESULTS ---")
    print(f"Hit Rate: {hits}/{len(in_scope)} = {hit_rate:.2%}")
    print(f"Correct Refusals: {refusal_correct}/{len(out_of_scope)}")

    if misses:
        print(f"\nMISSED QUESTIONS:")
        for m in misses:
            print(f"  Q: {m['question'][:60]}")
            print(f"  Expected: {m['expected']}")
            print(f"  Got: {m['got']}")
            print(f"  Best similarity: {m['best_similarity']:.3f}")

    return {
        "hit_rate": hit_rate,
        "hits": hits,
        "total_in_scope": len(in_scope),
        "refusal_correct": refusal_correct,
        "refusal_total": len(out_of_scope),
        "misses": misses
    }


# ─────────────────────────────────────────────
# STEP 3 — RAGAS EVALUATION
# Faithfulness + Answer Relevancy + Context Recall
# ─────────────────────────────────────────────

def evaluate_with_ragas(db: Session) -> dict:
    """
    Uses RAGAS framework to evaluate faithfulness,
    answer relevancy, and context recall.
    """
    print("\n" + "="*60)
    print("STEP 3: RAGAS EVALUATION")
    print("="*60)

    try:
        from ragas import evaluate as ragas_evaluate
        from ragas.metrics.collections import faithfulness, answer_relevancy, context_recall
        from datasets import Dataset
        from langchain_groq import ChatGroq
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
    except ImportError:
        print("⚠️  RAGAS not installed. Run: uv add ragas datasets langchain-groq")
        print("Skipping RAGAS evaluation.")
        return {}

    questions = []
    answers = []
    contexts = []
    ground_truths = []

    in_scope = [q for q in TEST_SET if q["ground_truth"] != "REFUSAL_EXPECTED"]

    print(f"Running RAG pipeline for {len(in_scope)} questions...")

    for item in in_scope:
        question = item["question"]

        # Get retrieved context
        context_str = query_compliance(question, "NY", db, top_k=5)

        # Get generated answer from LLM
        import groq
        client = groq.Groq(api_key=os.getenv("GROQ_API_KEY_1"))

        answer_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a CDL compliance assistant. Answer using ONLY the provided context."
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context_str}\n\nQuestion: {question}"
                }
            ]
        )

        answer = answer_response.choices[0].message.content

        questions.append(question)
        answers.append(answer)
        contexts.append([context_str])
        ground_truths.append(item["ground_truth"])

        print(f"  ✓ {question[:60]}")

    # Build RAGAS dataset
    dataset = Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths,
    })

    # Use Groq as judge LLM, fastembed for embeddings
    judge_llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY_1")
    )
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")

    print("\nRunning RAGAS scoring...")
    results = ragas_evaluate(
        dataset=dataset,
        metrics=[faithfulness, answer_relevancy, context_recall],
        llm=judge_llm,
        embeddings=embeddings,
    )

    print(f"\n--- RAGAS RESULTS ---")
    print(f"Faithfulness:      {results['faithfulness']:.3f}")
    print(f"Answer Relevancy:  {results['answer_relevancy']:.3f}")
    print(f"Context Recall:    {results['context_recall']:.3f}")

    return {
        "faithfulness": results["faithfulness"],
        "answer_relevancy": results["answer_relevancy"],
        "context_recall": results["context_recall"],
    }


# ─────────────────────────────────────────────
# STEP 4 — THRESHOLD TUNING
# Find optimal similarity threshold
# ─────────────────────────────────────────────

def evaluate_threshold_tuning(db: Session) -> dict:
    """
    Tests different similarity thresholds and measures
    coverage vs accuracy tradeoff.
    """
    print("\n" + "="*60)
    print("STEP 4: THRESHOLD TUNING")
    print("="*60)

    thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]
    in_scope = [q for q in TEST_SET if q["ground_truth"] != "REFUSAL_EXPECTED"]
    out_of_scope = [q for q in TEST_SET if q["ground_truth"] == "REFUSAL_EXPECTED"]

    results = []

    for threshold in thresholds:
        answered = 0
        refused_in_scope = 0
        correctly_refused_out_of_scope = 0

        for item in in_scope:
            result = query_compliance(
                item["question"], "NY", db,
                top_k=5,
                threshold_override=threshold
            )
            if "cannot find" in result.lower():
                refused_in_scope += 1
            else:
                answered += 1

        for item in out_of_scope:
            result = query_compliance(
                item["question"], "NY", db,
                top_k=5,
                threshold_override=threshold
            )
            if "cannot find" in result.lower():
                correctly_refused_out_of_scope += 1

        coverage = answered / len(in_scope)
        refusal_accuracy = correctly_refused_out_of_scope / len(out_of_scope)

        results.append({
            "threshold": threshold,
            "coverage": coverage,
            "refusal_accuracy": refusal_accuracy,
            "answered": answered,
            "refused_in_scope": refused_in_scope,
        })

        print(f"threshold={threshold} | coverage={coverage:.2%} | refusal_accuracy={refusal_accuracy:.2%} | answered={answered}/{len(in_scope)}")

    # Find best threshold — maximize coverage while keeping refusal accuracy high
    best = max(results, key=lambda x: x["coverage"] + x["refusal_accuracy"])
    print(f"\n✅ Recommended threshold: {best['threshold']} (coverage={best['coverage']:.2%}, refusal_accuracy={best['refusal_accuracy']:.2%})")

    return {"threshold_results": results, "recommended_threshold": best["threshold"]}


# ─────────────────────────────────────────────
# STEP 5 — SAVE RESULTS
# ─────────────────────────────────────────────

def save_results(results: dict) -> None:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"eval_results_{timestamp}.json"
    path = os.path.join(os.path.dirname(__file__), filename)

    with open(path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Results saved to {path}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("RoutAura CDL Compliance RAG Evaluation")
    print("="*60)

    db: Session = SessionLocal()

    try:
        all_results = {}

        # Step 2 — Retrieval
        retrieval_results = evaluate_retrieval(db)
        all_results["retrieval"] = retrieval_results

        # Step 3 — RAGAS (commented out — run manually when needed, uses API credits)
        # ragas_results = evaluate_with_ragas(db)
        # if ragas_results:
        #     all_results["ragas"] = ragas_results

        # Step 4 — Threshold tuning (commented out — run manually when needed)
        # threshold_results = evaluate_threshold_tuning(db)
        # all_results["threshold_tuning"] = threshold_results

        # Step 5 — Save
        save_results(all_results)

        # Final summary
        print("\n" + "="*60)
        print("FINAL SUMMARY")
        print("="*60)
        print(f"Hit Rate:          {retrieval_results['hit_rate']:.2%}")
        print(f"Correct Refusals:  {retrieval_results['refusal_correct']}/{retrieval_results['refusal_total']}")

    finally:
        db.close()
