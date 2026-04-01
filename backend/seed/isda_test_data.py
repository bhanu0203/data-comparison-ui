"""
Test data for the 1992 ISDA Master Agreement (Multicurrency - Cross Border).

Provides:
  - ISDA_AGREEMENT: agreement record with ground truth JSON (System 2 / API data)
  - ISDA_METADATA: metadata construct defining extraction fields for the LLM
  - ISDA_LLM_OUTPUT: simulated LLM extraction result (System 1) with realistic differences
"""

# ═══════════════════════════════════════════════════════════════════════════════
# GROUND TRUTH — System 2 (API) data
# This is the authoritative, structured JSON that the direct API query returns.
# ═══════════════════════════════════════════════════════════════════════════════

ISDA_GROUND_TRUTH = {
    "agreement": {
        "id": "ISDA-1992-MC-001",
        "type": "ISDA Master Agreement",
        "subType": "Multicurrency - Cross Border",
        "version": "1992",
        "status": "Active",
        "effectiveDate": "1992-01-01",
        "governingBody": "International Swap Dealers Association, Inc.",
        "singleAgreementClause": True,
    },
    "parties": {
        "partyA": {
            "name": None,
            "role": "Party A",
            "processAgent": None,
            "address": None,
            "jurisdiction": None,
        },
        "partyB": {
            "name": None,
            "role": "Party B",
            "processAgent": None,
            "address": None,
            "jurisdiction": None,
        },
    },
    "obligations": {
        "paymentConditions": {
            "netPayments": True,
            "paymentCurrency": "Contractual Currency",
            "paymentMethod": "Freely transferable funds",
            "interestCompounding": "Daily",
        },
        "deliveryObligations": True,
        "defaultInterestRate": "Default Rate",
        "defaultInterestBasis": "Daily compounding, actual days elapsed",
    },
    "representations": {
        "basicRepresentations": [
            "Status - duly organised and validly existing",
            "Powers - all necessary power to execute and perform",
            "No Violation - does not violate or conflict with laws or agreements",
            "Consents - all governmental and other consents obtained",
            "Binding Obligations - legal, valid and binding obligations",
        ],
        "absenceOfCertainEvents": "No Event of Default or Potential Event of Default continuing",
        "absenceOfLitigation": "No pending or threatened litigation likely to affect legality",
        "accuracyOfSpecifiedInformation": True,
        "payerTaxRepresentations": True,
        "payeeTaxRepresentations": True,
    },
    "taxProvisions": {
        "grossUpRequired": True,
        "indemnifiableTax": "Any Tax other than Tax from present or former connection between jurisdiction and recipient",
        "stampTaxResponsibility": "Each party responsible for own Stamp Tax Jurisdiction",
        "withholdingTaxLiability": "Party must pay liability if fails to deduct or withhold",
    },
    "agreements": {
        "furnishSpecifiedInformation": True,
        "maintainAuthorisations": True,
        "complyWithLaws": True,
        "stampTaxIndemnity": True,
        "paymentOfStampTax": "Each party pays own Stamp Tax Jurisdiction taxes",
    },
    "eventsOfDefault": {
        "failureToPayOrDeliver": {
            "gracePeriod": "3 Local Business Days",
            "triggerCondition": "Failure to make payment or delivery when due",
        },
        "breachOfAgreement": {
            "gracePeriod": "30 days",
            "triggerCondition": "Failure to comply with any agreement or obligation",
        },
        "creditSupportDefault": {
            "description": "Failure to comply with Credit Support Document obligations",
            "includesExpiration": True,
        },
        "misrepresentation": {
            "description": "Representation proves to have been incorrect or misleading in material respect",
        },
        "defaultUnderSpecifiedTransaction": {
            "description": "Default under a Specified Transaction",
            "includesFailureToPayDeliver": True,
        },
        "crossDefault": {
            "thresholdAmount": "As specified in Schedule",
            "appliesTo": ["party", "Credit Support Provider", "Specified Entity"],
        },
        "bankruptcy": {
            "triggers": [
                "Dissolution (other than consolidation/merger)",
                "Insolvency or inability to pay debts",
                "General assignment for benefit of creditors",
                "Bankruptcy or insolvency proceeding instituted",
                "Appointment of receiver, administrator or similar",
                "Secured party takes possession of substantially all assets",
                "Analogous proceeding under any jurisdiction",
            ],
            "dismissalPeriod": "15 days (for proceedings instituted against)",
        },
        "mergerWithoutAssumption": "Successor fails to assume obligations",
    },
    "terminationEvents": {
        "illegality": {
            "description": "Becomes unlawful to perform due to change in law",
            "affectedParty": "Party for which performance is unlawful",
        },
        "taxEvent": {
            "description": "Party required to pay additional amount due to tax action or Change in Tax Law",
            "substantialLikelihood": True,
        },
        "taxEventUponMerger": {
            "description": "Tax Event arising from merger of party or Credit Support Provider",
            "burdenedParty": "As determined per Section 5(b)(iii)",
        },
        "creditEventUponMerger": {
            "description": "Material reduction in creditworthiness after merger",
            "specifiedInSchedule": True,
        },
        "additionalTerminationEvents": "As specified in Schedule",
    },
    "earlyTermination": {
        "rightToTerminateOnDefault": {
            "noticePeriod": "Not more than 20 days",
            "designationDay": "Not earlier than day notice is effective",
        },
        "automaticEarlyTermination": "As specified in Schedule",
        "paymentMethods": ["Market Quotation", "Loss"],
        "settlementMethods": ["First Method", "Second Method"],
        "settlementCombinations": {
            "firstMethodMarketQuotation": "Settlement Amount in favour of Non-defaulting Party",
            "firstMethodLoss": "Non-defaulting Party's Loss (positive only)",
            "secondMethodMarketQuotation": "Net Settlement Amount (either direction)",
            "secondMethodLoss": "Non-defaulting Party's Loss (either direction)",
        },
        "setOffRights": True,
    },
    "transferAndAssignment": {
        "consentRequired": True,
        "exceptions": [
            "Transfer pursuant to consolidation, amalgamation, or merger",
            "Transfer of amounts payable from Defaulting Party under Section 6(e)",
        ],
    },
    "contractualCurrency": {
        "paymentInContractualCurrency": True,
        "judgmentCurrencyIndemnity": True,
        "separateIndemnity": True,
    },
    "miscellaneous": {
        "entireAgreement": True,
        "amendmentRequirement": "In writing, executed by each party",
        "survivalOfObligations": True,
        "remediesCumulative": True,
        "counterparts": True,
        "noWaiverOfRights": True,
        "headingsDescriptiveOnly": True,
        "interestAndCompensation": True,
    },
    "governingLawAndJurisdiction": {
        "governingLaw": "As specified in Schedule",
        "jurisdictionOfCourts": "As specified in Schedule",
        "processAgent": "As specified in Schedule",
        "waiverOfImmunities": True,
    },
    "notices": {
        "methods": [
            "In writing, delivered in person or by courier",
            "Telex",
            "Facsimile transmission",
            "Certified or registered mail",
            "Electronic messaging system",
        ],
        "restrictions": "Section 5 or 6 notices may not be given by fax or electronic messaging",
        "changeOfAddress": "By notice to other party",
    },
    "definitions": {
        "additionalTerminationEvent": "As specified in Section 5(b)",
        "affectedParty": "As specified in Section 5(b)",
        "affiliate": "Entity controlled by, controlling, or under common control with a person",
        "automaticEarlyTermination": "As specified in Section 5(a)(vii)",
        "burdenedParty": "As specified in Section 5(b)",
        "changeInTaxLaw": "Enactment, promulgation or change in tax treaty, law, regulation or ruling",
        "consent": "Consent, approval, action, authorisation, exemption, notice, filing, registration or exchange control consent",
        "contractualCurrency": "As specified in Section 8",
        "crossDefault": "As specified in Section 5(a)(vi)",
        "defaultRate": "Cost of funding plus 1% per annum",
        "earlyTerminationDate": "As determined per Section 6(a) or 6(b)(iv)",
        "localBusinessDay": "Day when commercial banks are open for business",
        "loss": "Total losses and costs reasonably determined in good faith",
        "marketQuotation": "Weighted average of quotations from Reference Market-makers",
        "scheduledPaymentDate": "Date on which payment or delivery would have been required",
        "specifiedEntity": "As specified in Schedule",
        "specifiedIndebtedness": "Any obligation for borrowed money (default definition)",
        "specifiedTransaction": "Rate swap, currency swap, commodity swap, equity swap, etc.",
        "terminationCurrency": "As specified in Schedule or freely available and transferable",
        "thresholdAmount": "As specified in Schedule",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# LLM MOCK OUTPUT — System 1 (PDF extraction) result
# Simulates what an LLM would extract from the actual PDF.
# Contains realistic differences: wording variations, missed fields,
# rephrased values, type mismatches, extra hallucinated fields.
# ═══════════════════════════════════════════════════════════════════════════════

ISDA_LLM_OUTPUT = {
    "agreement": {
        "id": "ISDA-1992-MC-001",
        "type": "ISDA Master Agreement",
        "subType": "Multicurrency Cross Border",                       # MISMATCH: missing dash
        "version": "1992",
        "status": "Active",
        "effectiveDate": "1992-01-01",
        "governingBody": "International Swap Dealers Association Inc",  # MISMATCH: missing comma and period
        "singleAgreementClause": True,
        "documentTitle": "Master Agreement",                           # EXTRA: LLM hallucinated field
    },
    "parties": {
        "partyA": {
            "name": "To be specified in Schedule",                     # MISMATCH: LLM inferred placeholder vs null
            "role": "Party A",
            "processAgent": "To be specified in Schedule",             # MISMATCH: inferred vs null
            "address": "To be specified in Schedule",                  # TYPE_MISMATCH: string vs null
            "jurisdiction": "To be specified in Schedule",             # MISMATCH: inferred vs null
        },
        "partyB": {
            "name": "To be specified in Schedule",                     # MISMATCH: LLM inferred vs null
            "role": "Party B",
            "processAgent": "To be specified in Schedule",             # MISMATCH: inferred vs null
            "address": "To be specified in Schedule",                  # TYPE_MISMATCH: string vs null
            "jurisdiction": "To be specified in Schedule",             # MISMATCH: inferred vs null
        },
    },
    "obligations": {
        "paymentConditions": {
            "netPayments": True,
            "paymentCurrency": "Contractual Currency",
            "paymentMethod": "Freely transferable funds",
            "interestCompounding": "Daily",
            "valueDateBasis": "Same day value",                        # EXTRA: LLM extracted from Section 2(a)(ii)
        },
        "deliveryObligations": True,
        "defaultInterestRate": "Default Rate (cost of funding + 1%)",  # MISMATCH: LLM added parenthetical
        "defaultInterestBasis": "Daily compounding, actual days elapsed",
    },
    "representations": {
        "basicRepresentations": [
            "Status - duly organised and validly existing under applicable laws",  # MISMATCH: added "under applicable laws"
            "Powers - all necessary power to execute and perform",
            "No Violation - does not violate laws, constitutional documents or agreements",  # MISMATCH: added "constitutional documents"
            "Consents - all governmental and other consents obtained",
            "Binding Obligations - legal, valid and binding obligations enforceable in accordance with terms",  # MISMATCH: added "enforceable..."
        ],
        "absenceOfCertainEvents": "No Event of Default or Potential Event of Default continuing",
        "absenceOfLitigation": "No pending or threatened litigation affecting legality or enforceability",  # MISMATCH: different phrasing
        "accuracyOfSpecifiedInformation": True,
        "payerTaxRepresentations": True,
        # MISSING: payeeTaxRepresentations — LLM missed this field
    },
    "taxProvisions": {
        "grossUpRequired": True,
        "indemnifiableTax": "Any Tax other than a Tax arising from a present or former connection between the jurisdiction of the taxing authority and the recipient",  # MISMATCH: more verbose
        "stampTaxResponsibility": "Each party responsible for own Stamp Tax Jurisdiction",
        "withholdingTaxLiability": "Party must pay liability if fails to deduct or withhold",
        "taxCreditBenefit": "Prompt payment of benefit to other party",  # EXTRA: LLM extracted from Section 2(d)(i)
    },
    "agreements": {
        "furnishSpecifiedInformation": True,
        "maintainAuthorisations": True,
        "complyWithLaws": True,
        "stampTaxIndemnity": True,
        "paymentOfStampTax": "Each party pays own Stamp Tax Jurisdiction taxes",
    },
    "eventsOfDefault": {
        "failureToPayOrDeliver": {
            "gracePeriod": "3 business days",                          # MISMATCH: "business days" vs "Local Business Days"
            "triggerCondition": "Failure to make payment or delivery when due",
        },
        "breachOfAgreement": {
            "gracePeriod": "thirty (30) days",                         # MISMATCH: spelled out vs numeric
            "triggerCondition": "Failure to comply with any agreement or obligation (other than payment)",  # MISMATCH: added qualifier
        },
        "creditSupportDefault": {
            "description": "Failure to comply with Credit Support Document obligations",
            "includesExpiration": True,
        },
        "misrepresentation": {
            "description": "Representation proves incorrect or misleading in any material respect",  # MISMATCH: slight rewording
        },
        "defaultUnderSpecifiedTransaction": {
            "description": "Default under a Specified Transaction",
            "includesFailureToPayDeliver": True,
        },
        "crossDefault": {
            "thresholdAmount": "As specified in Schedule",
            "appliesTo": ["party", "Credit Support Provider", "Specified Entity"],
        },
        "bankruptcy": {
            "triggers": [
                "Dissolution (other than pursuant to consolidation, amalgamation or merger)",  # MISMATCH: more precise wording
                "Insolvency or inability to pay debts as they become due",                    # MISMATCH: added "as they become due"
                "General assignment, arrangement or composition for benefit of creditors",     # MISMATCH: added "arrangement or composition"
                "Bankruptcy or insolvency proceeding instituted or petition presented",        # MISMATCH: added "or petition presented"
                "Appointment of receiver, administrator, trustee or similar officer",          # MISMATCH: added "trustee"
                "Secured party takes possession of substantially all assets",
                # MISSING: "Analogous proceeding under any jurisdiction" — LLM missed last trigger
            ],
            "dismissalPeriod": "15 days",                              # MISMATCH: dropped parenthetical detail
        },
        "mergerWithoutAssumption": "Successor fails to assume obligations",
    },
    "terminationEvents": {
        "illegality": {
            "description": "Performance becomes unlawful due to adoption of or change in applicable law",  # MISMATCH: rephrased
            "affectedParty": "Party for which performance is unlawful",
        },
        "taxEvent": {
            "description": "Party will or likely will be required to pay additional amounts due to tax action or Change in Tax Law",  # MISMATCH: rephrased
            "substantialLikelihood": "Yes",                            # TYPE_MISMATCH: string vs boolean
        },
        "taxEventUponMerger": {
            "description": "Tax Event arising from merger of party or Credit Support Provider",
            "burdenedParty": "As determined per Section 5(b)(iii)",
        },
        "creditEventUponMerger": {
            "description": "Material deterioration in creditworthiness following merger",      # MISMATCH: "deterioration" vs "reduction"
            "specifiedInSchedule": True,
        },
        # MISSING: additionalTerminationEvents — LLM missed this field
    },
    "earlyTermination": {
        "rightToTerminateOnDefault": {
            "noticePeriod": "Up to 20 days",                           # MISMATCH: "Up to" vs "Not more than"
            "designationDay": "Not earlier than day notice is effective",
        },
        "automaticEarlyTermination": "As specified in Schedule",
        "paymentMethods": ["Market Quotation", "Loss"],
        "settlementMethods": ["First Method", "Second Method"],
        # MISSING: settlementCombinations — LLM missed this nested structure
        "setOffRights": True,
        "terminationCurrency": "As specified in Schedule",             # EXTRA: LLM pulled from definitions
    },
    "transferAndAssignment": {
        "consentRequired": True,
        "exceptions": [
            "Transfer pursuant to consolidation, amalgamation, or merger",
            # MISSING: second exception about Defaulting Party amounts
        ],
        "purportedTransferVoid": True,                                 # EXTRA: LLM extracted from Section 7
    },
    "contractualCurrency": {
        "paymentInContractualCurrency": True,
        "judgmentCurrencyIndemnity": True,
        "separateIndemnity": True,
    },
    "miscellaneous": {
        "entireAgreement": True,
        "amendmentRequirement": "In writing (including facsimile) and executed by each party",  # MISMATCH: added detail
        "survivalOfObligations": True,
        "remediesCumulative": True,
        "counterparts": True,
        "noWaiverOfRights": True,
        "headingsDescriptiveOnly": True,
        "interestAndCompensation": True,
        "expenseReimbursement": "Defaulting Party reimburses enforcement costs",  # EXTRA: from Section 11
    },
    "governingLawAndJurisdiction": {
        "governingLaw": "As specified in Schedule",
        "jurisdictionOfCourts": "As specified in Schedule",
        "processAgent": "As specified in Schedule",
        "waiverOfImmunities": True,
        "serviceOfProcess": "In manner provided for notices in Section 12",  # EXTRA: from Section 13(c)
    },
    "notices": {
        "methods": [
            "In writing, delivered in person or by courier",
            "Telex",
            "Facsimile transmission",
            "Certified or registered mail (airmail if overseas)",       # MISMATCH: added "(airmail if overseas)"
            # MISSING: "Electronic messaging system" — LLM missed 5th method
        ],
        "restrictions": "Notices under Section 5 or 6 cannot be given by facsimile or electronic messaging",  # MISMATCH: rephrased
        "changeOfAddress": "By notice to other party",
    },
    "definitions": {
        "additionalTerminationEvent": "As specified in Section 5(b)",
        "affectedParty": "As specified in Section 5(b)",
        "affiliate": "Entity controlled by, controlling, or under common control with a person",
        "automaticEarlyTermination": "As specified in Section 5(a)(vii)",
        "burdenedParty": "As specified in Section 5(b)",
        "changeInTaxLaw": "Enactment, promulgation or change in tax treaty, law, regulation or ruling",
        "consent": "Consent, approval, action, authorisation, exemption, notice, filing, registration or exchange control consent",
        "contractualCurrency": "As specified in Section 8",
        "crossDefault": "As specified in Section 5(a)(vi)",
        "defaultRate": "Cost of funding + 1% per annum",               # MISMATCH: "+" vs "plus"
        "earlyTerminationDate": "As determined per Section 6(a) or 6(b)(iv)",
        "localBusinessDay": "Day when commercial banks are open for business including dealings in foreign exchange",  # MISMATCH: added detail
        "loss": "Total losses and costs determined in good faith",      # MISMATCH: dropped "reasonably"
        "marketQuotation": "Weighted average of quotations from Reference Market-makers",
        # MISSING: scheduledPaymentDate — LLM missed this definition
        "specifiedEntity": "As specified in Schedule",
        "specifiedIndebtedness": "Any obligation for borrowed money",   # MISMATCH: dropped "(default definition)"
        "specifiedTransaction": "Rate swap, currency swap, commodity swap, equity swap, cap, floor, collar, forward rate agreement, interest rate option, FX transaction and similar transactions",  # MISMATCH: expanded list
        # MISSING: terminationCurrency — LLM missed this definition
        "thresholdAmount": "As specified in Schedule",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# AGREEMENT RECORD — used by seed script
# ═══════════════════════════════════════════════════════════════════════════════

ISDA_AGREEMENT = {
    "agreement_id": "ISDA-1992-MC-001",
    "name": "1992 ISDA Master Agreement (Multicurrency - Cross Border)",
    "json_data": ISDA_GROUND_TRUTH,
}


# ═══════════════════════════════════════════════════════════════════════════════
# METADATA CONSTRUCT — guides LLM field extraction from PDF
# 50 fields covering all major ISDA sections
# ═══════════════════════════════════════════════════════════════════════════════

ISDA_METADATA = {
    "name": "1992 ISDA Master Agreement Extraction Schema",
    "version": "1.0",
    "fields": [
        # Agreement identification
        {"fieldName": "Agreement ID", "jsonPath": "agreement.id", "description": "Unique identifier for the ISDA Master Agreement", "type": "string"},
        {"fieldName": "Agreement Type", "jsonPath": "agreement.type", "description": "Type of agreement (ISDA Master Agreement)", "type": "string"},
        {"fieldName": "Agreement Sub-Type", "jsonPath": "agreement.subType", "description": "Variant (e.g., Multicurrency - Cross Border, Single Currency)", "type": "string"},
        {"fieldName": "ISDA Version", "jsonPath": "agreement.version", "description": "Year version of the ISDA Master Agreement (1992 or 2002)", "type": "string"},
        {"fieldName": "Status", "jsonPath": "agreement.status", "description": "Current status of the agreement", "type": "string"},
        {"fieldName": "Effective Date", "jsonPath": "agreement.effectiveDate", "description": "Date the agreement becomes effective", "type": "date"},
        {"fieldName": "Governing Body", "jsonPath": "agreement.governingBody", "description": "Organization governing the agreement (ISDA)", "type": "string"},
        {"fieldName": "Single Agreement Clause", "jsonPath": "agreement.singleAgreementClause", "description": "Whether all Transactions form a single agreement", "type": "boolean"},

        # Parties
        {"fieldName": "Party A Name", "jsonPath": "parties.partyA.name", "description": "Legal name of Party A", "type": "string"},
        {"fieldName": "Party A Jurisdiction", "jsonPath": "parties.partyA.jurisdiction", "description": "Jurisdiction of Party A", "type": "string"},
        {"fieldName": "Party B Name", "jsonPath": "parties.partyB.name", "description": "Legal name of Party B", "type": "string"},
        {"fieldName": "Party B Jurisdiction", "jsonPath": "parties.partyB.jurisdiction", "description": "Jurisdiction of Party B", "type": "string"},

        # Payment obligations
        {"fieldName": "Net Payments", "jsonPath": "obligations.paymentConditions.netPayments", "description": "Whether netting of payments applies", "type": "boolean"},
        {"fieldName": "Payment Currency", "jsonPath": "obligations.paymentConditions.paymentCurrency", "description": "Currency for payments", "type": "string"},
        {"fieldName": "Payment Method", "jsonPath": "obligations.paymentConditions.paymentMethod", "description": "Method of payment (freely transferable funds)", "type": "string"},
        {"fieldName": "Default Interest Rate", "jsonPath": "obligations.defaultInterestRate", "description": "Interest rate on overdue amounts", "type": "string"},
        {"fieldName": "Default Interest Basis", "jsonPath": "obligations.defaultInterestBasis", "description": "Compounding basis for default interest", "type": "string"},

        # Representations
        {"fieldName": "Basic Representations", "jsonPath": "representations.basicRepresentations", "description": "List of standard representations made by each party", "type": "array"},
        {"fieldName": "Absence of Certain Events", "jsonPath": "representations.absenceOfCertainEvents", "description": "Representation that no Event of Default is continuing", "type": "string"},
        {"fieldName": "Absence of Litigation", "jsonPath": "representations.absenceOfLitigation", "description": "Representation regarding pending litigation", "type": "string"},

        # Tax provisions
        {"fieldName": "Gross-Up Required", "jsonPath": "taxProvisions.grossUpRequired", "description": "Whether gross-up for withholding tax is required", "type": "boolean"},
        {"fieldName": "Indemnifiable Tax Definition", "jsonPath": "taxProvisions.indemnifiableTax", "description": "Definition of Indemnifiable Tax", "type": "string"},
        {"fieldName": "Stamp Tax Responsibility", "jsonPath": "taxProvisions.stampTaxResponsibility", "description": "Allocation of stamp tax obligations", "type": "string"},

        # Events of Default
        {"fieldName": "Failure to Pay Grace Period", "jsonPath": "eventsOfDefault.failureToPayOrDeliver.gracePeriod", "description": "Grace period for failure to pay or deliver", "type": "string"},
        {"fieldName": "Breach of Agreement Grace Period", "jsonPath": "eventsOfDefault.breachOfAgreement.gracePeriod", "description": "Grace period for breach of agreement", "type": "string"},
        {"fieldName": "Cross Default Threshold", "jsonPath": "eventsOfDefault.crossDefault.thresholdAmount", "description": "Threshold Amount for cross-default trigger", "type": "string"},
        {"fieldName": "Bankruptcy Triggers", "jsonPath": "eventsOfDefault.bankruptcy.triggers", "description": "Events constituting bankruptcy Event of Default", "type": "array"},
        {"fieldName": "Bankruptcy Dismissal Period", "jsonPath": "eventsOfDefault.bankruptcy.dismissalPeriod", "description": "Period for dismissal of bankruptcy proceedings", "type": "string"},

        # Termination Events
        {"fieldName": "Illegality", "jsonPath": "terminationEvents.illegality.description", "description": "Description of the Illegality termination event", "type": "string"},
        {"fieldName": "Tax Event", "jsonPath": "terminationEvents.taxEvent.description", "description": "Description of the Tax Event termination event", "type": "string"},
        {"fieldName": "Tax Event Upon Merger", "jsonPath": "terminationEvents.taxEventUponMerger.description", "description": "Tax Event arising from merger", "type": "string"},
        {"fieldName": "Credit Event Upon Merger", "jsonPath": "terminationEvents.creditEventUponMerger.description", "description": "Credit deterioration after merger", "type": "string"},

        # Early termination
        {"fieldName": "Termination Notice Period", "jsonPath": "earlyTermination.rightToTerminateOnDefault.noticePeriod", "description": "Notice period for early termination on default", "type": "string"},
        {"fieldName": "Automatic Early Termination", "jsonPath": "earlyTermination.automaticEarlyTermination", "description": "Whether automatic early termination applies", "type": "string"},
        {"fieldName": "Payment Methods", "jsonPath": "earlyTermination.paymentMethods", "description": "Methods for calculating termination payments (Market Quotation/Loss)", "type": "array"},
        {"fieldName": "Settlement Methods", "jsonPath": "earlyTermination.settlementMethods", "description": "Settlement methods (First Method/Second Method)", "type": "array"},
        {"fieldName": "Set-Off Rights", "jsonPath": "earlyTermination.setOffRights", "description": "Whether set-off rights apply", "type": "boolean"},

        # Transfer
        {"fieldName": "Transfer Consent Required", "jsonPath": "transferAndAssignment.consentRequired", "description": "Whether prior written consent is needed for transfer", "type": "boolean"},
        {"fieldName": "Transfer Exceptions", "jsonPath": "transferAndAssignment.exceptions", "description": "Exceptions to the transfer consent requirement", "type": "array"},

        # Governing law
        {"fieldName": "Governing Law", "jsonPath": "governingLawAndJurisdiction.governingLaw", "description": "Governing law of the agreement", "type": "string"},
        {"fieldName": "Waiver of Immunities", "jsonPath": "governingLawAndJurisdiction.waiverOfImmunities", "description": "Whether parties waive sovereign immunity", "type": "boolean"},

        # Notices
        {"fieldName": "Notice Methods", "jsonPath": "notices.methods", "description": "Permitted methods for giving notices", "type": "array"},
        {"fieldName": "Notice Restrictions", "jsonPath": "notices.restrictions", "description": "Restrictions on notice delivery for certain sections", "type": "string"},

        # Miscellaneous
        {"fieldName": "Entire Agreement Clause", "jsonPath": "miscellaneous.entireAgreement", "description": "Whether this constitutes the entire agreement", "type": "boolean"},
        {"fieldName": "Amendment Requirement", "jsonPath": "miscellaneous.amendmentRequirement", "description": "Requirements for amending the agreement", "type": "string"},
        {"fieldName": "Survival of Obligations", "jsonPath": "miscellaneous.survivalOfObligations", "description": "Whether obligations survive termination", "type": "boolean"},

        # Key definitions
        {"fieldName": "Default Rate Definition", "jsonPath": "definitions.defaultRate", "description": "Definition of the Default Rate", "type": "string"},
        {"fieldName": "Specified Transaction Definition", "jsonPath": "definitions.specifiedTransaction", "description": "Definition of Specified Transaction", "type": "string"},
        {"fieldName": "Loss Definition", "jsonPath": "definitions.loss", "description": "Definition of Loss for settlement calculation", "type": "string"},
        {"fieldName": "Market Quotation Definition", "jsonPath": "definitions.marketQuotation", "description": "Definition of Market Quotation", "type": "string"},
    ],
}
