# Release Workflow

When deploying a new version to Production, the following steps must be strictly adhered to:

1. **Pre-flight Checks:** 
   Before initiating any release, always run local checks to catch errors early:
   ```bash
   npm run lint
   npm run typecheck
   ```
2. **Version Bump:** 
   Ensure the version is consistently updated across all configuration files:
   - `package.json` (Use `npm version patch --no-git-tag-version`)
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
3. **Commit Version Changes:**
   Commit the bumped versions in `develop`.
4. **Merge to Main:**
   Merge `develop` into `main` using a non-fast-forward merge (`--no-ff`):
   ```bash
   git checkout main
   git pull origin main
   git merge develop --no-ff -m "chore(release): Release vX.Y.Z"
   ```
5. **Tagging:**
   Create a semantic version tag:
   ```bash
   git tag vX.Y.Z
   ```
6. **Push to Remote:**
   Explicitly push both branches and the new tag:
   ```bash
   git push origin main
   git push origin develop
   git push origin --tags
   ```
