# Budgie App Tests

End-to-end tests for the Budgie expense tracking app using [Maestro](https://maestro.mobile.dev/).

## Running Tests Locally

### Prerequisites

- Install Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash`
- iOS Simulator or Android Emulator running
- App installed on the simulator/emulator

### Commands

iOS:

```bash
sh ./scripts/run-maestro-suite.sh com.vitalyiegorov.budgie.e2e
```

Local Erste Bank PDF flow:

```bash
sh ./scripts/setup-ios-e2e-fixtures.sh
maestro test ./flows/16.erste-pdf-import.flow.yaml \
  -e APP_ID=com.vitalyiegorov.budgie.e2e
```

Both variants use committed sanitized PDF fixtures from `tests/app-tests/fixtures/erste/`.

Android:

```bash
sh ./scripts/run-maestro-suite.sh com.vitaliiyehorov.budgie.e2e
```

## CI/CD

E2E tests run automatically on pull requests via the GitHub Actions workflow (`.github/workflows/pr.yml`).
Tests execute on both iOS (macos-latest) and Android (ubuntu-latest) after code quality checks pass.

## Future Test Coverage

- [ ] Multiple account types (Savings, Debt)
- [ ] Income transactions
- [ ] Transfer transactions
- [ ] Transaction editing and deletion
- [ ] Category and tag management
- [ ] Analytics screen verification
- [ ] Settings and preferences
