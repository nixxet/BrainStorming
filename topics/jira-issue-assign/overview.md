---
title: jira-issue-assign
tags: [research, jira, automation, assignment, python]
created: 2026-04-19
updated: 2026-04-19
status: complete
---

# jira-issue-assign

## What It Is

`jira-issue-assign` is a single-file Python script from 2018 that trains a `TextBlob` Naive Bayes classifier on closed Jira issues, then continuously polls for unassigned issues and auto-assigns them to predicted service-desk team members. It is not a packaged service, library, or modern Jira automation framework.

## Key Concepts

- **Historical training set:** uses closed issues and their assignees as labels.
- **Single-script workflow:** training, polling, assignment, database writes, comments, and email all happen in one file.
- **Legacy Jira Server posture:** configured around a custom server URL and basic auth.
- **Heuristic operations:** no model governance, no confidence thresholds, and no staged review path.

## Context

**Who it is for:**
- Builders studying early practical ML-on-helpdesk automation experiments.
- Anyone comparing bespoke scripts to today's Jira automation and MCP approaches.

**What it is not for:**
- Teams wanting production-ready auto-assignment.
- Anyone needing secure credential handling or reliable packaging.

**Why it matters:**
- It captures a real operational desire: route issues to the right humans automatically.
- It also shows why many one-off automation scripts age badly compared with platform-native automation or better-governed MCP layers.

## Key Numbers / Stats

- **Repo age:** created on `2018-04-20`; last push on `2018-05-04`. - [GitHub API repo metadata](https://api.github.com/repos/capan/JiraIssueAssign) - **HIGH**
- **GitHub activity on 2026-04-19:** `4` stars, `2` forks, `0` open issues, `5` visible commits, no releases. - [GitHub API repo metadata](https://api.github.com/repos/capan/JiraIssueAssign) - **HIGH**
- **Implementation surface:** exactly 2 files in the repo, with all behavior living in `index.py`. - [repo tree](https://github.com/capan/JiraIssueAssign), [index.py](https://raw.githubusercontent.com/capan/JiraIssueAssign/master/index.py) - **HIGH**
- **Modern alternative coverage:** Atlassian's current Jira Automation supports direct issue assignment actions and multiple distribution modes such as balanced workload, random, and round-robin. - [Jira automation actions](https://support.atlassian.com/cloud-automation/docs/jira-automation-actions/) - **HIGH**

## Links & Resources

### Core

- [GitHub repo](https://github.com/capan/JiraIssueAssign)
- [README.md](https://raw.githubusercontent.com/capan/JiraIssueAssign/master/README.md)
- [index.py](https://raw.githubusercontent.com/capan/JiraIssueAssign/master/index.py)

### Platform docs

- [Jira automation actions](https://support.atlassian.com/cloud-automation/docs/jira-automation-actions/)
- [Jira REST API v3 intro](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [Jira REST API examples](https://developer.atlassian.com/server/jira/platform/jira-rest-api-examples/)
