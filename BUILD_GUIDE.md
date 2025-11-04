# Build Guide - Dynamic Plugins for Red Hat Developer Hub

## ✅ Build System Wired Up

Both frontend and backend plugins are now fully integrated into your build system!

## 🏗️ Build Commands

### Build All Plugins

```bash
make build-all
```

This will:
1. Clean the `build/` directory
2. Build the frontend plugin (`redhat-ai-project-space`)
3. Build the backend plugin (`redhat-ai-project-space-backend`)
4. Generate tarballs and integrity checksums

### Build Individual Plugins

**Frontend Plugin Only:**
```bash
make build-plugin
```

**Backend Plugin Only:**
```bash
make build-backend-plugin
```

### Clean Build Directory

```bash
make clean
```

## 📦 Build Artifacts

After running `make build-all`, you'll find:

```
build/
├── redhat-ai-project-space/
│   ├── backstage-plugin-redhat-ai-project-space-dynamic-1.0.13.tgz
│   └── backstage-plugin-redhat-ai-project-space-dynamic-1.0.13-integrity.txt
└── redhat-ai-project-space-backend/
    ├── backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0.tgz
    └── backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0-integrity.txt
```

### Artifact Sizes

- **Frontend Plugin**: ~2.9 MB (unpacked: 11.2 MB)
- **Backend Plugin**: ~2.0 MB (unpacked: 8.6 MB)

## 🔧 Build Process Details

### Frontend Plugin Build

1. Runs `yarn workspace backstage-plugin-redhat-ai-project-space export-dynamic`
2. Uses `janus-cli` to create dynamic plugin
3. Generates Scalprum assets for frontend module federation
4. Creates tarball in `plugins/redhat-ai-project-space/dist-dynamic/`
5. Moves to `build/redhat-ai-project-space/`
6. Calculates SHA256 checksum and saves to integrity file

### Backend Plugin Build

1. Runs `yarn workspace backstage-plugin-redhat-ai-project-space-backend export-dynamic`
2. Uses `janus-cli` to create dynamic plugin
3. Moves peer dependencies to reduce bundle size
4. Bundles private dependencies (knex, express, zod, etc.)
5. Creates tarball in `plugins/redhat-ai-project-space-backend/dist-dynamic/`
6. Moves to `build/redhat-ai-project-space-backend/`
7. Calculates SHA256 checksum and saves to integrity file

## 📝 Makefile Targets

```makefile
clean                   # Remove build directory
build-plugin            # Build frontend plugin only
build-backend-plugin    # Build backend plugin only
build-all              # Clean and build both plugins
```

## 🔍 Build Script (build.sh)

The `build.sh` script handles the build process:

**Usage:**
```bash
./build.sh <workspace-name> <plugin-directory-name>
```

**Examples:**
```bash
# Frontend
./build.sh backstage-plugin-redhat-ai-project-space redhat-ai-project-space

# Backend
./build.sh backstage-plugin-redhat-ai-project-space-backend redhat-ai-project-space-backend
```

**What it does:**
1. Creates build directory
2. Cleans old dist files
3. Runs `yarn workspace <name> export-dynamic`
4. Packs the plugin with `npm pack`
5. Moves tarball to `build/<plugin-dir-name>/`
6. Calculates and saves integrity checksum

## 🚀 Deploying to Red Hat Developer Hub

### 1. Build the Plugins

```bash
make build-all
```

### 2. Upload to RHDH

Upload both tarballs:
- `build/redhat-ai-project-space/backstage-plugin-redhat-ai-project-space-dynamic-1.0.13.tgz`
- `build/redhat-ai-project-space-backend/backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0.tgz`

### 3. Configure in RHDH

Add to your RHDH configuration:

```yaml
dynamicPlugins:
  frontend:
    backstage-plugin-redhat-ai-project-space:
      package: ./dynamic-plugins/dist/backstage-plugin-redhat-ai-project-space-dynamic-1.0.13.tgz
      pluginConfig:
        # Your frontend plugin config
  
  backend:
    backstage-plugin-redhat-ai-project-space-backend:
      package: ./dynamic-plugins/dist/backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0.tgz
      pluginConfig:
        # Your backend plugin config
```

### 4. Verify Integrity (Optional)

Use the integrity files to verify uploads:

```bash
# Frontend
cat build/redhat-ai-project-space/backstage-plugin-redhat-ai-project-space-dynamic-1.0.13-integrity.txt
# Output: base64-encoded SHA256 hash

# Backend
cat build/redhat-ai-project-space-backend/backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0-integrity.txt
# Output: base64-encoded SHA256 hash
```

## 🔁 Development Workflow

### 1. Make Changes

Edit your plugin source code in:
- `plugins/redhat-ai-project-space/src/` (frontend)
- `plugins/redhat-ai-project-space-backend/src/` (backend)

### 2. Test Locally

```bash
# Terminal 1 - Backend
yarn start-backend

# Terminal 2 - Frontend
yarn start
```

### 3. Build for Production

```bash
make build-all
```

### 4. Deploy

Upload the new tarballs to RHDH.

## 🧹 Cleaning Up

### Clean Build Directory

```bash
make clean
```

### Clean Plugin Dist Files

```bash
# Frontend
rm -rf plugins/redhat-ai-project-space/dist*

# Backend
rm -rf plugins/redhat-ai-project-space-backend/dist*

# Both (done by Makefile)
make clean
```

## 📊 Build Verification

After building, verify the artifacts:

```bash
# List all build artifacts
ls -lh build/*/

# Check tarball contents (frontend)
tar -tzf build/redhat-ai-project-space/backstage-plugin-redhat-ai-project-space-dynamic-1.0.13.tgz | head -20

# Check tarball contents (backend)
tar -tzf build/redhat-ai-project-space-backend/backstage-plugin-redhat-ai-project-space-backend-dynamic-1.0.0.tgz | head -20
```

## 🔍 Troubleshooting

### Build Fails

**Check dependencies:**
```bash
yarn install
```

**Clean and retry:**
```bash
make clean
make build-all
```

### Plugin Doesn't Work in RHDH

**Verify tarball integrity:**
```bash
# Extract and inspect
tar -xzf build/redhat-ai-project-space-backend/*.tgz -C /tmp/
ls -la /tmp/package/
```

**Check package.json:**
```bash
tar -xzf build/redhat-ai-project-space-backend/*.tgz -O package/package.json | jq
```

### Integrity Mismatch

**Recalculate checksum:**
```bash
shasum -a 256 build/redhat-ai-project-space-backend/*.tgz | awk '{print $1}' | xxd -r -p | base64
```

## 📋 Checklist for Release

- [ ] Update version in `plugins/redhat-ai-project-space/package.json`
- [ ] Update version in `plugins/redhat-ai-project-space-backend/package.json`
- [ ] Run `yarn install` to update lock file
- [ ] Test locally with `yarn start` and `yarn start-backend`
- [ ] Run `make build-all`
- [ ] Verify build artifacts exist in `build/` directory
- [ ] Check tarball sizes are reasonable
- [ ] Save integrity checksums for documentation
- [ ] Upload to RHDH
- [ ] Test in RHDH environment
- [ ] Tag release in git (optional)

## 📚 Related Documentation

- `QUICKSTART.md` - Quick start guide for using the voting feature
- `VOTING_FEATURE_COMPLETE.md` - Complete feature overview
- `BACKEND_PLUGIN_SUMMARY.md` - Backend plugin details
- `FRONTEND_VOTING_INTEGRATION.md` - Frontend integration details

## 🎉 Success!

Your build system is now fully configured to create dynamic plugins for Red Hat Developer Hub!

**Key Targets:**
- `make clean` - Clean build directory
- `make build-plugin` - Build frontend only
- `make build-backend-plugin` - Build backend only
- `make build-all` - Build everything

**Output:**
- Frontend: `build/redhat-ai-project-space/*.tgz`
- Backend: `build/redhat-ai-project-space-backend/*.tgz`

**Ready for deployment to Red Hat Developer Hub!** 🚀

---

**Last Updated:** November 4, 2025  
**Frontend Version:** 1.0.13  
**Backend Version:** 1.0.0

