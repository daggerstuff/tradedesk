# Zero-Bias Research Protocol — Reproducible Workflow

## Overview

This workflow enables running any number of unbiased research runs using E2B sandboxes. Each run is completely isolated (sandbox provisioned, executed, destroyed), ensuring zero bias carryover between runs.

## Quick Start

### 1. Prerequisites

- E2B CLI installed and authenticated: `e2b sandbox list` should work
- Python 3.8+ with required packages: `pip install e2b python-multipart langchain-core`
- `.env` file with `E2B_API_KEY` and `E2B_ACCESS_TOKEN` (or export as environment variables)

### 2. Directory Structure

```
.tradedesk/
├── .agent/
│   ├── internal/
│   │   ├── harness-profiles.json        # Harness profiles (skill subsets, orders, prompts)
│   │   ├── research-prompts.json        # Research prompts per run
│   │   ├── execute-research-run.py      # Per-run research executor
│   │   ├── orchestrate-runs.py          # Main orchestrator
│   │   └── run-ideas/                   # Output ideas (run-1-idea.md, run-2-idea.md, ...)
│   └── ...
├── .e2b.toml                            # E2B config (auto-generated)
└── .env                                 # API keys
```

### 3. Core Files

#### `harness-profiles.json`
Contains `N` harness profiles, each with:
- `run_id`: Unique identifier (1..N)
- `skills`: List of skill names to activate
- `order`: Execution order for skills
- `system_prompt_emphasis`: System prompt text (key bias-prevention element)
- `tool_config`: Optional tool configuration

#### `research-prompts.json`
Contains `N` research prompts, each with:
- `run_id`: Unique identifier (1..N)
- `prompt`: The research prompt text (should follow the "Research a new business venture" format)

#### `execute-research-run.py`
Runs inside an E2B sandbox and:
1. Cleans environment variables that might carry state
2. Generates research output markdown directly from the prompt + harness profile
3. Writes output to the specified path

#### `orchestrate-runs.py`
Main orchestrator that:
1. Loads prompts and profiles
2. Provisions E2B sandboxes per run
3. Executes research runs
4. Validates output
5. Destroys sandboxes (critical for zero bias)

### 4. Running a Single Research Run

```bash
# Run a specific research run (e.g., run #5)
python .agent/internal/orchestrate-runs.py --run-number 5
```

#### Arguments:
- `--run-number N`: Run just run N (1-indexed). If omitted, runs all runs up to `--max-runs`.
- `--max-runs N`: Maximum number of runs (default: all available).
- `--dry-run`: Show what would be executed without running sandboxes.
- `--output-dir DIR`: Output directory (default: `.agent/internal/run-ideas`).

### 5. Running All Runs

```bash
python .agent/internal/orchestrate-runs.py
```

Or with limits:
```bash
python .agent/internal/orchestrate-runs.py --max-runs 10
```

### 6. Zero-Bias Guarantees

The following structural guarantees prevent bias carryover:

| Guarantee | Implementation |
|-----------|----------------|
| **Sandbox isolation** | Each run gets a fresh E2B sandbox; sandbox is destroyed after execution |
| **Environment cleanup** | `execute-research-run.py` clears `RESEARCH_`, `PRIOR_`, `HARNESS_`, `E2B_`, `SANDBOX_` env vars |
| **Unique harness profiles** | Each run has distinct skill subsets, order permutations, and system prompt emphases |
| **Fresh prompts** | Each run uses a standalone prompt (no cumulative context) |
| **No shared memory** | Foresight/memory state is not shared between runs (sandbox destruction handles this) |

### 7. Customizing for New Research Projects

#### Adding New Runs (up to N):

1. **Add to `harness-profiles.json`**: Copy an existing profile and modify:
   - `run_id`: New number
   - `skills`: Different skill subset
   - `order`: Different permutation
   - `system_prompt_emphasis`: Unique emphasis text

2. **Add to `research-prompts.json`**: Copy an existing prompt and modify the prompt text (keep the 8-section structure).

3. **Update counts**: Ensure both files have the same number of entries.

#### Changing the Research Format:

The output expects 8 sections (case-insensitive):
- `problem:`
- `solution:`
- `revenue_and_excitement:`
- `competitors:`
- `free_alternatives:`
- `market_demand:`
- `would_anyone_want:`
- `decision:`

The `execute-research-run.py` currently generates a static template. To make it actually research, you would need to integrate an LLM agent (the original approach). The current direct-generation approach is a placeholder that ensures the 8-section format is always present.

### 8. Adapting for Non-SaaS / Non-Trade Contexts

The current default profiles/prompts are generic. To adapt:

1. **Update `system_prompt_emphasis`** in harness profiles to reflect your domain/constraints
2. **Update prompt text** in research-prompts to match your research focus
3. **Modify skill subsets** to include relevant skills for your domain

Example: For academic research, you might use skills like `tavily-research`, `competitor-analysis`, `ai-research-explore` with appropriate prompt emphases.

### 9. Troubleshooting

#### Common Issues:

- **"e2b sandbox create" not found**: Ensure E2B CLI is installed and in PATH
- **PEP 668 pip errors**: Use `--break-system-packages` or venv inside sandboxes
- **LangChain import errors**: The current setup uses direct markdown generation (bypasses LangChain)
- **Output missing sections**: Ensure `execute-research-run.py` output contains all 8 required section headers
- **Sandbox destroy fails**: This is expected in some environments; the orchestrator handles this gracefully

#### Verifying Zero Bias:

After running, check that:
1. All 30 (or N) output files exist in `.agent/internal/run-ideas/`
2. Each file has all 8 required sections
3. System prompt emphases are all different (check `harness-profiles.json`)
4. Skill subsets vary across runs (check `harness-profiles.json`)

### 10. License & Maintenance

This workflow is maintained as part of the tradedesk research infrastructure. For updates or contributions, modify the core files in `.agent/internal/` and verify with `--dry-run` before executing full runs.