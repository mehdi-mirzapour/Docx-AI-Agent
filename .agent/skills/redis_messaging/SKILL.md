---
name: Redis Messaging Patterns
description: Best practices for implementing Redis Streams in this project.
---

# Redis Messaging Patterns (Agentic Mesh)

This skill describes how to use Redis Streams and Consumer Groups to coordinate multiple AI agents ("Specialists") in the DocxAI ecosystem.

## 1. Stream Architecture
We use a **one-stream-per-topic** approach. Each stream represents an event type (e.g., `doc.review.started`).

## 2. Consumer Groups
To ensure high availability and shared work:
- Define a `GROUP_NAME` for each specialty (e.g., `legal-check-group`).
- Multiple physical instances of the same agent join the same group to load-balance messages.

## 3. Message Processing Workflow
1. **XREADGROUP**: Fetch new messages that haven't been delivered to other consumers in the group.
2. **Deterministic Logic**: The agent processes the document chunk.
3. **XACK**: Acknowledge processing completion so the message is removed from the Pending Entries List (PEL).

## 4. Error Handling & Idempotency
- **PEL Recovery**: If an agent crashes, others should use `XPENDING` and `XCLAIM` to take over stalled messages.
- **Idempotency**: All `process_message` functions should check if the `message_id` has already been processed (using a Redis SET with TTL) to avoid duplicate AI spending.

## 5. Metadata naming
- **Streams**: `doc.[module].[action]` (e.g., `doc.suggestions.apply`)
- **Groups**: `[action]-group` (e.g., `apply-group`)
