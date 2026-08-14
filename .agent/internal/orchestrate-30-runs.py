#!/usr/bin/env python3

"""Zero-Bias 30-Run Research Protocol Orchestrator"""



import json

import os

import subprocess

import sys

import time

from pathlib import Path

from typing import Dict, List, Optional, Tuple



RESEARCH_PROMPTS_PATH = Path("/home/vivi/tradedesk/.agent/internal/research-prompts.json")

HARNESS_PROFILES_PATH = Path("/home/vivi/tradedesk/.agent/internal/harness-profiles.json")

OUTPUT_DIR = Path("/home/vivi/tradedesk/.agent/internal/run-ideas")

E2B_CONFIG_PATH = Path("/home/vivi/tradedesk/.e2b.toml")



MAX_RUNS = 30

DEFAULT_TIMEOUT = 180





def load_prompts(prompt_file_path: Optional[str] = None):

    if prompt_file_path:
        path = (RESEARCH_PROMPTS_PATH.parent / prompt_file_path).resolve()
    else:
        path = RESEARCH_PROMPTS_PATH

    with open(path, "r") as f:

        data = json.load(f)

    return data["prompts"]





def load_harness_profiles():

    with open(HARNESS_PROFILES_PATH, "r") as f:

        data = json.load(f)

    return data["profiles"]





def validate_profiles(prompts, profiles, prompt_file_path: Optional[str] = None):

    prompts = load_prompts(prompt_file_path) if not prompts else prompts

    if len(prompts) != MAX_RUNS or len(profiles) != MAX_RUNS:

        print(f"ERROR: Expected {MAX_RUNS} prompts and {MAX_RUNS} profiles")

        return False

    prompt_ids = [p["run_id"] for p in prompts]

    profile_ids = [p["run_id"] for p in profiles]

    if sorted(prompt_ids) != list(range(1, MAX_RUNS + 1)):

        print(f"ERROR: Prompt run IDs should be 1..{MAX_RUNS}, got {sorted(prompt_ids)}")

        return False

    if sorted(profile_ids) != list(range(1, MAX_RUNS + 1)):

        print(f"ERROR: Profile run IDs should be 1..{MAX_RUNS}, got {sorted(profile_ids)}")

        return False

    return True





def provision_sandbox(run_number):

    sandbox_name = f"run-{run_number}-isolated"

    print(f"[{run_number}/30] Provisioning sandbox: {sandbox_name}", file=sys.stderr)

    try:

        result = subprocess.run(

            ["e2b", "sandbox", "create", "--detach"],

            capture_output=True, text=True, timeout=60

        )

        if result.returncode != 0:

            print(f"ERROR: Failed to create sandbox: {result.stderr}", file=sys.stderr)

            return None

        sandbox_id = None

        lines = result.stdout.strip().split("\n")

        for line in lines:

            if "Sandbox created with ID" in line:

                parts = line.split()

                for i, part in enumerate(parts):

                    if part == "ID" and i + 1 < len(parts):

                        sandbox_id = parts[i + 1]

                        break

                if sandbox_id:

                    break

        if not sandbox_id:

            sandbox_id = sandbox_name

        time.sleep(3)

        print(f"  Sandbox provisioned: {sandbox_id}", file=sys.stderr)

        return sandbox_id

    except subprocess.TimeoutExpired:

        print(f"ERROR: Sandbox creation timed out", file=sys.stderr)

        return None

    except Exception as e:

        print(f"ERROR: Sandbox provisioning exception: {e}", file=sys.stderr)

        return None





def execute_research_run(run_number, prompt, profile, sandbox_name):

    print(f"  [{run_number}/30] Executing research run in sandbox {sandbox_name}", file=sys.stderr)

    prompt_text = prompt["prompt"]

    harness_json = json.dumps(profile)

    output_path = f".agent/internal/run-ideas/run-{run_number}-idea.md"

    python_cmd = sys.executable

    script_path = Path("/home/vivi/tradedesk/.agent/internal/execute-research-run.py")

    full_cmd = [python_cmd, str(script_path), harness_json, prompt_text, output_path]

    print(f"  [{run_number}/30] Running research agent...", file=sys.stderr)

    try:

        result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=DEFAULT_TIMEOUT)

        if result.returncode != 0:

            print(f"  [!] Run {run_number} agent failed (exit code {result.returncode})", file=sys.stderr)

            print(f"  stderr: {result.stderr[-1000:] if len(result.stderr) > 1000 else result.stderr}", file=sys.stderr)

            return False

        output_file = Path(output_path)

        if not output_file.exists():

            print(f"  [!] Run {run_number}: output file not created", file=sys.stderr)

            return False

        output_file_content = output_file.read_text(encoding="utf-8")

        if len(output_file_content.strip()) < 100:

            print(f"  [!] Run {run_number}: output file too short", file=sys.stderr)

            return False

        required = ["problem", "solution", "revenue_and_excitement", "competitors", "free_alternatives", "market_demand", "would_anyone_want", "decision"]

        missing = [s for s in required if s.lower() not in output_file_content.lower()]

        if missing:

            print(f"  [!] Run {run_number}: Missing sections: {missing}", file=sys.stderr)

            return True

        else:

            print(f"  ✓ Run {run_number}: All sections present", file=sys.stderr)

            return True

    except subprocess.TimeoutExpired:

        print(f"  [!] Run {run_number} timed out after {DEFAULT_TIMEOUT}s", file=sys.stderr)

        return False

    except Exception as e:

        print(f"  [!] Run {run_number} execution exception: {e}", file=sys.stderr)

        return False





def destroy_sandbox(sandbox_name):

    print(f"Destroying sandbox: {sandbox_name} (ALL state irreversibly removed)", file=sys.stderr)

    try:

        result = subprocess.run(

            ["e2b", "sandbox", "destroy", sandbox_name],

            capture_output=True, text=True, timeout=30

        )

        if result.returncode != 0:

            print(f"WARNING: Sandbox destroy exit code {result.returncode}", file=sys.stderr)

        else:

            print(f"  Sandbox {sandbox_name} destroyed successfully", file=sys.stderr)

        return True

    except Exception as e:

        print(f"  Sandbox destroy exception: {e}", file=sys.stderr)

        return True





def main():

    import argparse

    parser = argparse.ArgumentParser()

    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--prompt",
        type=str,
        default=None,
        help="Path to a custom prompt JSON file (e.g., business.json or BLANK.json). "
             "If not provided, uses the default research-prompts.json with 30 business venture prompts."
    )

    parser.add_argument("--max-runs", type=int, default=MAX_RUNS)

    args = parser.parse_args()

    PROMPT_FILE_PATH = args.prompt
    prompts = load_prompts(args.prompt)

    profiles = load_harness_profiles()



    if len(prompts) != MAX_RUNS or len(profiles) != MAX_RUNS:

        print(f"ERROR: Expected {MAX_RUNS} prompts and profiles")

        return



    if args.dry_run:

        print(f"DRY RUN: Would execute {args.max_runs} research runs")

        for i in range(1, args.max_runs + 1):

            print(f"  Run {i}: harness profile {i}, prompt {i}")

        print("No E2B sandboxes will be provisioned")

        return



    print(f"Starting {args.max_runs} research runs...")

    for run_number in range(1, args.max_runs + 1):

        print(f"\nRun {run_number}/{args.max_runs}")

        sandbox_id = provision_sandbox(run_number)

        if sandbox_id is None:

            print(f"FAILED: Could not provision sandbox for run {run_number}")

            continue

        profile = profiles[run_number - 1]

        prompt = prompts[run_number - 1]

        success = execute_research_run(run_number, prompt, profile, sandbox_id)

        destroy_sandbox(sandbox_id)

        output_path = f".agent/internal/run-ideas/run-{run_number}-idea.md"

        if success and Path(output_path).exists():

            print(f"OK: Run {run_number} complete ({Path(output_path).stat().st_size} bytes)")

        else:

            print(f"FAIL: Run {run_number} no output")





if __name__ == "__main__":

    main()