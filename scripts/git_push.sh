#!/usr/bin/env bash
# =============================================================================
# scripts/git_push.sh
#
# Stages and commits every changed file INDIVIDUALLY with a conventional
# commit message, then pushes every PUSH_EVERY commits.
#
# Conventional format: <type>(<scope>): <description>
#   Types : feat | fix | style | chore | docs | test | refactor
#   Scope : derived from file path
#
# Usage:
#   bash scripts/git_push.sh              # commit + push all changes
#   bash scripts/git_push.sh --dry-run    # preview without committing
#   PUSH_EVERY=3 bash scripts/git_push.sh # override push interval
#
# Never commits: .env*, node_modules/, .next/, dist/, submodules
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PUSH_EVERY="${PUSH_EVERY:-5}"
DRY_RUN=false
COMMIT_COUNT=0

# ── Parse flags ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run)        DRY_RUN=true ;;
    --push-every=*)   PUSH_EVERY="${arg#*=}" ;;
  esac
done

# ── Colour helpers ────────────────────────────────────────────────────────────
log()  { printf '\033[36m[git_push]\033[0m %s\n'          "$*"; }
ok()   { printf '\033[32m[git_push] OK\033[0m  %s\n'      "$*"; }
warn() { printf '\033[33m[git_push] WARN:\033[0m %s\n'    "$*" >&2; }
die()  { printf '\033[31m[git_push] ERROR:\033[0m %s\n'   "$*" >&2; exit 1; }

# ── Skip guard ────────────────────────────────────────────────────────────────
should_skip() {
  local f="$1"
  [[ "$f" == *".env"*          ]] && return 0
  [[ "$f" == *".env.local"*    ]] && return 0
  [[ "$f" == *"node_modules/"* ]] && return 0
  [[ "$f" == *".next/"*        ]] && return 0
  [[ "$f" == *"/dist/"*        ]] && return 0
  [[ "$f" == *".agents/skills"* ]] && return 0  # git submodule — skip
  return 1
}

# ── Derive conventional commit message ───────────────────────────────────────
derive_message() {
  local file="$1"
  local status="$2"   # M | A | D | R
  local type scope description

  # --- default type from git status ----------------------------------------
  case "$status" in
    D)   type="chore"    ;;
    R)   type="refactor" ;;
    *)   type="feat"     ;;
  esac

  # --- override type by file kind ------------------------------------------
  case "$file" in
    *.css|*.scss)                   type="style"    ;;
    *.md)                           type="docs"     ;;
    *.sql)                          type="chore"    ;;
    *.test.ts|*.spec.ts|*/__tests__/*) type="test"  ;;
    *.config.ts|*.config.js|*.config.mjs) type="chore" ;;
    scripts/*)                      type="chore"    ;;
  esac

  # --- scope from directory ------------------------------------------------
  case "$file" in
    src/components/wellness/*)      scope="wellness-ui"  ;;
    src/components/chat/*)          scope="chat-ui"      ;;
    src/components/features/*)      scope="features-ui"  ;;
    src/components/dashboard/*)     scope="dashboard-ui" ;;
    src/components/booking/*)       scope="booking-ui"   ;;
    src/components/doctor/*)        scope="doctor-ui"    ;;
    src/components/ui/*)            scope="ui"           ;;
    src/components/*)               scope="components"   ;;
    src/lib/wellness/*)             scope="wellness-lib" ;;
    src/lib/diagnosis/advanced/*)   scope="intelligence" ;;
    src/lib/diagnosis/*)            scope="diagnosis"    ;;
    src/lib/ayurveda/*)             scope="ayurveda"     ;;
    src/lib/chat/*)                 scope="chat-lib"     ;;
    src/lib/subscription/*)         scope="subscription" ;;
    src/lib/stripe/*)               scope="billing"      ;;
    src/lib/appointments/*)         scope="appointments" ;;
    src/lib/*)                      scope="lib"          ;;
    src/app/dashboard/consult/*)    scope="consult"      ;;
    src/app/dashboard/wellness/*)   scope="wellness"     ;;
    src/app/dashboard/family/*)     scope="family"       ;;
    src/app/dashboard/billing/*)    scope="billing"      ;;
    src/app/dashboard/*)            scope="dashboard"    ;;
    src/app/api/chat/*)             scope="api-chat"     ;;
    src/app/api/*)                  scope="api"          ;;
    src/app/tokens.css)             scope="tokens"       ;;
    src/app/globals.css)            scope="tokens"       ;;
    src/app/*)                      scope="app"          ;;
    supabase/migrations/*)          scope="db-migration" ;;
    supabase/*)                     scope="db"           ;;
    docs/project-management/*)      scope="pm-docs"      ;;
    docs/*)                         scope="docs"         ;;
    scripts/*)                      scope="scripts"      ;;
    public/*)                       scope="assets"       ;;
    *)                              scope="misc"         ;;
  esac

  # --- description: human-readable from filename ---------------------------
  local bn
  bn=$(basename "$file")
  bn="${bn%.*}"                                        # strip extension
  bn=$(echo "$bn" | tr '_-' '  ')                      # snake/kebab → spaces
  description=$(echo "$bn" | tr '[:upper:]' '[:lower:]')

  # --- well-known file overrides (highest priority) ------------------------
  case "$file" in
    src/app/tokens.css)
      type="style";  scope="tokens"
      description="add wellness repositioning design tokens" ;;
    src/lib/wellness/evidenceLabels.ts)
      type="feat";   scope="wellness-lib"
      description="add 5-type evidence label system" ;;
    src/lib/wellness/escalationEngine.ts)
      type="feat";   scope="wellness-lib"
      description="add SafetyAssessment to EscalationAlert bridge" ;;
    src/lib/wellness/contentTypes.ts)
      type="feat";   scope="wellness-lib"
      description="add wellness content card type definitions" ;;
    src/lib/wellness/index.ts)
      type="feat";   scope="wellness-lib"
      description="add wellness lib barrel export" ;;
    src/components/wellness/EvidenceLabelBadge.tsx)
      type="feat";   scope="wellness-ui"
      description="add evidence label badge component" ;;
    src/components/wellness/EscalationAlert.tsx)
      type="feat";   scope="wellness-ui"
      description="add non-dismissible L1-L5 escalation alert" ;;
    src/components/wellness/ContentCard.tsx)
      type="feat";   scope="wellness-ui"
      description="add 8-field wellness content card component" ;;
    src/components/wellness/index.ts)
      type="feat";   scope="wellness-ui"
      description="add wellness components barrel export" ;;
    src/lib/diagnosis/advanced/intelligenceTypes.ts)
      type="feat";   scope="intelligence"
      description="add escalationLevel field to SafetyAssessment" ;;
    src/lib/diagnosis/advanced/SafetyGuardEnhancer.ts)
      type="feat";   scope="intelligence"
      description="populate escalationLevel in safety assessment output" ;;
    docs/project-management/content-audit-report.md)
      type="docs";   scope="pm-docs"
      description="add phase 1 content audit report" ;;
    docs/Healio_Enhanced_Repositioning_Plan.md)
      type="docs";   scope="docs"
      description="add enhanced repositioning plan v2" ;;
    docs/project-management/Healio_Traditional_Wellness_Repositioning_Plan.md)
      type="docs";   scope="pm-docs"
      description="add traditional wellness repositioning plan" ;;
    scripts/git_push.sh)
      type="chore";  scope="scripts"
      description="add per-file conventional commit and auto-push script" ;;
  esac

  echo "${type}(${scope}): ${description}"
}

# ── Push with upstream fallback ──────────────────────────────────────────────
do_push() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[dry-run] would push now"
    return
  fi
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  if git rev-parse @{u} &>/dev/null 2>&1; then
    git push
    ok "Pushed '${branch}'."
  else
    log "No upstream -- pushing with: git push -u origin ${branch}"
    git push -u origin "${branch}"
    ok "Upstream set and pushed '${branch}'."
  fi
}

# ── Collect changed files ────────────────────────────────────────────────────
# Outputs lines of: "<status_char> <filepath>"
collect_files() {
  git status --porcelain | tr -d '\r' | while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    local xy="${line:0:2}"
    local rest="${line:3}"

    # Rename lines: "R  old -> new" — keep only destination
    if [[ "${xy:0:1}" == "R" || "${xy:1:1}" == "R" ]]; then
      rest="${rest##* -> }"
    fi

    # Skip bare directory entries (untracked dirs shown as "dir/")
    [[ "$rest" == */ ]] && continue

    # Determine status char
    local sc
    if   [[ "$xy" == "??" ]];          then sc="A"
    elif [[ "${xy:0:1}" != " " ]];     then sc="${xy:0:1}"
    else                                    sc="${xy:1:1}"
    fi

    printf '%s %s\n' "$sc" "$rest"
  done || true
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  git rev-parse --git-dir &>/dev/null || die "Not inside a git repository."

  log "Scanning for changes…"
  [[ "$DRY_RUN" == "true" ]] && warn "DRY-RUN enabled -- no commits or pushes will be made."

  local -a entries=()
  while IFS= read -r entry; do
    [[ -n "$entry" ]] && entries+=("$entry")
  done < <(collect_files)

  if [[ ${#entries[@]} -eq 0 ]]; then
    log "Nothing to commit — working tree is clean."
    exit 0
  fi
  log "Found ${#entries[@]} changed item(s)."
  echo ""

  for entry in "${entries[@]}"; do
    local sc="${entry:0:1}"
    local file="${entry:2}"

    # ── Guard: skip sensitive / unwanted files ───────────────────────────
    if should_skip "$file"; then
      warn "SKIP (sensitive/submodule): $file"
      continue
    fi

    # ── Guard: file must exist for non-deletions ─────────────────────────
    if [[ "$sc" != "D" && ! -e "$file" ]]; then
      warn "SKIP (not found on disk): $file"
      continue
    fi

    # ── Stage the file ───────────────────────────────────────────────────
    if [[ "$DRY_RUN" != "true" ]]; then
      git add -- "$file"

      # Confirm something was actually staged for this file
      if ! git diff --cached --name-only | grep -qF "$file"; then
        warn "SKIP (no effective change after staging): $file"
        git restore --staged -- "$file" 2>/dev/null || true
        continue
      fi
    fi

    local msg
    msg=$(derive_message "$file" "$sc")

    # ── Commit or dry-run log ────────────────────────────────────────────
    if [[ "$DRY_RUN" == "true" ]]; then
      log "[dry-run] WOULD COMMIT: $msg"
      log "          file        : $file"
      echo ""
      continue
    fi

    git commit -m "$msg"
    COMMIT_COUNT=$(( COMMIT_COUNT + 1 ))
    ok "[${COMMIT_COUNT}] ${msg}"

    # ── Push every PUSH_EVERY commits ────────────────────────────────────
    if (( COMMIT_COUNT % PUSH_EVERY == 0 )); then
      echo ""
      log "--- ${PUSH_EVERY}-commit interval reached -- pushing... ---"
      do_push
      echo ""
    fi
  done

  # ── Final push for any remaining unpushed commits ────────────────────────
  if [[ "$DRY_RUN" != "true" && "$COMMIT_COUNT" -gt 0 ]]; then
    local unpushed=0
    if git rev-parse @{u} &>/dev/null 2>&1; then
      unpushed=$(git log --oneline @{u}.. 2>/dev/null | wc -l | tr -d ' ' || echo 0)
    else
      unpushed=$COMMIT_COUNT
    fi
    if [[ "$unpushed" -gt 0 ]]; then
      echo ""
      log "--- Pushing remaining ${unpushed} commit(s)... ---"
      do_push
    fi
  fi

  echo ""
  if [[ "$DRY_RUN" == "true" ]]; then
    log "Dry-run complete -- no commits made."
  else
    ok "All done. ${COMMIT_COUNT} commit(s) created."
  fi
}

main "$@"
