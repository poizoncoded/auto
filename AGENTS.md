# poizoncoded - Agent Guide

This repo is the reusable PoizonCoded skill-set for future projects. Keep
changes portable, private-data-free, and grounded in the actual `.codex/` and
`.claude/` assets in this repository.

## Project Map

- `.codex/config.toml`: Codex MCP and multi-agent settings.
- `.codex/skills/`: Codex-discoverable skills and OpenAI UI metadata.
- `.claude/settings.json`: Claude Code permissions and enabled MCP servers.
- `.claude/settings.local.json`: local Claude Code settings.
- `.claude/skills/`: Claude Code skills shared with the Codex skill root.
- `.claude/commands/`, `.claude/agents/`, `.claude/helpers/`: Claude Code
  commands, agents, hooks, statusline, and helper scripts.
- `.agents/`, `.swarm/`, `.superpowers/`: runtime placeholders for agent
  workflows.
- `scripts/init-workspace.mjs`: npx/bootstrap installer for new repositories,
  including `--ai codex|claude|both` and `--profile fe|be|bot|all` selectors.
- `package.json`: skill-set identity, npx bin, and Ruflo integration metadata.

## Main Harness

[ruvnet/ruflo](https://github.com/ruvnet/ruflo) is the primary agent harness for
this skill-set. Prefer Ruflo-backed MCP tools, memory, hooks, and swarm
orchestration when they are available.

Codex starts the Ruflo MCP server through `.codex/config.toml`:

```bash
npx -y ruflo@latest mcp start
```

When working on multi-file tasks or complex features, use ToolSearch to look for
Ruflo MCP tools first. Start with `hooks_route` when available; use
`swarm_init` / `agent_spawn` only when independent workers are genuinely useful.
If Ruflo tools are not exposed in the session, continue with local repository
tools and keep the Ruflo configuration intact. The bootstrap CLI should not
install Ruflo just to copy assets; target repositories can opt into a local
published `ruflo` dependency with `--with-ruflo-dep`.

## Skills

Project skills are shared under both `.codex/skills/` and `.claude/skills/`.
Every skill directory under either root must have a matching directory under the
other root. When changing a skill, update both roots together and keep content
in sync, except for Codex-only `agents/openai.yaml` adapters and upstream
package metadata such as `README.md` or `metadata.json`.

- `.codex/skills/poizoncoded-conventions` and
  `.claude/skills/poizoncoded-conventions`: use before changing this skill-set
  repo or adapting it for a new workspace.
- `.codex/skills/feature-sliced-design` and
  `.claude/skills/feature-sliced-design`: use for UI file placement and import
  boundaries.
- `.codex/skills/react-best-practices` and
  `.claude/skills/react-best-practices`: use for React component, hook, data
  fetching, and rendering/performance work.
- `.codex/skills/verify-md` and `.claude/skills/verify-md`: use when verifying
  or rewriting markdown docs in this repo or a project derived from it.
- `.codex/skills/dual-tool-skills` and
  `.claude/skills/dual-tool-skills`: use when adding/changing project skills or
  doc references to skills.
- `.codex/skills/golang-*` and `.claude/skills/golang-*`: use for Go project
  layout, style, testing, concurrency, database, CLI, observability,
  performance, security, and common library work.
- `.codex/skills/qdrant-*` and `.claude/skills/qdrant-*`: use for Qdrant
  client integration, deployment, monitoring, scaling, model migration,
  performance, search quality, and version upgrades.
- `.codex/skills/agentdb-*` and `.claude/skills/agentdb-*`: use for AgentDB
  memory, vector search, learning, optimization, and advanced coordination
  work.
- `.codex/skills/github-*` and `.claude/skills/github-*`: use for GitHub code
  review, multi-repo, project management, release, and workflow automation
  work.
- `.codex/skills/reasoningbank-*` and `.claude/skills/reasoningbank-*`: use
  for ReasoningBank memory and adaptive intelligence workflows.
- `.codex/skills/swarm-*` and `.claude/skills/swarm-*`: use for Ruflo or
  agentic-flow swarm orchestration and advanced swarm work.
- `.codex/skills/v3-*` and `.claude/skills/v3-*`: use for claude-flow v3
  implementation, integration, memory, MCP, security, performance, and swarm
  coordination work.
- `.codex/skills/nest` and `.claude/skills/nest`: use for generic NestJS
  backend module, provider, controller, and bootstrap work.
- `.codex/skills/typeorm` and `.claude/skills/typeorm`: use for generic TypeORM
  entities, repositories, query builders, relations, migrations, and database
  configuration.
- `.codex/skills/browser` and `.claude/skills/browser`: use for browser
  automation guidance.
- `.codex/skills/hooks-automation` and `.claude/skills/hooks-automation`: use
  for Claude/Ruflo hook automation workflows.
- `.codex/skills/pair-programming` and `.claude/skills/pair-programming`: use
  for structured pair-programming workflows.
- `.codex/skills/skill-builder` and `.claude/skills/skill-builder`: use for
  building new skills.
- `.codex/skills/sparc-methodology` and `.claude/skills/sparc-methodology`:
  use for SPARC workflow guidance.
- `.codex/skills/stream-chain` and `.claude/skills/stream-chain`: use for
  stream-chain workflow guidance.
- `.codex/skills/verification-quality` and
  `.claude/skills/verification-quality`: use for verification and quality
  assurance workflows.
- The repo vendors `mcollina/skills` project skills under both roots at
  upstream commit `879c9deb0d3a3551086e7c737577dc6cd76fd0c7`
  (2026-07-16): `documentation`, `fastify`, `init`,
  `linting-neostandard-eslint9`, `node`, `nodejs-core`, `oauth`, `octocat`,
  `skill-optimizer`, `snipgrapher`, and `typescript-magician`.

Claude-focused or Ruflo-focused skills may still mention Claude Code,
claude-flow, or MCP-specific commands, but the skill folders themselves stay
shared so both agents see the same guidance.

## Editing Rules

- Preserve user changes. Never revert unrelated dirty work.
- Use `rg` / `rg --files` for search.
- Use `apply_patch` for manual file edits.
- Keep the bundle reusable; avoid project-specific app names, ports, private
  paths, credentials, resumes, customer data, or generated personal content.
- Prefer small, explicit skill descriptions that start with "Use when..." and
  include the real trigger terms future agents should search for.
- Keep `agents/openai.yaml` values short and consistent with the corresponding
  `SKILL.md`.
- When adding a shared skill, create or update both roots and update this
  guide plus `.claude/settings.json` permissions if explicit skill invocation
  should be allowed there.

## Verification

Prefer the narrowest relevant check first, then broaden before claiming a fix is
complete:

```bash
npm run check:json
npm run check:skills
git diff --check
```

For reference hygiene, scan active docs/config for stale project language:

```bash
npm run check:refs
```
