# Git Workflow & Repository Architecture Guidelines

You must strictly adhere to the following Git workflow, remote-tracking rules, and working directory management instructions when executing, suggesting, or automating version control operations.

### Committer Identity
* **Mandatory Author:** All commits must be made as **"Fluxtruth"** with the email **"philipp.tschakert@gmail.com"** to prevent release issues. Ensure your local or global git config is set correctly (`git config user.name "Fluxtruth"` and `git config user.email "philipp.tschakert@gmail.com"`).

### Branch Architecture & Roles
* **`main` (Production):** Represents production-ready, stable, and tested code. Direct commits to `main` are strictly prohibited. Releases must be merged from `develop` into `main` and tagged with semantic versioning (e.g., `v1.11.6`).
* **`develop` (Integration):** The primary integration branch for ongoing development. All feature branches originate from and merge back into `develop`.
* **`feature/<name>` (Task Isolation):** Isolated branches for specific tasks, bugfixes, or features.
  * Always branch off from the latest local `develop` after pulling the newest remote state (`git checkout develop && git pull origin develop && git checkout -b feature/<name>`).
  * Merge back into `develop` using non-fast-forward merges (`--no-ff`) or via Pull Requests.

### Local vs. Remote Synchronization
* **Explicit Distinction:** 
  * Local branches (`main`, `develop`, `feature/*`) exist only on the local machine within the `.git` directory and represent the active workspace.
  * Remote tracking references (`origin/main`, `origin/develop`) reflect the mirrored state on GitHub/remote servers.
* **Tracking & Setup:**
  * Ensure local branches properly track their upstream remotes (`git checkout --track origin/<branch>` or `git checkout -b main origin/main` if `main` only exists remotely).
  * Always fetch remote changes (`git fetch origin`) before branching, merging, or releasing to verify parity between local references and `origin/*`.

### Working Directory Hygiene & Worktrees
* **Inspection:** Always verify local repository status using `git status` and `git diff` before staging changes.
* **Stashing:** If a branch switch is required with uncommitted changes in the working directory, use `git stash save "<message>"` instead of creating broken commits. Restore with `git stash pop`.
* **Git Worktrees:** For parallel branch work without context switching or unstashing, use `git worktree add .worktrees/<directory-name> <branch>`.
  * *Codebase Collaboration Rule (CRITICAL):* **NEVER edit code directly in the main repository.** You MUST create a dedicated worktree for the task IMMEDIATELY before starting any feature work, bug fixing, or refactoring: `git worktree add .worktrees/pm-[TaskName] -b feature/[TaskName] develop`. 
  * All coding, TDD, testing, and modifications must be performed inside this newly created worktree directory from the very beginning. DO NOT make any code modifications in the main folder.
  * *Cleanup:* Physically delete the worktree when done: `git worktree remove .worktrees/pm-[TaskName]`.
* **Artifacts & Secrets:** Never track build artifacts (`node_modules/`, `dist/`, `target/`, `.next/`), local configurations, or environment variables (`.env`, `.env.local`). Verify `.gitignore` compliance before staging.
