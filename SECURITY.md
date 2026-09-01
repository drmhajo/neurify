# Security policy

Neurify is a privacy-sensitive clinical coordination project. Security reports should be shared privately with the repository owner rather than opened as public issues.

## Protected information

Source code, tests, screenshots, logs, issues, pull requests, and Copilot prompts must not contain real patient names, medical-record numbers, diagnoses, clinical histories, credentials, access tokens, private keys, production URLs containing credentials, or production database exports. Use synthetic records for development and testing.

## Secrets

Keep development secrets in the local `.env` file or an approved secrets manager. GitHub Actions credentials must be stored as encrypted GitHub repository or environment secrets. Do not commit `.env`, keystores, service-account credentials, signing keys, relay tokens, JWT secrets, or service-role keys.

## Production boundary

The repository alone is not an authorization for clinical deployment. Production use requires institutional approval, an identity and access review, encryption and retention controls, audit logging, secure notification content, approved hosting, and a documented incident-response process.

