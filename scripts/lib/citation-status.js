"use strict";

const CITATION_COUNT_KEYS = [
  "ok",
  "redirect_ok",
  "warn_placeholder",
  "timeout",
  "dead",
  "dns_error",
  "tls_error",
  "http_forbidden",
  "http_server_error",
  "redirect_blocked",
  "private_network_blocked",
  "unsupported_protocol",
  "unknown_error",
];

const FAILED_CITATION_STATUSES = new Set([
  "DEAD",
  "TIMEOUT",
  "DNS_ERROR",
  "TLS_ERROR",
  "HTTP_SERVER_ERROR",
  "REDIRECT_BLOCKED",
  "BLOCKED_PRIVATE_NETWORK",
  "BLOCKED_UNSUPPORTED_PROTOCOL",
  "UNKNOWN_ERROR",
]);

const TLS_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

function classifyHttpStatus(statusCode, redirectHops = 0) {
  if (!Number.isInteger(statusCode)) return "UNKNOWN_ERROR";
  if (statusCode >= 200 && statusCode < 300) {
    return redirectHops > 0 ? "REDIRECT_OK" : "OK";
  }
  if (statusCode === 401 || statusCode === 403) return "HTTP_FORBIDDEN";
  if (statusCode >= 500 && statusCode < 600) return "HTTP_SERVER_ERROR";
  if (statusCode >= 400 && statusCode < 500) return "DEAD";
  return "UNKNOWN_ERROR";
}

function classifyRequestError(error) {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (message === "TIMEOUT" || code === "ETIMEDOUT") return "TIMEOUT";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "DNS_ERROR";
  if (
    TLS_ERROR_CODES.has(code) ||
    code.startsWith("ERR_TLS_") ||
    code === "EPROTO" ||
    /\b(tls|ssl|cert|certificate)\b/i.test(message)
  ) {
    return "TLS_ERROR";
  }

  return "UNKNOWN_ERROR";
}

function citationCountKey(status) {
  const map = {
    OK: "ok",
    REDIRECT_OK: "redirect_ok",
    WARN_AUTH: "http_forbidden",
    WARN_PLACEHOLDER: "warn_placeholder",
    TIMEOUT: "timeout",
    DEAD: "dead",
    DNS_ERROR: "dns_error",
    TLS_ERROR: "tls_error",
    HTTP_FORBIDDEN: "http_forbidden",
    HTTP_SERVER_ERROR: "http_server_error",
    REDIRECT_BLOCKED: "redirect_blocked",
    BLOCKED_PRIVATE_NETWORK: "private_network_blocked",
    BLOCKED_UNSUPPORTED_PROTOCOL: "unsupported_protocol",
    ERROR: "unknown_error",
    UNKNOWN_ERROR: "unknown_error",
  };
  return map[status] ?? "unknown_error";
}

function isFailedCitationStatus(status) {
  return FAILED_CITATION_STATUSES.has(status);
}

module.exports = {
  CITATION_COUNT_KEYS,
  FAILED_CITATION_STATUSES,
  classifyHttpStatus,
  classifyRequestError,
  citationCountKey,
  isFailedCitationStatus,
};
