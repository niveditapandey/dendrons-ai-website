# Rollback: pre-repositioning-2026-08

Tagged commit: `6d9d634`
Tag: `pre-repositioning-2026-08`
Tag message: "Five-suite catalogue version, prior to trust-infrastructure repositioning."

## How this site deploys

`dendrons.ai` is a single-file static site (`index.html`) deployed via Vercel CLI.
Vercel project: `dendrons-ai`, scope: `nivedita-pandeys-projects`, aliased to https://dendrons.ai.

Standard deploy command (run from this repo root):

```sh
vercel --prod --scope nivedita-pandeys-projects
```

## To restore to the pre-repositioning version

Run these three commands from the repo root:

```sh
# 1. Restore all tracked files from the tag (branch is unchanged)
git checkout pre-repositioning-2026-08 -- index.html sitemap.xml apple-touch-icon.png favicon.ico dendrons-mark.png dendrons-mark-white.png og-image.png

# 2. Redeploy to production
vercel --prod --scope nivedita-pandeys-projects

# 3. After confirming live site looks correct, commit the restored files
git add index.html sitemap.xml apple-touch-icon.png favicon.ico dendrons-mark.png dendrons-mark-white.png og-image.png
git commit -m "revert: restore pre-repositioning-2026-08 five-suite catalogue version"
```

Step 1 checks out just the content files from the tag without touching your working branch.
Step 2 redeploys them live. Step 3 records the rollback in git history.

## To discard the rollback and return to the repositioned version

If you decide to keep the trust-infrastructure version instead:

```sh
git checkout main -- index.html sitemap.xml
vercel --prod --scope nivedita-pandeys-projects
```
