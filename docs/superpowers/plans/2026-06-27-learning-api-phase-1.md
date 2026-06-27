# Learning API Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal local Express API with health and events endpoints.

**Architecture:** Keep the app testable by exporting `createApp()` from `src/app.ts`. Keep the runtime listener in `src/server.ts` so local development and production start cleanly.

**Tech Stack:** Node.js, TypeScript, Express, Vitest, Supertest.

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] Add scripts for `dev`, `build`, `start`, and `test`.
- [ ] Install runtime and dev dependencies.

### Task 2: Route Tests

**Files:**
- Create: `test/app.test.ts`

- [ ] Write tests for `GET /health` and `GET /events`.
- [ ] Run tests and confirm they fail because `src/app.ts` does not exist yet.

### Task 3: Minimal API

**Files:**
- Create: `src/app.ts`
- Create: `src/server.ts`

- [ ] Implement `createApp()` with the two routes.
- [ ] Implement the local listener.
- [ ] Run tests and confirm they pass.
- [ ] Run the TypeScript build.

### Task 4: Learning Notes

**Files:**
- Create: `README.md`

- [ ] Document what Phase 1 teaches.
- [ ] Document the commands for dev, test, build, and start.
