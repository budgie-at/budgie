# Budgie App Tests

End-to-end tests for the Budgie expense tracking app using [Maestro](https://maestro.mobile.dev/).

## Test Flows

### 01.smoke-test.flow.yaml
Comprehensive smoke test that verifies core functionality:
1. App launches successfully
2. Empty state displays "No accounts yet"
3. User can create a Checking Account with $1,000 balance
4. User can create a $50 expense in Food category
5. Account balance updates correctly to $950

## Running Tests Locally

### Prerequisites
- Install Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash`
- iOS Simulator or Android Emulator running
- App installed on the simulator/emulator

### Commands

iOS:
```bash
maestro test flows -e APP_ID=com.vitalyiegorov.budgie.preview --config config.yaml
```

Android:
```bash
maestro test flows -e APP_ID=com.vitaliiyehorov.budgie.preview --config config.yaml
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
