# Kong TLS certs

This directory holds the TLS certificate Kong serves on :443.

- **Local/dev:** run `bash scripts/generate-local-tls.sh` to create a
  self-signed `fullchain.pem` + `privkey.pem` here. Both are gitignored.
- **Production:** place real certs (Let's Encrypt / your CA) at the same
  filenames, or point `KONG_SSL_CERT` / `KONG_SSL_CERT_KEY` elsewhere.

Kong will not start if these files are missing.
