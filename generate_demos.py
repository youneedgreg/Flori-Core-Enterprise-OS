import os, re

SRC = '/Users/greg/Desktop/projects/Flori-Core-Enterprise-OS/floricore-cenancle-demo.html'
OUT = '/Users/greg/Desktop/projects/Flori-Core-Enterprise-OS/demos'
os.makedirs(OUT, exist_ok=True)

with open(SRC, 'r', encoding='utf-8') as f:
    BASE = f.read()

# ─────────────────────────────────────────────────────────────────
# FARM REGISTRY
# ─────────────────────────────────────────────────────────────────
FARMS = [
  {
    'name':'Oserian Development Company','location':'Naivasha','slug':'oserian',
    'contact':'Hamish Ker','first':'Hamish','initials':'HK','role':'Farm Director',
    'stems_k':'1M','stems_full':'1,000,000','stems_day':'1,000,000',
    'staff':5000,'rev':'82M','rev_kes':'KES 82M',
    'perm':2300,'casual':2700,
    'dispatches':34,
    'cr_time':'02:31 AM','cr_name':'Pack House Cold Room 4',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Akito','2.8 ha'),'zone_c':('Avalanche','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Albert Heijn','Marks & Spencer'],
    'temp':'23.4','moisture':'39.8','ec':'1.7','ph':'6.2',
    'products':'Roses & Fillers',
  },
  {
    'name':'Aquila Development Company','location':'Naivasha','slug':'aquila',
    'contact':'Abhay Marathe','first':'Abhay','initials':'AM','role':'Farm Director',
    'stems_k':'180K','stems_full':'180,000','stems_day':'180,000',
    'staff':420,'rev':'14.2M','rev_kes':'KES 14.2M',
    'perm':190,'casual':230,
    'dispatches':28,
    'cr_time':'02:08 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Proud','2.8 ha'),'zone_c':('Igloo','1.5 ha'),
    'buyers':['FloraHolland','Fleurop Germany','UAE Bloom','Stems EA'],
    'temp':'22.6','moisture':'37.4','ec':'1.6','ph':'6.3',
    'products':'Roses (Export)',
  },
  {
    'name':'Wildfire Flowers','location':'Naivasha','slug':'wildfire',
    'contact':'Patrick Mbugua','first':'Patrick','initials':'PM','role':'Operations Manager',
    'stems_k':'35K','stems_full':'35,000','stems_day':'35,000',
    'staff':180,'rev':'5.8M','rev_kes':'KES 5.8M',
    'perm':82,'casual':98,
    'dispatches':18,
    'cr_time':'03:14 AM','cr_name':'Cold Room 2',
    'zone_a':('Athena','3.2 ha'),'zone_b':('Commanche','2.8 ha'),'zone_c':('Hypericum Berry Flair','1.5 ha'),
    'buyers':['UK Supermarkets','FloraHolland','Filler Buyers','KQ Cargo'],
    'temp':'23.1','moisture':'38.2','ec':'1.6','ph':'6.4',
    'products':'Roses & Hypericum',
  },
  {
    'name':'Subati Flowers','location':'Naivasha','slug':'subati',
    'contact':'Naren Patel','first':'Naren','initials':'NP','role':'Operations Manager',
    'stems_k':'165K','stems_full':'165,000','stems_day':'165,000',
    'staff':390,'rev':'13.1M','rev_kes':'KES 13.1M',
    'perm':175,'casual':215,
    'dispatches':26,
    'cr_time':'02:44 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Topaz','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Fleurop','KQ Cargo'],
    'temp':'22.9','moisture':'38.6','ec':'1.6','ph':'6.3',
    'products':'Roses (Export)',
  },
  {
    'name':'Maridadi Flowers','location':'Naivasha','slug':'maridadi',
    'contact':'Jack Kneppers','first':'Jack','initials':'JK','role':'Farm Director',
    'stems_k':'55K','stems_full':'55,000','stems_day':'55,000',
    'staff':280,'rev':'8.9M','rev_kes':'KES 8.9M',
    'perm':126,'casual':154,
    'dispatches':22,
    'cr_time':'02:22 AM','cr_name':'Cold Room 2',
    'zone_a':('Proud','3.2 ha'),'zone_b':('Tara','2.8 ha'),'zone_c':('Akito','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Belgian Florists','KQ Cargo'],
    'temp':'22.5','moisture':'36.9','ec':'1.6','ph':'6.3',
    'products':'Roses',
  },
  {
    'name':"Finlay's Flamingo",'location':'Naivasha','slug':'finlays',
    'contact':'Peter Mwangi','first':'Peter','initials':'PM','role':'Operations Manager',
    'stems_k':'90K','stems_full':'90,000','stems_day':'90,000',
    'staff':340,'rev':'11.2M','rev_kes':'KES 11.2M',
    'perm':155,'casual':185,
    'dispatches':25,
    'cr_time':'01:58 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Limelight Filler','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Premier Flowers','KQ Cargo'],
    'temp':'23.2','moisture':'37.1','ec':'1.7','ph':'6.2',
    'products':'Roses & Fillers',
  },
  {
    'name':'Van Den Berg Roses','location':'Naivasha','slug':'vandenberg',
    'contact':'Johan Remeus','first':'Johan','initials':'JR','role':'Farm Director',
    'stems_k':'70K','stems_full':'70,000','stems_day':'70,000',
    'staff':220,'rev':'9.4M','rev_kes':'KES 9.4M',
    'perm':100,'casual':120,
    'dispatches':20,
    'cr_time':'02:37 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Prom','2.8 ha'),'zone_c':('Norfolk','1.5 ha'),
    'buyers':['FloraHolland','Dutch Wholesalers','Stems NL','KQ Cargo'],
    'temp':'22.8','moisture':'37.8','ec':'1.6','ph':'6.3',
    'products':'Roses',
  },
  {
    'name':'Savannah International','location':'Naivasha','slug':'savannah',
    'contact':'Ignaitus Lukulu','first':'Ignaitus','initials':'IL','role':'Farm Director',
    'stems_k':'42K','stems_full':'42,000','stems_day':'42,000',
    'staff':190,'rev':'6.7M','rev_kes':'KES 6.7M',
    'perm':87,'casual':103,
    'dispatches':17,
    'cr_time':'03:02 AM','cr_name':'Cold Room 2',
    'zone_a':('Proud','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Red Naomi','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Gulf Flowers','KQ Cargo'],
    'temp':'23.6','moisture':'36.2','ec':'1.6','ph':'6.4',
    'products':'Roses (Export)',
  },
  {
    'name':'Sian Roses','location':'Kitengela','slug':'sianroses',
    'contact':'Jos van der Venne','first':'Jos','initials':'JV','role':'Farm Director',
    'stems_k':'120K','stems_full':'120,000','stems_day':'120,000',
    'staff':360,'rev':'12.8M','rev_kes':'KES 12.8M',
    'perm':165,'casual':195,
    'dispatches':27,
    'cr_time':'02:19 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Igloo','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Premier Blooms','KQ Cargo'],
    'temp':'25.2','moisture':'31.4','ec':'1.5','ph':'6.3',
    'products':'Roses',
  },
  {
    'name':'P.J. Dave Flowers','location':'Isinya','slug':'pjdave',
    'contact':'Ananth Kumar','first':'Ananth','initials':'AK','role':'Operations Manager',
    'stems_k':'58K','stems_full':'58,000','stems_day':'58,000',
    'staff':240,'rev':'7.9M','rev_kes':'KES 7.9M',
    'perm':109,'casual':131,
    'dispatches':21,
    'cr_time':'02:48 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Proud','1.5 ha'),
    'buyers':['FloraHolland','Stems EA','KQ Cargo','UAE Bloom'],
    'temp':'25.8','moisture':'30.6','ec':'1.5','ph':'6.4',
    'products':'Cut Roses',
  },
  {
    'name':'Red Lands Roses','location':'Ruiru','slug':'redlands',
    'contact':'Isabelle Spindler','first':'Isabelle','initials':'IS','role':'Farm Director',
    'stems_k':'95K','stems_full':'95,000','stems_day':'95,000',
    'staff':310,'rev':'11.8M','rev_kes':'KES 11.8M',
    'perm':142,'casual':168,
    'dispatches':24,
    'cr_time':'02:15 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Akito','2.8 ha'),'zone_c':('Tara','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Fleurop','KQ Cargo'],
    'temp':'21.4','moisture':'40.2','ec':'1.6','ph':'6.2',
    'products':'Roses (Export)',
  },
  {
    'name':'Flamingo Flora','location':'Nairobi','slug':'flamingo',
    'contact':'Sam Ivor','first':'Sam','initials':'SI','role':'Operations Manager',
    'stems_k':'48K','stems_full':'48,000','stems_day':'48,000',
    'staff':195,'rev':'6.2M','rev_kes':'KES 6.2M',
    'perm':89,'casual':106,
    'dispatches':16,
    'cr_time':'03:07 AM','cr_name':'Cold Room 2',
    'zone_a':('Proud','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Igloo','1.5 ha'),
    'buyers':['FloraHolland','Stems EA','KQ Cargo','Local Hotels'],
    'temp':'22.3','moisture':'35.8','ec':'1.6','ph':'6.3',
    'products':'Roses',
  },
  {
    'name':'Black Tulip Group','location':'Nairobi','slug':'blacktulip',
    'contact':'Mohan Choudhery','first':'Mohan','initials':'MC','role':'Farm Director',
    'stems_k':'110K','stems_full':'110,000','stems_day':'110,000',
    'staff':350,'rev':'12.1M','rev_kes':'KES 12.1M',
    'perm':160,'casual':190,
    'dispatches':26,
    'cr_time':'02:33 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Freedom','2.8 ha'),'zone_c':('Avalanche','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Amsterdam Flowers','KQ Cargo'],
    'temp':'22.1','moisture':'34.6','ec':'1.6','ph':'6.3',
    'products':'Roses (Export)',
  },
  {
    'name':'Karen Roses','location':'Nairobi','slug':'karenroses',
    'contact':'Juliana Rono','first':'Juliana','initials':'JR','role':'Farm Director',
    'stems_k':'38K','stems_full':'38,000','stems_day':'38,000',
    'staff':160,'rev':'5.4M','rev_kes':'KES 5.4M',
    'perm':72,'casual':88,
    'dispatches':15,
    'cr_time':'01:52 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Prom','2.8 ha'),'zone_c':('Tara','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','KQ Cargo','Stems EA'],
    'temp':'22.4','moisture':'35.1','ec':'1.6','ph':'6.3',
    'products':'Roses (Export)',
  },
  {
    'name':'Kisima','location':'Timau','slug':'kisima',
    'contact':'Martin Dyer','first':'Martin','initials':'MD','role':'Farm Director',
    'stems_k':'62K','stems_full':'62,000','stems_day':'62,000',
    'staff':260,'rev':'8.4M','rev_kes':'KES 8.4M',
    'perm':118,'casual':142,
    'dispatches':19,
    'cr_time':'02:41 AM','cr_name':'Cold Room 2',
    'zone_a':('Tycoon','3.2 ha'),'zone_b':('Escimo','2.8 ha'),'zone_c':('Cherry Brandy','1.5 ha'),
    'buyers':['FloraHolland','Serena Hotels','Fairmont Hotels','KQ Cargo'],
    'temp':'19.2','moisture':'42.6','ec':'1.5','ph':'6.2',
    'products':'Roses',
  },
  {
    'name':'Uhuru Flowers','location':'Timau','slug':'uhuru',
    'contact':'Ivan Freeman','first':'Ivan','initials':'IF','role':'Farm Director',
    'stems_k':'45K','stems_full':'45,000','stems_day':'45,000',
    'staff':200,'rev':'6.9M','rev_kes':'KES 6.9M',
    'perm':91,'casual':109,
    'dispatches':16,
    'cr_time':'03:18 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Freedom','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Stems EA','KQ Cargo'],
    'temp':'18.8','moisture':'43.2','ec':'1.4','ph':'6.2',
    'products':'Roses',
  },
  {
    'name':'Equinox Flowers','location':'Timau','slug':'equinox',
    'contact':'Tom Lawrence','first':'Tom','initials':'TL','role':'Farm Director',
    'stems_k':'52K','stems_full':'52,000','stems_day':'52,000',
    'staff':230,'rev':'7.6M','rev_kes':'KES 7.6M',
    'perm':105,'casual':125,
    'dispatches':18,
    'cr_time':'02:56 AM','cr_name':'Cold Room 2',
    'zone_a':('Proud','3.2 ha'),'zone_b':('Red Naomi','2.8 ha'),'zone_c':('Escimo','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Stems EA','KQ Cargo'],
    'temp':'19.6','moisture':'41.8','ec':'1.4','ph':'6.3',
    'products':'Roses',
  },
  {
    'name':'Tambuzi','location':'Nanyuki','slug':'tambuzi',
    'contact':'Paul Salim','first':'Paul','initials':'PS','role':'Farm Director',
    'stems_k':'40K','stems_full':'40,000','stems_day':'40,000',
    'staff':175,'rev':'5.9M','rev_kes':'KES 5.9M',
    'perm':80,'casual':95,
    'dispatches':15,
    'cr_time':'02:27 AM','cr_name':'Cold Room 2',
    'zone_a':('Beloved','3.2 ha'),'zone_b':('Piano','2.8 ha'),'zone_c':('Kerio','1.5 ha'),
    'buyers':['Luxury UK Retailers','Hotel Groups','FloraHolland','KQ Cargo'],
    'temp':'18.4','moisture':'44.1','ec':'1.4','ph':'6.2',
    'products':'Roses',
  },
  {
    'name':'AAA Roses','location':'Rumuruti','slug':'aaaroses',
    'contact':'Jennifer Sassi','first':'Jennifer','initials':'JS','role':'Farm Director',
    'stems_k':'88K','stems_full':'88,000','stems_day':'88,000',
    'staff':290,'rev':'10.5M','rev_kes':'KES 10.5M',
    'perm':132,'casual':158,
    'dispatches':23,
    'cr_time':'02:13 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Freedom','2.8 ha'),'zone_c':('Avalanche','1.5 ha'),
    'buyers':['FloraHolland','Interflora UK','Dutch Wholesale','KQ Cargo'],
    'temp':'20.2','moisture':'38.4','ec':'1.5','ph':'6.3',
    'products':'Roses (Export)',
  },
  {
    'name':'Waridi Ltd','location':'Athi River','slug':'waridi',
    'contact':'PD Kadlag','first':'PD','initials':'PK','role':'Farm Director',
    'stems_k':'50K','stems_full':'50,000','stems_day':'50,000',
    'staff':210,'rev':'7.2M','rev_kes':'KES 7.2M',
    'perm':96,'casual':114,
    'dispatches':17,
    'cr_time':'03:09 AM','cr_name':'Cold Room 2',
    'zone_a':('Red Naomi','3.2 ha'),'zone_b':('Avalanche','2.8 ha'),'zone_c':('Proud','1.5 ha'),
    'buyers':['FloraHolland','Stems EA','UAE Bloom','KQ Cargo'],
    'temp':'25.4','moisture':'29.8','ec':'1.5','ph':'6.4',
    'products':'Roses',
  },
]

print(f"Farm registry loaded: {len(FARMS)} farms")
print("Farm data OK ✓")

# ─────────────────────────────────────────────────────────────────
# PER-FARM TOUR WHY STRINGS  (21 entries × 20 farms)
# Keys match TOUR_DATA order:
# 0=dashboard,1=zones,2=production,3=operations,4=packhouse,
# 5=coldroom,6=access,7=hr,8=logistics,9=inventory,10=stores,
# 11=sales,12=procurement,13=finance,14=payroll,15=compliance,
# 16=iot,17=audit,18=ai,19=comms,20=automations
# ─────────────────────────────────────────────────────────────────
TOUR_WHYS = {
'oserian': [
  "At a million stems leaving Naivasha every single day, Hamish cannot run Oserian on morning WhatsApp pings. This dashboard is the single view that tells every department head — before sunrise — whether the farm is green or not. Replacing the equivalent of 14 spreadsheets and 6 simultaneous WhatsApp groups.",
  "Oserian manages over 100 rose varieties across a greenhouse complex the size of a small town. When a zone drifts — moisture, temperature, crop stage — this screen catches it in minutes, not days. The cost of missing it is a write-off measured in tonnes, not stems.",
  "Oserian ships to 60+ countries. FloraHolland buyers, Albert Heijn procurement teams, Marks & Spencer seasonal desks — all of them want confirmed stem counts 10 days ahead. This forecasting module is what lets Hamish say yes with certainty, not with a guess.",
  "One spray applicator, one missed re-entry interval, one lapsed record — and KEPHIS grounds an export licence that covers a million stems a day. Oserian's operations team cannot afford a paper trail gap. This module closes it permanently.",
  "Oserian grades millions of stems weekly. A 3% reject rate at this scale is tens of thousands of stems of lost revenue — daily. This screen makes that number visible, traceable to the grader and the batch, and actionable before a single box is sealed.",
  "Pack House Cold Room 4 breached threshold at 02:31 AM. Flori-Core fired the alert, Hamish's team corrected it, and the log was closed before 03:00 AM. At Oserian's scale — dozens of cold rooms, hundreds of thousands of stems in storage — manual monitoring is not an option.",
  "5,000 staff. Multiple pack houses, greenhouses, logistics yards, and finance departments. Who can approve a payroll run? Who can sign off a PO? Who can access the compliance vault? Oserian needs airtight role-based access. This module enforces it across every session.",
  "Oserian runs one of the largest agricultural workforces in East Africa. KEPHIS asks: was your spray operator certified on the day? GlobalG.A.P asks: show me the training calendar for the last 12 months. This module answers both — per employee, per date, per chemical.",
  "JKIA cargo holds have cut-off windows measured in minutes. Oserian dispatches trucks from Naivasha daily — multiple vehicles, multiple cold-chain legs, multiple buyers. Miss the KQ cargo cut-off and an entire batch misses its flight. This module tracks every truck in real time.",
  "Oserian commits hundreds of thousands of stems to buyers weeks in advance. The difference between a reliable farm and an embarrassing over-commitment is ATP — Available to Promise. This module shows exactly what is real, what is committed, and what is left to sell.",
  "At Oserian's volume, a stockout of packing materials or a late fertiliser reorder doesn't delay a crop cycle — it halts an entire greenhouse block. This module fires reorder triggers the moment stock drops below threshold. The system notices. The farm keeps moving.",
  "Oserian sells to buyers in 60+ countries — each with different terms, volumes, invoice currencies, and dispatch schedules. This kanban board is how the sales team manages that complexity without a single order falling through the cracks.",
  "A PO at Oserian's scale can run into millions of shillings. Verbal approvals, late GRNs, and unmatched invoices are financial controls failures that no auditor — and no bank — will overlook. This module forces process on every purchase, every time.",
  "Month-end P&L across Oserian's divisions used to take the finance team a week. This module generates the full income statement instantly — with every transaction linked to its source document and every figure reconciled in real time.",
  "5,000 employees. PAYE, NSSF, NHIF, Housing Levy. 2,700 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds, runs payroll on approval, and dispatches payslips by email and SMS — without HR touching a calculator.",
  "Oserian exports to the EU, UK, and Middle East. GlobalG.A.P re-certification is not optional — it is the licence to operate in those markets. One lapsed certificate can freeze an export relationship worth hundreds of millions of shillings. This vault tracks every cert, every spray log, every audit — and alerts 14 days before anything expires.",
  "Oserian's greenhouse complex spans hundreds of hectares. Checking soil moisture, temperature, and EC readings by walking the crop takes hours. Checking them here takes 10 seconds. And unlike a walk, this fires an alert the moment a sensor breaks threshold — at any hour of the night.",
  "When a FloraHolland buyer disputes a stem count, or an auditor asks who approved a PO modification at Oserian — the answer must come in minutes, not after a week of emails. Every change, every user, every timestamp. Immutable. This is the record that stands up in any room.",
  "A new Head of Operations inheriting Oserian's systems gets an AI that already knows all active crop cycles across every greenhouse block, every cold room reading, every pending approval, and the full P&L — and answers in plain English. The farm's institutional knowledge, always on.",
  "When Albert Heijn asks 'did you send the dispatch confirmation?' — Hamish opens this screen and shows the WhatsApp read receipt, timestamp, and the email it was CC'd to. One screen. No more chasing. End of conversation.",
  "Flori-Core doesn't wait to be asked. Cold room breaches → alert fired in 60 seconds. Stock drops → draft PO created. Certificate expires in 14 days → reminder sent. At Oserian's scale, a farm that reacts is not fast enough. A farm that anticipates — is.",
],
'aquila': [
  "Aquila ships 180,000 stems out of Naivasha every day and tracks orders to Europe, the Gulf, and beyond. Abhay needs one screen — before the first truck moves — to confirm the operation is green. This dashboard is that screen.",
  "A moisture drift in Zone B at Aquila costs two days of crop recovery and a conversation with FloraHolland that nobody wants to have. This screen surfaces the issue in real time — before the stems are damaged and before the buyer even knows there was a risk.",
  "FloraHolland and Fleurop Germany want stem counts confirmed 10 days out. Without a production forecast, Aquila is guessing with premium EU buyers. This module ends the guesswork — every variety, every week, every zone, in one Gantt view.",
  "One uncaptured spray event at Aquila is a KEPHIS violation that can freeze the export licence covering 180,000 stems a day. This module records every spray, every applicator, every re-entry interval — so the paper trail is always audit-ready.",
  "Aquila grades 180,000 stems a day. A 3% reject rate is over 5,000 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed and loaded.",
  "Cold Room 2 breached at 02:08 AM. Flori-Core alerted Abhay instantly. The batch was corrected and logged before 02:30 AM. At 180,000 stems a day, a cold room incident without an alert system is not a near-miss — it's a write-off and a buyer conversation.",
  "Aquila's finance, operations, procurement, and compliance teams all touch Flori-Core. Who can approve a purchase order? Who can run payroll? This module enforces clean, role-based access — every session, every user, every module.",
  "A KEPHIS auditor asks: was your spray operator certified on the day of the application? If Aquila can't answer in 30 seconds, the audit fails. This module holds the answer — per employee, per chemical, per date.",
  "The Naivasha-to-JKIA cold chain has a 2-hour window. Aquila's export volumes mean multiple trucks, multiple cargo holds, multiple buyers per night. This module tracks every dispatch in real time — and auto-fills the CMR so nothing is missing at the cargo gate.",
  "ATP — Available to Promise — is what lets Aquila quote UAE Bloom and Fleurop with confidence. This module shows exactly how many stems exist, how many are committed, and how many are truly available. No over-selling. No apologies.",
  "A late fertiliser reorder at Aquila delays a crop cycle that was already promised to FloraHolland. This module sets reorder triggers — the moment stock drops below threshold, a draft PO is created automatically. Nobody has to notice. The system does.",
  "Aquila's sales team manages FloraHolland, Fleurop Germany, UAE Bloom, and more — across different terms, currencies, and dispatch windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A KES purchase order approved verbally, executed late, and GRN signed by the wrong person — this module forces process on every purchase at Aquila, with a full audit trail that satisfies KEPHIS, GlobalG.A.P, and any bank requesting financial controls.",
  "Month-end P&L across Aquila's export operation used to take the finance team days of reconciliation. This module generates the full income statement instantly — every transaction linked to its source document, every figure reconciled in real time.",
  "420 staff. PAYE, NSSF, NHIF, Housing Levy. 230 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds, runs payroll on approval, and dispatches payslips — without HR touching a calculator.",
  "Aquila's EU buyer relationships depend on GlobalG.A.P certification. One lapsed certificate, one missing spray log — and an entire export relationship worth millions is at risk. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Naivasha's microclimate at Aquila runs warm and humid. Soil moisture at 37%, temp at 22.6°C, EC at 1.6 — these readings tell Abhay whether the crop is on track before the first harvest of the day. Checking them here takes 10 seconds. Not 45 minutes of walking.",
  "When Fleurop Germany disputes a delivery, Aquila needs the answer in minutes — who approved the dispatch, when the truck left, and what the CMR reference is. Every change, every user, every timestamp. Immutable. This module holds that record.",
  "An AI that already knows Aquila's active crop cycles, cold room status, pending POs, and current P&L — and answers in plain English. Ask it anything about the farm. It knows the operation better than any onboarding document.",
  "When UAE Bloom asks 'did you send the dispatch confirmation?' — Abhay opens this screen and shows the WhatsApp read receipt, the email timestamp, and the CMR reference. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock below threshold → draft PO created. Certificate expiring → reminder sent 14 days out. Aquila doesn't wait to be told there's a problem. Flori-Core tells them before it becomes one.",
],
'wildfire': [
  "Wildfire runs 14 rose varieties and 4 hypericum lines out of Naivasha — a diverse portfolio that demands precise scheduling. Patrick needs one screen to confirm the whole operation is green before morning. This dashboard is it — no spreadsheets, no WhatsApp groups.",
  "With roses and hypericum in the same greenhouse complex, Wildfire's zone management is more granular than most farms. A moisture issue in the hypericum blocks hits a completely different crop than the roses. This screen catches it — per zone, per variety, in real time.",
  "UK supermarkets want confirmed stem counts for both rose and hypericum lines well ahead of pack date. Without a forecasting tool, Wildfire is guessing with buyers who have planogram commitments. This module provides the confirmed numbers — every variety, every week.",
  "Hypericum pre-harvest intervals are different from roses. One missed re-entry interval on a spray is a KEPHIS violation that can hold up an entire filler shipment. This module captures every spray event, every applicator, every chemical — for both crop types, every time.",
  "Wildfire grades roses and hypericum separately — different reject tolerances, different graders, different buyers. This pack house screen makes the reject rate visible per batch and per variety, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 03:14 AM. Flori-Core alerted Patrick instantly. At Wildfire, where filler stems are often more temperature-sensitive than roses, a cold room incident without an alert system is a buyer problem before sunrise.",
  "Wildfire's small-but-specialist team means role clarity matters. Who can approve a filler buyer PO? Who can run the compliance report? This module enforces clean access across finance, operations, and procurement — every session.",
  "A KEPHIS auditor asking about hypericum spray certification is a real scenario at Wildfire. This module holds the answer — per employee, per chemical, per date — whether the question comes in an audit or a buyer's due diligence review.",
  "Wildfire ships to UK supermarkets with cut-off windows that don't flex. The Naivasha-to-JKIA run has to be on time, every time. This module tracks every truck, every dispatch, every cargo handoff — and auto-fills the CMR.",
  "Wildfire's mixed product portfolio means ATP tracking is complex — rose stems and hypericum stems committed to different buyers at different prices. This module shows exactly what is real, what is spoken for, and what is available to quote.",
  "A stockout of hypericum packaging or a late filler fertiliser order at Wildfire delays a specialist shipment that UK buyers are counting on. Reorder triggers fire automatically — the moment stock drops below threshold. The system handles it.",
  "Wildfire manages UK supermarket buyers, FloraHolland, and specialist filler buyers — each with different terms and different product lines. This kanban board keeps every order visible and every invoice tracked across the full product mix.",
  "A procurement approval for the wrong chemical at Wildfire — whether fertiliser or pesticide — has compliance consequences beyond the cost. This module forces process on every purchase, with a full audit trail that satisfies KEPHIS and GlobalG.A.P.",
  "Month-end P&L at Wildfire covers two revenue streams — roses and hypericum — with different margins and different buyer terms. This module generates the full income statement instantly, segmented and reconciled in real time.",
  "180 staff. PAYE, NSSF, NHIF. 98 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips without HR touching a calculator — for both permanent and casual staff.",
  "Wildfire's UK supermarket contracts require KEPHIS clearance and GlobalG.A.P compliance for both roses and hypericum. One lapsed certificate can freeze both product lines simultaneously. This vault tracks every cert, every spray log, every audit — 365 days a year.",
  "Naivasha warmth at Wildfire — 23.1°C greenhouse average — means both roses and hypericum need precise EC and moisture monitoring. These are the farm's vital signs. This module checks them in 10 seconds and alerts Patrick the moment any reading breaks threshold.",
  "When a UK supermarket buyer disputes a filler shipment, Wildfire needs the answer in minutes — who approved the dispatch, what the CMR reference is, when the truck left. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Wildfire's 14 rose varieties, 4 hypericum lines, all active crop cycles, cold room status, and pending orders — and answers in plain English. Ask it anything. It knows the farm better than any briefing document.",
  "When a UK supermarket buyer asks 'did the dispatch confirmation go out?' — Patrick opens this screen and shows the WhatsApp read receipt, timestamp, and the email it was CC'd to. One screen. No more chasing.",
  "Cold room breach → alert in 60 seconds. Hypericum stock below threshold → draft PO created. Certificate expiring → reminder sent. Wildfire doesn't wait to be told. Flori-Core fires the alert before Patrick has to ask.",
],
'subati': [
  "Subati ships 165,000 stems out of Naivasha to 25+ countries. Naren needs one view — before morning tea — to confirm whether the whole operation is running. This dashboard replaces the cascade of spreadsheets and group chats that used to start every day.",
  "At Subati's scale, a zone moisture issue that goes unnoticed for 48 hours is a FloraHolland complaint and a credit note. This screen surfaces it in real time — before stems are damaged, before boxes are packed, before a buyer is let down.",
  "Subati commits stems to FloraHolland, Interflora, and Fleurop weeks in advance. Without a production forecast, Naren is guessing with buyers who have market commitments in Amsterdam and Frankfurt. This module provides the confirmed numbers — every variety, every week.",
  "One spray record gap at Subati is a KEPHIS violation on a licence covering 165,000 stems a day. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and audit-ready.",
  "Subati grades 165,000 stems a day. A 3% reject rate is nearly 5,000 stems of lost revenue — daily. This screen makes the reject rate visible, traceable by batch and by grader, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:44 AM. Flori-Core alerted Naren instantly. The batch was corrected and the log was closed before 03:00 AM. Without this module, that batch — and that buyer relationship — would have been at risk before sunrise.",
  "Subati's export operation touches finance, compliance, procurement, and logistics daily. Who can approve a FloraHolland PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Subati asks: was your spray operator certified on the day of the application? This module answers in 30 seconds — per employee, per chemical, per date. An audit that used to take hours is now 30 seconds of screen time.",
  "The Naivasha-to-JKIA window is tight. Subati's 165,000 daily stems mean multiple trucks, multiple cargo legs, multiple buyer destinations. Miss the KQ cargo cut-off and a batch that was promised to Fleurop sits overnight. This module tracks every dispatch in real time.",
  "Subati commits stems to 25+ countries simultaneously. ATP — Available to Promise — is what separates a farm that quotes with confidence from a farm that over-commits and apologises. This module shows what is real, what is committed, and what is left to sell.",
  "A late fertiliser reorder at Subati delays a crop cycle that is already allocated to FloraHolland. Reorder triggers fire the moment stock drops below threshold — a draft PO is created automatically and the procurement flow starts. Nobody has to notice.",
  "Subati's sales team manages FloraHolland, Interflora UK, Fleurop, and 25 country relationships — each with different terms, volumes, and dispatch windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A KES purchase approval at Subati — whether fertiliser, pesticide, or packaging — needs a full audit trail that satisfies KEPHIS, GlobalG.A.P, and any bank requesting financial controls. This module forces process on every purchase, every time.",
  "Month-end P&L across Subati's global export operation used to take the finance team days. This module generates the full income statement instantly — every transaction linked to its source document and every figure reconciled in real time.",
  "390 staff. PAYE, NSSF, NHIF, Housing Levy. 215 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds, runs payroll on approval, and dispatches payslips — without HR touching a calculator.",
  "Subati's EU buyer relationships depend entirely on GlobalG.A.P and KEPHIS certification. Interflora UK and Fleurop Germany will not place orders with a farm that cannot prove compliance on demand. This vault tracks every cert, every audit, every expiry.",
  "Naivasha at Subati — 22.9°C, moisture at 38.6%, EC at 1.6 — these are the readings that tell Naren whether the crop is on track before the first truck leaves. Checking them here takes 10 seconds. A walk across the greenhouse takes 45 minutes.",
  "When Fleurop Germany disputes a delivery, Subati needs the full record in minutes — who approved the dispatch, what the CMR reference is, when the truck left, and who was notified. Every change, every user, every timestamp. Immutable.",
  "An AI that already knows Subati's active crop cycles, cold room status, 25-country order pipeline, and current P&L — and answers in plain English. Ask it anything about the operation. It knows the farm better than any onboarding document.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Naren opens this screen and shows the email timestamp, the WhatsApp read receipt, and the CMR reference. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → reminder sent 14 days out. Subati's global commitments cannot wait for someone to notice a problem. Flori-Core fires the alert before anyone has to.",
],
'maridadi': [
  "Jack runs Maridadi with the precision of a Dutch operation transplanted to the shores of Lake Naivasha. 55,000 stems a day, every day. This dashboard is the morning briefing that tells him — before the first truck is loaded — whether the farm is on track.",
  "Maridadi's zone discipline is what keeps European buyers coming back. A moisture issue in Zone B that goes unreported for a day is a crop quality problem. This screen surfaces it in real time — before stems are damaged and before a buyer has any reason to notice.",
  "FloraHolland buyers want stem count commitments 10 days ahead. Maridadi cannot afford to guess. This production module provides the confirmed forecast — every variety, every week — so Jack can quote with confidence, not with hope.",
  "One uncaptured spray event at Maridadi is a KEPHIS violation. This module records every spray, every applicator, every re-entry interval — so the paper trail is always clean and every audit is answered in seconds, not days.",
  "Maridadi grades 55,000 stems a day. A 3% reject rate is 1,650 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by grader and by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:22 AM. Flori-Core alerted Jack instantly. At Maridadi, where stem quality is the brand, a cold room incident without an alert system is a buyer problem before sunrise. This module ensures it never goes unnoticed.",
  "Maridadi's operations team touches procurement, compliance, and finance daily. Who can approve a purchase order? Who can run payroll? This module enforces clean, role-based access — protecting Maridadi's financial controls every session.",
  "A KEPHIS auditor asking about spray operator certification at Maridadi is not a hypothetical. This module holds the answer — per employee, per chemical, per date. The audit passes in 30 seconds instead of a week of email trails.",
  "The Naivasha-to-JKIA cold chain has no margin for error. Jack's dispatches need to hit the KQ cargo cut-off on time, every time. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing at the gate.",
  "Maridadi commits stems to Belgian florists and European buyers weeks in advance. ATP — Available to Promise — is what lets Jack quote with confidence. This module shows exactly what is real, what is committed, and what is truly available.",
  "A late fertiliser order at Maridadi delays a crop cycle that was already promised to a European buyer. Reorder triggers fire automatically — the moment stock drops below threshold. The system handles it before anyone has to notice.",
  "Maridadi's sales team manages FloraHolland, Interflora UK, and Belgian buyers — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Maridadi needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase — from fertiliser to packaging — with a complete, immutable record.",
  "Month-end P&L at Maridadi used to mean three days of spreadsheet reconciliation. This module generates the full income statement instantly — every transaction linked to its source document and every figure reconciled in real time.",
  "280 staff. PAYE, NSSF, NHIF, Housing Levy. 154 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Maridadi's European export relationships depend on GlobalG.A.P certification. One lapsed certificate can freeze an order pipeline that took years to build. This vault tracks every cert, every spray log, every audit — and alerts 14 days before anything expires.",
  "Naivasha conditions at Maridadi — 22.5°C, moisture at 36.9%, EC at 1.6 — these are the readings that tell Jack whether the crop is performing before the first harvest of the day. This module checks them in 10 seconds and alerts the moment anything breaks threshold.",
  "When a Belgian buyer disputes a delivery, Maridadi needs the answer fast — who approved the dispatch, what the CMR is, and who was notified. Every change, every user, every timestamp. Immutable. This is the record that holds up in any dispute.",
  "An AI that knows Maridadi's active crop cycles, cold room status, pending orders, and full P&L — and answers Jack's questions in plain English. The farm's operational knowledge, always available, always current.",
  "When FloraHolland asks 'did the dispatch confirmation go out?' — Jack opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder fired. Maridadi doesn't react to problems — Flori-Core flags them before they become one.",
],
'finlays': [
  "Finlay's Flamingo runs roses and fillers out of Naivasha — a dual-product operation that demands precise zone and SKU management. Peter needs one screen to confirm the whole farm is green before the first dispatch leaves. This dashboard is that screen.",
  "With roses and filler crops in the same complex, Flamingo's zone management is more layered than a single-variety farm. A moisture issue in the filler blocks hits a completely different crop cycle than the roses. This screen catches it — per zone, per variety, in real time.",
  "Interflora UK and FloraHolland buyers want confirmed stem and filler counts ahead of pack date. Without a forecasting tool, Peter is guessing with buyers who have seasonal commitments. This module provides the confirmed numbers for both product lines — every week.",
  "Filler crops and roses have different spray intervals and different KEPHIS requirements. One missed re-entry interval is a compliance gap that can hold up an entire mixed shipment. This module captures every spray, every applicator, every chemical — for both crops.",
  "Flamingo grades roses and fillers through separate lines. A 3% reject rate across 90,000 stems is 2,700 stems of lost revenue — daily. This screen makes it visible, traceable by batch and by variety, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 01:58 AM. Flori-Core alerted Peter instantly. Fillers are often more sensitive to temperature swings than roses. A cold room incident without an alert system at Flamingo means a full mixed shipment at risk before sunrise.",
  "Flamingo's mixed operation means different staff access different systems for different products. Who approves a filler buyer PO? Who can run payroll? This module enforces clean, role-based access — every session, every module.",
  "A KEPHIS auditor at Flamingo may ask about filler crop spray certification separately from roses. This module holds the answer for every employee, every chemical, every date — whether the question comes in an audit or a buyer's due diligence check.",
  "Flamingo ships roses and fillers on the same cold chain run to JKIA. Miss the KQ cargo cut-off and both product lines sit overnight. This module tracks every truck, every dispatch — and auto-fills the CMR for mixed-product shipments.",
  "Flamingo's dual product lines mean ATP is more complex — rose stems and filler stems committed to different buyers at different prices. This module shows exactly what is real, what is committed, and what is truly available to quote — per product line.",
  "A stockout of filler packaging at Flamingo means a mixed shipment goes out incomplete. Reorder triggers fire automatically — the moment stock drops below threshold. The system handles it before anyone has to notice.",
  "Flamingo manages FloraHolland, Interflora UK, and Premier Flowers across two product lines. This kanban board keeps every order visible — roses and fillers tracked together, invoiced together, dispatched together.",
  "A procurement approval at Flamingo — whether for rose fertiliser or filler chemicals — needs a full audit trail. This module forces process on every purchase, with a complete record that satisfies KEPHIS and GlobalG.A.P.",
  "Month-end P&L at Flamingo covers two revenue streams with different margins. This module generates the full income statement instantly — every transaction linked to its source document, every figure reconciled across both product lines.",
  "340 staff. PAYE, NSSF, NHIF. 185 casual workers on weekly attendance across both crop operations. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Flamingo's EU buyer relationships depend on GlobalG.A.P certification across both roses and fillers. One lapsed certificate can freeze both product lines simultaneously. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Naivasha at Flamingo — 23.2°C, moisture at 37.1%, EC at 1.7 — these readings confirm whether both the rose and filler crops are on track before the first harvest of the day. This module checks them in 10 seconds and alerts Peter the moment anything breaks threshold.",
  "When Interflora UK disputes a mixed delivery, Flamingo needs the answer in minutes — who approved the dispatch, what the CMR is, what was in each box. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Flamingo's rose and filler cycles, cold room status, pending orders, and full P&L — and answers in plain English. The farm's operational knowledge, always current, always available.",
  "When Premier Flowers asks 'did the dispatch confirmation go out?' — Peter opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Filler stock below threshold → draft PO created. Certificate expiring → 14-day reminder. Flamingo doesn't wait for someone to notice. Flori-Core fires the alert before it becomes a problem.",
],
'vandenberg': [
  "Van Den Berg ships 70,000 stems from Naivasha to Dutch wholesalers and FloraHolland weekly. Johan needs one view — before the first truck leaves — to confirm the whole operation is on track. This dashboard is that view, replacing the morning WhatsApp cascade.",
  "A moisture issue in one of Van Den Berg's zones that goes unreported for two days is a FloraHolland quality flag and a conversation nobody wants. This screen surfaces it in real time — before stems are affected and before a buyer has reason to notice.",
  "Dutch wholesalers and FloraHolland commit to stem volumes weeks in advance. Johan cannot guess at production numbers with buyers who run tight logistics chains. This module gives him confirmed forecasts — every variety, every week.",
  "One uncaptured spray record at Van Den Berg is a KEPHIS violation. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Van Den Berg grades 70,000 stems a day. A 3% reject rate is 2,100 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch and by grader, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:37 AM. Flori-Core alerted Johan instantly. At Van Den Berg, where Dutch buyers expect consistent cold chain performance, a temperature incident without an alert system is a quality complaint before sunrise.",
  "Van Den Berg's team touches procurement, compliance, and finance daily. Who can approve a Dutch wholesaler PO? Who can run the compliance export? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor asking about spray operator certification at Van Den Berg needs an answer in 30 seconds. This module holds the record — per employee, per chemical, per date — so the audit passes without a document chase.",
  "The Naivasha-to-JKIA run for Van Den Berg's Dutch wholesale orders has a tight cargo window. Miss the KQ cut-off and a consignment sits overnight in a cargo shed. This module tracks every truck, every dispatch, and auto-fills the CMR.",
  "Van Den Berg commits stems to Dutch wholesalers and Stems NL weeks in advance. ATP — Available to Promise — is what lets Johan quote without over-committing. This module shows exactly what is real, what is spoken for, and what is left to sell.",
  "A late fertiliser reorder at Van Den Berg delays a crop cycle already promised to FloraHolland. Reorder triggers fire automatically — the moment stock drops below threshold. The system starts the procurement flow before anyone has to notice.",
  "Van Den Berg manages FloraHolland, Dutch Wholesalers, and Stems NL — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Van Den Berg needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase — from fertiliser to packaging — with a complete, immutable record.",
  "Month-end P&L at Van Den Berg used to mean days of spreadsheet reconciliation. This module generates the full income statement instantly — every transaction linked to its source document and reconciled in real time.",
  "220 staff. PAYE, NSSF, NHIF, Housing Levy. 120 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Van Den Berg's EU export relationships depend on GlobalG.A.P certification. FloraHolland and Dutch wholesalers will not place orders with a farm that cannot prove compliance on demand. This vault tracks every cert, every spray log, every audit.",
  "Naivasha conditions at Van Den Berg — 22.8°C, moisture at 37.8%, EC at 1.6 — these readings confirm the crop is on track before the first harvest. This module checks them in 10 seconds and alerts Johan the moment any reading breaks threshold.",
  "When a Dutch wholesaler disputes a stem count, Van Den Berg needs the full record in minutes — who approved the dispatch, what the CMR is, and who was notified. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Van Den Berg's active crop cycles, cold room status, Dutch wholesale orders, and full P&L — and answers Johan's questions in plain English. The farm's knowledge, always on.",
  "When FloraHolland asks 'did the dispatch confirmation go out?' — Johan opens this screen and shows the email timestamp, the WhatsApp read receipt, and the CMR reference. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. Van Den Berg doesn't wait to be told. Flori-Core fires the alert before Johan has to ask.",
],
'savannah': [
  "Savannah International ships 42,000 stems out of Naivasha daily to EU and Gulf markets. Ignaitus needs one screen — before sunrise — to confirm the operation is running. This dashboard replaces the morning spreadsheet checks and WhatsApp pings.",
  "A zone moisture issue at Savannah that goes unnoticed for two days is a FloraHolland quality flag. This screen surfaces it in real time — before stems are damaged and before a European buyer has any reason to raise a complaint.",
  "Interflora UK and FloraHolland buyers want stem count commitments well ahead of pack date. Without a forecast, Savannah is guessing with premium export buyers. This module provides confirmed numbers — every variety, every week.",
  "One uncaptured spray event at Savannah is a KEPHIS violation on a licence covering 42,000 stems a day. This module records every spray, every applicator, every chemical — so the paper trail is always clean.",
  "Savannah grades 42,000 stems a day. A 3% reject rate is 1,260 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 03:02 AM. Flori-Core alerted Ignaitus instantly. For a Naivasha export farm shipping to Gulf Flowers and EU buyers, a cold room incident without an alert system means a batch problem before the first truck moves.",
  "Savannah's export operation touches finance, compliance, and logistics daily. Who can approve a Gulf buyer PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every module.",
  "A KEPHIS auditor at Savannah needs spray operator certification records on demand. This module holds the answer — per employee, per chemical, per date — so the audit passes in 30 seconds instead of a week of email trails.",
  "Savannah's JKIA cargo run is a tight window. Multiple trucks, Gulf Flowers consignments, and EU buyer dispatch windows all converge at KQ cargo. This module tracks every dispatch in real time — and auto-fills the CMR.",
  "Savannah commits stems to Gulf Flowers and EU buyers in advance. ATP — Available to Promise — is what lets Ignaitus quote with confidence, not with a guess. This module shows exactly what is real, what is committed, and what is left to sell.",
  "A late fertiliser reorder at Savannah delays a crop cycle that was already promised to a European buyer. Reorder triggers fire automatically when stock drops below threshold. The procurement flow starts before anyone has to notice.",
  "Savannah manages FloraHolland, Interflora UK, and Gulf Flowers — each with different terms and dispatch windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Savannah needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase — from fertiliser to packaging — with a complete, immutable record.",
  "Month-end P&L at Savannah used to take days of reconciliation. This module generates the full income statement instantly — every transaction linked to its source document and every figure reconciled in real time.",
  "190 staff. PAYE, NSSF, NHIF, Housing Levy. 103 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Savannah's EU buyer relationships depend on GlobalG.A.P certification. One lapsed certificate can freeze an export pipeline that took years to build. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Naivasha at Savannah — 23.6°C, moisture at 36.2%, EC at 1.6 — these readings tell Ignaitus whether the crop is on track before the first truck leaves. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When an EU buyer disputes a delivery, Savannah needs the answer fast — who approved the dispatch, what the CMR is, and who was notified. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Savannah's active crop cycles, cold room status, Gulf and EU orders, and full P&L — and answers in plain English. Ask it anything. It knows the operation better than any briefing document.",
  "When Gulf Flowers asks 'did the dispatch confirmation go out?' — Ignaitus opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. Savannah doesn't wait to be told. Flori-Core fires the alert before it becomes a problem.",
],
'sianroses': [
  "Sian Roses runs 120,000 stems a day out of Kitengela — drier, warmer, and further from the main Naivasha pack house cluster. Jos needs one screen to confirm the whole operation is running before the first truck heads to JKIA. This dashboard is that view.",
  "Kitengela's drier microclimate means moisture management at Sian is more critical than at Naivasha farms. A zone drift here costs more per stem recovered. This screen flags it in real time — before stems are affected and before a FloraHolland buyer sees a quality dip.",
  "Sian commits 120,000 stems a day to FloraHolland and Interflora UK buyers who expect confirmed numbers ahead of time. Without a production forecast, Jos is guessing with buyers who have Amsterdam auction commitments. This module ends that.",
  "One spray record gap at Sian is a KEPHIS violation on a licence covering 120,000 stems a day. This module captures every spray event, every applicator, every chemical — so the paper trail is always audit-ready.",
  "Sian grades 120,000 stems a day. A 3% reject rate is 3,600 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:19 AM. Flori-Core alerted Jos instantly. For a Kitengela farm with premium FloraHolland relationships, a cold room incident without an alert system is a batch problem and a buyer conversation — before sunrise.",
  "Sian's finance, compliance, and logistics teams all touch Flori-Core. Who can approve a FloraHolland PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Sian needs spray operator certification records on demand. This module holds the answer — per employee, per chemical, per date — so Jos can answer in 30 seconds instead of digging through filing cabinets.",
  "Kitengela to JKIA is a longer run than Naivasha. The cold chain window is tighter, the margin for error smaller. This module tracks every truck, every dispatch, every cold chain handoff — and auto-fills the CMR so nothing is missing at the cargo gate.",
  "Sian commits stems to FloraHolland and Interflora UK weeks in advance. ATP — Available to Promise — is what lets Jos quote with confidence. This module shows exactly what is real, what is committed, and what is left to sell.",
  "A late fertiliser reorder at Sian delays a crop cycle already promised to FloraHolland. Reorder triggers fire automatically — the moment stock drops below threshold. The procurement flow starts before anyone has to notice.",
  "Sian manages FloraHolland, Interflora UK, and Premier Blooms — each with different order windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Sian needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record that holds up in any review.",
  "Month-end P&L at Sian used to mean days of reconciliation across Kitengela's operations. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "360 staff. PAYE, NSSF, NHIF, Housing Levy. 195 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Sian's EU buyer relationships — FloraHolland, Interflora UK — depend on GlobalG.A.P certification. One lapsed certificate can freeze the entire export pipeline. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Kitengela runs warmer and drier than Naivasha — 25.2°C, moisture at 31.4%, EC at 1.5. These readings are more critical at Sian than at many competitor farms. This module checks them in 10 seconds and alerts Jos the moment anything breaks threshold.",
  "When a FloraHolland buyer disputes a delivery, Sian needs the full record in minutes — who approved the dispatch, what the CMR is, who was notified. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Sian's active crop cycles, Kitengela conditions, cold room status, and full P&L — and answers Jos's questions in plain English. The farm's operational knowledge, always available.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Jos opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Kitengela, Sian cannot afford to react late. Flori-Core fires the alert before Jos has to ask.",
],
'pjdave': [
  "P.J. Dave ships 58,000 cut roses out of Isinya daily — one of the hotter, drier growing zones in Kenya. Ananth needs one screen to confirm the whole operation is green before the first truck moves. This dashboard replaces the morning spreadsheet stack.",
  "Isinya's heat and dryness mean zone moisture management at P.J. Dave is more demanding than at Naivasha farms. A zone drift that goes unnoticed costs more per stem recovered. This screen flags it in real time — before stems are affected.",
  "FloraHolland and UAE Bloom buyers want confirmed stem counts ahead of time. Without a forecast, P.J. Dave is guessing with buyers who have market commitments. This module provides the confirmed numbers — every variety, every week.",
  "One spray record gap at P.J. Dave is a KEPHIS violation. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "P.J. Dave grades 58,000 stems a day. A 3% reject rate is 1,740 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:48 AM. Flori-Core alerted Ananth instantly. For a farm shipping cut roses to UAE and FloraHolland, a temperature incident without an alert system means a batch problem and a buyer conversation before sunrise.",
  "P.J. Dave's operations team touches procurement, compliance, and finance daily. Who can approve a UAE Bloom PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at P.J. Dave needs spray operator certification records on demand. This module holds the answer — per employee, per chemical, per date — so Ananth can answer in 30 seconds instead of a document search.",
  "Isinya to JKIA is a longer cold chain run with fewer pack house options en route. The window is tight. This module tracks every truck, every dispatch, every cold chain handoff — and auto-fills the CMR so nothing is missing at the cargo gate.",
  "P.J. Dave commits stems to FloraHolland and UAE Bloom in advance. ATP is what lets Ananth quote with confidence. This module shows exactly what is real, what is committed, and what is left to sell — before any buyer is over-promised.",
  "A late fertiliser reorder at P.J. Dave — in Isinya's demanding growing conditions — delays a crop cycle already committed to a buyer. Reorder triggers fire automatically when stock drops below threshold. The system starts the procurement flow.",
  "P.J. Dave manages FloraHolland, Stems EA, and UAE Bloom — each with different terms and dispatch windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at P.J. Dave needs a full audit trail that satisfies KEPHIS and any financial review. This module forces process on every purchase — from fertiliser to packaging — with a complete, immutable record.",
  "Month-end P&L at P.J. Dave used to take days. This module generates the full income statement instantly — every transaction linked to its source document and every figure reconciled in real time.",
  "240 staff. PAYE, NSSF, NHIF, Housing Levy. 131 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "P.J. Dave's export relationships depend on KEPHIS clearance and compliance readiness. One lapsed certificate can hold up a UAE shipment that was weeks in the making. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Isinya runs hot and dry — 25.8°C, moisture at 30.6%, EC at 1.5. These readings are critical at P.J. Dave. This module checks them in 10 seconds and alerts Ananth the moment any reading breaks threshold — day or night.",
  "When a UAE Bloom buyer disputes a delivery, P.J. Dave needs the full record in minutes — who approved the dispatch, what the CMR is, when the truck left. Every change, every user, every timestamp. Immutable.",
  "An AI that knows P.J. Dave's active crop cycles, Isinya's growing conditions, cold room status, and full P&L — and answers in plain English. The farm's operational knowledge, always on.",
  "When FloraHolland asks 'did the dispatch confirmation go out?' — Ananth opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Isinya, P.J. Dave cannot afford late reactions. Flori-Core fires the alert before Ananth has to ask.",
],
'redlands': [
  "Red Lands Roses ships 95,000 stems out of Ruiru to FloraHolland, Interflora UK, and Fleurop buyers. Isabelle needs one screen — before the first truck leaves — to confirm the whole operation is running. This dashboard replaces the morning spreadsheet and group chats.",
  "A zone moisture issue at Red Lands that goes unnoticed for two days is a FloraHolland quality flag. This screen surfaces it in real time — before stems are affected and before a European buyer has any reason to raise a complaint.",
  "Isabelle commits 95,000 stems a day to FloraHolland and Fleurop — buyers who expect confirmed numbers ahead of time. Without a forecast, Red Lands is guessing. This module provides confirmed production numbers — every variety, every week.",
  "One spray record gap at Red Lands is a KEPHIS violation on a licence covering 95,000 stems a day. This module records every spray, every applicator, every chemical — so the paper trail is always clean and audit-ready.",
  "Red Lands grades 95,000 stems a day. A 3% reject rate is 2,850 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:15 AM. Flori-Core alerted Isabelle instantly. For a Ruiru farm with premium EU buyer relationships, a cold room incident without an alert system means a batch problem before the first export truck moves.",
  "Red Lands' finance, compliance, and logistics teams all touch Flori-Core. Who can approve a Fleurop PO? Who can run the compliance export? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Red Lands needs spray operator certification records on demand. This module holds the answer — per employee, per chemical, per date — so Isabelle can answer in 30 seconds instead of a document search.",
  "Ruiru to JKIA is a shorter run than Naivasha, but the cold chain window is just as unforgiving. This module tracks every truck, every dispatch, every cargo handoff — and auto-fills the CMR so nothing is missing at the gate.",
  "Red Lands commits stems to FloraHolland and Fleurop in advance. ATP is what lets Isabelle quote with confidence. This module shows exactly what is real, what is committed, and what is left to sell — before any buyer is over-promised.",
  "A late fertiliser reorder at Red Lands delays a crop cycle already promised to Interflora UK. Reorder triggers fire automatically — the moment stock drops below threshold. The procurement flow starts before anyone has to notice.",
  "Red Lands manages FloraHolland, Interflora UK, and Fleurop — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Red Lands needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at Red Lands used to take days of reconciliation. This module generates the full income statement instantly — every transaction linked to its source document and reconciled in real time.",
  "310 staff. PAYE, NSSF, NHIF, Housing Levy. 168 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Red Lands' EU buyer relationships — FloraHolland, Interflora UK, Fleurop — depend entirely on GlobalG.A.P certification. One lapsed certificate can freeze an export pipeline worth millions. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Ruiru's cooler highland conditions — 21.4°C, moisture at 40.2%, EC at 1.6 — suit premium rose production. These readings tell Isabelle whether the crop is performing before the first harvest. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When Fleurop Germany disputes a delivery, Red Lands needs the full record in minutes. Every change, every user, every timestamp. Immutable. This is the record that holds up in any dispute.",
  "An AI that knows Red Lands' active crop cycles, Ruiru's growing conditions, cold room status, and full P&L — and answers Isabelle's questions in plain English. The farm's operational knowledge, always current.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Isabelle opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. Red Lands' EU commitments cannot wait for someone to notice a problem. Flori-Core fires the alert first.",
],
'flamingo': [
  "Flamingo Flora coordinates 48,000 stems a day across Nairobi's multi-buyer landscape — hotels, auction houses, and local distribution all in the mix. Sam needs one screen to confirm the operation is green before the first van leaves. This dashboard is that view.",
  "Flamingo's Nairobi location means multiple local buyers, faster turnaround expectations, and less tolerance for zone issues. A moisture drift that goes unreported for a day shows up in a hotel delivery complaint. This screen catches it in real time.",
  "FloraHolland and local buyers want confirmed stem counts ahead of pack date. Without a forecast, Flamingo is guessing — and in Nairobi's competitive market, that costs orders. This module provides confirmed numbers every week.",
  "One spray record gap at Flamingo is a KEPHIS violation. This module records every spray, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Flamingo grades 48,000 stems a day. A 3% reject rate is 1,440 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 03:07 AM. Flori-Core alerted Sam instantly. For a Nairobi farm serving hotels and auction buyers, a temperature incident without an alert system means spoiled stock and a client call before 8 AM.",
  "Flamingo's team touches procurement, compliance, and logistics daily across multiple buyer channels. This module enforces clean, role-based access — so the right people see the right data, every session.",
  "A KEPHIS auditor at Flamingo needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Sam can answer in 30 seconds instead of searching filing cabinets.",
  "Flamingo's Nairobi deliveries run on tight windows — hotels, florists, and KQ cargo all on the same day. This module tracks every van, every dispatch — and flags the moment a delivery is at risk of missing its window.",
  "Flamingo commits stems to multiple buyers simultaneously — FloraHolland, local hotels, and distribution buyers. ATP is what lets Sam quote each one with confidence. This module shows what is real, what is committed, and what is left to sell.",
  "A stockout of packing materials at Flamingo delays a hotel delivery that was booked a week ago. Reorder triggers fire automatically — the moment stock drops below threshold. The system starts the procurement flow before anyone has to notice.",
  "Flamingo manages FloraHolland, Stems EA, and local hotel accounts — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Flamingo needs a full audit trail. This module forces process on every purchase, with a complete, immutable record that holds up in any financial or compliance review.",
  "Month-end P&L at Flamingo used to mean reconciling multiple buyer invoices and channel revenues. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "195 staff. PAYE, NSSF, NHIF. 106 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Flamingo's export relationships and hotel supply agreements depend on KEPHIS clearance and compliance readiness. One lapsed certificate can freeze multiple buyer relationships simultaneously. This vault tracks every cert, every audit, every expiry.",
  "Nairobi at Flamingo — 22.3°C, moisture at 35.8%, EC at 1.6 — these readings confirm the crop is performing before the first delivery of the day. This module checks them in 10 seconds and alerts Sam the moment anything breaks threshold.",
  "When a hotel buyer disputes a delivery or FloraHolland questions a stem count, Flamingo needs the full record in minutes. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Flamingo's active crop cycles, Nairobi delivery schedules, cold room status, and full P&L — and answers Sam's questions in plain English. The farm's operational knowledge, always on.",
  "When a hotel account asks 'did the delivery confirmation go out?' — Sam opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. In Nairobi's fast-moving market, Flamingo cannot afford to react late. Flori-Core fires the alert before Sam has to.",
],
'blacktulip': [
  "Black Tulip ships 110,000 stems a day from Nairobi to FloraHolland, Interflora UK, and Amsterdam buyers — a high-volume EU export operation that runs on precision. Mohan needs one screen to confirm the whole farm is green before the first truck moves. This dashboard is it.",
  "Black Tulip's Nairobi operation serves multiple EU buyers simultaneously. A zone moisture drift that goes unreported for two days is a FloraHolland quality flag and an Interflora UK complaint. This screen catches it in real time — before stems are affected.",
  "Black Tulip commits 110,000 stems a day to Amsterdam Flowers, Interflora UK, and FloraHolland — buyers who run tight logistics chains and expect confirmed stem counts ahead of time. This module gives Mohan those numbers — every variety, every week.",
  "One spray record gap at Black Tulip is a KEPHIS violation on a licence covering 110,000 stems a day. This module records every spray, every applicator, every chemical — so the paper trail is always clean and audit-ready.",
  "Black Tulip grades 110,000 stems a day. A 3% reject rate is 3,300 stems of lost revenue — daily. This pack house screen makes it visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:33 AM. Flori-Core alerted Mohan instantly. For a Nairobi export farm with Amsterdam buyer relationships, a cold room incident without an alert system is a batch problem and a buyer conversation before sunrise.",
  "Black Tulip's finance, compliance, and logistics teams all touch Flori-Core. Who can approve an Amsterdam Flowers PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Black Tulip needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Mohan can answer in 30 seconds instead of a document search.",
  "Black Tulip's Nairobi location means the JKIA cold chain run is shorter, but the cargo window is just as unforgiving. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing at the cargo gate.",
  "Black Tulip commits stems to three EU buyer channels simultaneously. ATP is what lets Mohan quote with confidence. This module shows exactly what is real, what is committed, and what is truly available to sell.",
  "A late chemical or fertiliser reorder at Black Tulip delays a crop cycle already promised to FloraHolland. Reorder triggers fire automatically — the moment stock drops below threshold. The system starts the procurement flow.",
  "Black Tulip manages FloraHolland, Interflora UK, and Amsterdam Flowers — each with different order windows and invoice requirements. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Black Tulip needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L across Black Tulip's EU export operation used to take days. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "350 staff. PAYE, NSSF, NHIF, Housing Levy. 190 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Black Tulip's EU buyer relationships depend entirely on GlobalG.A.P certification. FloraHolland and Interflora UK will not place orders with a farm that cannot prove compliance on demand. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Nairobi at Black Tulip — 22.1°C, moisture at 34.6%, EC at 1.6 — these readings confirm the crop is on track before the first export truck moves. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When Amsterdam Flowers disputes a stem count, Black Tulip needs the full record in minutes. Every change, every user, every timestamp. Immutable. This is the record that holds up in any dispute with any EU buyer.",
  "An AI that knows Black Tulip's active crop cycles, EU order pipeline, cold room status, and full P&L — and answers Mohan's questions in plain English. The farm's operational knowledge, always current.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Mohan opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. Black Tulip's EU commitments cannot wait for someone to notice a problem. Flori-Core fires the alert before it becomes one.",
],
'karenroses': [
  "Karen Roses ships 38,000 stems a day from Nairobi — a tight, precision operation with a reputation for consistent quality. Juliana needs one screen to confirm the whole farm is running before the first dispatch. This dashboard is that view.",
  "A zone moisture issue at Karen Roses that goes unreported for a day is a quality complaint from FloraHolland. This screen surfaces it in real time — before stems are damaged and before a buyer has any reason to notice.",
  "FloraHolland and Interflora UK buyers expect confirmed stem counts ahead of time. Without a production forecast, Karen Roses is guessing with buyers who have no tolerance for over-commitments. This module provides confirmed numbers — every week.",
  "One spray record gap at Karen Roses is a KEPHIS violation. This module records every spray, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Karen Roses grades 38,000 stems a day. A 3% reject rate is 1,140 stems of lost revenue — daily. This screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 01:52 AM. Flori-Core alerted Juliana instantly. For a Nairobi export farm with EU buyer relationships, a temperature incident without an alert system means a batch problem and a buyer conversation before business hours.",
  "Karen Roses' team touches procurement, compliance, and logistics daily. Who can approve a FloraHolland PO? Who can run the compliance export? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Karen Roses needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Juliana can answer in 30 seconds instead of digging through records.",
  "Nairobi to JKIA is a shorter cold chain run, but the cargo window is just as unforgiving. This module tracks every dispatch — and auto-fills the CMR so nothing is missing when Juliana's truck reaches the cargo gate.",
  "Karen Roses commits stems to FloraHolland and Interflora UK in advance. ATP is what lets Juliana quote without over-committing. This module shows exactly what is real, what is committed, and what is left to sell.",
  "A late fertiliser reorder at Karen Roses delays a crop cycle already promised to a European buyer. Reorder triggers fire automatically — the moment stock drops below threshold. The procurement flow starts before anyone has to notice.",
  "Karen Roses manages FloraHolland, Interflora UK, and KQ Cargo — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Karen Roses needs a full audit trail. This module forces process on every purchase, with a complete, immutable record that holds up in any KEPHIS or GlobalG.A.P review.",
  "Month-end P&L at Karen Roses used to take days of manual reconciliation. This module generates the full income statement instantly — every transaction linked to its source document and reconciled in real time.",
  "160 staff. PAYE, NSSF, NHIF, Housing Levy. 88 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Karen Roses' EU export relationships depend on GlobalG.A.P certification. One lapsed certificate can freeze an Interflora UK order pipeline worth millions. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Nairobi at Karen Roses — 22.4°C, moisture at 35.1%, EC at 1.6 — these readings confirm the crop is on track before the first harvest. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When a buyer disputes a delivery, Karen Roses needs the answer in minutes — who approved the dispatch, what the CMR is, who was notified. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Karen Roses' active crop cycles, EU order pipeline, cold room status, and full P&L — and answers Juliana's questions in plain English. The farm's knowledge, always current.",
  "When FloraHolland asks 'did the dispatch confirmation go out?' — Juliana opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. Karen Roses' EU commitments cannot wait for someone to notice a problem. Flori-Core fires the alert first.",
],
'kisima': [
  "From the slopes of Mt. Kenya at 2,400m, Martin runs one of the tightest rose operations in East Africa. Every stem that leaves Kisima is spoken for. This dashboard tells him in 10 seconds whether the farm delivered on that promise — before the first driver hits the Timau-Nanyuki road.",
  "At altitude, Kisima's growing conditions are more stable than Naivasha — but a moisture drift in Tycoon or Cherry Brandy blocks is harder to recover from at 2,400m. This screen flags it in real time, before stems are damaged and before FloraHolland has a reason to notice.",
  "Kisima's premium highland varieties — Tycoon, Escimo, Cherry Brandy — command premium prices from FloraHolland and Nairobi hotel chains. Missing a stem count commitment to either buyer costs more per stem than most farms experience. This module provides confirmed numbers ahead of time.",
  "One spray record gap at Kisima is a KEPHIS violation that can freeze an export licence serving both FloraHolland and premium hotel accounts. This module captures every spray, every applicator, every re-entry interval — so the paper trail is always clean at altitude.",
  "Kisima grades 62,000 premium stems a day. A 3% reject rate is 1,860 stems of lost revenue — daily. At Kisima's price point, that loss is felt immediately. This screen makes it visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:41 AM. Flori-Core alerted Martin instantly. At 2,400m, where cold room performance is critical for highland roses, a temperature breach without an alert system means a premium batch problem before the first Timau truck moves.",
  "Kisima's team spans field operations, pack house, compliance, and logistics. Who can approve a hotel supply PO? Who can run the compliance report? This module enforces clean, role-based access — so the right people see the right data, every session.",
  "A KEPHIS auditor at Kisima — asking about highland spray certification at 2,400m — needs an answer in 30 seconds. This module holds it — per employee, per chemical, per date — so the audit passes without a document chase.",
  "Timau to JKIA is a longer cold chain run than Naivasha. The highland road adds time. The cargo window doesn't flex. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing when Martin's vehicle reaches the cargo gate.",
  "Kisima commits premium stems to FloraHolland and Nairobi hotel chains simultaneously. ATP is what lets Martin quote both with confidence. This module shows exactly what is real, what is committed, and what is truly available.",
  "A late fertiliser reorder at Kisima — at 2,400m, with limited local supply options — delays a crop cycle already promised to a premium buyer. Reorder triggers fire automatically. The system starts the procurement flow before anyone has to notice.",
  "Kisima manages FloraHolland, Serena Hotels, and Fairmont Hotels — completely different buyer profiles, different order windows, different quality standards. This kanban board keeps every channel visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Kisima — whether for highland fertiliser or specialist packaging — needs a full audit trail. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at Kisima covers both export revenue and premium hotel supply margins. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "260 staff. PAYE, NSSF, NHIF, Housing Levy. 142 casual workers on weekly attendance in the highland conditions of Timau. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Kisima's FloraHolland relationship depends on GlobalG.A.P certification. One lapsed certificate freezes the EU export pipeline for a farm whose premium varieties command a price that gap cannot afford to lose. This vault tracks every cert, every audit, every expiry.",
  "Kisima's altitude means cooler readings — 19.2°C, moisture at 42.6%, EC at 1.5 — and those numbers behave differently from Naivasha farms. Martin knows what normal looks like at 2,400m. This module alerts him the moment any reading breaks that baseline.",
  "When FloraHolland disputes a Kisima delivery, Martin needs the full record in minutes — who approved the dispatch, what the CMR is, when the truck left Timau. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Kisima's highland crop cycles, FloraHolland orders, hotel supply commitments, and full P&L — and answers in plain English. Ask it anything. It knows the farm at 2,400m better than any briefing document.",
  "When Serena Hotels asks 'did the delivery confirmation go out?' — Martin opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Timau, where the logistics window is longer, Kisima cannot afford to react late. Flori-Core fires the alert before Martin has to.",
],
'uhuru': [
  "Uhuru Flowers runs 45,000 stems a day from the highland climate of Timau — cooler, crisper growing conditions that produce premium roses for FloraHolland and EU buyers. Ivan needs one screen to confirm the whole farm is green before the first truck heads for JKIA. This dashboard is it.",
  "At Timau's altitude, a zone moisture issue at Uhuru is harder to recover from than at a Naivasha farm. A drift that goes unreported costs more per stem. This screen catches it in real time — before stems are affected and before a buyer notices.",
  "FloraHolland and Interflora UK want confirmed stem counts ahead of pack date. Without a forecast, Uhuru is guessing with buyers who have tight Amsterdam and UK logistics chains. This module provides confirmed numbers — every variety, every week.",
  "One spray record gap at Uhuru is a KEPHIS violation. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Uhuru grades 45,000 stems a day. A 3% reject rate is 1,350 stems of lost revenue — daily. At Timau's price point per stem, that loss adds up fast. This screen makes it visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 03:18 AM. Flori-Core alerted Ivan instantly. For a highland farm serving EU buyers, a cold room incident without an alert system is a batch problem and a buyer conversation before business hours.",
  "Uhuru's team spans field operations, pack house, and logistics. Who can approve a FloraHolland PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Uhuru needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Ivan can respond in 30 seconds instead of searching through files.",
  "Timau to JKIA is a longer cold chain run than Naivasha. The highland road adds time, but the cargo window doesn't flex. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing at the gate.",
  "Uhuru commits stems to FloraHolland and Interflora UK in advance. ATP is what lets Ivan quote without over-committing. This module shows exactly what is real, what is committed, and what is truly available to sell.",
  "A late fertiliser reorder at Uhuru — with limited local supply options in Timau — delays a crop cycle already promised to a European buyer. Reorder triggers fire automatically. The system handles it before anyone has to notice.",
  "Uhuru manages FloraHolland, Interflora UK, and Stems EA — each with different order windows. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Uhuru needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at Uhuru used to take days. This module generates the full income statement instantly — every transaction linked to its source document and reconciled in real time.",
  "200 staff. PAYE, NSSF, NHIF, Housing Levy. 109 casual workers on weekly attendance in Timau's highland conditions. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Uhuru's EU buyer relationships depend on GlobalG.A.P certification. One lapsed certificate freezes a FloraHolland relationship that took years to build. This vault tracks every cert, every audit, every expiry — and alerts 14 days ahead.",
  "Timau's highland microclimate at Uhuru — 18.8°C, moisture at 43.2%, EC at 1.4 — produces roses that behave differently from Naivasha crops. Ivan knows what normal looks like here. This module alerts him the moment any reading breaks that baseline.",
  "When a buyer disputes a delivery, Uhuru needs the full record in minutes — who approved the dispatch, what the CMR is, when the truck left Timau. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Uhuru's highland crop cycles, FloraHolland order pipeline, cold room status, and full P&L — and answers Ivan's questions in plain English. The farm's knowledge, always on.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Ivan opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Timau, Uhuru cannot afford to react late. Flori-Core fires the alert before Ivan has to ask.",
],
'equinox': [
  "Equinox Flowers runs 52,000 stems a day from the highland growing conditions of Timau — cooler temperatures, longer stem development cycles, and EU buyers who know what highland quality looks like. Tom needs one screen to confirm the whole farm is green before trucks depart. This dashboard is it.",
  "At Timau's altitude, a zone moisture issue at Equinox costs more per stem to recover from than at a Naivasha farm. A drift that goes unreported for a day is a quality problem. This screen catches it in real time — before stems are affected.",
  "Equinox commits 52,000 stems a day to FloraHolland and Interflora UK — buyers who expect confirmed numbers ahead of time. Without a production forecast, Tom is guessing with premium EU buyers. This module provides confirmed numbers every week.",
  "One spray record gap at Equinox is a KEPHIS violation. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Equinox grades 52,000 stems a day. A 3% reject rate is 1,560 stems of lost revenue — daily. At highland price points, that loss is significant. This screen makes it visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:56 AM. Flori-Core alerted Tom instantly. For a Timau farm with EU buyer commitments, a cold room incident without an alert system means a batch problem and a buyer conversation before business hours.",
  "Equinox's team spans field operations, pack house, and logistics. Who can approve a FloraHolland PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Equinox needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Tom can respond in 30 seconds instead of searching through records.",
  "Timau to JKIA is a longer cold chain run. The highland road adds time, and the KQ cargo cut-off doesn't flex. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing at the gate.",
  "Equinox commits stems to FloraHolland and Interflora UK in advance. ATP is what lets Tom quote with confidence. This module shows exactly what is real, what is committed, and what is truly available to sell.",
  "A late fertiliser reorder at Equinox — with limited supply options in Timau — delays a crop cycle already promised to a European buyer. Reorder triggers fire automatically. The system handles it before anyone has to notice.",
  "Equinox manages FloraHolland, Interflora UK, and Stems EA. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Equinox needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at Equinox used to take days. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "230 staff. PAYE, NSSF, NHIF, Housing Levy. 125 casual workers on weekly attendance in Timau's highland conditions. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Equinox's EU buyer relationships depend on GlobalG.A.P certification. One lapsed certificate freezes a FloraHolland or Interflora UK relationship that took years to build. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Timau at Equinox — 19.6°C, moisture at 41.8%, EC at 1.4 — highland readings that tell Tom whether the crop is performing before the first harvest. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When a buyer disputes a delivery, Equinox needs the full record fast — who approved the dispatch, what the CMR is, when the truck left. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Equinox's highland crop cycles, EU order pipeline, cold room status, and full P&L — and answers Tom's questions in plain English. The farm's knowledge, always available.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Tom opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Timau, Equinox cannot afford to react late. Flori-Core fires the alert before Tom has to.",
],
'tambuzi': [
  "Tambuzi grows some of the most sought-after premium roses in East Africa — Beloved, Piano, Kerio — from the highlands of Nanyuki, at altitude, for luxury UK retailers and hotel groups who pay premium for provenance. Paul needs one screen to confirm the whole farm is performing before any stem leaves the property. This dashboard is it.",
  "At Nanyuki's altitude, Tambuzi's zone conditions are precision-managed. A moisture drift in the Beloved or Piano blocks is not a minor correction — it's a premium crop quality risk. This screen catches it in real time, before stems are affected and before a UK retailer has any reason to question a consignment.",
  "Luxury UK retailers and hotel groups want confirmed stem count commitments from Tambuzi well ahead of pack date — and they expect those commitments kept. Without a production forecast, Paul is guessing with buyers who have zero tolerance for over-commitments. This module provides the confirmed numbers.",
  "One spray record gap at Tambuzi is a KEPHIS violation on an operation where premium provenance is the value proposition. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean and every audit holds.",
  "Tambuzi grades 40,000 premium stems a day. A 3% reject rate on Nanyuki highland roses is 1,200 stems of lost revenue at premium prices — daily. This screen makes it visible, traceable by batch, and actionable before any box is sealed.",
  "Cold Room 2 breached at 02:27 AM. Flori-Core alerted Paul instantly. For a Nanyuki farm where every stem is a premium product for luxury buyers, a cold room incident without an alert system means a write-off that buyers feel immediately.",
  "Tambuzi's team touches field operations, pack house, compliance, and premium buyer logistics. Who can approve a luxury UK retailer PO? Who can run the compliance export? This module enforces clean, role-based access — every session.",
  "A buyer or KEPHIS auditor at Tambuzi may ask about spray certification for the Beloved or Piano varieties specifically. This module holds the answer — per employee, per chemical, per date — so Paul can respond in 30 seconds.",
  "Nanyuki to JKIA is one of the longer cold chain runs in Kenya. The highland road, the temperature sensitivity of premium varieties, and the tight cargo window combine into a logistics challenge that leaves no room for error. This module tracks every dispatch in real time.",
  "Tambuzi commits premium stems to luxury UK retailers and hotel groups simultaneously — buyers who don't accept short deliveries. ATP is what lets Paul quote each one with confidence. This module shows exactly what is real, what is committed, and what is truly available.",
  "A late supply reorder at Tambuzi — at altitude, with limited local options — delays a premium crop cycle already promised to a luxury buyer. Reorder triggers fire automatically. The system starts the procurement flow before Paul has to notice.",
  "Tambuzi manages luxury UK retailers, hotel groups, and FloraHolland — completely different buyer profiles, different order windows, different quality expectations. This kanban board keeps every channel visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at Tambuzi — whether for highland fertiliser or premium packaging — needs a full audit trail. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at Tambuzi covers luxury retail margins and hotel supply revenues — different margin profiles that both need reconciling in real time. This module generates the full income statement instantly.",
  "175 staff. PAYE, NSSF, NHIF, Housing Levy. 95 casual workers on weekly attendance in Nanyuki's highland conditions. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Tambuzi's luxury UK retailer relationships depend on KEPHIS clearance and GlobalG.A.P compliance. One lapsed certificate freezes a premium buyer relationship that took years to cultivate. This vault tracks every cert, every audit, every expiry.",
  "Nanyuki at Tambuzi — 18.4°C, moisture at 44.1%, EC at 1.4 — the highland readings that define Tambuzi's premium growing conditions. Paul knows exactly what these numbers should look like. This module alerts him the moment any reading breaks that baseline.",
  "When a luxury UK retailer disputes a Tambuzi delivery, Paul needs the full record in minutes — who approved the dispatch, what the CMR is, when the truck left Nanyuki. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Tambuzi's premium variety cycles, Nanyuki's highland conditions, UK retail orders, and full P&L — and answers Paul's questions in plain English. The farm's operational knowledge, always current.",
  "When a hotel group asks 'did the delivery confirmation go out?' — Paul opens this screen and shows the WhatsApp read receipt and the email timestamp. One screen. No more chasing. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Nanyuki, Tambuzi cannot afford to react late. Flori-Core fires the alert before Paul has to.",
],
'aaaroses': [
  "AAA Roses ships 88,000 stems out of Rumuruti to FloraHolland, Interflora UK, and Dutch wholesale buyers. Jennifer needs one screen — before sunrise — to confirm the whole operation is green. This dashboard is that view, replacing the cascade of morning checks that used to start every day.",
  "A zone moisture issue at AAA Roses that goes unreported for two days is a FloraHolland quality flag. This screen surfaces it in real time — before stems are affected and before a European buyer has any reason to raise a complaint.",
  "AAA Roses commits 88,000 stems a day to Dutch wholesale and Interflora UK buyers who expect confirmed numbers ahead of time. Without a production forecast, Jennifer is guessing with premium EU buyers. This module provides confirmed numbers — every variety, every week.",
  "One spray record gap at AAA Roses is a KEPHIS violation on a licence covering 88,000 stems a day. This module records every spray, every applicator, every chemical — so the paper trail is always clean and audit-ready.",
  "AAA Roses grades 88,000 stems a day. A 3% reject rate is 2,640 stems of lost revenue — daily. This pack house screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 02:13 AM. Flori-Core alerted Jennifer instantly. For a Rumuruti export farm with EU buyer relationships, a cold room incident without an alert system means a batch problem and a buyer conversation before business hours.",
  "AAA Roses' finance, compliance, and logistics teams all touch Flori-Core. Who can approve a Dutch wholesale PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at AAA Roses needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so Jennifer can respond in 30 seconds instead of a document search.",
  "Rumuruti to JKIA is one of the longer cold chain runs in Kenya. The cargo window doesn't flex, and AAA Roses' EU buyers expect every consignment on time. This module tracks every truck, every dispatch — and auto-fills the CMR.",
  "AAA Roses commits stems to Dutch Wholesale and Interflora UK simultaneously. ATP is what lets Jennifer quote both with confidence. This module shows exactly what is real, what is committed, and what is truly available.",
  "A late fertiliser reorder at AAA Roses delays a crop cycle already promised to FloraHolland. Reorder triggers fire automatically — the moment stock drops below threshold. The system starts the procurement flow.",
  "AAA Roses manages FloraHolland, Interflora UK, and Dutch Wholesale — each with different order windows and invoice requirements. This kanban board keeps every order visible, every invoice tracked, and every buyer notified.",
  "A purchase approval at AAA Roses needs a full audit trail that satisfies KEPHIS and GlobalG.A.P. This module forces process on every purchase, with a complete, immutable record.",
  "Month-end P&L at AAA Roses used to take days of reconciliation. This module generates the full income statement instantly — every transaction linked to its source and reconciled in real time.",
  "290 staff. PAYE, NSSF, NHIF, Housing Levy. 158 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "AAA Roses' EU buyer relationships depend on GlobalG.A.P certification. FloraHolland and Interflora UK will not place orders with a farm that cannot prove compliance on demand. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Rumuruti's conditions at AAA Roses — 20.2°C, moisture at 38.4%, EC at 1.5 — tell Jennifer whether the crop is on track before the first truck leaves. This module checks them in 10 seconds and fires an alert the moment anything breaks threshold.",
  "When Dutch Wholesale disputes a stem count, AAA Roses needs the full record in minutes. Every change, every user, every timestamp. Immutable. This is the record that holds up in any dispute with any EU buyer.",
  "An AI that knows AAA Roses' active crop cycles, EU order pipeline, cold room status, and full P&L — and answers Jennifer's questions in plain English. The farm's operational knowledge, always available.",
  "When Interflora UK asks 'did the dispatch confirmation go out?' — Jennifer opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. From Rumuruti, AAA Roses cannot afford to react late. Flori-Core fires the alert before Jennifer has to.",
],
'waridi': [
  "Waridi Ltd runs 50,000 stems a day from Athi River — Kenya's warmest, driest export growing zone — shipping to FloraHolland, UAE Bloom, and Stems EA. PD needs one screen to confirm the whole operation is green before the first truck moves. This dashboard is it.",
  "Athi River's heat and dryness make zone moisture management at Waridi more demanding than at highland farms. A zone drift that goes unnoticed costs more per stem recovered. This screen flags it in real time — before stems are affected.",
  "FloraHolland and UAE Bloom want confirmed stem counts ahead of pack date. Without a forecast, Waridi is guessing with buyers who have tight logistics chains. This module provides confirmed numbers — every variety, every week.",
  "One spray record gap at Waridi is a KEPHIS violation. This module records every spray, every applicator, every chemical — so the paper trail is always clean and every audit is answered in seconds.",
  "Waridi grades 50,000 stems a day. A 3% reject rate is 1,500 stems of lost revenue — daily. In Athi River's demanding growing conditions, that loss adds up fast. This screen makes it visible, traceable by batch, and actionable before boxes are sealed.",
  "Cold Room 2 breached at 03:09 AM. Flori-Core alerted PD instantly. For an Athi River farm where ambient temperatures are higher than most Kenyan growing zones, cold room performance is critical. A breach without an alert system means a batch problem before sunrise.",
  "Waridi's team touches procurement, compliance, and logistics daily. Who can approve a UAE Bloom PO? Who can run the compliance report? This module enforces clean, role-based access — every session, every user.",
  "A KEPHIS auditor at Waridi needs spray certification records on demand. This module holds the answer — per employee, per chemical, per date — so PD can respond in 30 seconds instead of searching through records.",
  "Waridi's Athi River location puts it close to JKIA — a shorter cold chain run, but the cargo window is just as unforgiving. This module tracks every truck, every dispatch — and auto-fills the CMR so nothing is missing at the gate.",
  "Waridi commits stems to FloraHolland, UAE Bloom, and Stems EA simultaneously. ATP is what lets PD quote all three with confidence. This module shows exactly what is real, what is committed, and what is left to sell.",
  "A late fertiliser reorder at Waridi — in Athi River's high-demand growing conditions — delays a crop cycle already promised to a buyer. Reorder triggers fire automatically. The system starts the procurement flow before PD has to notice.",
  "Waridi manages FloraHolland, Stems EA, and UAE Bloom — each with different order windows and invoice terms. This kanban board keeps every order visible, every invoice tracked, and every buyer notified automatically.",
  "A purchase approval at Waridi needs a full audit trail. This module forces process on every purchase, with a complete, immutable record that holds up in any KEPHIS or financial review.",
  "Month-end P&L at Waridi covers UAE, EU, and local buyer revenues. This module generates the full income statement instantly — every transaction linked to its source document and reconciled in real time.",
  "210 staff. PAYE, NSSF, NHIF, Housing Levy. 114 casual workers on weekly attendance in Athi River's hot growing conditions. Flori-Core calculates every deduction in seconds and dispatches payslips — without HR touching a calculator.",
  "Waridi's export relationships depend on KEPHIS clearance and compliance readiness. One lapsed certificate can freeze both the FloraHolland and UAE Bloom pipelines simultaneously. This vault tracks every cert, every audit, every expiry — 365 days a year.",
  "Athi River at Waridi — 25.4°C, moisture at 29.8%, EC at 1.5 — hot, dry readings that require precise irrigation management. These are Waridi's farm vital signs. This module checks them in 10 seconds and alerts PD the moment any reading breaks threshold.",
  "When a UAE Bloom buyer disputes a delivery, Waridi needs the full record in minutes — who approved the dispatch, what the CMR is, when the truck left. Every change, every user, every timestamp. Immutable.",
  "An AI that knows Waridi's active crop cycles, Athi River's growing conditions, UAE and FloraHolland orders, and full P&L — and answers PD's questions in plain English. The farm's knowledge, always current.",
  "When FloraHolland asks 'did the dispatch confirmation go out?' — PD opens this screen and shows the email timestamp and the WhatsApp read receipt. One screen. End of conversation.",
  "Cold room breach → alert in 60 seconds. Stock drops → draft PO created. Certificate expiring → 14-day reminder. In Athi River's demanding environment, Waridi cannot afford to react late. Flori-Core fires the alert before PD has to.",
],
}

print("TOUR_WHYS loaded ✓")

# ─────────────────────────────────────────────────────────────────
# ORIGINAL WHY STRINGS (to replace in base file)
# ─────────────────────────────────────────────────────────────────
ORIG_WHYS = [
  "James used to open 4 spreadsheets and ping 3 WhatsApp groups before he could say \"operations are running.\" This screen is that answer in under 10 seconds — every morning, before the first truck leaves.",
  "Last season a moisture issue in Zone B went unnoticed for 3 days because nobody updated the shared sheet. This screen flags it in real time — before stems are damaged and before a buyer is let down.",
  "FloraHolland requires confirmed stem counts 10 days ahead. Without a forecasting tool, Cenancle guesses. Guessing with premium European buyers costs contracts. This module ends that permanently.",
  "One missed re-entry interval after a spray is a KEPHIS violation that can suspend Cenancle's export licence. This module captures every spray event, every applicator, every chemical — so the paper trail is always clean.",
  "At 48,000 stems per day, a 3% reject rate is 1,440 stems of lost revenue — daily. This screen makes the reject rate visible, traceable by batch, and actionable before boxes are sealed and shipped.",
  "Cold Room 2 breached 3.4°C at 02:14 AM this morning. Flori-Core alerted James by WhatsApp instantly. He corrected it and logged the action before 02:30 AM. Without this module, that batch — and that buyer relationship — would be lost.",
  "With 312 staff accessing finance, operations, procurement, and payroll — who sees what matters. A rogue procurement approval or a payroll export in the wrong hands is a liability. This module enforces clean access, every session.",
  "A KEPHIS auditor asks: \"Was your spray operator certified on the day of the application?\" If you can't answer in 30 seconds, the audit fails. This module holds the answer — per employee, per chemical, per date.",
  "A Naivasha→JKIA cold-chain shipment has a 2-hour window between pack house and cargo hold. Miss the KQ cargo cut-off and the batch sits overnight. This module tracks every truck, every dispatch — and auto-fills the CMR.",
  "ATP — Available to Promise — is what separates farms that confidently quote buyers from farms that over-commit and apologise. This module shows exactly how many stems exist, how many are committed, and how many are truly available.",
  "Fertiliser reordered two weeks late delays an entire crop cycle. This module sets reorder triggers — the moment stock drops below threshold, a draft PO is created and the procurement flow starts. Nobody has to notice. The system does.",
  "Cenancle's sales team tracked orders across WhatsApp, email, and a spreadsheet — three places for one truth. This kanban board collapses it to one. Confirmed order → invoice auto-generated → dispatch triggered → buyer notified. All automatic.",
  "A KES 72,000 fertiliser order approved verbally, executed late, and GRN signed by the wrong person — this module forces process on every purchase, with a full audit trail that satisfies KEPHIS, GlobalG.A.P, or any bank requesting financial controls.",
  "Pulling together month-end P&L from multiple spreadsheets used to take the finance team 3 days. This module generates the full income statement instantly — with every transaction linked to its source document and every figure reconciled in real time.",
  "312 employees. PAYE, NSSF, NHIF, Housing Levy. 164 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds, runs payroll on approval, and dispatches payslips by email and SMS — without HR touching a calculator.",
  "GlobalG.A.P re-certification is Cenancle's licence to sell to European buyers. One lapsed certificate can freeze an entire export relationship worth millions. This vault tracks every cert, every spray log, every audit — and alerts 14 days before anything expires.",
  "Soil moisture at 38%, cold room at 2.1°C, EC at 1.6 — these are Cenancle's farm vital signs. Checking them by walking the greenhouse takes 45 minutes. Checking them here takes 10 seconds. And unlike a walk, this sends an alert at 2 AM if something breaks.",
  "When a buyer disputes an invoice, an auditor asks who approved a PO, or a regulator asks when a spray record was modified — Cenancle needs the answer in minutes, not after a week of emails. Every change, every user, every timestamp. Immutable.",
  "A new Farm Director inheriting Cenancle gets an AI that already knows all 6 active crop cycles, every cold room reading, every pending approval, and the full P&L — and answers in plain English. Ask it anything. It knows the farm better than any onboarding document.",
  "When Flamingo Horticulture asks \"did you send the dispatch confirmation?\" — James opens this screen and shows the WhatsApp read receipt, timestamp, and the email it was CC'd to. One screen. No more chasing. End of conversation.",
  "Flori-Core doesn't wait to be asked. Cold room breaches → alert fired in 60 seconds. Stock drops → draft PO created. Certificate expires in 14 days → reminder sent. This screen shows every rule, when it last fired, and exactly who was notified. A farm that runs itself.",
]

print(f"ORIG_WHYS count: {len(ORIG_WHYS)} (expected 21)")

# ─────────────────────────────────────────────────────────────────
# FILE GENERATION ENGINE
# ─────────────────────────────────────────────────────────────────
def make_demo(farm):
    slug   = farm['slug']
    name   = farm['name']
    loc    = farm['location']
    first  = farm['first']
    ini    = farm['initials']
    role   = farm['role']
    cont   = farm['contact']
    sk     = farm['stems_k']
    sf     = farm['stems_full']
    staff  = farm['staff']
    staff_f = f'{staff:,}'
    rev    = farm['rev']
    rev_k  = farm['rev_kes']
    perm   = farm['perm']
    casual = farm['casual']
    disp   = farm['dispatches']
    cr_t   = farm['cr_time']
    cr_n   = farm['cr_name']
    za     = farm['zone_a']  # (variety, ha)
    zb     = farm['zone_b']
    zc     = farm['zone_c']
    buyers = farm['buyers']   # list of 4
    temp   = farm['temp']
    moist  = farm['moisture']
    ec     = farm['ec']
    ph     = farm['ph']
    whys   = TOUR_WHYS[slug]

    html = BASE

    # 1. Title
    html = html.replace(
        '<title>Flori-Core · Cenancle Kenya Demo</title>',
        f'<title>Flori-Core · {name} Demo</title>'
    )

    # 2. Landing sub-line
    html = html.replace(
        'Built exclusively for <strong>Cenancle Kenya</strong> · Naivasha · June 2026',
        f'Built exclusively for <strong>{name}</strong> · {loc} · June 2026'
    )

    # 3. Landing stats (use surrounding context to be surgical)
    html = html.replace(
        '<div class="lp-stat-val">48K</div><div class="lp-stat-lbl">Stems / Day</div>',
        f'<div class="lp-stat-val">{sk}</div><div class="lp-stat-lbl">Stems / Day</div>'
    )
    html = html.replace(
        '<div class="lp-stat-val">312</div><div class="lp-stat-lbl">Staff Managed</div>',
        f'<div class="lp-stat-val">{staff_f}</div><div class="lp-stat-lbl">Staff Managed</div>'
    )
    html = html.replace(
        '<div class="lp-stat-val">8.45M</div><div class="lp-stat-lbl">KES Rev MTD</div>',
        f'<div class="lp-stat-val">{rev}</div><div class="lp-stat-lbl">KES Rev MTD</div>'
    )

    # 4. URL bars (both live view and tour view)
    html = html.replace(
        'floricore.<strong>cenancle</strong>.co.ke',
        f'floricore.<strong>{slug}</strong>.co.ke'
    )
    # also the noreply email
    html = html.replace('noreply@floricore.cenancle.co.ke', f'noreply@floricore.{slug}.co.ke')
    html = html.replace('orders@cenancle.co.ke', f'orders@{slug}.co.ke')

    # 5. Topbar client badge
    html = html.replace(
        '<span class="tb-client-name">Cenancle Kenya</span>',
        f'<span class="tb-client-name">{name}</span>'
    )

    # 6. Sidebar avatar, name, role
    html = html.replace(
        '\n                JK\n',
        f'\n                {ini}\n'
    )
    html = html.replace(
        '<div class="sb-user-name">James Kariuki</div>',
        f'<div class="sb-user-name">{cont}</div>'
    )
    html = html.replace(
        '<div class="sb-user-role">Farm Director</div>',
        f'<div class="sb-user-role">{role}</div>'
    )

    # 7. Dashboard greeting + subtitle
    html = html.replace(
        '<div class="mod-title">Good morning, James <span style="font-size:18px;">🌿</span></div>',
        f'<div class="mod-title">Good morning, {first} <span style="font-size:18px;">🌿</span></div>'
    )
    html = html.replace(
        '<div class="mod-subtitle">Cenancle Kenya — Naivasha · Friday 6 June 2026</div>',
        f'<div class="mod-subtitle">{name} — {loc} · Friday 6 June 2026</div>'
    )

    # 8. Dashboard KPI values
    html = html.replace(
        '<div class="kpi-value">48,000</div>\n      <div class="kpi-sub"><span class="up">↑ 4.2%</span></div>',
        f'<div class="kpi-value">{sf}</div>\n      <div class="kpi-sub"><span class="up">↑ 4.2%</span></div>'
    )
    html = html.replace(
        '<div class="kpi-value" style="font-size:20px;">KES 8.45M</div>',
        f'<div class="kpi-value" style="font-size:20px;">{rev_k}</div>'
    )
    # Workforce Active KPI on dashboard
    html = html.replace(
        '<div class="kpi-label">Workforce Active</div>\n      <div class="kpi-value">312</div>\n      <div class="kpi-sub">148 perm · 164 casual</div>',
        f'<div class="kpi-label">Workforce Active</div>\n      <div class="kpi-value">{staff_f}</div>\n      <div class="kpi-sub">{perm:,} perm · {casual:,} casual</div>'
    )
    # Payroll run history row

    # Pending dispatches
    html = html.replace(
        '<div class="kpi-value">22</div>\n      <div class="kpi-sub warn">',
        f'<div class="kpi-value">{disp}</div>\n      <div class="kpi-sub warn">'
    )

    # 9. Production module subtitle (stems/day)
    html = html.replace(
        f'Week 23 · 3 active cycles · 48,000 stems/day avg',
        f'Week 23 · 3 active cycles · {sf} stems/day avg'
    )
    html = html.replace(
        f'<div class="kpi-value">48,000</div><div class="kpi-sub"><span class="up">↑ 4.2%</span></div>',
        f'<div class="kpi-value">{sf}</div><div class="kpi-sub"><span class="up">↑ 4.2%</span></div>'
    )

    # 10. Pack house subtitle
    html = html.replace(
        '1,482 stems rejected from 48,000 graded (3.09%)',
        f'1,482 stems rejected from {sf} graded (3.09%)'
    )

    # 11. Payroll KPI
    html = html.replace(
        '<div class="kpi-value">312 staff</div>\n      <div class="kpi-sub">148 permanent · 164 casuals</div>',
        f'<div class="kpi-value">{staff_f} staff</div>\n      <div class="kpi-sub">{perm:,} permanent · {casual:,} casuals</div>'
    )

    # 12. TOUR_DATA desc — replace "Cenancle Kenya" in desc fields
    html = html.replace(
        "desc:'The command center for Cenancle Kenya — a real-time view of the entire farm operation at a glance.',",
        f"desc:'The command center for {name} — a real-time view of the entire farm operation at a glance.',"
    )
    html = html.replace(
        "desc:'Pipeline management, customer records, order tracking, and invoicing — connecting Cenancle Kenya to its global flower buyers.',",
        f"desc:'Pipeline management, customer records, order tracking, and invoicing — connecting {name} to its global flower buyers.',"
    )
    html = html.replace(
        "desc:'Profit & loss, balance sheet, and tax reporting — real-time financial health of the Cenancle Kenya operation.',",
        f"desc:'Profit & loss, balance sheet, and tax reporting — real-time financial health of the {name} operation.',"
    )
    html = html.replace(
        f"desc:'Full payroll processing for 312 staff — permanent and casual — with run history, net pay summaries, and statutory deductions.',",
        f"desc:'Full payroll processing for {staff_f} staff — permanent and casual — with run history, net pay summaries, and statutory deductions.',"
    )
    html = html.replace(
        "desc:'Certification management, spray logs, labour records, and full audit trail — keeping Cenancle audit-ready 365 days a year.',",
        f"desc:'Certification management, spray logs, labour records, and full audit trail — keeping {name} audit-ready 365 days a year.',"
    )

    # 13. TOUR_DATA feats with staff count
    html = html.replace(
        "'312 workforce: 148 permanent + 164 casual workers',",
        f"'{staff_f} workforce: {perm:,} permanent + {casual:,} casual workers',"
    )
    html = html.replace(
        "why:'312 employees. PAYE, NSSF, NHIF, Housing Levy. 164 casual workers on weekly attendance. Flori-Core calculates every deduction in seconds, runs payroll on approval, and dispatches payslips by email and SMS — without HR touching a calculator.',",
        f"why:'{whys[14]}',"
    )

    # 14. TOUR_DATA access feat
    html = html.replace(
        "why:'With 312 staff accessing finance, operations, procurement, and payroll — who sees what matters. A rogue procurement approval or a payroll export in the wrong hands is a liability. This module enforces clean access, every session.',",
        f"why:'{whys[6]}',"
    )

    html = html.replace('<td>312 staff</td>', f'<td>{staff_f} staff</td>')
    html = html.replace('All Staff (312)', f'All Staff ({staff_f})')
    html = html.replace('312 employees', f'{staff_f} employees')

    # 15. Zone A/B/C varieties (TOUR_DATA feat)
    html = html.replace(
        "'Zone A (Red Naomi, 3.2 ha), B (Avalanche, 2.8 ha), C (Pink Floyd, 1.5 ha)',",
        f"'Zone A ({za[0]}, {za[1]}), B ({zb[0]}, {zb[1]}), C ({zc[0]}, {zc[1]})',"
    )
    # Zone cards in HTML
    html = html.replace(
        '<div class="zone-crop">Red Naomi · 3.2 ha</div>',
        f'<div class="zone-crop">{za[0]} · {za[1]}</div>'
    )
    html = html.replace(
        '<div class="zone-crop">Avalanche White · 2.8 ha</div>',
        f'<div class="zone-crop">{zb[0]} · {zb[1]}</div>'
    )
    html = html.replace(
        '<div class="zone-crop">Pink Floyd · 1.5 ha</div>',
        f'<div class="zone-crop">{zc[0]} · {zc[1]}</div>'
    )
    # SVG map labels
    html = html.replace(
        'fill="#94a3b8" font-size="11" font-family="Inter">Red Naomi · 3.2 ha</text>',
        f'fill="#94a3b8" font-size="11" font-family="Inter">{za[0]} · {za[1]}</text>'
    )
    html = html.replace(
        'fill="#94a3b8" font-size="11" font-family="Inter">Avalanche · 2.8 ha</text>',
        f'fill="#94a3b8" font-size="11" font-family="Inter">{zb[0]} · {zb[1]}</text>'
    )
    html = html.replace(
        'fill="#94a3b8" font-size="10" font-family="Inter">Pink Floyd</text>',
        f'fill="#94a3b8" font-size="10" font-family="Inter">{zc[0]}</text>'
    )

    # 16. IoT sensor readings (KPI cards)
    html = html.replace(
        '<div class="kpi-value" style="color:var(--cyan);">38.2%</div>',
        f'<div class="kpi-value" style="color:var(--cyan);">{moist}%</div>'
    )
    html = html.replace(
        '<div class="kpi-value">22.8°C</div>',
        f'<div class="kpi-value">{temp}°C</div>'
    )
    html = html.replace(
        '<div class="kpi-value">1.6 mS/cm</div>',
        f'<div class="kpi-value">{ec} mS/cm</div>'
    )
    # Sensor card big reading
    html = html.replace(
        '>38.2<span style="font-size:20px;color:var(--text-3);">%</span>',
        f'>{moist}<span style="font-size:20px;color:var(--text-3);">%</span>'
    )
    html = html.replace(
        'width:38.2%;background:var(--cyan)',
        f'width:{moist}%;background:var(--cyan)'
    )

    # 17. Cold room alert time + name
    html = html.replace('Cold Room 2 Temperature Alert', f'{cr_n} Temperature Alert')
    html = html.replace('Cold Room 2 breached 3.4°C at 02:14 AM', f'{cr_n} breached 3.4°C at {cr_t}')
    html = html.replace(
        'Live sensor cards: Cold Room 1 at 2.1°C STABLE, CR2 at 3.4°C WARNING',
        f'Live sensor cards: Cold Room 1 at 2.1°C STABLE, {cr_n} at 3.4°C WARNING'
    )
    # Comms/automations references to 02:14 AM
    html = html.replace('at 02:14 AM', f'at {cr_t}')
    html = html.replace('02:14 AM', cr_t)

    # 18. Sales kanban buyers (TOUR_DATA feat)
    b = buyers
    html = html.replace(
        "'Kanban pipeline: FloraHolland, Interflora UK, KQ Cargo, Stems EA',",
        f"'Kanban pipeline: {b[0]}, {b[1]}, {b[2]}, {b[3]}',"
    )
    # HTML kanban buyer names in sales module
    html = html.replace('>FloraHolland<', f'>{b[0]}<')
    html = html.replace('>Interflora UK<', f'>{b[1]}<')

    # 19. Various module subtitles mentioning Cenancle Kenya
    html = html.replace(
        'Cenancle Kenya · Live sensor monitoring · FIFO stock management',
        f'{name} · Live sensor monitoring · FIFO stock management'
    )
    html = html.replace(
        'Cenancle Kenya · System users · roles &amp; permissions management',
        f'{name} · System users · roles &amp; permissions management'
    )
    html = html.replace(
        'Cenancle Kenya · Training records · compliance · 360° appraisals',
        f'{name} · Training records · compliance · 360° appraisals'
    )
    html = html.replace(
        'Cenancle Kenya · Live routing · order queue · fleet management',
        f'{name} · Live routing · order queue · fleet management'
    )
    html = html.replace(
        'Cenancle Kenya · Finished goods · ATP · packed boxes · wastage tracking',
        f'{name} · Finished goods · ATP · packed boxes · wastage tracking'
    )
    html = html.replace(
        'Cenancle Kenya · Sales pipeline · orders tracking · global invoicing',
        f'{name} · Sales pipeline · orders tracking · global invoicing'
    )
    html = html.replace(
        'Cenancle Kenya · Purchase requests · purchase orders · GRN matching',
        f'{name} · Purchase requests · purchase orders · GRN matching'
    )
    html = html.replace(
        'Cenancle Kenya · General ledger · Profit &amp; Loss · Balance Sheet',
        f'{name} · General ledger · Profit &amp; Loss · Balance Sheet'
    )
    html = html.replace(
        'Cenancle Kenya · Statutory deductions · M-Pesa disbursements · pay slips',
        f'{name} · Statutory deductions · M-Pesa disbursements · pay slips'
    )
    html = html.replace(
        f'Cenancle Kenya · Naivasha · 4 active sensors · auto-sync every 30s',
        f'{name} · {loc} · 4 active sensors · auto-sync every 30s'
    )
    html = html.replace(
        'Cenancle Kenya · Immutable action log · full diff history · 10 events this session',
        f'{name} · Immutable action log · full diff history · 10 events this session'
    )
    html = html.replace(
        'Cenancle Kenya · Environmental certificates · chemical spray logs · labor audits',
        f'{name} · Environmental certificates · chemical spray logs · labor audits'
    )
    html = html.replace(
        f'Powered by farm context · James Kariuki · Cenancle Kenya · 06/06/2026',
        f'Powered by farm context · {cont} · {name} · 06/06/2026'
    )
    html = html.replace(
        f'Ask anything about Cenancle Kenya farm operations...',
        f'Ask anything about {name} farm operations...'
    )

    # 20. User management panel — James Kariuki user entry
    html = html.replace(
        '<div class="user-name">James Kariuki</div>',
        f'<div class="user-name">{cont}</div>'
    )
    html = html.replace(
        '<div class="user-role">Farm Director</div>',
        f'<div class="user-role">{role}</div>'
    )
    html = html.replace(
        '<div class="user-avatar" style="background:linear-gradient(135deg,#22c55e,#16a34a);">JK</div>',
        f'<div class="user-avatar" style="background:linear-gradient(135deg,#22c55e,#16a34a);">{ini}</div>'
    )
    html = html.replace(
        '<span class="user-badge role-badge">Farm Director</span>',
        f'<span class="user-badge role-badge">{role}</span>'
    )
    html = html.replace(
        '<option>Farm Director</option>',
        f'<option>{role}</option>'
    )

    # 21. Audit trail / notifications contact name
    html = html.replace('James Kariuki', cont)
    html = html.replace(
        f'Auto-alert sent to James Kariuki.',
        f'Auto-alert sent to {cont}.'
    )

    # 22. Chat / comms: remaining "James" first-name refs in farm context
    html = html.replace('James · 10:02 AM', f'{first} · 10:02 AM')
    html = html.replace('James · 10:05 AM', f'{first} · 10:05 AM')
    html = html.replace(
        f'<div class="sms-contact" id="sms-contact-name">James Kariuki</div>',
        f'<div class="sms-contact" id="sms-contact-name">{cont}</div>'
    )
    html = html.replace(
        f'james@cenancle.co.ke',
        f'{first.lower()}@{slug}.co.ke'
    )
    html = html.replace(
        f'john@cenancle.co.ke',
        f'team@{slug}.co.ke'
    )
    # Cenancle Kenya Ltd references in notification panels
    html = html.replace('Cenancle Kenya Ltd', f'{name}')
    html = html.replace('cenancle.co.ke', f'{slug}.co.ke')
    html = html.replace('Cenancle Farm Ops', f'{name} Ops')
    html = html.replace('CEN-0892', f'{slug.upper()[:3]}-0892')

    # 23. TOUR_DATA why strings — replace all 21 originals
    for i, orig in enumerate(ORIG_WHYS):
        new_why = whys[i]
        # Escape single quotes in JS string context: the why is inside why:'...'
        # The orig already has escaped quotes where needed in the JS
        # We need to find the exact string in the file
        search = f"why:'{orig}',"
        replace = f"why:'{new_why}',"
        if search in html:
            html = html.replace(search, replace)
        else:
            # Try double-escaped version
            search2 = "why:'" + orig.replace("'", "\\'") + "',"
            replace2 = "why:'" + new_why.replace("'", "\\'") + "',"
            html = html.replace(search2, replace2)

    # 24. Tour panel initial desc + why shown on load
    html = html.replace(
        "The command center for Cenancle Kenya — a real-time view of the entire farm operation at a glance.",
        f"The command center for {name} — a real-time view of the entire farm operation at a glance."
    )
    html = html.replace(
        "Why This Matters for Cenancle Kenya",
        f"Why This Matters for {name}"
    )
    # Replace the initial tour why text shown before JS runs
    html = html.replace(
        "With 48,000 stems leaving Naivasha daily, James needs one screen to confirm the entire operation is running before morning tea. This dashboard replaces 4 spreadsheets and 3 WhatsApp groups.",
        whys[0]
    )

    # 25. Compliance module — GlobalG.A.P copy mentioning Cenancle
    html = html.replace(
        "Cenancle meets 87% of required training compliance",
        f"{name} meets 87% of required training compliance"
    )
    html = html.replace(
        "Cenancle Kenya meets 87%",
        f"{name} meets 87%"
    )

    # 26. Notification panel buyer name (Cenancle Kenya)
    html = html.replace('Cenancle Kenya:', f'{name}:')
    html = html.replace('— Cenancle Kenya', f'— {name}')
    html = html.replace('Cenancle Kenya', name)   # catch any remaining

    # 26b. Telemetry label
    html = html.replace('Cenancle Current Rate', f'{name} Current Rate')

    # 27. remaining 'James' first name in farm context (careful — only farm context)
    # Only replace where it clearly means the contact, not a generic name
    html = html.replace(
        'Good morning, James',
        f'Good morning, {first}'
    )

    return html


# ─────────────────────────────────────────────────────────────────
# WRITE ALL 20 FILES
# ─────────────────────────────────────────────────────────────────
for i, farm in enumerate(FARMS, 1):
    slug = farm['slug']
    out_path = f"{OUT}/floricore-{slug}-demo.html"
    content = make_demo(farm)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
    size_kb = len(content) // 1024
    print(f"[{i:02d}/20] ✓ floricore-{slug}-demo.html  ({size_kb} KB)")

print("\nAll 20 demo files written.")
