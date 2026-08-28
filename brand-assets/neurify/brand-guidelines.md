# Neurify Mini Brand Guidelines

**Purpose.** This mini guide establishes a consistent visual identity for **Neurify**, the digital coordination platform for the Neurosurgery Department at King Saud Medical City. It covers the approved app icon, horizontal wordmark, core palette, typography direction, spacing, and app-store exports.

**Identity-kit download:** [Neurify identity kit (ZIP)](https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/VOfHMasqwngehwgl.zip)

## 1. Brand system

| Asset | Primary use | File |
| --- | --- | --- |
| App icon | Launcher, social avatar, favicon, compact spaces | [PNG master](https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/YXXIihcgMrZwtzzK.png) |
| Horizontal wordmark | App headers, posters, reports, presentations | [Approved humanist PNG master](https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/qflgvWRFuLWVioHc.png) |
| Pilot-launch flyer | Internal announcements and WhatsApp distribution | [PNG poster](https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/kOpQOrZAiOTiIiUQ.png) |

The **Neurify icon** represents coordinated clinical pathways: three connected routes form an abstract “N”, while the contrasting nodes suggest secure handoff and shared visibility across the care team. Use the symbol alone only when the application name is already visible nearby; otherwise use the complete horizontal wordmark.

## 2. Approved color palette

| Role | Color name | Hex | Use |
| --- | --- | --- | --- |
| Primary | Midnight Navy | `#082B49` | Main background, headings, high-trust surfaces |
| Accent | Clinical Teal | `#00AFC1` | Interactive highlights, pathway lines, active indicators |
| Accent | Coordination Gold | `#D5A941` | Key nodes, milestones, restrained emphasis |
| Neutral | Clinical White | `#FFFFFF` | Logo background, cards, primary reverse text |
| Neutral | Mist Surface | `#F4F8FB` | Light backgrounds and report sections |
| Text | Ink Navy | `#12304A` | Body copy on light backgrounds |

> Use **Midnight Navy** as the dominant color. Teal and gold should support hierarchy, not compete for attention. Avoid changing the icon colors independently.

## 3. Typography

| Context | Preferred family | Fallback | Weight and guidance |
| --- | --- | --- | --- |
| Approved Neurify wordmark | Custom humanist sans letterform | Not applicable | Always use the supplied master asset; do not retype or substitute the brand name. |
| English UI support | Manrope | Inter, Arial | SemiBold for headings; Regular for body text. |
| Arabic UI and communications | IBM Plex Sans Arabic | Noto Sans Arabic, Arial | SemiBold for headings; Regular for body text |
| Reports | IBM Plex Sans Arabic + Manrope | System sans-serif | Keep clinical fields at 11pt or larger in print |

Use sentence case for English labels and clear, short Arabic phrases. The Neurify wordmark uses a calm, humanist letterform with softened terminals and a clinical-teal dot above the `i`; do not typeset the name with a substitute font. Use the supplied wordmark asset.

## 4. Logo use and spacing

| Rule | Requirement |
| --- | --- |
| Clear space | Keep space equal to the teal node diameter around every side of the symbol or wordmark. |
| Minimum digital size | Do not render the symbol below 24 px; do not render the horizontal wordmark below 140 px wide. |
| Minimum print size | Do not print the symbol below 8 mm; do not print the wordmark below 30 mm wide. |
| Background | Use the full-color icon on Midnight Navy or white. Use the wordmark on white, Mist Surface, or Midnight Navy with sufficient contrast. |
| Prohibited use | Do not stretch, rotate, recolor, add a border, add a shadow, crop the symbol, or place it on visually busy imagery. |

## 5. iOS and Android store assets

The icon exports are RGB PNGs derived from the approved square master. Apple uses a 1024 × 1024 square iOS layout asset and applies the final system masking; Google Play requires a 512 × 512 sRGB 32-bit PNG and dynamically renders its corner treatment and shadow. [1] [2]

| Platform | Required file | Size | Notes |
| --- | --- | --- | --- |
| Apple App Store | `store-icons/ios/AppStore-1024.png` | 1024 × 1024 px | Square, opaque master export; allow the system to apply the final mask. |
| iOS app asset catalog | `store-icons/ios/AppIcon-*` | 40–180 px plus 1024 px | Density-specific exports for common application placements. |
| Google Play | `store-icons/android/GooglePlay-512.png` | 512 × 512 px | Full square, sRGB, 32-bit PNG, no pre-applied rounded corners or shadow. |
| Android launcher | `store-icons/android/mipmap-*` | 48–192 px | Legacy-density launcher exports. |
| Android adaptive preparation | [Transparent foreground master](https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/gHqMtcsFGAwOtOLb.png) | 1920 × 1920 px | Resize from the transparent master when a native adaptive foreground layer is required. |

## 6. Flyer and internal communication

Use the final flyer in portrait orientation for WhatsApp, internal mail, and noticeboards. Keep the wordmark and app icon in the top third of the layout. App-screen images must contain only fictional or anonymized content; never use patient names, MRNs, images, diagnoses, or actual clinical conversations in promotional material.

## 7. Quick approval checklist

| Check | Pass condition |
| --- | --- |
| Icon | Square, full bleed, uncluttered, no text embedded in the icon |
| Wordmark | Exact spelling: `Neurify`; symbol and text remain proportionate |
| Contrast | Navy or white background provides clear readability |
| Store upload | Use the dedicated 1024 px iOS or 512 px Google Play export, not a screenshot |
| Clinical privacy | Promotional assets contain no identifiable patient or staff information |

## References

[1]: https://developer.apple.com/design/human-interface-guidelines/app-icons "Apple Human Interface Guidelines — App icons"
[2]: https://developer.android.com/distribute/google-play/resources/icon-design-specifications "Google Play icon design specifications"
