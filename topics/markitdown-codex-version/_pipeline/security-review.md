---
title: Microsoft MarkItDown — Security Review
tags: [security, review, document-conversion]
created: 2026-04-24
---

# Microsoft MarkItDown — Security Review

## Verdict: PASS_WITH_CAVEATS

No blocking issue prevents publishing the evaluation, but production adoption must preserve the security caveats.

## Findings

- HIGH: MarkItDown performs I/O with the current process's privileges. Services that accept user-controlled files, URLs, or data URIs need explicit validation, allowlists, and isolation.
- HIGH: The MCP server exposes conversion by URI, including local file and remote schemes. Treat it as local/trusted unless additional authorization and containment are added.
- MEDIUM: Installing all optional extras expands the dependency attack surface. Prefer format-specific extras and scan dependencies.
- MEDIUM: Remote fetching should be performed by controlled application code when possible, then passed to MarkItDown as a response or stream.

## Required Report Changes

None. The drafts already include the process-privileged I/O warning, narrow API recommendation, and MCP containment guidance.

## Deployment Guardrails

- Run converters in a sandbox or container for untrusted input.
- Deny private, loopback, link-local, and metadata-service network destinations for URL conversion.
- Restrict local file access to explicit allowlisted directories.
- Disable plugins unless they are reviewed and intentionally enabled.
