"""
AYUSH Research Portal Complete Scraper & Enricher
==================================================
Site: https://ayushportal.nic.in/default.aspx
Target: 43,722 Research Articles across all Indian Traditional Systems

Features:
- Handles ASP.NET WebForms postbacks, __VIEWSTATE, and UpdatePanels.
- Bypasses SSL certificate verification for Indian NIC government servers.
- System order: Sowa Rigpa (11), Yoga and Naturopathy (1,426), Homoeopathy (2,488),
  Unani (2,692), Siddha (6,185), Ayurveda (30,920).
- Navigates Category tiles:
  - Clinical Research (with sub-grades: Evidence Grade A, Grade B, Grade C)
  - Pre-Clinical Research
  - Drug Research
  - Fundamental Research
- Fast, reliable form-based pagination via 'ctl00$ContentPlaceHolder1$btnNext'.
- Auto-retries on network or navigation timeouts.
- Incremental CSV writing (safe against crashes; automatically skips already scraped IDs).
- Multi-threaded detail enrichment mode (`--enrich-only`) to fetch abstracts and keywords.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import os
import re
import sys
import time
from typing import Dict, List, Set, Optional
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

try:
    import sys
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

try:
    import requests
    import urllib3
    urllib3.disable_warnings()
except ImportError:
    requests = None

BASE_URL = "https://ayushportal.nic.in/default.aspx"
DEFAULT_OUTPUT_CSV = "ayush_articles.csv"
DELAY_SECONDS = 1.0  # polite delay between page requests
CONNECT_RETRY_WAIT = 30  # seconds to wait before retrying after internet disconnect
CONNECT_MAX_RETRIES = 60  # max reconnect attempts (~30 mins total)


def wait_for_internet(url: str = "https://ayushportal.nic.in/"):
    """Blocks until the internet is reachable, printing a countdown."""
    if requests is None:
        time.sleep(CONNECT_RETRY_WAIT)
        return
    for attempt in range(1, CONNECT_MAX_RETRIES + 1):
        try:
            requests.get(url, verify=False, timeout=10)
            if attempt > 1:
                print(f"  [+] Internet reconnected after attempt {attempt}. Resuming...")
            return
        except Exception:
            print(f"  [!] Internet disconnected. Waiting {CONNECT_RETRY_WAIT}s before retry {attempt}/{CONNECT_MAX_RETRIES}...")
            time.sleep(CONNECT_RETRY_WAIT)
    print("  [!] Internet not restored after max retries. Exiting.")
    sys.exit(1)


def safe_goto(page: Page, url: str, max_retries: int = 10):
    """Navigates to url with automatic reconnection on ERR_INTERNET_DISCONNECTED."""
    for attempt in range(1, max_retries + 1):
        try:
            page.goto(url, wait_until="networkidle", timeout=35000)
            return
        except Exception as e:
            if "ERR_INTERNET_DISCONNECTED" in str(e) or "ERR_NETWORK_CHANGED" in str(e):
                print(f"  [!] Network error on goto: {e}")
                wait_for_internet()
            elif attempt >= max_retries:
                raise
            else:
                print(f"  [!] goto error (attempt {attempt}/{max_retries}): {e}")
                time.sleep(5)

# Ordered from smallest to largest for fast early wins
MEDICAL_SYSTEM_CONFIG = [
    {"name": "Sowa Rigpa", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_5"},
    {"name": "Yoga and Naturopathy", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_1"},
    {"name": "Homoeopathy", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_4"},
    {"name": "Unani", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_2"},
    {"name": "Siddha", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_3"},
    {"name": "Ayurveda", "radio_id": "ctl00_ContentPlaceHolder1_optnMS_0"},
]

FIELD_NAMES = [
    "article_id",
    "article_title",
    "medical_system",
    "category",
    "authors",
    "research_status",
    "journal_details",
    "detail_url",
    "keywords",
    "abstract",
    "disease_related",
    "institution",
    "full_paper_url",
]


def load_seen_ids(csv_path: str) -> Set[str]:
    seen = set()
    if os.path.exists(csv_path):
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                aid = row.get("article_id")
                if aid:
                    seen.add(aid.strip())
    return seen


def ensure_csv_header(csv_path: str):
    if not os.path.exists(csv_path) or os.path.getsize(csv_path) == 0:
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
            writer.writeheader()


def append_rows(csv_path: str, rows: List[Dict[str, str]]):
    if not rows:
        return
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
        for r in rows:
            clean_row = {k: r.get(k, "") for k in FIELD_NAMES}
            writer.writerow(clean_row)


def fetch_detail_enrichment(detail_url: str, session: Optional[requests.Session] = None) -> Dict[str, str]:
    """Fetches abstract, keywords, disease, institution, and full paper url."""
    enrichment = {
        "keywords": "",
        "abstract": "",
        "disease_related": "",
        "institution": "",
        "full_paper_url": "",
    }
    if not detail_url:
        return enrichment
    
    requester = session if session else requests
    for attempt in range(3):
        try:
            resp = requester.get(detail_url, verify=False, timeout=15)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                
                def get_text(element_id):
                    el = soup.find(id=element_id)
                    return el.get_text(" ", strip=True) if el else ""

                enrichment["keywords"] = get_text("ctl00_ContentPlaceHolder1_Keywords")
                enrichment["abstract"] = get_text("ctl00_ContentPlaceHolder1_Label15")
                enrichment["disease_related"] = get_text("ctl00_ContentPlaceHolder1_Disease")
                enrichment["institution"] = get_text("ctl00_ContentPlaceHolder1_Desig")
                
                paper_a = soup.find("a", href=lambda h: h and "ncbi.nlm.nih.gov" in h) or soup.find(id="ctl00_ContentPlaceHolder1_HyperLink1")
                if paper_a and paper_a.get("href"):
                    enrichment["full_paper_url"] = paper_a.get("href")
                return enrichment
        except Exception:
            time.sleep(1.0)
    return enrichment


def parse_articles_from_html(html: str, system: str, category: str) -> List[Dict[str, str]]:
    """Extracts article rows from tables on the page with clean label stripping."""
    soup = BeautifulSoup(html, "html.parser")
    articles = []

    for table in soup.find_all("table"):
        txt = table.get_text(" ", strip=True)
        if "Article Title:" in txt and "Article ID:" in txt:
            row_data = {
                "article_id": "",
                "article_title": "",
                "medical_system": system,
                "category": category,
                "authors": "",
                "research_status": "",
                "journal_details": "",
                "detail_url": "",
                "keywords": "",
                "abstract": "",
                "disease_related": "",
                "institution": "",
                "full_paper_url": "",
            }
            
            for tr in table.find_all("tr"):
                row_str = " ".join([c.get_text(" ", strip=True) for c in tr.find_all("td")])
                
                title_link = tr.find("a", href=lambda h: h and "ShowDefault.aspx" in h)
                if title_link:
                    row_data["article_title"] = title_link.get_text(" ", strip=True)
                    href = title_link.get("href", "")
                    row_data["detail_url"] = f"https://ayushportal.nic.in/{href}" if not href.startswith("http") else href
                
                if "Article ID:" in row_str:
                    m = re.search(r"Article ID:\s*(\d+)", row_str, re.I)
                    if m:
                        row_data["article_id"] = m.group(1).strip()
                if "Authors:" in row_str:
                    val = re.sub(r"^.*?Authors:\s*", "", row_str, flags=re.I).strip()
                    row_data["authors"] = re.sub(r"^Authors:\s*", "", val, flags=re.I).strip()
                if "Research Status:" in row_str:
                    val = re.sub(r"^.*?Research Status:\s*", "", row_str, flags=re.I).strip()
                    row_data["research_status"] = re.sub(r"^Research Status:\s*", "", val, flags=re.I).strip()
                if "Medical System:" in row_str:
                    val = re.sub(r"^.*?Medical System:\s*", "", row_str, flags=re.I).strip()
                    val = re.sub(r"^Medical System:\s*", "", val, flags=re.I).strip()
                    if val:
                        row_data["medical_system"] = val
                if "Journal Details:" in row_str:
                    val = re.sub(r"^.*?Journal Details:\s*", "", row_str, flags=re.I).strip()
                    row_data["journal_details"] = re.sub(r"^Journal Details:\s*", "", val, flags=re.I).strip()
            
            if row_data["article_id"]:
                articles.append(row_data)
    return articles


def get_pagination_info(html: str) -> (int, int):
    """Returns (current_page, total_pages) from lblcurrpage, or (1, 1) if not found."""
    soup = BeautifulSoup(html, "html.parser")
    lbl = soup.find(id="ctl00_ContentPlaceHolder1_lblcurrpage")
    if lbl:
        text = lbl.get_text(strip=True)
        m = re.search(r"Page:\s*(\d+)\s*of\s*(\d+)", text)
        if m:
            return int(m.group(1)), int(m.group(2))
    return 1, 1


def advance_to_next_page(page: Page, max_retries: int = 3) -> bool:
    """Submits the form targeting btnNext and waits for navigation with retry."""
    for attempt in range(1, max_retries + 1):
        try:
            with page.expect_navigation(timeout=35000):
                page.evaluate("""() => {
                    const f = document.forms['aspnetForm'];
                    f.__EVENTTARGET.value = 'ctl00$ContentPlaceHolder1$btnNext';
                    f.__EVENTARGUMENT.value = '';
                    f.submit();
                }""")
            page.wait_for_load_state("networkidle")
            time.sleep(DELAY_SECONDS)
            return True
        except Exception as e:
            print(f"      [Retry {attempt}/{max_retries}] Pagination error: {e}")
            time.sleep(2.0)
    return False


def scrape_category_pages(
    page: Page,
    system_name: str,
    category_name: str,
    seen_ids: Set[str],
    csv_path: str,
    max_pages: int,
    enrich_details: bool = False
) -> int:
    """Loops over all pages in the current active category and records articles."""
    total_added = 0
    
    html = page.content()
    curr_page, total_pages = get_pagination_info(html)
    pages_to_scrape = min(total_pages, max_pages) if max_pages > 0 else total_pages
    
    print(f"    [Category: {category_name}] Total pages: {total_pages} (Scraping up to {pages_to_scrape})")
    
    for p_num in range(1, pages_to_scrape + 1):
        html = page.content()
        articles = parse_articles_from_html(html, system_name, category_name)
        
        new_rows = []
        for art in articles:
            aid = art["article_id"]
            if aid and aid not in seen_ids:
                seen_ids.add(aid)
                if enrich_details and art["detail_url"]:
                    extra = fetch_detail_enrichment(art["detail_url"])
                    art.update(extra)
                new_rows.append(art)
        
        append_rows(csv_path, new_rows)
        total_added += len(new_rows)
        
        if p_num % 10 == 0 or p_num == pages_to_scrape or len(new_rows) > 0:
            print(f"      Page {p_num}/{pages_to_scrape}: {len(articles)} on page, {len(new_rows)} new (Total new: {total_added}, Total unique: {len(seen_ids)})")
        
        if p_num < pages_to_scrape:
            success = advance_to_next_page(page)
            if not success:
                print(f"      [!] Failed to navigate to page {p_num + 1}. Halting category.")
                break
                
    return total_added


def run_scraper(
    target_system: Optional[str] = None,
    output_csv: str = DEFAULT_OUTPUT_CSV,
    max_pages: int = 0,
    enrich_details: bool = False,
    headless: bool = True
):
    ensure_csv_header(output_csv)
    seen_ids = load_seen_ids(output_csv)
    print(f"=== AYUSH Research Portal Scraper ===")
    print(f"Output file: {output_csv} (Already saved: {len(seen_ids)} articles)")
    if target_system:
        print(f"Target system: {target_system}")
    else:
        print("Target systems: ALL (Sowa Rigpa, Yoga, Homoeopathy, Unani, Siddha, Ayurveda)")
    if enrich_details:
        print("Detail enrichment: ENABLED (Inline abstracts & keywords)")
    print("---------------------------------------")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            ignore_https_errors=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        systems_to_process = [
            s for s in MEDICAL_SYSTEM_CONFIG 
            if not target_system or s["name"].lower() == target_system.lower()
        ]

        for sys_cfg in systems_to_process:
            sys_name = sys_cfg["name"]
            sys_radio = sys_cfg["radio_id"]
            print(f"\n========================================================")
            print(f">>> Processing Medical System: {sys_name} <<<")
            print(f"========================================================")

            # 1. Clinical Research (with 3 sub-grades)
            grade_radios = [
                ("EVIDENCE GRADE - A", "ctl00_ContentPlaceHolder1_optnClinicalStudy_0"),
                ("EVIDENCE GRADE - B", "ctl00_ContentPlaceHolder1_optnClinicalStudy_1"),
                ("EVIDENCE GRADE - C", "ctl00_ContentPlaceHolder1_optnClinicalStudy_2"),
            ]
            
            for grade_label, grade_id in grade_radios:
                for nav_attempt in range(1, 6):
                    try:
                        print(f"  -> Opening Clinical Research ({grade_label})...")
                        wait_for_internet()
                        safe_goto(page, BASE_URL)
                        page.locator(f"#{sys_radio}").click()
                        page.wait_for_load_state("networkidle")
                        time.sleep(1)

                        with page.expect_navigation(timeout=35000):
                            page.locator("#ctl00_ContentPlaceHolder1_ImageButton1").click()
                        page.wait_for_load_state("networkidle")
                        time.sleep(1)

                        if page.locator(f"#{grade_id}").count() > 0:
                            with page.expect_navigation(timeout=35000):
                                page.locator(f"#{grade_id}").click()
                            page.wait_for_load_state("networkidle")
                            time.sleep(DELAY_SECONDS)

                            scrape_category_pages(
                                page, sys_name, f"CLINICAL RESEARCH ({grade_label})",
                                seen_ids, output_csv, max_pages, enrich_details
                            )
                        break  # success
                    except Exception as e:
                        if "ERR_INTERNET_DISCONNECTED" in str(e) or "ERR_NETWORK_CHANGED" in str(e):
                            print(f"    [!] Network error during Clinical ({grade_label}), waiting to retry...")
                            wait_for_internet()
                        else:
                            print(f"    [!] Error during Clinical ({grade_label}) attempt {nav_attempt}: {e}")
                            if nav_attempt >= 5:
                                break
                            time.sleep(3)

            # 2. Other Categories: Pre-Clinical, Drug Research, Fundamental Research
            other_categories = [
                ("PRE-CLINICAL RESEARCH", "ctl00_ContentPlaceHolder1_ImageButton2"),
                ("DRUG RESEARCH", "ctl00_ContentPlaceHolder1_ImageButton3"),
                ("FUNDAMENTAL RESEARCH", "ctl00_ContentPlaceHolder1_ImageButton4"),
            ]

            for cat_name, btn_id in other_categories:
                print(f"  -> Category: {cat_name}...")
                for nav_attempt in range(1, 6):
                    try:
                        wait_for_internet()
                        safe_goto(page, BASE_URL)
                        page.locator(f"#{sys_radio}").click()
                        page.wait_for_load_state("networkidle")
                        time.sleep(1)

                        with page.expect_navigation(timeout=35000):
                            page.locator(f"#{btn_id}").click()
                        page.wait_for_load_state("networkidle")
                        time.sleep(DELAY_SECONDS)

                        scrape_category_pages(
                            page, sys_name, cat_name,
                            seen_ids, output_csv, max_pages, enrich_details
                        )
                        break  # success
                    except Exception as e:
                        if "ERR_INTERNET_DISCONNECTED" in str(e) or "ERR_NETWORK_CHANGED" in str(e):
                            print(f"    [!] Network error in {cat_name}, waiting to retry...")
                            wait_for_internet()
                        else:
                            print(f"    [!] Error accessing {cat_name} attempt {nav_attempt}: {e}")
                            if nav_attempt >= 5:
                                break
                            time.sleep(3)

        browser.close()

    print(f"\n========================================================")
    print(f"Scraping complete! Total unique articles in CSV: {len(seen_ids)}")
    print(f"Output saved to: {output_csv}")


def run_enrichment_pool(csv_path: str = DEFAULT_OUTPUT_CSV, max_workers: int = 6):
    """Enriches all articles in the CSV missing abstract/keywords using concurrent HTTP workers."""
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} does not exist.")
        return

    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        rows = list(reader)

    to_enrich = [i for i, r in enumerate(rows) if not r.get("abstract") and r.get("detail_url")]
    print(f"=== Detail Enrichment Pool ===")
    print(f"Total articles in CSV: {len(rows)}")
    print(f"Articles needing enrichment: {len(to_enrich)}")
    print(f"Workers: {max_workers}")
    print("---------------------------------------")

    if not to_enrich:
        print("All articles are already enriched!")
        return

    session = requests.Session()
    completed = 0

    def task(idx):
        url = rows[idx].get("detail_url", "")
        extra = fetch_detail_enrichment(url, session)
        return idx, extra

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(task, idx): idx for idx in to_enrich}
        for fut in as_completed(futures):
            idx, extra = fut.result()
            rows[idx].update(extra)
            completed += 1
            if completed % 25 == 0 or completed == len(to_enrich):
                print(f"Enriched {completed}/{len(to_enrich)} articles ({(completed/len(to_enrich))*100:.1f}%)")
                # Periodically flush updates to CSV
                with open(csv_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
                    writer.writeheader()
                    writer.writerows(rows)

    # Final write
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELD_NAMES)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nEnrichment complete! All {len(to_enrich)} articles updated in {csv_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AYUSH Research Portal Scraper & Enricher")
    parser.add_argument("--system", type=str, help="Specific Medical System to scrape (e.g. 'Yoga and Naturopathy')")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT_CSV, help="CSV output filename")
    parser.add_argument("--max-pages", type=int, default=0, help="Max pages per category (0 = all pages)")
    parser.add_argument("--enrich-details", action="store_true", help="Fetch abstracts inline during scraping")
    parser.add_argument("--enrich-only", action="store_true", help="Run multi-threaded enrichment on existing CSV")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent workers for --enrich-only")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="Run browser in visible mode")
    
    args = parser.parse_args()
    if args.enrich_only:
        run_enrichment_pool(csv_path=args.output, max_workers=args.workers)
    else:
        run_scraper(
            target_system=args.system,
            output_csv=args.output,
            max_pages=args.max_pages,
            enrich_details=args.enrich_details,
            headless=args.headless
        )
