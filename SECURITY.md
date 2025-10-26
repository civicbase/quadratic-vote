# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Reporting a Vulnerability

We take the security of quadratic-vote seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. Email us at **mortoni.alan@hotmail.com** with:

   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

2. Allow us reasonable time to respond before disclosing to others

### What to expect:

- **Response Time**: We will acknowledge your email within 48 hours
- **Updates**: We will keep you informed about our progress
- **Resolution**: We aim to release a fix within 30 days for critical issues
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using quadratic-vote in your application:

1. **Keep Updated**: Always use the latest version to benefit from security patches
2. **Validate Inputs**: Always validate question data from untrusted sources
3. **CSP Headers**: Implement Content Security Policy headers in your application
4. **Dependencies**: Regularly audit your dependencies with `npm audit`

## Security Measures

Our package:

- Has zero runtime dependencies (only React peerDependencies)
- Uses TypeScript for type safety
- Undergoes automated security scanning via GitHub Actions
- Follows secure coding practices
- Regularly updates development dependencies

## Questions?

If you have questions about security that aren't covered here, please email mortoni.alan@hotmail.com
