# Budgie App E2E Tests

Maestro tests for the Budgie expense tracking app.

## Test Flows

### 01. Smoke Test
Complete user journey covering:
- App launch and initial empty state
- Account creation (Checking Account)
- Expense transaction creation
- Verification of created data

## Running Tests Locally

### Prerequisites
1. Install Maestro CLI:
```bash
export MAESTRO_VERSION=2.0.3
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

2. Build the app for e2e profile:
```bash
# iOS
cd packages/app
eas build --profile=e2e --platform ios --local

# Android
cd packages/app
eas build --profile=e2e --platform android --local
```

### Running Tests

```bash
# iOS
cd tests/app-tests
maestro test flows -e APP_ID=com.vitalyiegorov.budgie.preview --config config.yaml

# Android
cd tests/app-tests
maestro test flows -e APP_ID=com.vitaliiyehorov.budgie.preview --config config.yaml
```

## CI/CD

### Enabling CI Tests

To enable Maestro tests in CI/CD, apply the provided patch:

```bash
git apply tests/app-tests/enable-ci.patch
```

This patch will:
- Remove `if: false` from both `e2e-ios` and `e2e-android` jobs
- Update APP_ID variables to use Budgie bundle identifiers

Once applied, tests will run automatically on pull requests via GitHub Actions:
- iOS tests: `e2e-ios` job in `.github/workflows/pr.yml`
- Android tests: `e2e-android` job in `.github/workflows/pr.yml`

## Future Test Coverage

- [ ] Account management (update, archive, delete)
- [ ] Income transaction creation
- [ ] Transfer between accounts
- [ ] Transaction categorization and tags
- [ ] Analytics and reporting screens
- [ ] Settings and preferences
- [ ] Multi-currency support
- [ ] PIN authentication flow
