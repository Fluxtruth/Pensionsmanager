---
description: Comprehensive workflow for app releases including environment separation, version management, and Tauri/Vercel deployment.
---

# Master Workflow: Release Process

This workflow defines how to promote code from development to production and release new versions of the Tauri desktop client.

## 1. Environment Topology
We maintain strict separation between development and production data:
- **Development (Dev)**: 
  - **Supabase**: Dedicated dev project (`pensionmanager-dev`).
  - **Logic**: Feature branches and `dev` branch use these credentials.
- **Production (Prod)**:
  - **Supabase**: Isolated production project (`pensionmanager-prod`).
  - **Logic**: Only the `main` branch uses these credentials.
- **Preview (Vercel)**:
  - Every Pull Request creates a Vercel Preview deployment for functional verification before merging to `main`.

## 2. Version Synchronization
Before creating a release, the version string must be updated in these files:
- `package.json`: Main frontend version.
- `src-tauri/tauri.conf.json`: Tauri application version.
- `src-tauri/Cargo.toml`: Rust backend version.
- `src/app/konfiguration/page.tsx`: Update the hardcoded `appVersion` fallback (line 20).
- `src/components/Sidebar.tsx`: Ensure any displayed version strings are updated.

## 3. Deployment Flow (Tauri & Web)

### Step A: Merge to Main
- Merge approved feature branches into `dev`.
- Merge `dev` into `main` once stability is verified via E2E/Smoketests.

### Step B: Create Release Tag
To trigger the Tauri build pipeline and generate Windows binaries:
1. Create a tag: `git tag v1.X.Y` (e.g., `git tag v1.12.0`).
2. Push the tag: `git push origin --tags`.
3. GitHub Actions will automatically start the `release.yml` pipeline.

### Step C: Signature & Assets
- The pipeline uses `TAURI_SIGNING_PRIVATE_KEY` to sign binaries.
- The `update.json` is generated for the auto-updater.
- **Note**: Ensure `windows-x86_64` mapping is correct in the updater assets.

## 4. Final Verification
1. Verify the web version at `app.pensionsmanager.de`.
2. Open the Tauri client and check **Konfiguration > Software-Update** to see if the new version is detected.
3. Verify that the system connects to the **Production Supabase** in the final release build.

---
> [!IMPORTANT]
> Never skip the version bump in `src/app/konfiguration/page.tsx`, as this is a key visual indicator for the user.
