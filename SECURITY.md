# Security Policy

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **Email**: Create a private security advisory at  
   [GitHub Security Advisories](https://github.com/MrJc01/crom-protocolo-iceberg/security/advisories/new)

2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 1 week
- **Resolution target**: Within 30 days (depending on complexity)

## Scope

### In Scope

- Authentication bypass
- Data exposure
- Privilege escalation
- XSS/CSRF vulnerabilities
- SQL injection
- Remote code execution

### Out of Scope

- DoS/DDoS attacks
- Social engineering
- Physical security
- Third-party services

## Recognition

Contributors who responsibly disclose valid vulnerabilities will be:
- Credited in release notes (with permission)
- Added to security hall of fame

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅ Yes    |
| < 0.2   | ❌ No     |

## Security Best Practices

When using Iceberg:

1. **Keep your mnemonic secret** - Never share your 24 words
2. **Run your own daemon** - Don't trust public daemons with your identity
3. **Verify CIDs** - Check content hashes match expected values
4. **Use Tor** - Enable Tor integration for maximum privacy
