import asyncio
import copy
import json
import random
from datetime import datetime, timezone
from app.database import async_session
from app.models import ComparisonRun
from app.enums import RunStatus, RunStage, STAGE_PROGRESS


def compute_match_percentage(left: dict, right: dict) -> float:
    """Simple recursive match percentage computation."""
    matches = 0
    total = 0

    def walk(l: object, r: object) -> None:
        nonlocal matches, total
        if isinstance(l, dict) and isinstance(r, dict):
            all_keys = set(list(l.keys()) + list(r.keys()))
            for k in all_keys:
                if k in l and k in r:
                    walk(l[k], r[k])
                else:
                    total += 1
        elif isinstance(l, list) and isinstance(r, list):
            for i in range(max(len(l), len(r))):
                if i < len(l) and i < len(r):
                    walk(l[i], r[i])
                else:
                    total += 1
        else:
            total += 1
            if l == r:
                matches += 1

    walk(left, right)
    return round((matches / total) * 100, 1) if total > 0 else 100.0


# ── Simulated LLM extraction variations ──
# These mimic the kinds of differences a real LLM extraction from a PDF would
# produce compared to the ground truth: format variations, slight value diffs,
# missing fields, extra hallucinated fields, etc.

def _simulate_llm_extraction(ground_truth: dict) -> dict:
    """
    Take the ground truth JSON and introduce realistic LLM-like variations.
    Returns a modified copy that simulates what a PDF extraction would produce.
    """
    result = copy.deepcopy(ground_truth)

    # 1. Agreement section variations
    if "agreement" in result:
        agr = result["agreement"]
        # LLM might extract date off by 1 day
        if "expirationDate" in agr:
            date_str = agr["expirationDate"]
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                dt = dt.replace(day=max(1, dt.day - 1))
                agr["expirationDate"] = dt.strftime("%Y-%m-%d")
            except ValueError:
                pass

    # 2. Party variations
    if "parties" in result:
        parties = result["parties"]

        # Bank variations
        if "bank" in parties:
            bank = parties["bank"]
            # Jurisdiction format: "State of X" vs "X"
            if "jurisdiction" in bank:
                j = bank["jurisdiction"]
                if j.startswith("State of "):
                    bank["jurisdiction"] = j.replace("State of ", "")
                elif j.startswith("Commonwealth of "):
                    bank["jurisdiction"] = j.replace("Commonwealth of ", "")

            # Address: "United States" vs "US"
            if "address" in bank and isinstance(bank["address"], dict):
                addr = bank["address"]
                if addr.get("country") == "US":
                    addr["country"] = "United States"
                elif addr.get("country") == "United States":
                    addr["country"] = "US"

            # Signatory: may miss middle initial
            if "signatoryName" in bank:
                name = bank["signatoryName"]
                parts = name.split()
                if len(parts) == 3 and len(parts[1]) == 2 and parts[1].endswith("."):
                    bank["signatoryName"] = f"{parts[0]} {parts[2]}"

        # Third party variations
        if "thirdParty" in parties:
            tp = parties["thirdParty"]
            # Name: trailing period inconsistency
            if "name" in tp:
                if tp["name"].endswith("."):
                    tp["name"] = tp["name"][:-1]
                elif tp["name"].endswith(" Inc") or tp["name"].endswith(" Corp"):
                    tp["name"] = tp["name"] + "."

            # Address variations
            if "address" in tp and isinstance(tp["address"], dict):
                addr = tp["address"]
                # Remove suite numbers
                if "street" in addr and ", Suite" in addr["street"]:
                    addr["street"] = addr["street"].split(", Suite")[0]
                elif "street" in addr and "Suite " in addr["street"]:
                    addr["street"] = addr["street"].split(", Suite")[0]
                # Country format
                if addr.get("country") == "US":
                    addr["country"] = "United States"
                elif addr.get("country") == "United States":
                    addr["country"] = "US"

            # Title: minor wording difference
            if "signatoryTitle" in tp:
                title = tp["signatoryTitle"]
                if " of " in title:
                    tp["signatoryTitle"] = title.replace(" of ", " ")

            # LLM might not extract email
            tp.pop("contactEmail", None)

    # 3. Financial terms variations
    if "financialTerms" in result:
        ft = result["financialTerms"]

        # Early termination fee: different interpretation
        if "penalties" in ft and isinstance(ft["penalties"], dict):
            pen = ft["penalties"]
            if "earlyTerminationFee" in pen:
                # LLM reads a different value from PDF
                pen["earlyTerminationFee"] = int(pen["earlyTerminationFee"] * random.choice([0.8, 1.25, 1.5]))

        # Volume tiers: slight rate difference in middle tier
        for tier_key in ("volumeTiers", "userTiers"):
            if tier_key in ft and isinstance(ft[tier_key], list) and len(ft[tier_key]) > 1:
                # Slightly different rate in tier 2
                tier = ft[tier_key][1]
                for rate_key in ("ratePerTransaction", "costPerMillion", "costPerUser"):
                    if rate_key in tier:
                        original = tier[rate_key]
                        tier[rate_key] = round(original * random.choice([0.9, 1.1, 1.15]), 4)

        # LLM might miss discount/extra structures
        for optional_key in ("discount", "reservedInstanceDiscount"):
            if optional_key in ft and random.random() < 0.5:
                del ft[optional_key]

    # 4. Service level variations
    if "serviceLevel" in result:
        sl = result["serviceLevel"]

        # Uptime: slightly different reading
        if "uptime" in sl:
            original = sl["uptime"]
            if original == 99.99:
                sl["uptime"] = 99.95
            elif original == 99.95:
                sl["uptime"] = 99.9
            elif original == 99.999:
                sl["uptime"] = 99.99
            elif original == 99.995:
                sl["uptime"] = 99.99

        # Response time: format variations
        for rt_key in ("responseTime", "incidentResponseTime"):
            if rt_key in sl and isinstance(sl[rt_key], dict):
                rt = sl[rt_key]
                if "low" in rt:
                    if rt["low"] == "24 hours":
                        rt["low"] = "1 business day"
                    elif rt["low"] == "1 business day":
                        rt["low"] = "24 hours"

        # DR: might add extra field or miss one
        if "disasterRecovery" in sl and isinstance(sl["disasterRecovery"], dict):
            dr = sl["disasterRecovery"]
            if "testingFrequency" not in dr:
                dr["testingFrequency"] = "Quarterly"
            if "regions" in dr and random.random() < 0.5:
                del dr["regions"]

    # 5. Compliance variations
    if "compliance" in result:
        comp = result["compliance"]

        # Regulatory frameworks: might miss one
        if "regulatoryFrameworks" in comp and isinstance(comp["regulatoryFrameworks"], list):
            frameworks = comp["regulatoryFrameworks"]
            if len(frameworks) > 2:
                comp["regulatoryFrameworks"] = frameworks[:-1]  # drop last one

        # Data classification: different wording
        if "dataClassification" in comp:
            dc = comp["dataClassification"]
            if dc == "Confidential":
                comp["dataClassification"] = "Highly Confidential"
            elif dc == "Highly Confidential":
                comp["dataClassification"] = "Confidential"
            elif dc == "Restricted":
                comp["dataClassification"] = "Highly Restricted"

        # LLM might not find lastAuditDate
        comp.pop("lastAuditDate", None)

        # LLM might miss specialized compliance fields
        for optional in ("dataResidency", "pciComplianceLevel", "clearanceLevel",
                         "fairLendingCompliance", "fiduciaryCompliance",
                         "networkCertifications", "sanctionsListsCovered", "keyManagement"):
            if optional in comp and random.random() < 0.4:
                del comp[optional]

    # 6. ISDA-specific variations
    if "eventsOfDefault" in result:
        eod = result["eventsOfDefault"]
        # Grace period wording variations
        if "failureToPayOrDeliver" in eod and isinstance(eod["failureToPayOrDeliver"], dict):
            fp = eod["failureToPayOrDeliver"]
            if fp.get("gracePeriod") == "3 Local Business Days":
                fp["gracePeriod"] = "3 business days"
        if "breachOfAgreement" in eod and isinstance(eod["breachOfAgreement"], dict):
            ba = eod["breachOfAgreement"]
            if ba.get("gracePeriod") == "30 days":
                ba["gracePeriod"] = "thirty (30) days"
        # Bankruptcy: LLM might miss a trigger or rephrase
        if "bankruptcy" in eod and isinstance(eod["bankruptcy"], dict):
            bk = eod["bankruptcy"]
            if "triggers" in bk and isinstance(bk["triggers"], list) and len(bk["triggers"]) > 3:
                bk["triggers"] = bk["triggers"][:-1]  # miss last trigger
            if bk.get("dismissalPeriod") == "15 days (for proceedings instituted against)":
                bk["dismissalPeriod"] = "15 days"

    if "terminationEvents" in result:
        te = result["terminationEvents"]
        # LLM may omit additional termination events
        te.pop("additionalTerminationEvents", None)
        # Rephrase tax event
        if "taxEvent" in te and isinstance(te["taxEvent"], dict):
            if "substantialLikelihood" in te["taxEvent"]:
                te["taxEvent"]["substantialLikelihood"] = "Yes"  # type mismatch: bool vs string

    if "earlyTermination" in result:
        et = result["earlyTermination"]
        # Notice period wording
        if "rightToTerminateOnDefault" in et and isinstance(et["rightToTerminateOnDefault"], dict):
            rt = et["rightToTerminateOnDefault"]
            if rt.get("noticePeriod") == "Not more than 20 days":
                rt["noticePeriod"] = "Up to 20 days"
        # LLM may miss settlement combinations detail
        et.pop("settlementCombinations", None)
        # LLM might add an extra field
        et["terminationCurrency"] = "As specified in Schedule"

    if "representations" in result:
        rep = result["representations"]
        # LLM may extract fewer representations
        if "basicRepresentations" in rep and isinstance(rep["basicRepresentations"], list):
            if len(rep["basicRepresentations"]) > 3:
                rep["basicRepresentations"] = rep["basicRepresentations"][:4]  # miss last one
        # Wording difference
        if rep.get("absenceOfLitigation") == "No pending or threatened litigation likely to affect legality":
            rep["absenceOfLitigation"] = "No pending or threatened litigation affecting legality or enforceability"

    if "taxProvisions" in result:
        tp = result["taxProvisions"]
        # LLM may simplify definitions
        if "indemnifiableTax" in tp:
            tp["indemnifiableTax"] = "Any Tax other than a Tax arising from a present or former connection between the jurisdiction and the recipient"

    if "notices" in result:
        notices = result["notices"]
        # LLM might extract fewer notice methods
        if "methods" in notices and isinstance(notices["methods"], list) and len(notices["methods"]) > 3:
            notices["methods"] = notices["methods"][:4]  # miss electronic messaging

    if "definitions" in result:
        defn = result["definitions"]
        # LLM may miss some definitions or rephrase
        defn.pop("scheduledPaymentDate", None)
        defn.pop("terminationCurrency", None)
        if "defaultRate" in defn:
            defn["defaultRate"] = "Cost of funding + 1% per annum"
        if "loss" in defn:
            defn["loss"] = "Total losses and costs determined in good faith"  # dropped "reasonably"

    if "transferAndAssignment" in result:
        ta = result["transferAndAssignment"]
        # LLM might extract only one exception
        if "exceptions" in ta and isinstance(ta["exceptions"], list) and len(ta["exceptions"]) > 1:
            ta["exceptions"] = [ta["exceptions"][0]]

    return result


PROCESSING_STAGES = [
    (RunStage.UPLOADING, 1.0, 1.5),
    (RunStage.PDF_PARSING, 1.5, 2.5),
    (RunStage.METADATA_MAPPING, 1.0, 2.0),
    (RunStage.LLM_EXTRACTION, 2.0, 3.5),
    (RunStage.RESPONSE_VALIDATION, 1.0, 1.5),
    (RunStage.DIFF_COMPUTATION, 1.0, 2.0),
    (RunStage.REPORT_GENERATION, 0.5, 1.5),
]


async def run_comparison(run_id: int) -> None:
    """Background task that processes a comparison run through staged delays."""
    async with async_session() as db:
        run = await db.get(ComparisonRun, run_id)
        if not run:
            return

        try:
            run.status = RunStatus.PROCESSING.value
            run.started_at = datetime.now(timezone.utc)
            await db.commit()

            for stage, min_delay, max_delay in PROCESSING_STAGES:
                run.current_stage = stage.value
                run.progress_percentage = STAGE_PROGRESS[stage]
                await db.commit()
                await asyncio.sleep(min_delay + random.random() * (max_delay - min_delay))

            # "Extract" data from PDF — simulate LLM extraction based on ground truth
            system_two_data = json.loads(run.system_two_data) if run.system_two_data else {}

            # Use static ISDA mock if this is an ISDA agreement
            if system_two_data.get("agreement", {}).get("type") == "ISDA Master Agreement":
                from seed.isda_test_data import ISDA_LLM_OUTPUT
                system_one_result = copy.deepcopy(ISDA_LLM_OUTPUT)
            else:
                system_one_result = _simulate_llm_extraction(system_two_data)

            match_pct = compute_match_percentage(system_one_result, system_two_data)

            run.system_one_result = json.dumps(system_one_result)
            run.match_percentage = match_pct
            run.status = RunStatus.COMPLETED.value
            run.current_stage = RunStage.COMPLETED.value
            run.progress_percentage = 100
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            run.status = RunStatus.FAILED.value
            run.error_message = str(e)
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()
