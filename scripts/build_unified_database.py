"""
Unified Medicine Database Builder
==================================
Merges:
  1. all_medicine databased.csv  -> primary Allopathic source (~248k entries)
  2. data/medicines_database.json -> existing scraped Allopathic generics
  3. data/ayurvedic/herbs.json    -> Ayurvedic herbs (JSON)
  4. Built-in curated Ayurvedic formulations list
  5. Built-in curated Homeopathic remedies list

Output: data/unified_medicines_database.json
Schema:
{
  "Allopathic":  { "A": [...], "B": [...], ... },
  "Ayurvedic":   { "A": [...], ... },
  "Homeopathic": { "A": [...], ... }
}
"""

import pandas as pd
import json
import re
import os
from collections import defaultdict

# ---------------------------------------------------------------------------
BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_IN  = os.path.join(BASE, "Medicines", "all_medicine databased.csv")
ALLO_IN = os.path.join(BASE, "data", "medicines_database.json")
AYUR_IN = os.path.join(BASE, "data", "ayurvedic", "herbs.json")
OUT     = os.path.join(BASE, "data", "unified_medicines_database.json")

# ---------------------------------------------------------------------------
# Curated Ayurvedic formulations / classical medicines
# ---------------------------------------------------------------------------
AYURVEDIC_CURATED = [
    # Herbs (single)
    "Ashwagandha","Tulsi","Amla","Giloy","Neem","Haridra","Brahmi","Shatavari",
    "Methi","Mulethi","Punarnava","Ajwain","Adraka","Kumari (Aloe Vera)","Triphala",
    "Arjuna","Senna","Brahmi","Shankhpushpi","Shilajit","Kesar","Guduchi","Pippali",
    "Marica","Sunthi","Draksha","Jatamansi","Vacha","Kutki","Manjishtha","Sariva",
    "Gokshura","Vidari","Bala","Musta","Kutaj","Dashamoola","Trikatu","Pushkarmool",
    "Haritaki","Bibhitaki","Amalaki","Kali Mirch","Tejpata","Dalchini","Elaichi",
    "Lavang","Javitri","Jaiphal","Nagkesar","Yashtimadhu","Babbula","Jyotishmati",
    "Punarnavashtaka","Chirayata","Nux Vomica (Kuchwla)","Karela","Jamun (Eugenia)",
    "Vasaka","Kantakari","Brihati","Eranda","Danti","Trivrit","Bilva","Agnimantha",
    "Shyonaka","Gambhari","Patala","Gokshura","Salaparni","Prsniparni","Mashaparni",
    "Shalaparni","Punarnava","Devdaru","Rasna","Guggulu","Shudh Guggulu","Kanchanar",
    # Classical formulations
    "Triphala Churna","Trikatu Churna","Sitopaladi Churna","Talisadi Churna",
    "Avipattikar Churna","Hingwashtak Churna","Mahasudarshan Churna","Ashwagandhadi Churna",
    "Brahmi Churna","Yashtimadhu Churna","Arjuna Churna","Haritaki Churna",
    "Amrut Sagar Ras","Abhrak Bhasma","Swarna Bhasma","Rajat Bhasma","Tamra Bhasma",
    "Lauh Bhasma","Mandur Bhasma","Prawal Bhasma","Mukta Shukti Bhasma","Kapardika Bhasma",
    "Shankha Bhasma","Godanti Bhasma","Trivang Bhasma","Naga Bhasma","Vanga Bhasma",
    "Ashtavarga","Chyawanprash","Brahma Rasayan","Bhallatakasava","Drakshasava",
    "Ashwagandharishta","Dashamularishta","Saraswatarishta","Abhayarishta","Arjunarishta",
    "Lohasava","Kumaryasava","Balarishta","Chandanasava","Pippalyasava",
    "Brahmi Vati","Chandraprabha Vati","Arogyavardhini Vati","Sitopaladi Vati",
    "Kankayan Vati","Swasa Kasa Chintamani","Lakshmi Vilas Ras","Vasant Kusumakar Ras",
    "Sutashekhar Ras","Kamdudha Ras","Prawal Panchamrit","Godanti Mishran",
    "Mahamrityunjay Ras","Swarna Sutsekhara Ras","Tribhuvan Kirti Ras",
    "Chaturmukha Ras","Panchavalkala Kvath","Mahayogaraj Guggulu","Triphala Guggulu",
    "Kanchanar Guggulu","Punarnavadi Guggulu","Shallaki Guggulu","Gokshuradi Guggulu",
    "Yogaraj Guggulu","Kaishor Guggulu","Medohar Guggulu","Vatari Guggulu",
    "Brihat Vatchintamani Ras","Ekangveer Ras","Vata Vidhwansaka Ras",
    "Mukta Vati","Arjun Kwath","Kutajghan Vati","Bilwadi Churna","Panchasakar Churna",
    "Haajmola (Digestive)","Punarnavadi Mandur","Irimedadi Oil","Mahanarayan Oil",
    "Ksheerabala Oil","Dhanwantharam Oil","Balarista","Jeerakadyarishta","Chitrakadi Vati",
    "Grahani Kapat Ras","Panchamrit Parpati","Swarna Parpati","Vijay Parpati",
    "Bolbaddha Ras","Hridayarnav Ras","Pradarantak Lauha","Pushyanug Churna",
    "Lodhrasava","Dashang Lepa","Jatyadi Oil","Triphala Ghrit","Brahmi Ghrit",
    "Panchtikta Ghrit","Panchakarma Ghrit","Saraswat Ghrit","Ashwagandha Ghrit",
    "Mahatikta Ghrit","Indukant Ghrit","Dhanwantharam Ghrit","Phala Ghrit",
    # Patanjali / popular commercial Ayurvedic
    "Divya Shilajit Rasayan Vati","Divya Kayakalp Vati","Divya Medha Vati",
    "Divya Swasari Ras","Divya Arshkalp Vati","Divya Udarkalp Churna",
    "Himalaya Liv.52","Himalaya Gasex","Himalaya Tentex Forte","Himalaya Speman",
    "Himalaya Septilin","Himalaya Confido","Himalaya Ashvagandha","Himalaya Bacopa",
    "Dabur Chyawanprash","Dabur Honitus","Dabur Hajmola","Dabur Ashwagandha",
    "Baidyanath Triphala Churna","Baidyanath Dashamularishta","Baidyanath Chyawan Prash",
    "Zandu Pancharishta","Zandu Balm","Zandu Nityam Churna","Zandu Kesari Jivan",
]

# ---------------------------------------------------------------------------
# Curated Homeopathic remedies
# ---------------------------------------------------------------------------
HOMEOPATHIC_CURATED = [
    # Polychrests (most widely used)
    "Aconite Napellus","Apis Mellifica","Argentum Nitricum","Arnica Montana",
    "Arsenicum Album","Aurum Metallicum","Belladonna","Bryonia Alba",
    "Calcarea Carbonica","Calcarea Fluorica","Calcarea Phosphorica","Cantharis",
    "Carbo Vegetabilis","Causticum","China Officinalis","Cina","Colocynthis",
    "Conium Maculatum","Dulcamara","Euphrasia","Ferrum Metallicum","Ferrum Phosphoricum",
    "Gelsemium","Graphites","Hepar Sulphuris","Hyoscyamus Niger","Ignatia Amara",
    "Ipecacuanha","Kali Bichromicum","Kali Carbonicum","Kali Muriaticum",
    "Kali Phosphoricum","Kali Sulphuricum","Lachesis","Ledum Palustre","Lycopodium",
    "Magnesia Carbonica","Magnesia Muriatica","Magnesia Phosphorica","Mercurius Solubilis",
    "Mercurius Vivus","Mezereum","Natrum Carbonicum","Natrum Muriaticum",
    "Natrum Phosphoricum","Natrum Sulphuricum","Nitric Acid","Nux Moschata",
    "Nux Vomica","Opium","Petroleum","Phosphoric Acid","Phosphorus","Platina",
    "Plumbum Metallicum","Podophyllum","Pulsatilla","Rhus Toxicodendron",
    "Ruta Graveolens","Sepia","Silica","Spigelia","Spongia Tosta","Stannum Metallicum",
    "Staphysagria","Stramonium","Sulphur","Sulphuric Acid","Symphytum",
    "Thuja Occidentalis","Urtica Urens","Veratrum Album","Zincum Metallicum",
    # Nosodes & Sarcodes
    "Tuberculinum","Medorrhinum","Syphilinum (Luesinum)","Carcinosin","Psorinum",
    "Bacillinum","Diphtherinum","Thyroidinum","Insulinum","Lac Caninum",
    # Common remedies
    "Aethusa Cynapium","Allium Cepa","Aloe Socotrina","Alstonia Scholaris",
    "Ammonium Carbonicum","Ammonium Muriaticum","Anacardium Orientale",
    "Antimonium Crudum","Antimonium Tartaricum","Baryta Carbonica",
    "Berberis Vulgaris","Borax","Bovista","Bufo Rana","Cactus Grandiflorus",
    "Calotropis Gigantea","Camphora","Capsicum Annum","Chamomilla","Chelidonium Majus",
    "Cicuta Virosa","Cimicifuga Racemosa","Clematis","Coffea Cruda","Colchicum",
    "Crocus Sativus","Croton Tiglium","Cuprum Metallicum","Cyclamen","Digitalis",
    "Dioscorea","Drosera Rotundifolia","Echinacea","Erigeron Canadense",
    "Eupatorium Perfoliatum","Fluoric Acid","Galium Aparine","Glonoinum",
    "Hamamelis Virginiana","Helleborus Niger","Helonias","Hydrastis","Hydrocyanicum Acidum",
    "Hypericum Perforatum","Iodum","Iris Versicolor","Jalapa","Kreosotum",
    "Lac Defloratum","Lachnantes","Lathyrus Sativus","Lilium Tigrinum","Lobelia Inflata",
    "Lycopus Virginicus","Magnesium Sulphuricum","Medorrhinum","Merc Cor","Moschus",
    "Murex Purpurea","Myristica Sebifera","Nabalus Serpentaria","Natrum Arsenicatum",
    "Naja Tripudians","Stannum Iodatum","Stictia Pulmonaria","Strontium Carbonicum",
    "Sulphur Iodatum","Tabacum","Tellurium","Teucrium Marum","Tinea Tonsurans",
    "Torpidium","Veratrum Viride","Viscum Album","Wyethia","Xanthoxylum",
    # Mother Tinctures (Q)
    "Arnica Montana Mother Tincture","Echinacea Mother Tincture","Calendula Mother Tincture",
    "Hydrastis Mother Tincture","Chelidonium Mother Tincture","Berberis Vulgaris Mother Tincture",
    "Carduus Marianus Mother Tincture","Ceanothus Mother Tincture","Avena Sativa Mother Tincture",
    "Passiflora Incarnata Mother Tincture","Withania Somnifera Mother Tincture",
    "Syzygium Jambolanum Mother Tincture","Gymnema Sylvestre Mother Tincture",
    "Momordica Charantia Mother Tincture","Phytolacca Decandra Mother Tincture",
    "Thuja Occidentalis Mother Tincture","Lycopodium Mother Tincture",
    "Symphytum Mother Tincture","Urtica Urens Mother Tincture","Hamamelis Mother Tincture",
    # Biochemic Tissue Salts (Schussler)
    "Calcarea Fluorica 6X","Calcarea Phosphorica 6X","Calcarea Sulphurica 6X",
    "Ferrum Phosphoricum 6X","Kali Muriaticum 6X","Kali Phosphoricum 6X",
    "Kali Sulphuricum 6X","Magnesia Phosphorica 6X","Natrum Muriaticum 6X",
    "Natrum Phosphoricum 6X","Natrum Sulphuricum 6X","Silica 6X",
    # Bio Combination tablets (Bioplasgen)
    "Bioplasgen No 1 (Anaemia)","Bioplasgen No 2 (Asthma)","Bioplasgen No 3 (Colic)",
    "Bioplasgen No 4 (Constipation)","Bioplasgen No 5 (Coryza)","Bioplasgen No 6 (Debility)",
    "Bioplasgen No 7 (Diarrhoea)","Bioplasgen No 8 (Dysepsia)","Bioplasgen No 9 (Dentition)",
    "Bioplasgen No 10 (Exhaustion)","Bioplasgen No 11 (Fever)","Bioplasgen No 12 (Headache)",
    "Bioplasgen No 13 (Leucorrhoea)","Bioplasgen No 14 (Measles)","Bioplasgen No 15 (Menstrual)",
    "Bioplasgen No 16 (Nervous Exhaustion)","Bioplasgen No 17 (Piles)",
    "Bioplasgen No 18 (Throat)","Bioplasgen No 19 (Urinary)","Bioplasgen No 20 (Skin)",
    "Bioplasgen No 21 (Teething)","Bioplasgen No 22 (Toothache)","Bioplasgen No 23 (Tumors)",
    "Bioplasgen No 24 (Nervous Diseases)","Bioplasgen No 25 (Acidity)","Bioplasgen No 26 (Cold)",
    "Bioplasgen No 27 (Eczema)","Bioplasgen No 28 (Nethertons)","Bioplasgen No 29 (Vitiligo)",
]


def title_smart(name: str) -> str:
    """Title-case but preserve uppercase abbreviations."""
    words = name.strip().split()
    abbrevs = {"XR","SR","DT","IV","IM","SC","ER","CR","CD","LA","OD","BD","TDS",
               "QID","MR","PR","SF","LS","DS","PD","LB","RF","Q"}
    return " ".join(w.upper() if w.upper() in abbrevs else w.capitalize() for w in words)


def get_letter(name: str) -> str:
    c = name.strip()[0].upper() if name.strip() else "#"
    return c if c.isalpha() else "#"


def build_letter_dict(names: list) -> dict:
    grouped = defaultdict(list)
    for name in sorted(set(names), key=lambda x: x.lower()):
        grouped[get_letter(name)].append(name)
    return dict(sorted(grouped.items()))


# ---------------------------------------------------------------------------
# Step 1: Load CSV
# ---------------------------------------------------------------------------
print("[1/6] Loading CSV (~248k rows) ...")
df = pd.read_csv(CSV_IN, usecols=["name"], dtype=str, on_bad_lines="skip")
df.dropna(subset=["name"], inplace=True)
df["name"] = df["name"].str.strip()
all_csv_names = df["name"].tolist()
print(f"   Loaded {len(all_csv_names):,} entries from CSV.")

# ---------------------------------------------------------------------------
# Step 2: Load existing JSONs
# ---------------------------------------------------------------------------
print("[2/6] Loading existing JSON datasets ...")
with open(ALLO_IN, encoding="utf-8") as f:
    existing_allo = json.load(f)

with open(AYUR_IN, encoding="utf-8") as f:
    herbs_raw = json.load(f)

ayurvedic_from_json = [h["herb_name"] for h in herbs_raw]
print(f"   Existing allopathic JSON: {len(existing_allo)} | Ayurvedic herbs JSON: {len(ayurvedic_from_json)}")

# ---------------------------------------------------------------------------
# Step 3: All CSV entries -> Allopathic (CSV is purely allopathic)
# ---------------------------------------------------------------------------
print("[3/6] Processing CSV entries into Allopathic bucket ...")
seen_allo = set()
allo_names = []
for raw in all_csv_names:
    name = title_smart(raw)
    key = name.lower()
    if key not in seen_allo:
        seen_allo.add(key)
        allo_names.append(name)
print(f"   Unique CSV allopathic entries: {len(allo_names):,}")

# ---------------------------------------------------------------------------
# Step 4: Merge existing Allopathic JSON
# ---------------------------------------------------------------------------
print("[4/6] Merging existing medicines_database.json ...")
merged_before = len(allo_names)
for name in existing_allo:
    key = name.strip().lower()
    if key not in seen_allo:
        seen_allo.add(key)
        allo_names.append(title_smart(name))
print(f"   Added {len(allo_names) - merged_before:,} unique entries from existing JSON. Total allopathic: {len(allo_names):,}")

# ---------------------------------------------------------------------------
# Step 5: Build Ayurvedic list
# ---------------------------------------------------------------------------
print("[5/6] Building Ayurvedic list ...")
ayur_all = list(ayurvedic_from_json) + AYURVEDIC_CURATED
ayur_unique = list({n.strip().lower(): n.strip() for n in ayur_all if n.strip()}.values())
print(f"   Total unique Ayurvedic entries: {len(ayur_unique):,}")

# ---------------------------------------------------------------------------
# Step 6: Build Homeopathic list
# ---------------------------------------------------------------------------
print("[6/6] Building Homeopathic list ...")
homeo_unique = list({n.strip().lower(): n.strip() for n in HOMEOPATHIC_CURATED if n.strip()}.values())
print(f"   Total unique Homeopathic entries: {len(homeo_unique):,}")

# ---------------------------------------------------------------------------
# Build letter-wise structure
# ---------------------------------------------------------------------------
result = {
    "Allopathic":  build_letter_dict(allo_names),
    "Ayurvedic":   build_letter_dict(ayur_unique),
    "Homeopathic": build_letter_dict(homeo_unique),
}

print("\nCategory summary:")
for cat, letters in result.items():
    total = sum(len(v) for v in letters.values())
    print(f"   {cat:15s}: {total:>7,} entries  ({len(letters)} letters)")

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------
print(f"\nWriting to {OUT} ...")
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

size_mb = os.path.getsize(OUT) / (1024 * 1024)
print(f"Done! File size: {size_mb:.2f} MB")

# Also write a flat summary for quick reference
summary = {
    cat: {letter: len(meds) for letter, meds in letters.items()}
    for cat, letters in result.items()
}
SUMMARY_OUT = os.path.join(BASE, "data", "unified_db_summary.json")
with open(SUMMARY_OUT, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)
print(f"Summary written to {SUMMARY_OUT}")
