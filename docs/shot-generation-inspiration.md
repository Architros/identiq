# Shot Generation

This document explains how Appshots shot generation works from a product and operations point of view. It describes the user journey, inputs, outputs, credit behavior, progress states, recovery paths, and common failure modes without covering code or private implementation details.

## Purpose

Shot generation turns a user's app context and optional UI screenshots into polished store-ready screenshot panels. The feature is meant to reduce the manual work of designing App Store and Play Store marketing assets while keeping the output tied to the user's real product.

Users enter the flow from the create workspace. They provide basic app information, choose output constraints, review the expected result, generate the set, then optionally refine or download the assets.

The current self-serve flow is optimized around complete screenshot sets. A standard set is 3 generated panels. The generation system supports 1 to 6 panels, but the main creation experience currently uses the 3-panel default.

## Creation Journey

### 1. App Context

The user starts by describing the app.

Required input:

- App name

Recommended inputs:

- Category
- App description

Optional inputs:

- UI reference screenshots

The app name is required because it anchors project naming, output file naming, and the creative context. Category and app description are not strictly required, but they usually improve the generated copy, feature selection, and visual direction.

UI references are optional. They help the generation system understand the real interface, visual density, product moments, and brand cues. References are guidance, not a request to copy the uploaded screens exactly.

Reference limits:

- 0 to 6 reference images
- PNG, JPEG, or WebP
- 20MB maximum per file

If a user adds unsupported, empty, oversized, or excessive reference files, Appshots skips the invalid files and explains what happened. If reference preparation fails later, generation can continue with the valid references or without references, depending on what remains usable.

### 2. Output Setup

The user chooses what kind of screenshot set should be generated.

Platform options:

- iOS
- Android
- Both

Target device options:

- iPhone 6.9 inch
- iPad 13 inch
- Android phone

When the user chooses both platforms, Appshots creates a separate iOS set and Android set under one generation action. The user reviews the two sets separately after generation.

Font presets give the user a simple way to steer typography without needing design tooling. Overall direction lets the user describe the desired message, tone, visual style, or product emphasis in plain language.

### 3. Review

Before generation starts, the user sees a summary of the confirmed constraints:

- Platform
- Target device
- Font
- Overall direction
- Number of uploaded UI references
- Estimated credits

The review step makes the cost and constraints visible before any credits are reserved. The generation system decides final image order, headline rhythm, visual variety, and feature emphasis within those constraints.

### 4. Generation

After the user starts generation, Appshots saves the project context, prepares valid references, reserves the required credits, and starts producing the panels.

The user sees progress through four main phases:

- Saving context
- Confirming constraints
- Generating screenshots
- Saving screenshots

During generation, Appshots can show panel-level status:

- Queued
- Generating
- Saving
- Saved

If multiple platform sets are being generated, progress is tracked for each set. Saved panels can appear as they become ready, so the user does not have to wait for every panel before seeing any output.

The user can stop generation while it is active. A stopped generation is marked as cancelled, and reserved credits are returned when the run is cancelled before successful completion.

If live progress updates are interrupted, Appshots can recover by checking the latest known run state. This keeps the UI from getting stuck when a browser connection drops, the tab sleeps, or realtime updates arrive late.

### 5. Review And Improve

Once generation completes, the user can inspect the saved panels, download assets, or refine the result.

Available actions:

- Download a single panel
- Download all panels
- Regenerate the set
- Revise the whole set with written feedback
- Redo one panel
- Translate the set into another locale

Regenerate creates a new set from the current project settings and references. Revise uses the current result as the baseline and applies the user's requested change across the set. Redo updates a single panel while preserving the rest of the set. Translate keeps product identity and intended meaning while adapting visible marketing copy to the requested locale.

## Outputs

Each successful generation returns saved image assets that can be previewed and downloaded.

Output targets:

- iPhone 6.9 inch: 1320 x 2868
- iPad 13 inch: 2048 x 2732
- Android phone: 1080 x 1920

Generated panels are named from the app name and panel number. If exact dimensions are available, Appshots uses them to keep previews at the correct aspect ratio. If dimensions are not available, the preview falls back to the target device's expected aspect ratio.

For both-platform generation, Appshots produces separate result sets. The user switches between platform tabs to review each set.

## Credits

Credits map directly to generated assets.

Current credit behavior:

- 1 generated panel costs 1 credit.
- A standard 3-panel set costs 3 credits.
- Both-platform generation creates two standard sets, so the standard cost is 6 credits.
- Redoing one panel costs 1 credit.
- Revising or translating a full 3-panel set costs 3 credits per platform set being changed.

Credits are checked before generation starts. If the user does not have enough credits, generation is blocked and no new run starts.

Credits are reserved when a generation action is accepted. If generation is cancelled or fails before successful completion, reserved credits are refunded when applicable. The user-facing failure message indicates when no credit was charged.

Subscription access is required for generation. Credit balances are refreshed after successful generation, cancellation, refunds, and insufficient-credit responses.

## Saved Projects

Every generation belongs to a project. A project represents the app context and its generated screenshot history.

Users can browse saved projects from the organize workspace. Each project card shows the most recent complete panel set when one is available. From the gallery, users can:

- Preview individual panels
- Download one panel
- Download all panels in a project
- Load more projects
- Delete a project

Deleting a project removes the project, its generated runs, panels, references, and saved assets. A project cannot be deleted while it has active generation work. The user must wait for active work to finish or stop it first.

## Refinement Behavior

Regeneration, revision, redo, and translation are separate generation actions with different intent.

Regenerate:

- Starts over from the current project settings and references.
- Produces a new complete result set.
- Charges for the full requested set.

Revise:

- Uses the current result as the visual baseline.
- Applies written feedback to the full set.
- Preserves the app identity and real UI unless the feedback asks for a change.
- Charges for the full revised set.

Redo:

- Targets one panel.
- Preserves the rest of the set.
- Charges one credit.

Translate:

- Adapts visible marketing copy to the requested locale.
- Preserves product identity, meaning, and emotional intent.
- Charges for the translated set.

If a refinement action cannot start because the previous result is not ready, Appshots tells the user the assets are not ready for another generation.

## Progress, Recovery, And Cancellation

Generation is treated as a long-running action. The UI keeps the user oriented with a progress label, detail text, elapsed time, and panel-level status.

Expected terminal outcomes:

- Success: screenshots are ready and downloadable.
- Error: generation failed, and the user can retry when retry is available.
- Cancelled: generation was stopped by the user or by related cleanup.

Retry repeats the user's last generation intent when possible. For example, if a revision failed, retry attempts the revision again rather than starting a brand-new project generation.

Cancellation applies to active work. If one part of a multi-platform generation fails or is cancelled, related active work is stopped so the user is not left with a mixed or ambiguous operation.

## Common Failure Modes

Missing app name:

- The user cannot continue from app context or start generation.
- Appshots asks the user to add the app name.

Invalid reference files:

- Unsupported, empty, oversized, or excess files are skipped.
- The user sees a message explaining the reference limit or accepted formats.
- Valid references can still be used.

Reference upload or verification issue:

- Affected references are skipped.
- Generation continues with valid references when possible.
- The user is told that references were skipped.

Insufficient credits:

- Generation is blocked before starting.
- The user sees how many credits are needed.
- The credit balance is refreshed.

Generation failure:

- The user sees a generic, safe failure message.
- Retry is offered where appropriate.
- Reserved credits are refunded when applicable.

Cancellation:

- Active generation stops.
- The UI shows that generation stopped.
- Reserved credits are refunded when applicable.

Assets not ready for refinement:

- Revision, redo, or translation cannot start until the prior result has usable saved panels.
- The user is asked to wait or retry later.

Project deletion blocked:

- Projects with active generation work cannot be deleted.
- The user must wait for completion or stop active work first.

Download failure:

- If an asset cannot be fetched for download, Appshots returns a download error.
- The project and generated result remain available unless the asset itself is missing or unavailable.

## Product And Ops Notes

Use this checklist when reviewing or supporting the feature:

- Confirm the user has an active subscription.
- Confirm the user's credit balance covers the requested action.
- Confirm the app name is present.
- Confirm references are PNG, JPEG, or WebP and no larger than 20MB each.
- Confirm there are no more than 6 references.
- Confirm whether the user selected iOS, Android, or both.
- For both-platform generations, check each platform set independently.
- For refinement issues, confirm the previous set completed and has saved panels.
- For deletion issues, confirm no active generation is still running.
- For refund questions, distinguish blocked starts from accepted generation actions that later failed or were cancelled.

## What This Document Does Not Cover

This document intentionally excludes code structure, private service details, generation provider specifics, exact instruction text sent to the image system, storage internals, route-level details, database details, and operational secrets. It is a product and operations guide, not an engineering implementation reference.



