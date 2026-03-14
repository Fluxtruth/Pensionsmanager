---
description: Standard workflow for collaborating on the codebase including Linear integration, TDD, and branch management.
---

# Codebase Collaboration Workflow

Use this workflow whenever you are asked to work on the codebase or implement new features.

## 1. Research & Context
- **Linear Team**: Always work within the **"Pensionsmanager"** team.
- **Linear Projects**: Always use `linear-mcp-server` to understand the feature context.
  - Call `list_projects` (filtering for the "Pensionsmanager" team if possible) to find if there's an active "Project" related to the task.
  - If no project exists and the task is significant, suggest creating one or ask the user.
- **Linear Issues**: Check for existing issues related to the task using `list_issues`.
  - If no issue exists, create one using `save_issue` assigned to the **"Pensionsmanager"** team.
  - Ensure the issue includes:
    - **Description**: Technical overview.
    - **User Story**: "As a [user], I want [feature], so that [benefit]".
    - **Acceptance Criteria**: List specific conditions that must be met.
- **TDD Preparation**: Before writing any code, list potential test cases in your `task.md` or as a comment. We follow Test-Driven Development.

## 2. Branch Management
- **Feature Branch**: Create a new feature branch starting from the `dev` branch.
  - Use naming convention: `feature/[issue-id]-[short-description]` (e.g., `feature/PEN-123-login-fix`).
  - Command: `git checkout dev`, `git pull`, `git checkout -b feature/...`

## 3. Planning & Implementation
- **Implementation Plan**: Create an `implementation_plan.md` artifact.
  - Detail the files to be modified/created.
  - Describe the logic changes.
  - Include the test cases identified in Step 1.
- **Execution**: Implement the changes following the approved plan.
- **Testing**: Run relevant tests (unit/integration) to verify the changes.

## 4. Finalization & Verification
- **Results**: Explain what was implemented and how it fulfills the acceptance criteria.
- **Smoketest / E2E**: 
  - Evaluate if a smoketest or E2E test (Playwright) is appropriate.
  - If yes, propose the test code and save it in the `tests/` directory (e.g., `tests/e2e/`).
- **Review**: Use `notify_user` to present the final `walkthrough.md` and any new tests.
