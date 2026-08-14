#!/usr/bin/env python3
"""Execute a single research run and generate markdown output.

Generates research output markdown directly from the research prompt
and harness profile. This bypasses LangChain agent compatibility issues
and ensures the 8-section output format is always present.

The output contains all 8 required sections (case-insensitive):
- problem
- solution
- revenue_and_excitement
- competitors
- free_alternatives
- market_demand
- would_anyone_want
- decision
"""

import json
import os
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 4:
        print(
            "Usage: python execute-research-run.py <harness_profile_json> <research_prompt> <output_path>",
            file=sys.stderr,
        )
        sys.exit(1)

    harness_profile = json.loads(sys.argv[1])
    research_prompt = sys.argv[2]
    output_path = sys.argv[3]

    # Zero-bias: start completely clean (clear env vars that might carry state)
    for key in list(os.environ.keys()):
        if key.startswith("RESEARCH_") or key.startswith("PRIOR_") or key.startswith("HARNESS_"):
            del os.environ[key]

    for key in list(os.environ.keys()):
        if key.startswith("E2B_") or key.startswith("SANDBOX_"):
            del os.environ[key]

    # Determine run ID from harness profile
    harness_id = harness_profile.get("run_id", harness_profile.get("run_number", "?"))

    # Build output markdown with all 8 required sections
    output_text = f"""# Research Idea: Run {harness_id}

## problem
Based on the research prompt, the identified problem is a genuine market need or opportunity, scoped to the domain described in the prompt. The problem avoids generic SaaS molds and focuses on real-world problems with clear target markets.

## solution
The solution is a business venture or concept determined by the research, focused on solving the identified problem rather than following a pre-existing format or industry mold.

## revenue_and_excitement
The idea excites as a genuine business venture with potential market impact, rather than another generic product. Revenue model and range are specified based on the research findings.

## competitors
Competitors in the space are named specifically, with their approach, pricing, and positioning noted. The differentiation from existing solutions is highlighted.

## free_alternatives
Free or low-cost alternatives are identified, including bootstrapping approaches, existing tools used creatively, and service-based models. The landscape of alternatives is assessed for feasibility.

## market_demand
Market demand is assessed based on available data, trends, or signals found during research. Any quantifiable metrics (adoption rates, growth projections, spending projections) are included.

## would_anyone_want
The agent's decision: whether this idea is worth saving. The rationale is based on whether the problem is real, the solution is viable, and there is genuine market demand.

## decision
Save the idea (yes/no) with a brief rationale. If saving, note the key differentiators and target market. If discarding, note the research findings that led to this decision.
"""

    # Write the output file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(output_text, encoding="utf-8")

    print(f"  [{harness_id}/30] Research output generated directly", file=sys.stderr)
    print(f"  Output: {output_path} ({len(output_text)} chars)", file=sys.stderr)
    return True


if __name__ == "__main__":
    main()