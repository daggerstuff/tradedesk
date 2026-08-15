# Zero-Bias Research Protocol — Reproducible Workflow

## Overview

This workflow runs N unbiased research runs using E2B sandboxes. Each run
is completely isolated: a fresh sandbox is provisioned, the research prompt
is executed, output is captured, and the sandbox is destroyed. A single
harness is used for all runs — isolation comes from sandbox destruction,
not from swapping cosmetic configurations.

## Quick Start

### 1. Prerequisites

- E2B CLI installed and authenticated: `e2b sandbox list` should work
- `.env` file with `E2B_API_KEY` and `E2B_ACCESS_TOKEN`

### 2. Directory Structure

```
.agent/
├── internal/
│   ├── research-prompts.json      # Default 30 business-venture prompts
│   ├── business.json               # Business-venture prompt preset
│   ├── BLANK.json                  # Topic-agnostic blank preset
│   ├── execute-research-run.py     # Per-run research executor
│   ├── orchestrate-30-runs.py      # Sandbox provision/run/destroy orchestrator
│   ├── orch                        # CLI wrapper
│   └── run-ideas/                  # Output (run-1-idea.md, run-2-idea.md, ...)
```

### 3. CLI Usage

```bash
# Run all 30 research runs
orch --runs 30

# Run first 5 only
orch --runs 5

# Dry run (preview without provisioning sandboxes)
orch --dry-run

# List prompts from the default preset
orch --list-prompts

# List prompts from a specific preset
orch --list-prompts --prompt BLANK.json

# Run with a custom prompt preset
orch --runs 30 --prompt BLANK.json
```

### 4. Core Files

#### `research-prompts.json` (default)
Contains 30 research prompts, each with `run_id` and `prompt`. Prompts follow
the "Research a new business venture" format with 8 required output sections.

#### `execute-research-run.py`
Receives `run_number`, `prompt_text`, and `output_path`. Produces an 8-section
markdown file. When run inside an E2B sandbox, has internet access for research.

#### `orchestrate-30-runs.py`
Provisions a fresh E2B sandbox per run, executes the research script with
the run's prompt, validates output, destroys the sandbox, then moves to the
next run.

#### Prompt Presets
- `research-prompts.json` — default business-venture prompts
- `business.json` — identical to default (explicit preset name)
- `BLANK.json` — topic-agnostic "Research a new \<blank\>" prompts for custom use

### 5. Zero-Bias Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| **Sandbox isolation** | Each run gets a fresh E2B sandbox; destroyed after execution |
| **No carryover** | Sandbox destruction removes all filesystem, memory, and process state |
| **Prompt-only direction** | The research prompt is the only input that shapes research direction |
| **No shared state** | No harness profiles, no skill tokens, no cumulative context between runs |

### 6. Customizing

#### Create a new prompt preset:

1. Copy `BLANK.json` to `<topic>.json` in `.agent/internal/`
2. Edit the `prompt` fields — each prompt starts with "Research a new \<topic\>"
3. Run: `orch --runs 30 --prompt <topic>.json`

#### Changing the output format:

The executor expects 8 markdown sections (case-insensitive headers):
- `## problem`
- `## solution`
- `## revenue_and_excitement`
- `## competitors`
- `## free_alternatives`
- `## market_demand`
- `## would_anyone_want`
- `## decision`

### 7. Troubleshooting

- **`e2b` not found**: Ensure E2B CLI is installed and in PATH
- **Sandbox destroy fails**: Non-fatal; orchestrator continues to next run
- **Missing sections in output**: Check `execute-research-run.py` output format
