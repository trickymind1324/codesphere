# Security Policy

## Reporting a Vulnerability

We take the security of CodeSphere seriously. If you believe you have found a
security vulnerability, please report it to us privately — **do not open a
public GitHub issue, discussion, or pull request** for security problems.

Please report vulnerabilities by either:

- Using GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  (the **Report a vulnerability** button on the Security tab), or
- Emailing **sunnyas1824@gmail.com** with the details.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept, affected endpoints/components)
- Any suggested remediation

## What to expect

- We will acknowledge your report within a few business days.
- We will investigate and keep you informed of our progress.
- We ask that you give us a reasonable amount of time to remediate the issue
  before any public disclosure.
- We are happy to credit reporters who responsibly disclose issues.

## Scope

This platform executes untrusted user code in sandboxed containers and handles
authentication and assessment data. Reports that are especially valuable
include: sandbox escapes or resource-isolation bypasses, authentication or
authorization flaws, injection vulnerabilities, and any exposure of secrets or
other users' data.

## Supported Versions

This project is under active development; security fixes are applied to the
`main` branch.
