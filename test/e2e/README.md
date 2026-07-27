# Desktop E2E (Playwright)

Scenarios for **MailWebclient**. Runner lives at the Aurora install root:

```bash
# from install root
yarn test:e2e-desktop
./test-desktop/e2e/run.sh

# this module only (Chrome)
yarn --cwd test-desktop/e2e test:e2e_local -- --project="MailWebclient · Desktop Chrome"
```

Shared helpers: `test-desktop/e2e/helpers/` (`AURORA_E2E_ROOT`).
Domain helpers: `./helpers/` in this folder.
