# Identiq — AI Generation & Asset Pipeline Architecture

## Overview

Identiq is an AI-powered branding platform designed to generate complete and production-ready brand systems using:

* GPT Image 2
* OpenRouter
* AI SDK
* ConvertAPI
* Pexels
* Next.js monolithic architecture

The platform focuses on:

* brand consistency
* scalable generation workflows
* premium exports
* realistic brand showcases
* cost-efficient AI orchestration

---

# Core Technology Stack

| Layer              | Technology          |
| ------------------ | ------------------- |
| Frontend + Backend | Next.js             |
| AI Orchestration   | AI SDK by Vercel    |
| LLM Routing        | OpenRouter          |
| Image Generation   | GPT Image 2         |
| Vectorization      | ConvertAPI          |
| Storage            | Cloudflare R2       |
| Database           | Supabase/PostgreSQL |

---

# Architecture Strategy

The platform uses a monolithic architecture built with Next.js.

This means:

* frontend
* API routes
* orchestration logic
* export workflows
* authentication
* AI integrations

all exist inside the same application.

## Benefits

* faster MVP development
* reduced infrastructure complexity
* lower operational cost
* simplified deployment
* easier iteration speed

---

# AI Workflow Architecture

## Step 1 — Brand Input

The user provides:

* brand name
* optional logo inspiration
* inspiration images
* industry
* vibe/style
* desired assets

Example:

```txt
Brand Name: Identiq
Industry: AI Branding
Style: Minimal futuristic SaaS
Assets Needed:
- logo
- hoodie mockup
- Instagram post
- LinkedIn banner
```

---

# Step 2 — Brand Intelligence Extraction

OpenRouter + AI SDK extract structured brand memory.

Example structured output:

```json
{
  "brand_style": "minimal futuristic SaaS",
  "primary_color": "#C46DFD",
  "secondary_color": "#111827",
  "typography": "bold geometric sans serif",
  "visual_language": "soft gradients and rounded geometry",
  "tone": "premium playful"
}
```

This becomes:

> persistent brand memory.

This memory is reused across all future asset generations.

---

# Step 3 — Asset Planning

The orchestration layer determines:

* required assets
* dimensions
* layouts
* prompt structures
* generation order

Example:

```json
{
  "assets": [
    "primary_logo",
    "instagram_post",
    "hoodie_mockup",
    "linkedin_banner",
    "coffee_cup_mockup"
  ]
}
```

---

# Step 4 — Structured Prompt Generation

The system generates structured prompts for each asset.

## IMPORTANT:

Assets should NOT be generated using chaotic freeform prompts.

Instead use:

* structured sections
* explicit design rules
* shared brand memory

---

# Recommended Prompt Structure

```txt
Brand Name: Identiq

Core Style:
Minimal futuristic SaaS branding.

Primary Colors:
#C46DFD
#111827

Typography Style:
Bold geometric sans serif.

Asset Type:
Instagram Promotional Post

Composition Rules:
- strong hierarchy
- clean spacing
- minimal premium layout

Consistency Rules:
- maintain same palette
- maintain same geometry
- maintain same typography
- avoid photorealism
```

---

# IMPORTANT — Do NOT Use Cropped Composite Sheets

Initially, a strategy of generating one giant board and cropping assets later was considered.

This should NOT be used.

## Problems With Cropping

* reduced quality
* blurry typography
* degraded logos
* inconsistent dimensions
* low-quality exports
* compression artifacts

Especially problematic for:

* social media posts
* logo exports
* merchandise mockups

---

# Correct Multi-Asset Generation Strategy

Instead of cropping:

* generate assets independently
* generate them in parallel
* reuse the same brand memory

This preserves:

* image quality
* sharpness
* export readiness
* aspect ratio accuracy

---

# Recommended Generation Strategy

## Generate Individually

Generate:

* logo
* social post
* hoodie mockup
* LinkedIn banner

as separate high-resolution assets.

## Maintain Shared Context

Each generation reuses:

* palette
* typography
* visual language
* composition rules
* brand tone

This ensures consistency without quality loss.

---

# Hybrid Content Pipeline

Identiq should use a hybrid generation system.

Not every visual should be fully AI-generated.

---

# GPT Image 2 Responsibilities

Use GPT Image 2 for:

* logos
* layouts
* brand illustrations
* social compositions
* overlays
* abstract visuals

---

# Pexels Responsibilities

Use Pexels for:

* realistic photography
* human images
* office environments
* product scenes
* clothing mockups
* realistic backgrounds

---

# Hybrid Workflow

Example:

1. Fetch realistic hoodie mockup from Pexels.
2. Overlay generated Identiq logo.
3. Apply palette adjustments.
4. Export branded showcase.

This produces:

* more realism
* lower generation cost
* faster workflows
* higher perceived quality

---

# Why Hybrid Pipelines Are Important

Fully AI-generated lifestyle images often suffer from:

* anatomy issues
* unrealistic environments
* strange textures
* visual inconsistency

Using real photography solves this problem.

---

# Vector Export Workflow

ConvertAPI is only used during export.

## This Is VERY Important

The system should NOT vectorize assets during generation.

SVG conversion only occurs when:

* user clicks Export SVG
* user exports Brand Pack
* user exports Logo Package

---

# Export Pipeline

## Step 1

Retrieve finalized logo asset.

## Step 2

Generate vector-safe version if required.

## Step 3

Send PNG to ConvertAPI.

## Step 4

Generate:

* SVG
* monochrome variant
* transparent variant

## Step 5

Package assets into ZIP.

---

# Suggested Export Structure

```txt
/logos
/svg
/png
/social-assets
/mockups
/favicon
/brand-guidelines
```

---

# Why Export-Time Vectorization Is Smart

Benefits:

* lower infrastructure costs
* reduced API usage
* faster generation speed
* scalable architecture
* better SaaS margins

Most users:

* generate many concepts
* export only finalized assets

This significantly reduces unnecessary processing.

---

# Storage Strategy

## Store

* PNG/WebP previews
* brand metadata
* export packages
* project history

## Avoid

* unnecessary SVG persistence
* duplicate export regeneration

---

# Caching Strategy

If a user exports the same logo twice:

* serve cached SVG
* avoid reconversion

This reduces ConvertAPI costs.

---

# OpenRouter Usage Strategy

Use OpenRouter primarily for:

* orchestration
* JSON outputs
* prompt generation
* asset planning
* brand extraction

Avoid wasting credits on:

* unnecessary long conversations
* repeated context dumping

---

# AI SDK Responsibilities

AI SDK acts as:

> the orchestration engine.

Responsibilities:

* streaming
* structured outputs
* prompt workflows
* generation pipelines
* asset coordination
* async jobs

---

# Key Product Principle

The value of Identiq is NOT:

> generating every pixel with AI.

The real value is:

* consistency
* workflow quality
* professional exports
* brand orchestration
* production-ready branding systems

That is the core competitive advantage of the platform.
