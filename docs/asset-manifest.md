# Asset manifest

The production app reuses the original artwork supplied in Registrix-New-Assets.zip and Registrix-Studio-Campus-Design.zip. All 23 SVG files and their license are delivered under `public/assets/` in source and `assets/` in the web build. There are no external CDN images or school graphics. Paths below are relative to `public/`.

| Assets | Classification | Source | License / attribution |
| --- | --- | --- | --- |
| assets/logo/registrix-mark.svg | Newly created original artwork | Created for this Registrix delivery; no external source | Included for use and modification in Registrix and portfolio work; no attribution required |
| assets/logo/registrix-wordmark.svg | Newly created original mark and wordmark | Created for this delivery | Same permission; text references native Segoe UI / Arial, not embedded fonts |
| assets/illustrations/records-workspace.svg | Newly created original illustration | Created for this delivery | Same permission; editable SVG paths and shapes |
| assets/icons/dashboard.svg, students.svg, book.svg, grades.svg, help.svg | Newly created original interface icons | Created SVG paths for this delivery | Same permission; no third-party icon library used |
| assets/icons/users.svg, logout.svg, search.svg, edit.svg, trash.svg | Newly created original interface icons | Created SVG paths for this delivery | Same permission |
| assets/icons/plus.svg, mail.svg, lock.svg, eye.svg, check.svg | Newly created original interface icons | Created SVG paths for this delivery | Same permission |
| assets/icons/alert.svg, clock.svg, shield.svg, arrow-right.svg, chevron-right.svg | Newly created original interface icons | Created SVG paths for this delivery | Same permission |
| Backgrounds, borders, status fills and shadows | Adapted production CSS styling | src/styles/tokens.css and src/styles/app.css | Included in source; no separate raster background asset |
| Native font references | External system resources, not bundled | Georgia / Times New Roman; Segoe UI / Arial installed on the viewer’s device | No font files redistributed. Use existing licensed installation; fallbacks specified. See [Microsoft font redistribution guidance](https://learn.microsoft.com/en-us/typography/fonts/font-faq) |
| Functional field names, course/subject catalog and flow | Reused reference information | Supplied StudentRecords-Recovery.zip source code | Reference only; no original source code, database, records, logos, seals or image assets are included |

No font binary is included because installed system fonts do not automatically confer redistribution rights. The replacement is a native CSS font stack that works offline. Every artwork asset in the preview is separately supplied as SVG. There are no raster photos, avatars or mockup backgrounds to download; avatars are synthetic initials rendered as text.

The artwork was originally created for the supplied design delivery and is reused here; no new raster artwork or external icon package was introduced during implementation. The UI is built from React components. Audit screenshots are separate evidence and are never loaded as interface backgrounds.
