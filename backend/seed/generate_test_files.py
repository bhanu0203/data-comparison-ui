"""
Generate test PDF files and metadata JSON files for all 10 agreements.

Usage:
    cd backend
    python -m seed.generate_test_files

Output:
    seed/test-data/pdfs/        — 10 PDF files (one per agreement)
    seed/test-data/metadata/    — 10 metadata JSON files (one per agreement)
"""

import json
import re
from pathlib import Path
from seed.agreements import AGREEMENTS
from seed.metadata import AGREEMENT_METADATA, GENERAL_METADATA


OUT_DIR = Path(__file__).parent / "test-data"
PDF_DIR = OUT_DIR / "pdfs"
META_DIR = OUT_DIR / "metadata"
PDF_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)


def _pdf_escape(text: str) -> str:
    # Replace non-latin-1 characters with ASCII equivalents
    text = text.replace('\u2014', ' -- ').replace('\u2013', ' - ')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _humanize(key: str) -> str:
    s = re.sub(r'([a-z])([A-Z])', r'\1 \2', key)
    s = s.replace('_', ' ')
    return s.title()


def _build_text_lines(data: dict) -> list[tuple[str, str]]:
    """Extract all displayable lines from an agreement JSON."""
    lines: list[tuple[str, str]] = []

    # Title
    lines.append(("title", data["agreement"]["type"].upper()))
    lines.append(("blank", ""))

    # Agreement details
    lines.append(("heading", "AGREEMENT DETAILS"))
    lines.append(("field", f"Agreement ID: {data['agreement']['id']}"))
    lines.append(("field", f"Type: {data['agreement']['type']}"))
    lines.append(("field", f"Status: {data['agreement']['status']}"))
    lines.append(("field", f"Effective Date: {data['agreement']['effectiveDate']}"))
    lines.append(("field", f"Expiration Date: {data['agreement']['expirationDate']}"))
    lines.append(("field", f"Auto-Renewal: {'Yes' if data['agreement']['autoRenewal'] else 'No'}"))
    lines.append(("blank", ""))

    # Parties
    lines.append(("heading", "PARTIES"))
    bank = data["parties"]["bank"]
    lines.append(("subheading", "Bank / Financial Institution"))
    lines.append(("field", f"Name: {bank['name']}"))
    lines.append(("field", f"Registration Number: {bank['registrationNumber']}"))
    lines.append(("field", f"Jurisdiction: {bank['jurisdiction']}"))
    addr = bank["address"]
    lines.append(("field", f"Address: {addr['street']}, {addr['city']}, {addr['state']} {addr['zipCode']}, {addr['country']}"))
    lines.append(("field", f"Signatory: {bank['signatoryName']}, {bank['signatoryTitle']}"))
    lines.append(("blank", ""))

    tp = data["parties"]["thirdParty"]
    lines.append(("subheading", "Third Party / Vendor"))
    lines.append(("field", f"Name: {tp['name']}"))
    lines.append(("field", f"Registration Number: {tp['registrationNumber']}"))
    if "jurisdiction" in tp:
        lines.append(("field", f"Jurisdiction: {tp['jurisdiction']}"))
    tp_addr = tp["address"]
    lines.append(("field", f"Address: {tp_addr['street']}, {tp_addr['city']}, {tp_addr['state']} {tp_addr['zipCode']}, {tp_addr['country']}"))
    lines.append(("field", f"Signatory: {tp['signatoryName']}, {tp['signatoryTitle']}"))
    if "contactEmail" in tp:
        lines.append(("field", f"Contact Email: {tp['contactEmail']}"))
    lines.append(("blank", ""))

    # Financial Terms
    lines.append(("heading", "FINANCIAL TERMS"))
    ft = data["financialTerms"]
    lines.append(("field", f"Currency: {ft['currency']}"))
    for key in ("baseFee", "licenseFee", "platformFee", "monthlyCommit", "annualMaintenanceFee", "implementationFee"):
        if key in ft:
            lines.append(("field", f"{_humanize(key)}: ${ft[key]:,.2f}"))
    lines.append(("field", f"Billing Cycle: {ft['billingCycle']}"))
    lines.append(("field", f"Payment Terms: {ft['paymentTerms']}"))

    if "penalties" in ft:
        pen = ft["penalties"]
        lines.append(("subheading", "Penalties"))
        for k, v in pen.items():
            if isinstance(v, (int, float)):
                if "Rate" in k or "rate" in k or "Share" in k or "share" in k or "Threshold" in k:
                    lines.append(("field", f"{_humanize(k)}: {v}%"))
                else:
                    lines.append(("field", f"{_humanize(k)}: ${v:,.2f}"))
            else:
                lines.append(("field", f"{_humanize(k)}: {v}"))

    for section_key, section_label in [
        ("transactionFees", "Transaction Fees"),
        ("perCheckFees", "Per-Check Fees"),
        ("perCardFees", "Per-Card Fees"),
        ("computeCosts", "Compute Costs"),
        ("storageCosts", "Storage Costs"),
        ("additionalServices", "Additional Services"),
    ]:
        if section_key in ft:
            lines.append(("subheading", section_label))
            for k, v in ft[section_key].items():
                if isinstance(v, (int, float)):
                    lines.append(("field", f"{_humanize(k)}: ${v:,.2f}"))

    if "volumeTiers" in ft:
        lines.append(("subheading", "Volume Tiers"))
        for i, tier in enumerate(ft["volumeTiers"]):
            parts = [f"{_humanize(k)}: {v}" for k, v in tier.items()]
            lines.append(("field", f"Tier {i+1}: {', '.join(parts)}"))

    if "userTiers" in ft:
        lines.append(("subheading", "User Tiers"))
        for i, tier in enumerate(ft["userTiers"]):
            parts = [f"{_humanize(k)}: {v}" for k, v in tier.items()]
            lines.append(("field", f"Tier {i+1}: {', '.join(parts)}"))

    if "revenueShare" in ft:
        lines.append(("subheading", "Revenue Share"))
        for k, v in ft["revenueShare"].items():
            if isinstance(v, float) and v < 1:
                lines.append(("field", f"{_humanize(k)}: {v*100:.0f}%"))
            else:
                lines.append(("field", f"{_humanize(k)}: {v}"))

    if "aumBasedFees" in ft:
        lines.append(("subheading", "AUM-Based Fees"))
        for tier_name, tier_data in ft["aumBasedFees"].items():
            max_aum = tier_data.get("maxAUM")
            max_str = f"${max_aum:,.0f}" if max_aum else "Unlimited"
            lines.append(("field", f"{tier_name}: ${tier_data['minAUM']:,.0f} - {max_str} at {tier_data['basisPoints']} bps"))

    for extra in ("monthlyMinimum", "annualMinimumCommitment", "loanVolumeMinimum"):
        if extra in ft:
            lines.append(("field", f"{_humanize(extra)}: ${ft[extra]:,.2f}"))

    if "discount" in ft:
        d = ft["discount"]
        lines.append(("field", f"Discount: {d.get('type', '')} — {d.get('percentage', '')}% above {d.get('threshold', '')}"))

    if "reservedInstanceDiscount" in ft:
        lines.append(("field", f"Reserved Instance Discount: {ft['reservedInstanceDiscount']*100:.0f}%"))

    lines.append(("blank", ""))

    # Service Level
    lines.append(("heading", "SERVICE LEVEL"))
    sl = data["serviceLevel"]
    if "uptime" in sl:
        lines.append(("field", f"Guaranteed Uptime: {sl['uptime']}%"))
    if "monitoringCoverage" in sl:
        lines.append(("field", f"Monitoring Coverage: {sl['monitoringCoverage']}"))

    for key in ("responseTime", "incidentResponseTime", "transactionProcessingTime", "verificationSpeed"):
        if key in sl:
            lines.append(("subheading", _humanize(key)))
            for k, v in sl[key].items():
                lines.append(("field", f"{k.capitalize()}: {v}"))

    skip = {"uptime", "responseTime", "incidentResponseTime", "transactionProcessingTime",
            "verificationSpeed", "disasterRecovery", "monitoringCoverage"}
    for key, v in sl.items():
        if key in skip:
            continue
        if isinstance(v, (str, int, float)):
            lines.append(("field", f"{_humanize(key)}: {v}"))
        elif isinstance(v, bool):
            lines.append(("field", f"{_humanize(key)}: {'Yes' if v else 'No'}"))

    if "disasterRecovery" in sl:
        lines.append(("subheading", "Disaster Recovery"))
        for k, v in sl["disasterRecovery"].items():
            if isinstance(v, list):
                lines.append(("field", f"{_humanize(k)}: {', '.join(v)}"))
            elif isinstance(v, bool):
                lines.append(("field", f"{_humanize(k)}: {'Yes' if v else 'No'}"))
            else:
                lines.append(("field", f"{_humanize(k)}: {v}"))
    lines.append(("blank", ""))

    # Compliance
    lines.append(("heading", "COMPLIANCE"))
    comp = data["compliance"]
    if "regulatoryFrameworks" in comp:
        lines.append(("field", f"Regulatory Frameworks: {', '.join(comp['regulatoryFrameworks'])}"))
    for k, v in comp.items():
        if k == "regulatoryFrameworks":
            continue
        if isinstance(v, list):
            lines.append(("field", f"{_humanize(k)}: {', '.join(str(x) for x in v)}"))
        elif isinstance(v, bool):
            lines.append(("field", f"{_humanize(k)}: {'Yes' if v else 'No'}"))
        else:
            lines.append(("field", f"{_humanize(k)}: {v}"))

    return lines


def _render_page_stream(text_lines: list[tuple[str, str]], start_idx: int) -> tuple[bytes, int]:
    """Render as many text_lines as fit on one page. Returns (stream_bytes, next_index)."""
    parts = ["BT\n"]
    y = 750
    i = start_idx
    while i < len(text_lines):
        line_type, text = text_lines[i]
        # How much space does this line need?
        needed = {"title": 26, "heading": 22, "subheading": 18, "field": 15, "blank": 12}[line_type]
        if y - needed < 40:
            break  # page full

        if line_type == "blank":
            y -= 12
            i += 1
            continue

        escaped = _pdf_escape(text)
        if line_type == "title":
            parts.append(f"/F1 16 Tf\n1 0 0 1 50 {y} Tm\n({escaped}) Tj\n")
            y -= 26
        elif line_type == "heading":
            parts.append(f"/F1 13 Tf\n1 0 0 1 50 {y} Tm\n({escaped}) Tj\n")
            y -= 22
        elif line_type == "subheading":
            parts.append(f"/F1 11 Tf\n1 0 0 1 60 {y} Tm\n({escaped}) Tj\n")
            y -= 18
        elif line_type == "field":
            parts.append(f"/F1 10 Tf\n1 0 0 1 70 {y} Tm\n({escaped}) Tj\n")
            y -= 15
        i += 1

    parts.append("ET")
    stream = "".join(parts)
    return stream.encode("latin-1"), i


def make_pdf(agreement: dict) -> bytes:
    """Generate a valid multi-page PDF with proper xref byte offsets."""
    data = agreement["json_data"]
    text_lines = _build_text_lines(data)

    # Split text into pages
    page_streams: list[bytes] = []
    idx = 0
    while idx < len(text_lines):
        stream_bytes, idx = _render_page_stream(text_lines, idx)
        page_streams.append(stream_bytes)

    num_pages = len(page_streams)

    # Object numbering:
    #   1 = Catalog
    #   2 = Pages
    #   3 = Font
    #   then for each page i (0-based): obj (4 + 2*i) = Page, obj (5 + 2*i) = Content stream
    total_objects = 3 + 2 * num_pages  # catalog + pages + font + (page + stream) per page

    objects: list[bytes] = []
    offsets: list[int] = []

    header = b"%PDF-1.4\n"
    pos = len(header)

    # Obj 1: Catalog
    offsets.append(pos)
    obj = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    objects.append(obj)
    pos += len(obj)

    # Obj 2: Pages (kids list built dynamically)
    offsets.append(pos)
    kids = " ".join(f"{4 + 2*i} 0 R" for i in range(num_pages))
    obj = f"2 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {num_pages} >>\nendobj\n".encode()
    objects.append(obj)
    pos += len(obj)

    # Obj 3: Font
    offsets.append(pos)
    obj = b"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    objects.append(obj)
    pos += len(obj)

    # Per-page objects
    for i, stream_bytes in enumerate(page_streams):
        page_obj_num = 4 + 2 * i
        stream_obj_num = 5 + 2 * i

        # Page object
        offsets.append(pos)
        obj = (
            f"{page_obj_num} 0 obj\n"
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
            f"   /Contents {stream_obj_num} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\n"
            f"endobj\n"
        ).encode()
        objects.append(obj)
        pos += len(obj)

        # Content stream object
        offsets.append(pos)
        obj_header = f"{stream_obj_num} 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode()
        obj_footer = b"\nendstream\nendobj\n"
        obj = obj_header + stream_bytes + obj_footer
        objects.append(obj)
        pos += len(obj)

    # Xref table
    xref_pos = pos
    xref_lines = [b"xref\n", f"0 {total_objects + 1}\n".encode()]
    xref_lines.append(b"0000000000 65535 f \n")
    for off in offsets:
        xref_lines.append(f"{off:010d} 00000 n \n".encode())

    # Trailer
    trailer = f"trailer\n<< /Size {total_objects + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()

    # Assemble
    pdf = header
    for obj in objects:
        pdf += obj
    for line in xref_lines:
        pdf += line
    pdf += trailer

    return pdf


def main():
    print("Generating test files...\n")

    for agr in AGREEMENTS:
        agr_id = agr["agreement_id"]
        name = agr["name"]

        # Generate PDF
        pdf_bytes = make_pdf(agr)
        safe_name = agr_id.replace("-", "_")
        pdf_path = PDF_DIR / f"{safe_name}.pdf"
        pdf_path.write_bytes(pdf_bytes)
        print(f"  PDF:  {pdf_path.name:30s}  ({len(pdf_bytes):,} bytes)  - {name}")

        # Generate metadata JSON
        metadata = AGREEMENT_METADATA.get(agr_id, GENERAL_METADATA)
        meta_path = META_DIR / f"{safe_name}_metadata.json"
        meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"  META: {meta_path.name:30s}  ({len(metadata['fields'])} fields)")
        print()

    print(f"Done! Files saved to:\n")
    print(f"  PDFs:     {PDF_DIR.resolve()}")
    print(f"  Metadata: {META_DIR.resolve()}")
    print(f"\nTo use in the UI:")
    print(f"  1. Go to /compare")
    print(f"  2. Select an agreement")
    print(f"  3. Upload the matching PDF from the pdfs/ folder")
    print(f"  4. The metadata editor auto-loads defaults, or import from metadata/ folder")


if __name__ == "__main__":
    main()
