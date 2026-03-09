"""
Custom ReAct output parser that handles the common 'Action: None' issue.

When the LLM wants to respond conversationally without using any tool, it
sometimes outputs 'Action: None' instead of 'Final Answer: ...'. The default
ReAct parser rejects this, causing an expensive retry loop. This parser
intercepts that case and converts the Thought text into a Final Answer.
"""

from __future__ import annotations

import re
from typing import Union

from langchain.agents import AgentOutputParser  # pyright: ignore[reportMissingImports]
from langchain_core.agents import AgentAction, AgentFinish  # pyright: ignore[reportMissingImports]
from langchain.agents.mrkl.output_parser import MRKLOutputParser  # pyright: ignore[reportMissingImports]


class RouteEasyOutputParser(AgentOutputParser):
    """
    Wraps the default ReAct/MRKL parser with special handling for:
    - Action: None / Action: N/A  → convert Thought to Final Answer
    - No 'Action:' line at all    → treat entire text as Final Answer
    """

    _default_parser: MRKLOutputParser = MRKLOutputParser()

    def parse(self, text: str) -> Union[AgentAction, AgentFinish]:
        # ── Case 1: Has "Final Answer:" — use default parser ──────────
        if "Final Answer:" in text:
            return self._default_parser.parse(text)

        # ── Case 2: Action is None / N/A / missing ────────────────────
        action_match = re.search(
            r"Action\s*:\s*(None|N/?A|none|n/?a)\s*\n",
            text,
            re.IGNORECASE,
        )
        if action_match:
            # Extract the last Thought as the response
            thought = self._extract_thought(text)
            if thought:
                return AgentFinish(
                    return_values={"output": thought},
                    log=text,
                )

        # ── Case 3: No "Action:" line at all — treat as final answer ─
        if "Action:" not in text and "Action :" not in text:
            cleaned = text.strip()
            # Try to extract just the Thought content
            thought = self._extract_thought(cleaned)
            return AgentFinish(
                return_values={"output": thought or cleaned},
                log=text,
            )

        # ── Default: delegate to the standard parser ──────────────────
        return self._default_parser.parse(text)

    def _extract_thought(self, text: str) -> str:
        """Extract the last Thought content from the LLM output."""
        # Clean the entire text of common ReAct leaks before extracting
        text = re.sub(r'Observation:', '', text)
        text = re.sub(r'Action Input:', '', text)
        
        # Find all Thought: lines and take the last one
        thoughts = re.findall(
            r"Thought\s*:\s*(.+?)(?=\n(?:Action|Thought|Final Answer|Observation)|$)",
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if thoughts:
            # Take the last thought, clean it up
            thought = thoughts[-1].strip()
            # Remove common prefixes the LLM adds
            for prefix in [
                "I should respond warmly",
                "The driver is ",
                "I now have enough information",
            ]:
                if thought.lower().startswith(prefix.lower()):
                    # The thought is reasoning, not a response — build a response
                    return ""
            
            # Final safety strip to guarantee no "Action: None" leaks
            thought = re.sub(r'(?i)Action\s*:\s*(?:None|N/?A|none|n/?a).*', '', thought).strip()
            return thought

        # If no explicit "Thought:" tag is found, strip all tags from the raw text completely
        # so we don't accidentally return reasoning.
        clean_text = text
        clean_text = re.sub(r'(?i)Thought:', '', clean_text)
        clean_text = re.sub(r'(?i)Action:', '', clean_text)
        clean_text = re.sub(r'(?i)Action Input:', '', clean_text)
        clean_text = re.sub(r'(?i)Observation:', '', clean_text)
        clean_text = re.sub(r'(?i)Final Answer:', '', clean_text)
        clean_text = re.sub(r'(?i)(?:None|N/?A|none|n/?a)', '', clean_text)
        return clean_text.strip()

    @property
    def _type(self) -> str:
        return "routeeasy-output-parser"
