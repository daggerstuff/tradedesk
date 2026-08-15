#!/usr/bin/env python3
"""Zero-bias research protocol orchestrator.

Provisions a fresh E2B sandbox per run, executes the research script with
the run's prompt, captures output, then destroys the sandbox. A single
harness is used for all runs — isolation comes from sandbox destruction,
not from swapping cosmetic configurations.
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional

RESEARCH_PROMPTS_PATH = Path("/home/vivi/tradedesk/.agent/internal/research-prompts.json")
OUTPUT_DIR = Path("/home/vivi/tradedesk/.agent/internal/run-ideas")
SCRIPT_PATH = Path("/home/vivi/tradedesk/.agent/internal/execute-research-run.py")
MAX_RUNS = 30
DEFAULT_TIMEOUT = 180


def load_prompts(prompt_file_path: Optional[str] = None) -> List[dict]:
    if prompt_file_path:
        path = (RESEARCH_PROMPTS_PATH.parent / prompt_file_path).resolve()
    else:
        path = RESEARCH_PROMPTS_PATH
    with open(path) as f:
        return json.load(f)["prompts"]


def provision_sandbox(run_number: int) -> Optional[str]:
    print(f"[{run_number}] Provisioning E2B sandbox...", file=sys.stderr)
    try:
        result = subprocess.run(
            ["e2b", "sandbox", "create", "--detach"],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr}", file=sys.stderr)
            return None

        sandbox_id = None
        for line in result.stdout.strip().split("\n"):
            if "Sandbox created with ID" in line:
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == "ID" and i + 1 < len(parts):
                        sandbox_id = parts[i + 1]
                        break
                if sandbox_id:
                    break

        if not sandbox_id:
            print(f"  ERROR: could not parse sandbox ID from output", file=sys.stderr)
            return None

        time.sleep(3)
        print(f"  Sandbox ready: {sandbox_id}", file=sys.stderr)
        return sandbox_id

    except subprocess.TimeoutExpired:
        print(f"  ERROR: sandbox creation timed out", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None


def execute_research_run(run_number: int, prompt: dict, sandbox_id: str) -> bool:
    prompt_text = prompt["prompt"]
    output_path = f".agent/internal/run-ideas/run-{run_number}-idea.md"

    print(f"  [{run_number}] Executing research...", file=sys.stderr)
    try:
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), str(run_number), prompt_text, output_path],
            capture_output=True, text=True, timeout=DEFAULT_TIMEOUT
        )
        if result.returncode != 0:
            print(f"  [!] Run {run_number} failed (exit {result.returncode})", file=sys.stderr)
            print(f"  stderr: {result.stderr[-500:]}", file=sys.stderr)
            return False

        output_file = Path(output_path)
        if not output_file.exists():
            print(f"  [!] Run {run_number}: no output file", file=sys.stderr)
            return False

        content = output_file.read_text(encoding="utf-8")
        required = ["problem", "solution", "revenue_and_excitement", "competitors",
                     "free_alternatives", "market_demand", "would_anyone_want", "decision"]
        missing = [s for s in required if s.lower() not in content.lower()]
        if missing:
            print(f"  [!] Run {run_number}: missing sections: {missing}", file=sys.stderr)
        else:
            print(f"  ✓ Run {run_number}: all sections present", file=sys.stderr)
        return True

    except subprocess.TimeoutExpired:
        print(f"  [!] Run {run_number} timed out after {DEFAULT_TIMEOUT}s", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  [!] Run {run_number} exception: {e}", file=sys.stderr)
        return False


def destroy_sandbox(sandbox_id: str) -> None:
    print(f"  Destroying sandbox: {sandbox_id}", file=sys.stderr)
    try:
        result = subprocess.run(
            ["e2b", "sandbox", "destroy", sandbox_id],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            print(f"  WARNING: destroy exit code {result.returncode}", file=sys.stderr)
    except Exception as e:
        print(f"  WARNING: destroy exception: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Zero-bias research protocol orchestrator")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--prompt", type=str, default=None,
                        help="Custom prompt JSON file (e.g., business.json, BLANK.json)")
    parser.add_argument("--max-runs", type=int, default=MAX_RUNS)
    args = parser.parse_args()

    prompts = load_prompts(args.prompt)

    if len(prompts) != MAX_RUNS:
        print(f"ERROR: Expected {MAX_RUNS} prompts, got {len(prompts)}")
        return

    if args.dry_run:
        print(f"DRY RUN: Would execute {args.max_runs} research runs")
        for i in range(1, args.max_runs + 1):
            ptext = prompts[i-1]["prompt"][:80].replace("\n", " ")
            print(f"  Run {i}: {ptext}...")
        print("No E2B sandboxes will be provisioned")
        return

    print(f"Starting {args.max_runs} research runs (single harness, isolated sandboxes)...")
    for run_number in range(1, args.max_runs + 1):
        print(f"\nRun {run_number}/{args.max_runs}")
        sandbox_id = provision_sandbox(run_number)
        if sandbox_id is None:
            print(f"FAILED: Could not provision sandbox for run {run_number}")
            continue

        success = execute_research_run(run_number, prompts[run_number - 1], sandbox_id)
        destroy_sandbox(sandbox_id)

        output_path = Path(f".agent/internal/run-ideas/run-{run_number}-idea.md")
        if success and output_path.exists():
            print(f"OK: Run {run_number} complete ({output_path.stat().st_size} bytes)")
        else:
            print(f"FAIL: Run {run_number} no output")


if __name__ == "__main__":
    main()
