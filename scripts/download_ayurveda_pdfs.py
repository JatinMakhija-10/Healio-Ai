# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Download PlanetAyurveda + CCRAS Classical Texts
=============================================================
Downloads all 58 PlanetAyurveda PDFs and 17 CCRAS government PDFs.
URLs discovered via browser scraping of:
  - https://www.planetayurveda.com/ayurveda-e-books/
  - https://ccras.nic.in/e-books/
  - https://ccras.nic.in/publication/ayurveda-handboooks/

Run:
  pip install requests
  python scripts/download_ayurveda_pdfs.py
"""

import time
import re
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] Run: pip install requests")
    sys.exit(1)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}
DELAY_SEC = 1.5

BASE_DIR = Path(__file__).parent.parent / "data" / "ayurveda" / "raw"

# ============================================================================
# PlanetAyurveda -- 58 classical texts (discovered via browser scraping)
# ============================================================================
PLANET_AYURVEDA_PDFS = [
    ("Ayurveda_Prakash", "https://www.planetayurveda.com/ayurveda-ebooks/ayurved-prakash.pdf"),
    ("Bhaishajya_Ratnavali_Part1", "https://www.planetayurveda.com/ayurveda-ebooks/bhaishajya-ratnavali-part-I.pdf"),
    ("Bhaishajya_Ratnavali_Bengali", "https://www.planetayurveda.com/ayurveda-ebooks/bhaishajya-ratnavali-bengali.pdf"),
    ("Chakradatta_1", "https://www.planetayurveda.com/ayurveda-ebooks/chakra-datta.pdf"),
    ("Chakradatta_4_Telugu", "https://www.planetayurveda.com/ayurveda-ebooks/chakradatta-4%20(1).pdf"),
    ("Bhaishajya_Ratnavali_Full", "https://www.planetayurveda.com/ayurveda-ebooks/Bhaishajya_ratnavali.pdf"),
    ("Madanapala_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/madanpala-nighantu.pdf"),
    ("Niruktam_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/niruktam-nighantu.pdf"),
    ("Anjan_Nidanam", "https://www.planetayurveda.com/ayurveda-ebooks/Anjana_Nidanam.pdf"),
    ("Ashtanga_Sangraha", "https://www.planetayurveda.com/ayurveda-ebooks/ashtanga-sangraha.pdf"),
    ("Ashtanga_Hridaya", "https://www.planetayurveda.com/ayurveda-ebooks/ashtanga-hridaya.pdf"),
    ("Ashtanga_Hridaya_Sutrasthan_Handbook", "https://www.planetayurveda.com/ayurveda-ebooks/astanga-hridaya-sutrasthan-handbook.pdf"),
    ("Charaka_Sutra_Hindi", "https://www.planetayurveda.com/ayurveda-ebooks/charaka-sutra-hindi.pdf"),
    ("Bhavprakash_Jvradhikar", "https://www.planetayurveda.com/ayurveda-ebooks/bhavprakash-jvradhikar.pdf"),
    ("Charak_Samhita_Thika_Adya_Khanda", "https://www.planetayurveda.com/ayurveda-ebooks/CharakSamhita%20Thika%20AdyaKhanda.pdf"),
    ("Charak_Samhita_Thika_Dvitiya_Khanda", "https://www.planetayurveda.com/ayurveda-ebooks/CharakSamhita%20Thika%20DvitiyaKhanda.pdf"),
    ("Charak_Samhita_Thika_Tritiya_Khanda", "https://www.planetayurveda.com/ayurveda-ebooks/CharakSamhita-Thika-Tritiya-Khanda.pdf"),
    ("Sushrut_Samhita_Bhanumati_Commentary", "https://www.planetayurveda.com/ayurveda-ebooks/Sushrut_samhita_SutraSthan_With_Bhanumati_Commentary_By_Chakrapani_Datta.pdf"),
    ("Sushruta_English_Translation", "https://www.planetayurveda.com/ayurveda-ebooks/Sushrutha%20english%20Translation.pdf"),
    ("Sushruta_Uttaratantra", "https://www.planetayurveda.com/ayurveda-ebooks/Sushrutha%20uthratantra.pdf"),
    ("Bhava_Prakash_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/bhava-prakash-nighantu.pdf"),
    ("Bhava_Prakash_Samhita_Uttara", "https://www.planetayurveda.com/ayurveda-ebooks/bhava-prakash-samhita-uttara.pdf"),
    ("Bhavaprakasha_Purvakhand", "https://www.planetayurveda.com/ayurveda-ebooks/bhavaprakasha-puravkhand.pdf"),
    ("Bhavprakash_Madhya_Khanda", "https://www.planetayurveda.com/ayurveda-ebooks/bhavprakash-madhya-khanda.pdf"),
    ("Madhava_Nidana_Vol1", "https://www.planetayurveda.com/ayurveda-ebooks/Madhavanidhanam_Vol_1.pdf"),
    ("Madhava_Nidana_Vol2", "https://www.planetayurveda.com/ayurveda-ebooks/Madhavanidhanam_Vol_2.pdf"),
    ("Sarngadhara_Samhita_Sanskrit", "https://www.planetayurveda.com/ayurveda-ebooks/Sarngadhara-Samhita%20(Sanskrit).pdf"),
    ("Chikitsa_Kramam", "https://www.planetayurveda.com/ayurveda-ebooks/chikitsa-kramam.pdf"),
    ("Sahasrayogam_Hindi", "https://www.planetayurveda.com/ayurveda-ebooks/Sahasrayogam-hindi.pdf"),
    ("Charakasamhitha_Chulika", "https://www.planetayurveda.com/ayurveda-ebooks/charakasamhitha-chulika.pdf"),
    ("Harita_Samhita", "https://www.planetayurveda.com/ayurveda-ebooks/harita-samhita.pdf"),
    ("Kaashyapa_Samhita", "https://www.planetayurveda.com/ayurveda-ebooks/kaashyapa-samhita.pdf"),
    ("Rasa_Rathna_Samuchayam", "https://www.planetayurveda.com/ayurveda-ebooks/rasa-rathna-samuchayam.pdf"),
    ("Gadatnigraha_Vol1", "https://www.planetayurveda.com/ayurveda-ebooks/gadatnigraha-vol-1.pdf"),
    ("Gadatnigraha_Vol2", "https://www.planetayurveda.com/ayurveda-ebooks/gadatnigraha-vol-2.pdf"),
    ("Gadatnigraha_Vol3", "https://www.planetayurveda.com/ayurveda-ebooks/gadatnigraha-vol-3.pdf"),
    ("Dhanvantari_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/dhanvantari-nighantu.pdf"),
    ("Raja_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/raja-nighantu.pdf"),
    ("Shodala_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/shodala-nighantu.pdf"),
    ("Kaiyadeve_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/kaiyadeve-nighantu.pdf"),
    ("Priya_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/priya-nighantu.pdf"),
    ("Ashtang_Hridaya_Sutra_Sthan", "https://www.planetayurveda.com/ayurveda-ebooks/ashtang-hridaya-sutra-sthan.pdf"),
    ("Sharangdhar_Samhita", "https://www.planetayurveda.com/ayurveda-ebooks/sharangdhar-samhita.pdf"),
    ("Bhavprakash_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/bhavprakash-nighantu.pdf"),
    ("Panchagavya_Importance", "https://www.planetayurveda.com/ayurveda-ebooks/panchagavya-importance.pdf"),
    ("Vaidhyasaar", "https://www.planetayurveda.com/ayurveda-ebooks/vaidhyasaar.pdf"),
    ("Vaidya_Yoga_Ratnavali", "https://www.planetayurveda.com/ayurveda-ebooks/vaidya-yoga-ratnavali.pdf"),
    ("Yoga_Chinthamani", "https://www.planetayurveda.com/ayurveda-ebooks/yoga-chinthamani.pdf"),
    ("Chikitsa_Sara_Sangraha_Vangasena", "https://www.planetayurveda.com/ayurveda-ebooks/chikitsa-sara-sangraha-of-vangasena.pdf"),
    ("Materia_Medica", "https://www.planetayurveda.com/ayurveda-ebooks/materia-medica.pdf"),
    ("Indian_Pharmacopoeia", "https://www.planetayurveda.com/ayurveda-ebooks/indian-pharmacopoea.pdf"),
    ("Raja_Nighantu_Dhanwantari_Nighantu", "https://www.planetayurveda.com/ayurveda-ebooks/raja-nighantu-evam-dhanwantari-nighantu.pdf"),
    ("Drugs_Magic_Remedies_Act", "https://www.planetayurveda.com/ayurveda-ebooks/drugs-magic-remedies-advertisement-act.pdf"),
    ("Drugs_Cosmetics_Act_1940", "https://www.planetayurveda.com/ayurveda-ebooks/india-drugs-and-cosmetics-act-1940-act-no-23.pdf"),
    ("Indian_Medicinal_Plants", "https://www.planetayurveda.com/ayurveda-ebooks/indian-medicinal-plants.pdf"),
    ("Brihad_Nighantu_Ratnakar_Part1", "https://www.planetayurveda.com/ayurveda-ebooks/brihad-nighantu-ratnakar-part-1.pdf"),
    ("Brihad_Nighantu_Ratnakar_Part3", "https://www.planetayurveda.com/ayurveda-ebooks/brihad-nighantu-ratnakar-part-3.pdf"),
    ("Brihad_Nighantu_Ratnakar_Part4", "https://www.planetayurveda.com/ayurveda-ebooks/brihad-nighantu-ratnakar-part-4.pdf"),
    ("Yog_Ratnakar_Part1", "https://www.planetayurveda.com/ayurveda-ebooks/yog-ratnakar-part-1.pdf"),
]

# ============================================================================
# CCRAS Government E-Books (17 PDFs, browser scraped)
# ============================================================================
CCRAS_PDFS = [
    ("CCRAS_Ayurveda_Focus_Research_Development", "https://ccras.nic.in/wp-content/uploads/2024/07/05112021_Ayurveda_A_Focus_on_Research__Development.pdf"),
    ("CCRAS_Nutritional_Advocacy_Ayurveda", "https://ccras.nic.in/wp-content/uploads/2024/07/05112021_Nutritional_Advocacy_in_Ayurveda.pdf"),
    ("CCRAS_Ayurveda_Science_Art_of_Life", "https://ccras.nic.in/wp-content/uploads/2024/06/Ayurveda-The-Science-and-Art-of-Life.pdf"),
    ("CCRAS_Vision_Document_2030", "https://ccras.nic.in/wp-content/uploads/2024/07/CCRAS-Vision-Document-2030.pdf"),
    ("CCRAS_Evidence_Based_Ayurvedic_Practice", "https://ccras.nic.in/wp-content/uploads/2024/06/Evidence_based_Ayurvedic_Practice.pdf"),
    ("CCRAS_Drug_Development_Select_Diseases", "https://ccras.nic.in/wp-content/uploads/2024/06/Drug_Development_Book.pdf"),
    ("CCRAS_Ayurveda_Dossier", "https://ccras.nic.in/wp-content/uploads/2024/07/AYURVEDA_The_Science_of_LifeDossier.pdf"),
    ("CCRAS_Glimpse_NorthEast_India", "https://ccras.nic.in/wp-content/uploads/2024/07/Glimpse-of-CCRAS.pdf"),
    ("CCRAS_Medico_Ethno_Botanical_Survey", "https://ccras.nic.in/wp-content/uploads/2024/07/Medico-Ethno-Botanical-Survey-Programmme.pdf"),
    ("CCRAS_Diet_Lifestyle_Cardiac_Disorders", "https://ccras.nic.in/wp-content/uploads/2024/07/24052018_CCRAS_Cardiac_disorders.pdf"),
    ("CCRAS_Diet_Lifestyle_Skin_Diseases", "https://ccras.nic.in/wp-content/uploads/2024/07/24052018_Ayurveda-Based-Diet-Lifestyle-Guidelines-Skin-Diseas.pdf"),
    ("CCRAS_Dietary_Guidelines_Mental_Disorders_EN", "https://ccras.nic.in/wp-content/uploads/2024/07/Ayurveda-Based_Dietary_Guidelines_Mental_Disorders_EN.pdf"),
    ("CCRAS_Dietary_Guidelines_Mental_Disorders_HI", "https://ccras.nic.in/wp-content/uploads/2024/07/Ayurveda-Based_Dietary_Guidelines_Mental_Disorders_HI-1.pdf"),
    ("CCRAS_AYU_SAMVAD_Ebook", "https://ccras.nic.in/wp-content/uploads/2024/06/AYU_SAMVAD_ebook.pdf"),
    ("CCRAS_Ayurvedic_Home_Remedies_Tulsi_EN", "https://ccras.nic.in/wp-content/uploads/2024/06/Ayurvedic-Home-Remedies-English.pdf"),
    ("CCRAS_Ayurvedic_Home_Remedies_Tulsi_HI", "https://ccras.nic.in/wp-content/uploads/2024/06/Ayurvedic-Home-Remedies-hindi.pdf"),
    ("CCRAS_Cross_Referral_Disease_Conditions", "https://ccras.nic.in/wp-content/uploads/2024/06/Cross_Referral_Approach_for_Selected_Disease_Conditions.pdf"),
]


def download(name: str, url: str, dest_dir: Path, session: requests.Session) -> bool:
    dest = dest_dir / (name + ".pdf")
    if dest.exists() and dest.stat().st_size > 5000:
        print(f"  [SKIP] {name}")
        return True
    # Disable SSL verification for government .nic.in domains (known expired cert)
    verify_ssl = "nic.in" not in url
    for attempt in range(3):
        try:
            resp = session.get(url, headers=HEADERS, stream=True, timeout=40, verify=verify_ssl)
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            size_kb = dest.stat().st_size // 1024
            print(f"  [OK]   {size_kb:>5} KB  {name}")
            return True
        except Exception as e:
            err = str(e)
            if "getaddrinfo" in err or "Name or service not known" in err:
                print(f"  [DNS]  DNS failure for {name}, attempt {attempt+1}/3 -- retrying in 5s")
                time.sleep(5)
            else:
                print(f"  [FAIL] {name}: {err[:100]}")
                return False
    print(f"  [FAIL] {name}: DNS permanently failed")
    return False


def batch_download(items: list, dest_dir: Path, label: str):
    dest_dir.mkdir(parents=True, exist_ok=True)
    session   = requests.Session()
    ok = fail = 0
    print(f"\n=== {label} ({len(items)} files) ===")
    for name, url in items:
        result = download(name, url, dest_dir, session)
        if result:
            ok += 1
        else:
            fail += 1
        time.sleep(DELAY_SEC)
    print(f"\n[DONE] {label}: {ok} ok, {fail} failed")
    return ok, fail


if __name__ == "__main__":
    total_ok = total_fail = 0

    ok, fail = batch_download(
        PLANET_AYURVEDA_PDFS,
        BASE_DIR / "planet_ayurveda",
        "PlanetAyurveda Classical Texts"
    )
    total_ok += ok; total_fail += fail

    ok, fail = batch_download(
        CCRAS_PDFS,
        BASE_DIR / "ccras",
        "CCRAS Government E-Books"
    )
    total_ok += ok; total_fail += fail

    print(f"\n===== GRAND TOTAL: {total_ok} downloaded, {total_fail} failed =====")

    # Summary
    for label, folder in [("PlanetAyurveda", "planet_ayurveda"), ("CCRAS", "ccras")]:
        d = BASE_DIR / folder
        files = list(d.glob("*.pdf"))
        total_mb = sum(f.stat().st_size for f in files) / 1_048_576
        print(f"  {label}: {len(files)} PDFs, {total_mb:.1f} MB")
