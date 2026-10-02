# PODS Operate mode

## Purpose

Move a person from a prepared application or repository to the real product running on their own compute. Provider authorization, preparation, transfer, startup, recovery, and browser navigation remain visible parts of one task.

## Surfaces

- **Catalogue (`/`)**: ordered prepared applications, each with title, description, and a direct try action.
- **Prepare (`/develop`)**: repository URL and optional folder first; GitHub connection and primary preparation action second; live build stages resolve into a copyable launch link and “Try this version.”
- **Launch (`/launch/:id`)**: verified application identity and artifact facts first; GitHub Codespaces or Google Cloud Shell choice second; live launch stages resolve into an explicit open action and automatic same-tab product navigation.

## Responsive contract

Desktop uses paired columns for context and action. At 800px and below, collapse in task order: heading and explanation, repository/application context, provider/account action, live progress, result/share controls, recent activity.

## State contract

Live state includes a human-readable heading, elapsed time, three ordered stages, and explanatory detail. Preparation distinguishes source, build/check, and publish. Launch distinguishes environment, artifact receipt, and product opening. Polling interruption exposes a manual status retry. Provider cancellation returns to the same surface with provider-specific reconnect guidance. Ready launch state retains an explicit open link even when auto-navigation is available.

## Identity boundary

PODS owns the catalogue, preparation, provider, and progress surfaces. The launched product owns its destination UI. Field Notes is one notes-app example with a document-title serif treatment, not a global preview shell or metaphor.

## Current verification boundary

The interface and recovery paths are implemented. Browser OAuth configuration remains incomplete in the preview and currently exposes a clearly labeled access-token connection. Live end-to-end provider validation must be reported separately for GitHub Codespaces and Google Cloud Shell; local or simulated success is not provider proof.
