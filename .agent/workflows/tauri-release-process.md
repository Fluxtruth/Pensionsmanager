---
description: How to release a new version of the Tauri application via GitHub Actions
---

# Tauri Release Process

This workflow describes the necessary steps to successfully release a new version of the Tauri application, specifically to ensure that the automated GitHub Action pipeline correctly builds the installers and generates the `update.json` file for the in-app updater.

## Common Pitfalls & Requirements
1. **Version Mismatch**: The GitHub Action relies on the versions matching exactly between:
   - The git tag (`v1.0.2`)
   - The `version` field in `package.json`
   - The `version` field in `src-tauri/tauri.conf.json`
   - The `version` field in `src-tauri/Cargo.toml`
   If these do not match, the build will produce an artifact with the old version number in the filenames (e.g. `pensionsmanager_1.0.1_x64-setup.nsis.zip.sig`), but the Action script will search for the new version number coming from the tag (e.g. `1.0.2`), causing a "Signature file not found" error.
2. **Dependency Drift**: Ensure that `@tauri-apps/api` (and plugins) in `package.json` perfectly match the major/minor versions of `tauri` and `tauri-plugin-*` in `src-tauri/Cargo.toml`. If they drift (e.g., node module is 2.10.x but Cargo crate is 2.9.x), the Tauri CLI build will fail with a version mismatch error. Run `npm install @tauri-apps/api@latest ...` and `cargo update` inside `src-tauri` simultaneously to align them.

## Release Steps

1. **Bump Version Numbers**
   Manually update the version strings to the desired target version (e.g., `"1.0.3"`) in these three files:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`

2. **Commit Changes**
   Commit the version bump changes:
   ```bash
   git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
   git commit -m "chore: bump version to 1.0.3"
   ```

3. **Push to Remote**
   Push your changes to the target branch (e.g., `main`):
   ```bash
   git push origin main
   ```

4. **Tag and Release**
   Create an annotated tag matching the new version (including the `v` prefix) and push the tag. This is the trigger that starts the GitHub Action.
   ```bash
   git tag -a v1.0.3 -m "Release v1.0.3"
   git push origin v1.0.3
   ```

5. **Verify**
   Check the GitHub Actions tab to ensure the build finishes successfully, creates the draft release, and attaches the `update.json` and installer assets.
