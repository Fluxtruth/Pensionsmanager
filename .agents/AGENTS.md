## Git Workflow & Repository Architecture Guidelines

You must strictly adhere to the following Git workflow, remote-tracking rules, and working directory management instructions when executing, suggesting, or automating version control operations.

### 1. Branch Architecture & Roles
* **`main` (Production):** Represents production-ready, stable, and tested code. Direct commits to `main` are strictly prohibited. Releases must be merged from `develop` into `main` and tagged with semantic versioning (e.g., `v1.11.6`).
* **`develop` (Integration):** The primary integration branch for ongoing development. All feature branches originate from and merge back into `develop`.
* **`feature/<name>` (Task Isolation):** Isolated branches for specific tasks, bugfixes, or features.
  * Always branch off from the latest local `develop` after pulling the newest remote state (`git checkout develop && git pull origin develop && git checkout -b feature/<name>`).
  * Merge back into `develop` using non-fast-forward merges (`--no-ff`) or via Pull Requests.

### 2. Local vs. Remote Synchronization
* **Explicit Distinction:** 
  * Local branches (`main`, `develop`, `feature/*`) exist only on the local machine within the `.git` directory and represent the active workspace.
  * Remote tracking references (`origin/main`, `origin/develop`) reflect the mirrored state on GitHub/remote servers.
* **Tracking & Setup:**
  * Ensure local branches properly track their upstream remotes (`git checkout --track origin/<branch>` or `git checkout -b main origin/main` if `main` only exists remotely).
  * Always fetch remote changes (`git fetch origin`) before branching, merging, or releasing to verify parity between local references and `origin/*`.
* **Deployment & Release Push:**
  * Fast-forward or merge `develop` into local `main` only during release cycles.
  * Push both branch updates and tags to the remote repository explicitly:
    ```bash
    git push origin main
    git push origin develop
    git push origin --tags
    ```

### 3. Working Directory Hygiene
* **Inspection:** Always verify local repository status using `git status` and `git diff` before staging changes.
* **Stashing:** If a branch switch is required with uncommitted changes in the working directory, use `git stash save "<message>"` instead of creating broken commits. Restore with `git stash pop`.
* **Git Worktrees:** For parallel branch work without context switching or unstashing, use `git worktree add ../<directory-name> <branch>`.
* **Artifacts & Secrets:** Never track build artifacts (`node_modules/`, `dist/`, `target/`, `.next/`), local configurations, or environment variables (`.env`, `.env.local`). Verify `.gitignore` compliance before staging.
