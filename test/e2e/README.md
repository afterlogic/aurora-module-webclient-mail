# Desktop E2E (Playwright)

Scenarios for **MailWebclient**. Runner lives at the Aurora install root:

```bash
# from install root
yarn test:e2e-desktop
./e2e-desktop/run.sh

# this module only (Chrome)
yarn --cwd e2e-desktop test:e2e_local -- --project="MailWebclient · Desktop Chrome"
```

Shared helpers: `e2e-desktop/helpers/` (`AURORA_E2E_ROOT`).
Domain helpers: `./helpers/` in this folder.
