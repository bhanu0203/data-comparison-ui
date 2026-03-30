"""
Seed script: uploads all 10 agreements + submits comparison runs via the API.

Usage:
    1. Start the backend:  uvicorn app.main:app --reload
    2. Run this script:    python -m seed.seed_all

Options:
    --agreements-only   Only upload agreements (skip comparisons)
    --base-url URL      Override API base URL (default: http://localhost:8000)
"""

import sys
import json
import time
import argparse
import urllib.request
import urllib.error

from seed.agreements import AGREEMENTS
from seed.metadata import AGREEMENT_METADATA, GENERAL_METADATA


def api(method: str, path: str, body: dict | None = None, base: str = "http://localhost:8000") -> dict | None:
    url = f"{base}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 204:
                return None
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body}")
        return None


def multipart_post(path: str, fields: dict, files: dict, base: str = "http://localhost:8000") -> dict | None:
    """Simple multipart/form-data POST without requests library."""
    boundary = "----SeedBoundary9876543210"
    body_parts = []

    for name, value in fields.items():
        body_parts.append(f"--{boundary}\r\n")
        body_parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n')
        body_parts.append(f"{value}\r\n")

    for name, (filename, content, content_type) in files.items():
        body_parts.append(f"--{boundary}\r\n")
        body_parts.append(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n')
        body_parts.append(f"Content-Type: {content_type}\r\n\r\n")
        body_parts.append(content)
        body_parts.append("\r\n")

    body_parts.append(f"--{boundary}--\r\n")

    # Encode everything to bytes
    body_bytes = b""
    for part in body_parts:
        if isinstance(part, str):
            body_bytes += part.encode()
        else:
            body_bytes += part

    url = f"{base}{path}"
    req = urllib.request.Request(url, data=body_bytes, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  ERROR {e.code}: {error_body}")
        return None


def make_dummy_pdf(agreement_id: str, name: str) -> bytes:
    """Generate a minimal valid PDF with agreement text."""
    text_lines = [
        f"AGREEMENT: {name}",
        f"ID: {agreement_id}",
        "This is a sample PDF for testing extraction.",
    ]
    stream = "BT\n/F1 12 Tf\n"
    y = 740
    for line in text_lines:
        stream += f"50 {y} Td\n({line}) Tj\n0 -20 Td\n"
        y -= 20
    stream += "ET"

    pdf = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length {len(stream)}>>
stream
{stream}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
{str(317 + len(stream)).zfill(10)} 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
{370 + len(stream)}
%%EOF"""
    return pdf.encode()


def seed_agreements(base_url: str) -> dict[str, int]:
    """Upload all 10 agreements, return mapping of agreement_id -> DB id."""
    print("\n=== Uploading Agreements ===\n")
    id_map = {}

    for agr in AGREEMENTS:
        print(f"  Uploading: {agr['agreement_id']} — {agr['name']}...", end=" ")
        result = api("POST", "/api/agreements", {
            "agreement_id": agr["agreement_id"],
            "name": agr["name"],
            "json_data": agr["json_data"],
        }, base=base_url)

        if result:
            id_map[agr["agreement_id"]] = result["id"]
            print(f"OK (id={result['id']}, {result['field_count']} fields)")
        else:
            print("FAILED")

    print(f"\n  Uploaded {len(id_map)}/{len(AGREEMENTS)} agreements.")
    return id_map


def seed_comparisons(base_url: str, id_map: dict[str, int]) -> list[int]:
    """Submit comparison runs for all uploaded agreements."""
    print("\n=== Submitting Comparison Runs ===\n")
    run_ids = []

    for agr in AGREEMENTS:
        agr_id = agr["agreement_id"]
        db_id = id_map.get(agr_id)
        if not db_id:
            print(f"  Skipping {agr_id} (not uploaded)")
            continue

        # Pick the agreement-specific metadata, fall back to general
        metadata = AGREEMENT_METADATA.get(agr_id, GENERAL_METADATA)
        pdf_bytes = make_dummy_pdf(agr_id, agr["name"])

        print(f"  Submitting: {agr_id} — {agr['name']}...", end=" ")
        result = multipart_post(
            "/api/comparisons",
            fields={
                "agreement_id": str(db_id),
                "run_name": f"Seed test — {agr['name']}",
                "metadata_construct": json.dumps(metadata),
            },
            files={
                "pdf": (f"{agr_id}.pdf", pdf_bytes, "application/pdf"),
            },
            base=base_url,
        )

        if result:
            run_ids.append(result["id"])
            print(f"OK (run_id={result['id']})")
        else:
            print("FAILED")

    print(f"\n  Submitted {len(run_ids)}/{len(AGREEMENTS)} comparison runs.")
    return run_ids


def wait_for_completion(base_url: str, run_ids: list[int], timeout: int = 120):
    """Poll until all runs complete or timeout."""
    if not run_ids:
        return
    print(f"\n=== Waiting for {len(run_ids)} runs to complete (timeout {timeout}s) ===\n")
    start = time.time()
    pending = set(run_ids)

    while pending and (time.time() - start) < timeout:
        for rid in list(pending):
            result = api("GET", f"/api/comparisons/{rid}/progress", base=base_url)
            if result:
                status = result["status"]
                stage = result["current_stage"]
                pct = result["progress_percentage"]
                match = result.get("match_percentage")
                if status == "completed":
                    print(f"  Run #{rid}: COMPLETED (match={match}%)")
                    pending.discard(rid)
                elif status == "failed":
                    print(f"  Run #{rid}: FAILED — {result.get('error_message', 'unknown')}")
                    pending.discard(rid)
                else:
                    print(f"  Run #{rid}: {stage} ({pct}%)")
        if pending:
            time.sleep(3)

    if pending:
        print(f"\n  WARNING: {len(pending)} runs did not complete within {timeout}s")
    else:
        print(f"\n  All runs completed in {time.time() - start:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="Seed DataDiff Pro with test data")
    parser.add_argument("--agreements-only", action="store_true", help="Only upload agreements")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--no-wait", action="store_true", help="Don't wait for run completion")
    args = parser.parse_args()

    # Health check
    print(f"Connecting to {args.base_url}...")
    health = api("GET", "/api/health", base=args.base_url)
    if not health:
        print("ERROR: Cannot reach backend. Is it running?")
        sys.exit(1)
    print(f"Backend is {health['status']}.")

    id_map = seed_agreements(args.base_url)

    if not args.agreements_only:
        run_ids = seed_comparisons(args.base_url, id_map)
        if not args.no_wait:
            wait_for_completion(args.base_url, run_ids)

    print("\n=== Done ===")
    print(f"  Agreements: {len(id_map)}")
    if not args.agreements_only:
        print(f"  Runs submitted: {len(run_ids)}")
    print(f"\n  Frontend: http://localhost:5173/agreements")


if __name__ == "__main__":
    main()
