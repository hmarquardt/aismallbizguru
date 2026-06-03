# AI Small Business Guru Branding Guide

A light-first brand system for practical small-business tech help.

This guide defines the preferred visual, verbal, and implementation direction for **AI Small Business Guru** and related service/package names. It is intended to be usable by humans, Codex, Claude Code, and future design/build agents.

---

## 1. Brand Positioning

### Core Identity

**AI Small Business Guru** should feel like:

- A seasoned technical professional helping real small businesses
- Practical, clear, human, and trustworthy
- AI-enabled without being AI-hypey
- Fast and useful without feeling like a fake agency
- Friendly enough for local businesses, technical enough for workflow/data work

The brand should **not** feel like:

- A dark hacker dashboard
- A crypto/AI grift landing page
- A fake large agency
- Enterprise “digital transformation” sludge
- A wizard/monk/guru parody taken too literally

### Recommended Framing

Use the founder/operator identity clearly:

> I’m Hank, a 20+ year web and data engineer. Through AI Small Business Guru, I help small businesses fix annoying web, data, and workflow problems fast.

This is stronger than pretending to be a large agency.

### Strategic Formula

```text
Experienced human + useful brand wrapper = credible
Mysterious AI brand + vague promises = suspicious
```

---

## 2. Primary Brand Direction

The preferred direction is:

## Human Guru + Toolbox Local

This combines:

- **Human Guru**: personal credibility, seasoned judgment, practical AI leverage
- **Toolbox Local**: small-business usefulness, concrete fixes, plain-English delivery

### Brand Personality

| Trait | Direction |
|---|---|
| Practical | Fix the thing, explain the thing, leave no mess |
| Human | Lead with Hank, not anonymous “we” |
| Lightly funny | Use wit, but do not undermine trust |
| Experienced | Calm confidence, not hype |
| AI-enabled | Mention AI as leverage, not as the product |
| Small-business friendly | Avoid technical intimidation |

---

## 3. Primary Message

### Main Headline Options

Use one of these as a starting point:

```text
Small Business Tech Fixes Without the Agency Circus
```

```text
One Annoying Business Problem, Fixed Fast
```

```text
Useful Tech Fixes for Small Businesses
```

```text
Websites, Spreadsheets, Automations, and Tiny Business Disasters — Fixed
```

### Primary Subhead

```text
I’m Hank, a 20+ year web and data engineer using modern AI tools to turn broken pages, messy spreadsheets, and repetitive workflows into simple working systems.
```

### Short Taglines

```text
Useful tech fixes without the agency circus.
```

```text
One broken thing. One clear fix.
```

```text
Practical AI-assisted help for small-business messes.
```

```text
Fix the workflow before it eats your week.
```

```text
Small tools for annoying business problems.
```

---

## 4. Offer Architecture

The brand should support productized services that are easy to understand and easy to buy.

### Primary Offer

```text
I fix one annoying business workflow, broken web thing, or spreadsheet mess in 48 hours.
```

### Service Buckets

#### Website Rescue

For broken, confusing, outdated, or underperforming web pages.

Examples:

- Mobile layout fixes
- Broken contact forms
- Landing page cleanup
- Homepage CTA improvement
- Speed/SEO basics
- Broken links
- Analytics setup
- Simple content refresh

#### Spreadsheet-to-Dashboard

For CSV, Excel, Google Sheets, exports, and recurring reports.

Examples:

- Clean dashboards
- CSV upload tools
- Charts and filters
- Summary insights
- Downloadable cleaned data
- Local/offline HTML tools

#### Workflow Automation

For repetitive manual business tasks.

Examples:

- File renaming/parsing
- Report generation
- Lightweight admin tools
- Form-to-output workflows
- Email/template helpers
- Small Python/SQLite/browser tools

#### Data Mechanic

Use this as a service lane or sub-brand for data-heavy work.

```text
Messy inputs. Useful outputs.
```

#### Workflow Goblin

Use this as a content hook or playful sub-brand, not the main handshake for conservative buyers.

```text
Stop feeding the workflow goblins.
```

---

## 5. Voice and Copy Rules

### Voice

Write like a highly competent technical person who can talk to normal humans.

Good:

```text
Your contact form is probably costing you leads. I can fix it this week and send you a before/after report.
```

Bad:

```text
We leverage agentic AI transformation frameworks to unlock operational excellence.
```

### Tone

Use:

- Plain English
- Concrete examples
- Short sentences
- Specific deliverables
- Mild humor
- Founder/operator honesty

Avoid:

- Buzzword sludge
- Dark cyberpunk language
- Grandiose agency claims
- “Revolutionize your business”
- “AI-powered everything”
- Fake scale
- Overuse of “guru” language

### Preferred Words

Use these freely:

```text
fix
clean up
ship
useful
working
practical
simple
clear
handoff
before/after
small business
workflow
dashboard
spreadsheet
form
page
automation
```

### Words to Use Carefully

These are okay, but should not dominate:

```text
AI
agent
automation
guru
transformation
optimization
intelligence
```

### Words to Avoid

```text
synergy
disrupt
revolutionize
paradigm
growth hacking
unlock potential
digital transformation journey
AI magic
enterprise-grade
```

---

## 6. Visual Direction

## Light-first. Always.

The preferred brand should be bright, readable, warm, and professional.

### Design Principles

- Light surfaces
- Dark readable text
- Clear borders
- Warm accent colors
- Practical UI patterns
- No low-contrast gray-on-gray content
- No dark hacker dashboard as the default
- No neon-on-black as the main brand expression
- Use whitespace generously
- Use cards, tabs, and service blocks with visible contrast

### Surface Hierarchy

Use this general light hierarchy:

```css
--page: #f7f5ef;
--paper: #ffffff;
--paper-warm: #fffaf0;
--ink: #18202a;
--ink-strong: #0b1220;
--muted: #536273;
--line: #d8dee6;
--line-strong: #b9c3cf;
```

### Contrast Rules

- Body text should usually be `#536273` or darker on white.
- Headlines should use `#0b1220`, `#18202a`, or an equivalently dark color.
- Borders should be visible enough to separate panels.
- Avoid text lighter than `#6b7785` unless it is nonessential metadata.
- Never place pale gray text on pale tinted cards.
- Buttons should use dark or saturated backgrounds with white text.
- Colored pills should have either dark text on pale background or white text on saturated background.

---

## 7. Primary Palette

This is the recommended main palette for the site and outreach materials.

### Human Guru Palette

| Token | Hex | Use |
|---|---:|---|
| Ink | `#1F2933` | Main text, logo strokes |
| Strong Ink | `#0B1220` | Headlines |
| Warm White | `#FFFAF0` | Warm panels |
| Paper | `#FFFFFF` | Cards and content surfaces |
| Trust Gold | `#D97706` | Primary accent |
| Practical Green | `#15803D` | Secondary accent |
| Parchment | `#F7EFD8` | Soft background |
| Muted Text | `#536273` | Body/subtext |
| Line | `#D8DEE6` | Borders |

### CSS Tokens

```css
:root {
  color-scheme: light;

  --page: #f7f5ef;
  --paper: #ffffff;
  --paper-warm: #fffaf0;

  --ink: #18202a;
  --ink-strong: #0b1220;
  --muted: #536273;

  --line: #d8dee6;
  --line-strong: #b9c3cf;

  --primary: #d97706;
  --secondary: #15803d;
  --accent-soft: #f7efd8;

  --shadow: 0 20px 55px rgba(24, 32, 42, .12);
  --shadow-soft: 0 8px 24px rgba(24, 32, 42, .08);
}
```

---

## 8. Secondary Palettes

Use these for service lanes or alternate sections.

### Clean Operator

Best for pricing, packages, checklists, and fixed-scope offers.

| Token | Hex |
|---|---:|
| Ink | `#0B1220` |
| Cloud | `#F7FAFF` |
| Operator Blue | `#155EEF` |
| Sky | `#0EA5E9` |
| Soft Blue | `#EEF5FF` |

### Data Mechanic

Best for dashboards, scripts, workflow automation, and technical/data-heavy services.

| Token | Hex |
|---|---:|
| Deep Green Ink | `#10231D` |
| Mint Paper | `#F2FBF7` |
| Mechanic Green | `#047857` |
| Signal | `#10B981` |
| Soft Mint | `#E6F7EF` |

### Toolbox Local

Best for local-business approachable service pages.

| Token | Hex |
|---|---:|
| Tool Ink | `#291A10` |
| Worklight | `#FFF8EF` |
| Tool Orange | `#C2410C` |
| Shop Blue | `#1D4ED8` |
| Bench Tan | `#F8EAD6` |

### Workflow Goblin

Best for content, memes, lead magnets, or playful sub-branding.

| Token | Hex |
|---|---:|
| Goblin Ink | `#1D260D` |
| Bone Paper | `#FBFFEF` |
| Deep Lime | `#5B7C00` |
| Chaos Purple | `#C026D3` |
| Soft Lime | `#EFF9D4` |

---

## 9. Typography

No external fonts are required.

### Primary Type Stack

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

### Human Guru Display Stack

Use for the main brand lockup or hero headlines when you want warmth and authority.

```css
font-family:
  ui-serif,
  Georgia,
  Cambria,
  "Times New Roman",
  serif;
```

### Clean Operator Display Stack

Use for service pages, pricing, and straightforward web UI.

```css
font-family:
  ui-sans-serif,
  system-ui,
  "Segoe UI",
  sans-serif;
font-weight: 900;
letter-spacing: -0.06em;
```

### Data Mechanic Accent Stack

Use only for labels, code-like headings, or the Data Mechanic sub-brand.

```css
font-family:
  ui-monospace,
  SFMono-Regular,
  Menlo,
  Monaco,
  Consolas,
  monospace;
```

Do not use monospace for long body copy.

---

## 10. Logo and SVG Strategy

The logo system should be inline SVG-friendly, simple, and reusable.

### Preferred Main Mark: Human Guru

Concept:

- Rounded square
- Human face/head
- Practical green body/base
- Gold head/spark
- Simple “guru” arc or spark
- Dark strokes for readability

The logo should feel human and experienced, not mystical.

### Main SVG

```svg
<svg viewBox="0 0 128 128" role="img" aria-label="AI Small Business Guru logo">
  <rect width="128" height="128" rx="30" fill="#ffffff"/>
  <circle cx="64" cy="48" r="21" fill="#f59e0b"/>
  <path d="M35 101c6-23 20-35 29-35s23 12 29 35" fill="#15803d"/>
  <path d="M38 39c9-17 29-24 48-11" fill="none" stroke="#1f2933" stroke-width="8" stroke-linecap="round"/>
  <path d="M80 31l15-15 4 20" fill="none" stroke="#1f2933" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M45 55h38" stroke="#1f2933" stroke-width="6" stroke-linecap="round"/>
</svg>
```

### Alternate Marks

Use alternates for sub-brands or sections.

#### Clean Operator

Checklist + spark.

#### Data Mechanic

Data sliders + wrench/repair shape.

#### Toolbox Local

Toolbox + bolt/check/spark.

#### Workflow Goblin

Mascot face + business/process icon.

### SVG Rules

- Keep shapes simple.
- Avoid text inside SVG logos.
- Must work at favicon size.
- Maintain light backgrounds by default.
- Provide one-color versions when needed.
- Use rounded geometry to keep the brand friendly.
- Avoid overly complex gradients.

---

## 11. Layout Style

### Preferred Components

Use:

- Light cards
- Soft shadows
- Visible borders
- Rounded corners
- Clear tabs
- Service cards
- Before/after blocks
- Intake forms
- Pricing cards
- “What you get” checklists
- Plain-English process steps

Avoid:

- Full-screen black hero sections
- Cyberpunk neon grids
- Low-contrast ghost panels
- Overly glassmorphic translucent cards
- Animated clutter
- Huge abstract AI art backgrounds
- Vague “AI brain” visuals

### Border and Shadow Defaults

```css
.card {
  background: #ffffff;
  border: 1px solid #d8dee6;
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(24, 32, 42, .08);
}
```

### Button Defaults

```css
.button-primary {
  background: #d97706;
  color: #ffffff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 999px;
  font-weight: 900;
  padding: 0.75rem 1rem;
}

.button-secondary {
  background: #ffffff;
  color: #1f2933;
  border: 1px solid #b9c3cf;
  border-radius: 999px;
  font-weight: 800;
  padding: 0.75rem 1rem;
}
```

---

## 12. Page Structure Recommendation

### Homepage

Suggested order:

1. Hero
2. Three service cards
3. “How it works”
4. Examples of problems fixed
5. Packages/pricing
6. Founder credibility
7. FAQ
8. Intake CTA

### Hero Example

```text
Small Business Tech Fixes Without the Agency Circus

I’m Hank, a 20+ year web and data engineer using modern AI tools to turn broken pages, messy spreadsheets, and repetitive workflows into simple working systems.

[Book a 48-hour fix] [See examples]
```

### Services Section

```text
Website Rescue
Broken forms, weak CTAs, ugly mobile pages, confusing landing pages.

Spreadsheet-to-Dashboard
Turn CSV, Excel, or Google Sheets exports into readable dashboards and tools.

Workflow Automation
Replace repetitive admin chores with scripts, forms, and tiny internal tools.
```

### Process Section

```text
1. Show me the mess
Send the page, spreadsheet, workflow, or task.

2. I scope one useful fix
No sprawling consulting engagement. One clear deliverable.

3. I build and hand it off
You get the working result, notes, and a plain-English walkthrough.
```

---

## 13. Pricing Language

For early sprint/offers, use simple package names.

### Package Options

```text
Quick Fix — $250
One small, clearly scoped repair.

Deep Fix — $500
A more involved cleanup, automation, or dashboard.

Rescue Sprint — $1,000
A focused short sprint for a larger workflow or web problem.
```

### Scope Guardrails

Use this language:

```text
Each package includes one defined deliverable, one revision pass, and a short handoff note. If the issue expands beyond the original scope, I’ll quote the next step before doing extra work.
```

---

## 14. Outreach Copy Style

### Direct Outreach Template

```text
Hi [Name] — I’m Hank, a 20+ year web/data engineer.

I noticed [specific issue] on [site/page/workflow]. That kind of thing can quietly cost leads or waste admin time.

I run AI Small Business Guru, where I fix one annoying web, spreadsheet, or workflow problem at a time.

I could clean this up this week for [price] and send you a before/after summary.

Worth a quick look?
```

### Shorter Version

```text
Hi [Name] — I noticed [specific issue]. I’m Hank, a 20+ year web/data engineer, and I fix small-business web/workflow problems through AI Small Business Guru.

I can fix this this week for [price] and send you a before/after note. Interested?
```

---

## 15. Do / Don’t

### Do

- Lead with Hank’s experience
- Keep design light and readable
- Explain deliverables plainly
- Show examples
- Use “AI” as leverage, not identity
- Be specific about problems fixed
- Use service packages
- Use warm, practical colors
- Keep humor restrained but present

### Don’t

- Default to dark themes
- Use low-contrast pale gray text
- Pretend to be a big agency
- Sell vague AI consulting
- Overuse “guru”
- Overuse neon
- Use abstract robot-brain imagery
- Make everything feel like a SaaS dashboard
- Create crufty hidden states with poor contrast

---

## 16. Accessibility and Contrast Checklist

Before shipping any page:

- [ ] Body text is readable on all backgrounds
- [ ] Buttons have strong text/background contrast
- [ ] Borders visibly separate panels
- [ ] Hover/focus states are visible
- [ ] Tabs show clear active state
- [ ] No pale gray text on pale tinted cards
- [ ] Cards remain readable on mobile
- [ ] SVG logo works at small size
- [ ] Page still works without external fonts
- [ ] Color is not the only indicator of state

---

## 17. Implementation Defaults

### Recommended File Names

```text
BRANDING.md
brand.css
logo.svg
logo-mark.svg
logo-onecolor.svg
```

### Recommended CSS Organization

```css
/* 1. Tokens */
/* 2. Base */
/* 3. Layout */
/* 4. Components */
/* 5. Service-specific variants */
/* 6. Utilities */
/* 7. Responsive */
```

### Recommended Class Naming

```css
.brand-header
.brand-lockup
.brand-mark
.hero
.service-card
.package-card
.process-step
.intake-card
```

---

## 18. Final Recommendation

Use **AI Small Business Guru** as the main brand.

Lead with:

```text
Hank Marquardt
20+ year web/data engineer
Founder/operator of AI Small Business Guru
```

Use this positioning:

```text
Practical web, data, and workflow fixes for small businesses.
```

Use this visual strategy:

```text
Light-first, warm, practical, founder-led, readable, and human.
```

Use **Data Mechanic** as a service lane.

Use **Workflow Goblin** as content bait or a playful productized sub-brand.

Do not let the brand drift into dark hacker cave, fake agency, or AI-grift territory.

---

## 19. Deploy Footer and Versioning

The production page should include a visible, machine-discoverable version footer. This is agent-managed as part of the change process, not updated by a Git hook.

Use this marker pattern in `index.html`:

```html
<!-- AISBG_DEPLOY_FOOTER version="YYYY.MM.DD.N" bump="Update this version whenever this file changes in a commit." -->
<p class="site-version" data-aisbg-deploy-footer data-deploy-version="YYYY.MM.DD.N" aria-label="Site version">version YYYY.MM.DD.N</p>
```

### Version Rules

- Format: `YYYY.MM.DD.N`
- Update the footer version whenever `index.html` changes in a commit.
- Increment `N` for each commit on the same calendar day.
- Reset to `.1` on a new calendar day.
- Keep the comment version, `data-deploy-version`, and visible footer text identical.
