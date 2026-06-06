# Flori-Core Per-Farm Demo Generator — Task Plan

## Overview
Generate 20 customised demo HTML files (one per Kenyan flower farm) from the base
`floricore-cenancle-demo.html`, then write 20 pitch emails in `pitch-emails.md`.

---

## Part 1 — 20 Farm Demo HTML Files ✳️ (in progress)

Each saved as `demos/floricore-[slug]-demo.html`

### Farm Registry

| # | Farm | Location | Contact | Initials | Role | Slug | Stems/day | Staff | Rev MTD |
|---|------|----------|---------|----------|------|------|-----------|-------|---------|
| 1 | Oserian Development Company | Naivasha | Hamish Ker | HK | Farm Director | oserian | 1,000,000 | 5,000 | 82M |
| 2 | Aquila Development Company | Naivasha | Abhay Marathe | AM | Farm Director | aquila | 180,000 | 420 | 14.2M |
| 3 | Wildfire Flowers | Naivasha | Patrick Mbugua | PM | Operations Manager | wildfire | 35,000 | 180 | 5.8M |
| 4 | Subati Flowers | Naivasha | Naren Patel | NP | Operations Manager | subati | 165,000 | 390 | 13.1M |
| 5 | Maridadi Flowers | Naivasha | Jack Kneppers | JK | Farm Director | maridadi | 55,000 | 280 | 8.9M |
| 6 | Finlay's Flamingo | Naivasha | Peter Mwangi | PM | Operations Manager | finlays | 90,000 | 340 | 11.2M |
| 7 | Van Den Berg Roses | Naivasha | Johan Remeus | JR | Farm Director | vandenberg | 70,000 | 220 | 9.4M |
| 8 | Savannah International | Naivasha | Ignaitus Lukulu | IL | Farm Director | savannah | 42,000 | 190 | 6.7M |
| 9 | Sian Roses | Kitengela | Jos van der Venne | JV | Farm Director | sianroses | 120,000 | 360 | 12.8M |
| 10 | P.J. Dave Flowers | Isinya | Ananth Kumar | AK | Operations Manager | pjdave | 58,000 | 240 | 7.9M |
| 11 | Red Lands Roses | Ruiru | Isabelle Spindler | IS | Farm Director | redlands | 95,000 | 310 | 11.8M |
| 12 | Flamingo Flora | Nairobi | Sam Ivor | SI | Operations Manager | flamingo | 48,000 | 195 | 6.2M |
| 13 | Black Tulip Group | Nairobi | Mohan Choudhery | MC | Farm Director | blacktulip | 110,000 | 350 | 12.1M |
| 14 | Karen Roses | Nairobi | Juliana Rono | JR | Farm Director | karenroses | 38,000 | 160 | 5.4M |
| 15 | Kisima | Timau | Martin Dyer | MD | Farm Director | kisima | 62,000 | 260 | 8.4M |
| 16 | Uhuru Flowers | Timau | Ivan Freeman | IF | Farm Director | uhuru | 45,000 | 200 | 6.9M |
| 17 | Equinox Flowers | Timau | Tom Lawrence | TL | Farm Director | equinox | 52,000 | 230 | 7.6M |
| 18 | Tambuzi | Nanyuki | Paul Salim | PS | Farm Director | tambuzi | 40,000 | 175 | 5.9M |
| 19 | AAA Roses | Rumuruti | Jennifer Sassi | JS | Farm Director | aaaroses | 88,000 | 290 | 10.5M |
| 20 | Waridi Ltd | Athi River | PD Kadlag | PK | Farm Director | waridi | 50,000 | 210 | 7.2M |

### Substitutions Applied Per File

| Element | Cenancle (base) | Target |
|---------|-----------------|--------|
| `<title>` | `Cenancle Kenya Demo` | `[Farm Name] Demo` |
| Landing sub-line | `Cenancle Kenya · Naivasha` | farm + location |
| Landing stat stems | `48K` | farm short value |
| Landing stat staff | `312` | farm staff |
| Landing stat revenue | `8.45M` | farm rev MTD |
| URL bar ×2 | `floricore.cenancle.co.ke` | `floricore.[slug].co.ke` |
| Topbar badge | `Cenancle Kenya` | farm name |
| Sidebar avatar | `JK` | contact initials |
| Sidebar name | `James Kariuki` | contact full name |
| Sidebar role | `Farm Director` | derived per contact |
| Dashboard greeting | `Good morning, James` | contact first name |
| Dashboard subtitle | `Cenancle Kenya — Naivasha` | farm + location |
| Dashboard KPI stems | `48,000` | farm value |
| Dashboard KPI revenue | `KES 8.45M` | farm value |
| Dashboard KPI staff | `312` | farm value |
| All 21 TOUR_DATA `why` fields | Cenancle copy | farm-specific copy |
| TOUR_DATA `desc` refs | `Cenancle Kenya` | farm name |
| Zone A/B/C varieties | Red Naomi, Avalanche, Pink Floyd | farm-specific |
| IoT sensor readings | 38.2%, 22.8°C, 1.6 mS/cm | altitude-adjusted |
| Cold room alert time | `02:14 AM` | varied per farm |
| Cold room name | `Cold Room 2` | farm-specific name |
| Payroll breakdown | `312 staff · 148 perm + 164 casual` | farm totals |
| Sales kanban buyers | FloraHolland, Interflora UK… | farm-specific buyers |

---

## Part 2 — pitch-emails.md ⏳ (awaiting confirmation)

Single file at project root with 20 email drafts.

### Email Structure
- **Subject**: `[Farm Name] × Flori-Core — Your farm, built into software`
- **To**: contact email from registry
- **Tone**: WebTech Kenya — confident, specific, never salesy. Under 200 words.
- **Para 1**: One farm-specific sentence (scale / location / product / reputation)
- **Para 2**: Flori-Core one-liner + "Not a brochure. An actual working system, with your farm's name on it."
- **Para 3**: 3 modules most relevant to this farm
- **Para 4**: Cenancle social proof hook + CTA
- **Sign-off**: WebTech Kenya
- **Note to reader**: demo is a preview — full system will be tailored to their operation

### Guardrails
- No "I hope this email finds you well"
- No "leverage" / "solution"
- Every email must be genuinely different in angle and detail

---

## Output Checklist

- [ ] `demos/` directory created
- [ ] 20 HTML files generated and verified non-empty
- [ ] `pitch-emails.md` created with 20 emails
