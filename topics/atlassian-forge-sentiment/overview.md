---
title: atlassian-forge-sentiment
tags: [research, jira, atlassian, forge, sentiment-analysis]
created: 2026-04-19
updated: 2026-04-19
status: complete
---

# atlassian-forge-sentiment

## What It Is

`atlassian-forge-sentiment` is a tiny Forge app prototype that adds a Jira issue panel and tries to score sentiment from the issue summary, description, and comments. In practice, it is closer to a 2020-era demo fork of the Forge Hello World starter than to a maintained sentiment product.

## Key Concepts

- **Forge issue panel UI:** mounts an `IssuePanel` inside Jira.
- **Local lexical sentiment:** uses the npm `sentiment` package rather than a hosted classifier.
- **Field aggregation:** attempts to combine summary, description, and comments into one ticket mood score.
- **Visual badge output:** highlights positive and negative words and maps aggregate score to one of five mood images.

## Context

**Who it is for:**
- Builders studying old Forge app patterns.
- Anyone looking for a minimal example of issue-panel sentiment scoring logic.

**What it is not for:**
- Teams wanting a current Forge starter.
- Anyone expecting production-ready Jira sentiment analytics.
- Anyone who needs reliable packaging, tests, releases, or support.

**Why it matters:**
- It shows one narrow idea that still generalizes: issue text can be summarized into triage signals directly inside Jira.
- It also shows how fast a hack-week Forge prototype becomes obsolete when Atlassian's runtime and UI stack move on.

## Key Numbers / Stats

- **Repo age:** created on `2020-07-06`; last push on `2020-07-08`. - [GitHub API repo metadata](https://api.github.com/repos/willpowell8/AtlassianForgeSentiment) - **HIGH**
- **GitHub activity on 2026-04-19:** `2` stars, `0` forks, `0` open issues, `2` commits, no releases. - [GitHub API repo metadata](https://api.github.com/repos/willpowell8/AtlassianForgeSentiment), [repo page](https://github.com/willpowell8/AtlassianForgeSentiment) - **HIGH**
- **Implementation surface:** 1 JSX file, 1 manifest, starter-level package metadata. - [repo tree](https://github.com/willpowell8/AtlassianForgeSentiment), [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx) - **HIGH**
- **Dependency age signal:** still pinned to `@forge/ui ^0.3.1`, while Atlassian's current UI Kit guidance points developers to `@forge/react` 10+ and Atlassian announced sandbox runtime and UI Kit 1 deprecations for `2025-02-28`. - [package.json](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/package.json), [UI Kit docs](https://developer.atlassian.com/platform/forge/ui-kit/), [deprecation notice](https://community.developer.atlassian.com/t/reminder-upcoming-sandbox-runtime-and-ui-kit-1-deprecations/89214) - **HIGH**

## Links & Resources

### Core

- [GitHub repo](https://github.com/willpowell8/AtlassianForgeSentiment)
- [README.md](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/README.md)
- [manifest.yml](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/manifest.yml)
- [src/index.jsx](https://raw.githubusercontent.com/willpowell8/AtlassianForgeSentiment/master/src/index.jsx)

### Platform docs

- [Forge overview](https://developer.atlassian.com/platform/forge/overview/)
- [UI Kit docs](https://developer.atlassian.com/platform/forge/ui-kit/)
- [Jira REST API v3 intro](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [Issue comments API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/)
