---
name: PODS
description: Prepared applications that open on a visitor's own compute.
colors:
  paper: "#f6f5ef"
  ink: "#242d25"
  muted-ink: "#60685f"
  quiet-line: "#d7dacf"
  olive-accent: "#e7f58a"
  clean-surface: "#fffef8"
  error: "#952c24"
  evergreen-hover: "#40503a"
  selected-olive: "#f2f5e7"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
rounded:
  field: "4px"
  control: "5px"
  panel: "8px"
  round: "50%"
spacing:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "24px"
  panel: "30px"
  section: "44px"
  column: "66px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.clean-surface}"
    rounded: "{rounded.control}"
    padding: "15px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.evergreen-hover}"
    textColor: "{colors.clean-surface}"
  button-secondary:
    backgroundColor: "{colors.olive-accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 16px"
    height: "44px"
  input:
    backgroundColor: "white"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
    height: "46px"
  launch-panel:
    backgroundColor: "{colors.clean-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "30px"
---

# Design System: PODS

## Overview

**Creative North Star: "Warm, Dependable Utility"**

PODS is an operational product surface: it helps a visitor choose an application, prepare a repository, or open a prepared product on their own compute. It feels calm and trustworthy through warm paper, dark evergreen text, quiet olive rules, plain language, and familiar controls. The interface stays visibly modest while provider setup and launch state do the substantive work.

Operate mode is the system's primary expression. Catalogue rows lead to an exact prepared application; the developer route turns a repository URL into visible preparation progress and a shareable link; the launch route pairs application facts with provider choice, live status detail, recovery actions, and automatic same-tab navigation to the product. A launched application keeps its own identity. PODS does not restyle every product as the earlier Field Notes sample.

**Key Characteristics:**

- Warm paper and clean inset surfaces with evergreen and olive accents.
- Clear task hierarchy, honest status text, and restrained motion.
- Application context first, provider choice and action second.
- Native-feeling system typography and accessible form controls.

## Colors

The palette is warm, low-contrast, and utilitarian; olive indicates selection and action support while dark evergreen carries primary actions and text.

### Primary

- **Evergreen Ink:** Primary text, primary buttons, and the strongest current state.
- **Olive Accent:** Secondary actions, text selection, and skip-link visibility.

### Neutral

- **Warm Paper:** The page canvas.
- **Clean Surface:** The launch and account panel.
- **Muted Ink:** Supporting copy, metadata, elapsed time, and low-emphasis actions.
- **Quiet Line:** Dividers, fields, provider cards, and section boundaries.
- **Error Red:** Alerts and failed progress states only.

**The Olive Restraint Rule.** Use olive to clarify selection, focus, and secondary action; it should not become a decorative wash.

## Typography

**Display Font:** System UI sans-serif stack

**Body Font:** System UI sans-serif stack

**Character:** Direct and familiar. Compact labels and metadata support a large, balanced task heading without introducing a separate brand typeface.

### Hierarchy

- **Display:** Large semibold type with tight tracking for the page task.
- **Title:** Compact semibold type for sections, application names, and results.
- **Body:** Regular system text with generous line height for explanations and status detail.
- **Label:** Small, usually semibold text for controls, navigation, facts, and history.

**The Plain-Language Rule.** Status headings name the current user-visible event; detail text explains what the provider or PODS is doing and how the user can recover.

## Layout

The page uses a centered container capped at 1280px. Desktop task introductions and workspaces use two columns: repository or application context on the left, provider/account choice and the primary action on the right. Catalogue entries remain full-width rows, and preparation completion becomes a two-column result with the share link beside the outcome.

At 800px and below, all paired layouts collapse to one column in task order. The heading precedes its explanation; repository or application facts precede provider choice; progress and the primary action stay within the provider panel; share details precede copy and try controls. Navigation remains available, the nonessential header note disappears, and controls wrap rather than compress.

**The Task-Order Rule.** Responsive collapse must preserve the sequence in which a person understands and completes the task.

## Elevation & Depth

The system is flat. It uses paper-to-surface contrast, one-pixel rules, and inset grouping instead of shadows. Motion is limited to a 150ms primary-button color change and a 250ms preparation-result reveal; reduced-motion preference removes both transitions and animations.

**The Flat-by-Default Rule.** Do not add shadows to create hierarchy that borders, spacing, and tonal surfaces already express.

## Shapes

Controls use small, practical corners: 4px for fields and secondary actions, 5px for provider choices and primary actions, and 8px for the main launch panel. The small circular olive mark beside the wordmark is the only fully round brand element. Borders stay one pixel and quiet.

## Components

### Buttons

- **Primary:** Full-width dark evergreen control with a 48px minimum height. It changes copy with connection and launch state.
- **Secondary:** Olive action with a quiet olive border and a 44px minimum height, used for copy, retry, and preview connection.
- **Text action:** Underlined muted text with a 44px minimum target, used for disconnecting or stopping.
- **Focus:** All interactive elements use a visible three-pixel green outline with four-pixel offset.

### Cards / Containers

- **Launch panel:** Clean surface, quiet border, 8px corners, and 30px desktop padding.
- **Provider choice:** A bordered 72px-minimum row. Selection changes both border and background while retaining the native radio control.
- **Catalogue choice:** A border-separated row with application title, description, and a clear “Try application” action.

### Inputs / Fields

Fields use a white fill, quiet border, 4px corners, and a 46px minimum height. Read-only result fields use a slightly tinted surface. Help text sits directly below the field; advanced folder input stays inside a disclosure.

### Navigation

The wordmark anchors home. Two plain text routes distinguish trying an app from preparing one; the current route is underlined and semibold. The footer remains informational and low emphasis.

### Progress and recovery

Three ordered steps summarize preparation or launch while a live heading, elapsed time, and status detail describe the current operation. Completed steps turn green; failures use error red. Interrupted polling exposes “Check progress again.” Provider authorization cancellation returns the person to the same task with provider-specific guidance and a direct reconnect path. Ready launch state exposes an explicit open action and automatically navigates to the exact application when the accepted flow remains active.

### Application identity

PODS presents the prepared application's verified title, description, source revision, and artifact size. The actual product owns the destination screen and its own interface. Field Notes remains a meaningful example of a document-like notes product, including its Georgia document-title treatment; it is not a universal preview frame or PODS brand rule.

## Do's and Don'ts

### Do:

- **Do** keep the application, repository, provider, and live state explicit.
- **Do** preserve recovery actions after provider cancellation, connection expiry, polling interruption, build failure, or launch failure.
- **Do** distinguish preparation time, provider startup, application health, and browser-visible readiness when presenting timing.
- **Do** keep mobile controls in task order and retain 44px-or-larger action targets.

### Don't:

- **Don't** describe a terminal, health response, or launcher as the finished product.
- **Don't** imply browser authorization is complete when the preview-token connection is still the available setup.
- **Don't** apply the Field Notes document aesthetic to unrelated prepared applications.
- **Don't** add decorative dashboards, provider logos, shadows, or ornamental status graphics to this quiet operational surface.
