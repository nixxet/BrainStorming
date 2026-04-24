---
title: Microsoft MarkItDown
tags: [document-conversion, markdown, llm, open-source]
created: 2026-04-24
updated: 2026-04-24
status: published
confidence: HIGH
---

# Microsoft MarkItDown

Microsoft MarkItDown is an open source Python package and CLI for converting document-like inputs into Markdown for LLM and text-analysis workflows. It is best understood as an ingestion utility: useful when Markdown structure is good enough for downstream retrieval, summarization, indexing, or agent workflows.

## What It Supports

HIGH confidence: The project lists support for PDFs, PowerPoint, Word, Excel, images, audio, HTML, CSV, JSON, XML, ZIP files, YouTube URLs, EPUB, and other inputs. Source: [GitHub repository](https://github.com/microsoft/markitdown)

HIGH confidence: MarkItDown requires Python 3.10 or higher and is published on PyPI under an MIT license expression. Source: [PyPI project page](https://pypi.org/project/markitdown/)

HIGH confidence: The latest observed release is 0.1.5, released 2026-02-20. Source: [PyPI project page](https://pypi.org/project/markitdown/)

MEDIUM confidence: The project should still be treated as maturing because its package metadata includes a Beta classifier and recent releases continue to improve extraction behavior. Sources: [pyproject metadata](https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml) and [GitHub releases](https://github.com/microsoft/markitdown/releases)

## When It Fits

Use MarkItDown when the goal is to convert common source files into Markdown for LLM preprocessing, RAG ingestion, search indexing, or text-analysis pipelines.

Avoid treating it as a high-fidelity document publishing converter. The project frames output as useful for text analysis and often readable, not as a guaranteed visual match to the source document.

## Sources

- [GitHub repository](https://github.com/microsoft/markitdown)
- [README](https://raw.githubusercontent.com/microsoft/markitdown/main/README.md)
- [PyPI project page](https://pypi.org/project/markitdown/)
- [pyproject metadata](https://raw.githubusercontent.com/microsoft/markitdown/main/packages/markitdown/pyproject.toml)
- [GitHub releases](https://github.com/microsoft/markitdown/releases)
