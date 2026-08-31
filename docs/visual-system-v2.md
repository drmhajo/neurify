# Neurify Visual System v2

## Direction

The redesigned interface uses a calm clinical-editorial style rather than the prior navy-and-teal dashboard treatment. The visual system is intentionally light, structured, and readable on compact Android screens. It preserves the Neurify wordmark and clinical purpose while moving the interface toward a warmer, more modern palette.

## Color tokens

| Token | Value | Intended use |
| --- | --- | --- |
| Ink | `#29364B` | Primary headings and essential content |
| Indigo | `#4956A6` | Navigation, primary actions, and selected controls |
| Jade | `#168B7A` | Positive actions and clinically safe confirmation states |
| Canvas | `#F8F8FC` | Screen backgrounds |
| Surface | `#FFFFFF` | Cards, forms, and bottom navigation |
| Lilac wash | `#EEF0FF` | Primary highlighted surfaces |
| Mint wash | `#E8F7F3` | Positive highlighted surfaces |
| Apricot wash | `#FFF0E8` | Attention and date-related highlighted surfaces |
| Rose wash | `#FFF0F2` | Urgent but non-alarming surfaces |
| Line | `#E2E4EF` | Borders and separators |
| Muted | `#6D778C` | Supporting text and inactive controls |

## Typography

The interface uses the locally packaged **Cairo** family for Arabic and English. Cairo Regular is used for ordinary content, Cairo SemiBold for labels and controls, and Cairo Bold for headings and primary metrics. The application loads all three weights before rendering its navigation, so users do not see a shift from a system font after the screen opens.

## Icon treatment

Icons retain a familiar clinical metaphor set, but their presentation changes to a consistent outlined visual treatment. Primary navigation and actions use a compact indigo icon on a pale lilac circular surface; contextual and positive actions use jade on mint. No visual asset depends on a remote URL.

## Accessibility and direction

All contrast-critical labels use Ink or Indigo on light surfaces. Status color is supplemented by text. Components keep RTL/LTR direction explicit and reserve fixed-size icon surfaces so Arabic labels cannot collide with icons at compact widths.
