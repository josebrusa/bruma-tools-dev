import type { FastifyReply } from "fastify";

export function badRequest(reply: FastifyReply, message: string, details?: unknown) {
  return reply.status(400).send({
    error: "bad_request",
    message,
    details: details ?? null,
  });
}

export function notFound(reply: FastifyReply, message: string) {
  return reply.status(404).send({ error: "not_found", message });
}

export function conflict(reply: FastifyReply, message: string) {
  return reply.status(409).send({ error: "conflict", message });
}

export function forbidden(reply: FastifyReply, message: string) {
  return reply.status(403).send({ error: "forbidden", message });
}

export function unauthorized(reply: FastifyReply, message = "Invalid or missing API key") {
  return reply.status(401).send({ error: "unauthorized", message });
}

export function serviceUnavailable(reply: FastifyReply, message: string) {
  return reply.status(503).send({ error: "service_unavailable", message });
}

export function tooManyRequests(reply: FastifyReply, retryAfterSec: number) {
  return reply
    .header("Retry-After", String(retryAfterSec))
    .status(429)
    .send({
      error: "rate_limited",
      message: "Too many requests; try again later.",
    });
}

export function unprocessableEntity(
  reply: FastifyReply,
  message: string,
  details?: unknown,
) {
  return reply.status(422).send({
    error: "unprocessable_entity",
    message,
    details: details ?? null,
  });
}
