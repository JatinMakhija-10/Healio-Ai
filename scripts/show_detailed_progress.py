# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  AROVIA.AI — 9 GB Knowledge Base Ingestion Terminal Dashboard               ║
║  Live file-by-file progress, category breakdown, subfolder stats & metrics   ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json, sys, os, time
from pathlib import Path

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT_DIR = Path(__file__).parent.parent
NEWFILES_DIR = ROOT_DIR / "NEWFiles"
MANIFEST_FILE = ROOT_DIR / "logs" / "newfiles_manifest.json"

try:
    from rich.console import Console
    from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn, TimeRemainingColumn
    from rich.table import Table
    from rich.panel import Panel
    from rich.columns import Columns
    from rich import box
    RICH = True
    console = Console()
except ImportError:
    RICH = False

def render_dashboard():
    if not MANIFEST_FILE.exists():
        print("❌ Manifest file not found at logs/newfiles_manifest.json")
        return

    # Scan disk for all PDFs
    all_pdfs = [p for p in NEWFILES_DIR.rglob("*.pdf") if "Google Drive_files" not in str(p)]
    total_disk_pdfs = len(all_pdfs)

    f24_all = [p for p in all_pdfs if "New folder (24)" in str(p)]
    f25_all = [p for p in all_pdfs if "New folder (25)" in str(p)]

    manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    stats = manifest.get("stats", {})
    files_manifest = manifest.get("files", {})

    completed_books = 0
    f24_done = f25_done = 0
    total_extracted_chunks = 0
    total_inserted_chunks = 0

    file_table_data = []

    for pdf_path in sorted(all_pdfs, key=lambda p: p.name):
        rel_key = str(pdf_path.relative_to(ROOT_DIR))
        info = files_manifest.get(rel_key, {})
        status = info.get("status", "PENDING")
        pages = info.get("pages", 0)
        extracted = info.get("chunks_extracted", 0)
        inserted = info.get("chunks_inserted", 0)
        category = info.get("category", "medical_reference")
        finished_at = info.get("finished_at", "—")

        if status in ("COMPLETED", "done") and (extracted > 0 or inserted > 0):
            completed_books += 1
            if "New folder (24)" in str(pdf_path): f24_done += 1
            if "New folder (25)" in str(pdf_path): f25_done += 1
            total_extracted_chunks += extracted
            total_inserted_chunks += inserted

        file_table_data.append({
            "name": pdf_path.name,
            "folder": "Folder 24" if "New folder (24)" in str(pdf_path) else "Folder 25",
            "category": category,
            "pages": pages,
            "extracted": extracted,
            "inserted": inserted,
            "status": status,
            "finished_at": finished_at,
            "size_mb": round(pdf_path.stat().st_size / 1024 / 1024, 1)
        })

    pct = (completed_books / total_disk_pdfs * 100) if total_disk_pdfs > 0 else 0
    f24_pct = (f24_done / len(f24_all) * 100) if f24_all else 0
    f25_pct = (f25_done / len(f25_all) * 100) if f25_all else 0

    bar_w = 35
    fill_w = int(bar_w * completed_books // total_disk_pdfs)
    overall_bar = "█" * fill_w + "░" * (bar_w - fill_w)

    f24_w = int(bar_w * f24_done // len(f24_all)) if f24_all else 0
    f24_bar = "█" * f24_w + "░" * (bar_w - f24_w)

    f25_w = int(bar_w * f25_done // len(f25_all)) if f25_all else 0
    f25_bar = "█" * f25_w + "░" * (bar_w - f25_w)

    if RICH:
        console.clear()
        console.print(Panel(
            f"[bold cyan]🧠 AROVIA.AI — 9 GB KNOWLEDGE BASE INGESTION DASHBOARD[/bold cyan]\n"
            f"[dim]Live Progress • 186 PDF Books • OCR Enabled • Dual Subfolder Tracking[/dim]",
            border_style="bright_cyan"
        ))

        # Metric Cards
        grid = Table.grid(expand=True)
        grid.add_column(justify="center")
        grid.add_column(justify="center")
        grid.add_column(justify="center")
        grid.add_column(justify="center")

        grid.add_row(
            Panel(f"[bold green]{pct:.1f}%[/bold green]\nOverall Completion", border_style="green"),
            Panel(f"[bold bright_cyan]{completed_books}/{total_disk_pdfs}[/bold bright_cyan]\nCompleted Books", border_style="cyan"),
            Panel(f"[bold yellow]{total_extracted_chunks:,}[/bold yellow]\nChunks Extracted", border_style="yellow"),
            Panel(f"[bold magenta]{total_inserted_chunks:,}[/bold magenta]\nChunks Ingested", border_style="magenta"),
        )
        console.print(grid)

        # Progress Bars Panel
        console.print(Panel(
            f"[bold white]Overall Ingestion :[/bold white] [{overall_bar}] [bold green]{pct:.1f}%[/bold green] ({completed_books}/{total_disk_pdfs} books)\n"
            f"[bold cyan]Folder 24 (89 PDFs) :[/bold cyan] [{f24_bar}] [cyan]{f24_pct:.1f}%[/cyan] ({f24_done}/{len(f24_all)} done)\n"
            f"[bold blue]Folder 25 (97 PDFs) :[/bold blue] [{f25_bar}] [blue]{f25_pct:.1f}%[/blue] ({f25_done}/{len(f25_all)} done)",
            title="📊 Subfolder & Global Progress Bars", border_style="bright_yellow"
        ))

        # Live File Table
        t = Table(title="📚 File-by-File Processing Status (186 Books)", box=box.ROUNDED, border_style="cyan", show_lines=True)
        t.add_column("#", style="dim", justify="right", width=4)
        t.add_column("Book Title", style="bold white", max_width=45)
        t.add_column("Folder", style="cyan", width=10)
        t.add_column("Category", style="yellow", max_width=22)
        t.add_column("Pages", justify="right", style="dim", width=6)
        t.add_column("Extracted", justify="right", style="yellow", width=9)
        t.add_column("Inserted", justify="right", style="green", width=9)
        t.add_column("Size", justify="right", style="dim", width=7)
        t.add_column("Status", justify="center", width=12)

        for idx, row in enumerate(file_table_data, 1):
            st = row["status"]
            if st in ("COMPLETED", "done") and (row["extracted"] > 0 or row["inserted"] > 0):
                st_fmt = "[bold green]✅ DONE[/bold green]"
            elif st == "IN_PROGRESS":
                st_fmt = "[bold yellow]⏳ BUSY[/bold yellow]"
            elif st == "FAILED" or st == "ERROR":
                st_fmt = "[bold red]❌ ERROR[/bold red]"
            else:
                st_fmt = "[dim]PENDING[/dim]"

            t.add_row(
                str(idx),
                row["name"][:43],
                row["folder"],
                row["category"].replace("_", " ").title()[:20],
                str(row["pages"]) if row["pages"] else "—",
                f"{row['extracted']:,}" if row["extracted"] else "—",
                f"{row['inserted']:,}" if row["inserted"] else "—",
                f"{row['size_mb']}MB",
                st_fmt
            )

        console.print(t)
    else:
        print("=" * 80)
        print(f" AROVIA.AI INGESTION DASHBOARD: [{overall_bar}] {pct:.1f}% ({completed_books}/{total_disk_pdfs})")
        print("=" * 80)
        print(f" Folder 24: [{f24_bar}] {f24_pct:.1f}% ({f24_done}/{len(f24_all)})")
        print(f" Folder 25: [{f25_bar}] {f25_pct:.1f}% ({f25_done}/{len(f25_all)})")
        print(f" Total Chunks Extracted: {total_extracted_chunks:,} | Ingested: {total_inserted_chunks:,}")
        print("-" * 80)
        for idx, row in enumerate(file_table_data[:30], 1):
            print(f" [{idx:03d}] {row['name'][:40]:<40} | {row['folder']} | {row['status']:<10} | {row['inserted']} chunks")

if __name__ == "__main__":
    render_dashboard()
