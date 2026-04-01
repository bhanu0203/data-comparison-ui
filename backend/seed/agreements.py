"""
11 Bank–Third Party Agreement baseline JSONs (ground truth).

Each agreement represents a different type of financial services contract
with realistic data covering diverse banks, vendors, terms, and compliance profiles.
"""

from seed.isda_test_data import ISDA_AGREEMENT

AGREEMENTS = [
    # ── 1. SLA – First National Bank ↔ TechServe Solutions ──
    {
        "agreement_id": "AGR-2024-00847",
        "name": "FNB–TechServe SLA 2024",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-00847",
                "type": "Service Level Agreement",
                "status": "Active",
                "effectiveDate": "2024-01-15",
                "expirationDate": "2026-01-15",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "First National Bank Corp",
                    "registrationNumber": "BNK-884721",
                    "jurisdiction": "Delaware",
                    "address": {
                        "street": "1200 Market Street",
                        "city": "Wilmington",
                        "state": "DE",
                        "zipCode": "19801",
                        "country": "US",
                    },
                    "signatoryName": "Robert Mitchell",
                    "signatoryTitle": "Chief Operating Officer",
                },
                "thirdParty": {
                    "name": "TechServe Solutions Inc",
                    "registrationNumber": "TS-2019-44582",
                    "jurisdiction": "State of California",
                    "address": {
                        "street": "500 Technology Drive",
                        "city": "San Jose",
                        "state": "CA",
                        "zipCode": "95112",
                        "country": "US",
                    },
                    "signatoryName": "Sarah L. Chen",
                    "signatoryTitle": "VP Enterprise Partnerships",
                    "contactEmail": "sarah.chen@techserve.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 250000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 30",
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 750000,
                    "slaBreachPenalty": 25000,
                },
                "volumeTiers": [
                    {"minTransactions": 0, "maxTransactions": 100000, "ratePerTransaction": 0.05},
                    {"minTransactions": 100001, "maxTransactions": 500000, "ratePerTransaction": 0.035},
                    {"minTransactions": 500001, "maxTransactions": None, "ratePerTransaction": 0.02},
                ],
                "discount": {
                    "type": "Volume",
                    "percentage": 5,
                    "threshold": 1000000,
                },
            },
            "serviceLevel": {
                "uptime": 99.9,
                "responseTime": {
                    "critical": "15 minutes",
                    "high": "1 hour",
                    "medium": "4 hours",
                    "low": "1 business day",
                },
                "maintenanceWindow": "Sunday 02:00-06:00 EST",
                "dataRetention": "7 years",
                "disasterRecovery": {
                    "rpo": "1 hour",
                    "rto": "4 hours",
                    "backupFrequency": "Every 6 hours",
                    "testingFrequency": "Quarterly",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["SOC 2 Type II", "PCI DSS", "GDPR"],
                "auditFrequency": "Annual",
                "dataClassification": "Highly Confidential",
                "encryptionStandard": "AES-256",
            },
        },
    },

    # ── 2. Data Processing – Summit Bank ↔ CloudVault Analytics ──
    {
        "agreement_id": "AGR-2024-01293",
        "name": "Summit–CloudVault Data Processing 2024",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-01293",
                "type": "Data Processing Agreement",
                "status": "Active",
                "effectiveDate": "2024-03-01",
                "expirationDate": "2027-02-28",
                "autoRenewal": False,
            },
            "parties": {
                "bank": {
                    "name": "Summit National Bank",
                    "registrationNumber": "BNK-551034",
                    "jurisdiction": "State of New York",
                    "address": {
                        "street": "350 Park Avenue, 22nd Floor",
                        "city": "New York",
                        "state": "NY",
                        "zipCode": "10022",
                        "country": "United States",
                    },
                    "signatoryName": "Margaret A. Hoffman",
                    "signatoryTitle": "Chief Data Officer",
                },
                "thirdParty": {
                    "name": "CloudVault Analytics LLC",
                    "registrationNumber": "CVA-2021-78431",
                    "jurisdiction": "State of Virginia",
                    "address": {
                        "street": "1850 Tysons Boulevard, Suite 400",
                        "city": "McLean",
                        "state": "VA",
                        "zipCode": "22102",
                        "country": "United States",
                    },
                    "signatoryName": "David R. Kowalski",
                    "signatoryTitle": "Chief Revenue Officer",
                    "contactEmail": "d.kowalski@cloudvault.io",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 185000,
                "billingCycle": "Quarterly",
                "paymentTerms": "Net 45",
                "penalties": {
                    "latePaymentRate": 2.0,
                    "earlyTerminationFee": 400000,
                    "dataBreachPenalty": 1000000,
                },
                "volumeTiers": [
                    {"minRecords": 0, "maxRecords": 5000000, "costPerMillion": 1200},
                    {"minRecords": 5000001, "maxRecords": 25000000, "costPerMillion": 900},
                    {"minRecords": 25000001, "maxRecords": None, "costPerMillion": 650},
                ],
            },
            "serviceLevel": {
                "uptime": 99.99,
                "responseTime": {
                    "critical": "5 minutes",
                    "high": "30 minutes",
                    "medium": "2 hours",
                    "low": "8 hours",
                },
                "maintenanceWindow": "Saturday 01:00-05:00 EST",
                "dataRetention": "10 years",
                "disasterRecovery": {
                    "rpo": "15 minutes",
                    "rto": "1 hour",
                    "backupFrequency": "Continuous",
                    "testingFrequency": "Monthly",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["SOC 2 Type II", "PCI DSS", "GDPR", "CCPA", "GLBA"],
                "auditFrequency": "Semi-Annual",
                "dataClassification": "Restricted",
                "encryptionStandard": "AES-256-GCM",
                "lastAuditDate": "2024-01-15",
                "dataResidency": "US-only",
            },
        },
    },

    # ── 3. Payment Processing – Pacific Mutual ↔ PayStream Global ──
    {
        "agreement_id": "AGR-2023-07821",
        "name": "Pacific–PayStream Payment Processing",
        "json_data": {
            "agreement": {
                "id": "AGR-2023-07821",
                "type": "Payment Processing Agreement",
                "status": "Active",
                "effectiveDate": "2023-06-01",
                "expirationDate": "2025-05-31",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "Pacific Mutual Savings Bank",
                    "registrationNumber": "BNK-339281",
                    "jurisdiction": "State of Oregon",
                    "address": {
                        "street": "900 SW Fifth Avenue",
                        "city": "Portland",
                        "state": "OR",
                        "zipCode": "97204",
                        "country": "United States",
                    },
                    "signatoryName": "Thomas J. Brennan",
                    "signatoryTitle": "EVP of Payments",
                },
                "thirdParty": {
                    "name": "PayStream Global Inc.",
                    "registrationNumber": "PSG-2018-22914",
                    "jurisdiction": "State of Georgia",
                    "address": {
                        "street": "3500 Lenox Road NE, Suite 1200",
                        "city": "Atlanta",
                        "state": "GA",
                        "zipCode": "30326",
                        "country": "United States",
                    },
                    "signatoryName": "Lisa M. Rodriguez",
                    "signatoryTitle": "SVP Strategic Partnerships",
                    "contactEmail": "l.rodriguez@paystream.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 75000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 15",
                "transactionFees": {
                    "achDebit": 0.25,
                    "achCredit": 0.30,
                    "wireTransfer": 15.00,
                    "realTimePayment": 0.75,
                    "internationalWire": 35.00,
                },
                "penalties": {
                    "latePaymentRate": 1.0,
                    "earlyTerminationFee": 200000,
                    "chargebackPenalty": 15.00,
                },
                "monthlyMinimum": 50000,
            },
            "serviceLevel": {
                "uptime": 99.995,
                "transactionProcessingTime": {
                    "ach": "Same business day",
                    "wire": "Within 2 hours",
                    "realTime": "Under 10 seconds",
                },
                "maintenanceWindow": "Sunday 03:00-05:00 EST",
                "dataRetention": "7 years",
                "disasterRecovery": {
                    "rpo": "Zero (synchronous replication)",
                    "rto": "15 minutes",
                    "backupFrequency": "Continuous",
                    "geoRedundancy": True,
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["PCI DSS Level 1", "SOC 1 Type II", "SOC 2 Type II", "NACHA Rules"],
                "auditFrequency": "Annual",
                "dataClassification": "Confidential",
                "encryptionStandard": "AES-256",
                "lastAuditDate": "2023-12-10",
                "pciComplianceLevel": 1,
            },
        },
    },

    # ── 4. Core Banking – Heritage Federal ↔ CoreTech Systems ──
    {
        "agreement_id": "AGR-2024-02156",
        "name": "Heritage–CoreTech Core Banking Platform",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-02156",
                "type": "Core Banking Platform License",
                "status": "Active",
                "effectiveDate": "2024-07-01",
                "expirationDate": "2029-06-30",
                "autoRenewal": False,
            },
            "parties": {
                "bank": {
                    "name": "Heritage Federal Credit Union",
                    "registrationNumber": "CU-112847",
                    "jurisdiction": "State of Indiana",
                    "address": {
                        "street": "721 Innovation Boulevard",
                        "city": "Newburgh",
                        "state": "IN",
                        "zipCode": "47630",
                        "country": "United States",
                    },
                    "signatoryName": "Karen L. Whitfield",
                    "signatoryTitle": "President & CEO",
                },
                "thirdParty": {
                    "name": "CoreTech Systems International",
                    "registrationNumber": "CTS-2015-66710",
                    "jurisdiction": "State of Wisconsin",
                    "address": {
                        "street": "200 South Executive Drive",
                        "city": "Brookfield",
                        "state": "WI",
                        "zipCode": "53005",
                        "country": "United States",
                    },
                    "signatoryName": "James R. Patterson",
                    "signatoryTitle": "VP Enterprise Sales",
                    "contactEmail": "j.patterson@coretech.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "licenseFee": 1200000,
                "annualMaintenanceFee": 240000,
                "implementationFee": 850000,
                "billingCycle": "Annual",
                "paymentTerms": "Net 30",
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 2400000,
                },
                "userTiers": [
                    {"minUsers": 0, "maxUsers": 500, "costPerUser": 45},
                    {"minUsers": 501, "maxUsers": 2000, "costPerUser": 35},
                    {"minUsers": 2001, "maxUsers": None, "costPerUser": 25},
                ],
            },
            "serviceLevel": {
                "uptime": 99.95,
                "responseTime": {
                    "critical": "15 minutes",
                    "high": "1 hour",
                    "medium": "4 hours",
                    "low": "1 business day",
                },
                "maintenanceWindow": "Sunday 00:00-06:00 CST",
                "dataRetention": "Unlimited",
                "disasterRecovery": {
                    "rpo": "5 minutes",
                    "rto": "2 hours",
                    "backupFrequency": "Every 15 minutes",
                    "testingFrequency": "Quarterly",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["NCUA Guidelines", "SOC 2 Type II", "FFIEC"],
                "auditFrequency": "Annual",
                "dataClassification": "Highly Confidential",
                "encryptionStandard": "AES-256-GCM",
                "lastAuditDate": "2024-03-22",
            },
        },
    },

    # ── 5. Cybersecurity – Meridian Trust ↔ CyberShield ──
    {
        "agreement_id": "AGR-2024-03490",
        "name": "Meridian–CyberShield Security Services",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-03490",
                "type": "Managed Security Services Agreement",
                "status": "Active",
                "effectiveDate": "2024-02-01",
                "expirationDate": "2026-01-31",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "Meridian Trust Bank",
                    "registrationNumber": "BNK-667432",
                    "jurisdiction": "State of Connecticut",
                    "address": {
                        "street": "100 Pearl Street, 18th Floor",
                        "city": "Hartford",
                        "state": "CT",
                        "zipCode": "06103",
                        "country": "United States",
                    },
                    "signatoryName": "Anthony D. Marchetti",
                    "signatoryTitle": "Chief Information Security Officer",
                },
                "thirdParty": {
                    "name": "CyberShield Defense Corp.",
                    "registrationNumber": "CSD-2020-91845",
                    "jurisdiction": "State of Maryland",
                    "address": {
                        "street": "7900 Westpark Drive, Suite T300",
                        "city": "Tysons",
                        "state": "VA",
                        "zipCode": "22102",
                        "country": "United States",
                    },
                    "signatoryName": "Rachel K. Nguyen",
                    "signatoryTitle": "Director of Client Engagement",
                    "contactEmail": "r.nguyen@cybershield.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 420000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 30",
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 600000,
                    "incidentResponseSLA_breach": 50000,
                },
                "additionalServices": {
                    "penetrationTesting": 75000,
                    "redTeamExercise": 150000,
                    "forensicInvestigation": 200,
                    "threatIntelFeed": 36000,
                },
            },
            "serviceLevel": {
                "monitoringCoverage": "24/7/365",
                "incidentResponseTime": {
                    "critical": "5 minutes",
                    "high": "15 minutes",
                    "medium": "1 hour",
                    "low": "4 hours",
                },
                "threatDetectionSLA": "Under 15 minutes",
                "falsePositiveRate": "Below 5%",
                "maintenanceWindow": "No scheduled downtime (HA cluster)",
                "dataRetention": "3 years (logs), 7 years (incidents)",
            },
            "compliance": {
                "regulatoryFrameworks": ["NIST CSF", "SOC 2 Type II", "PCI DSS", "FFIEC CAT"],
                "auditFrequency": "Annual",
                "dataClassification": "Restricted",
                "encryptionStandard": "AES-256-GCM + TLS 1.3",
                "lastAuditDate": "2024-01-08",
                "clearanceLevel": "FedRAMP Moderate",
            },
        },
    },

    # ── 6. Lending Platform – Frontier Savings ↔ LendFlow ──
    {
        "agreement_id": "AGR-2023-09134",
        "name": "Frontier–LendFlow Digital Lending",
        "json_data": {
            "agreement": {
                "id": "AGR-2023-09134",
                "type": "Digital Lending Platform Agreement",
                "status": "Active",
                "effectiveDate": "2023-09-15",
                "expirationDate": "2026-09-14",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "Frontier Savings & Loan",
                    "registrationNumber": "BNK-228764",
                    "jurisdiction": "State of Texas",
                    "address": {
                        "street": "2100 Ross Avenue, Suite 800",
                        "city": "Dallas",
                        "state": "TX",
                        "zipCode": "75201",
                        "country": "United States",
                    },
                    "signatoryName": "Michael T. Crawford",
                    "signatoryTitle": "Chief Lending Officer",
                },
                "thirdParty": {
                    "name": "LendFlow Technologies Inc.",
                    "registrationNumber": "LFT-2019-33291",
                    "jurisdiction": "State of Utah",
                    "address": {
                        "street": "6975 Union Park Center, Suite 600",
                        "city": "Cottonwood Heights",
                        "state": "UT",
                        "zipCode": "84047",
                        "country": "United States",
                    },
                    "signatoryName": "Patricia Fernandez",
                    "signatoryTitle": "COO",
                    "contactEmail": "p.fernandez@lendflow.io",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "platformFee": 95000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 30",
                "revenueShare": {
                    "originationFeeShare": 0.15,
                    "interestIncomeShare": 0.02,
                    "lateFeeSplit": 0.10,
                },
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 300000,
                    "regulatoryViolationPenalty": 500000,
                },
                "loanVolumeMinimum": 10000000,
            },
            "serviceLevel": {
                "uptime": 99.95,
                "applicationProcessingTime": "Under 3 seconds",
                "decisionEngineLatency": "Under 500ms",
                "documentGenerationTime": "Under 10 seconds",
                "maintenanceWindow": "Sunday 02:00-04:00 CST",
                "dataRetention": "7 years post-loan maturity",
                "disasterRecovery": {
                    "rpo": "1 hour",
                    "rto": "4 hours",
                    "backupFrequency": "Every 6 hours",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["TILA", "RESPA", "ECOA", "HMDA", "SOC 2 Type II", "CCPA"],
                "auditFrequency": "Annual",
                "dataClassification": "Confidential",
                "encryptionStandard": "AES-256",
                "lastAuditDate": "2023-11-30",
                "fairLendingCompliance": True,
            },
        },
    },

    # ── 7. KYC/AML – Commonwealth Bank ↔ VerifyIQ ──
    {
        "agreement_id": "AGR-2024-04672",
        "name": "Commonwealth–VerifyIQ KYC/AML Services",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-04672",
                "type": "KYC/AML Service Agreement",
                "status": "Active",
                "effectiveDate": "2024-04-01",
                "expirationDate": "2026-03-31",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "Commonwealth National Bank",
                    "registrationNumber": "BNK-443298",
                    "jurisdiction": "Commonwealth of Massachusetts",
                    "address": {
                        "street": "One Federal Street, 30th Floor",
                        "city": "Boston",
                        "state": "MA",
                        "zipCode": "02110",
                        "country": "United States",
                    },
                    "signatoryName": "Elizabeth P. Sullivan",
                    "signatoryTitle": "BSA/AML Officer",
                },
                "thirdParty": {
                    "name": "VerifyIQ Compliance Solutions",
                    "registrationNumber": "VIQ-2017-55893",
                    "jurisdiction": "State of New Jersey",
                    "address": {
                        "street": "101 Hudson Street, Suite 3600",
                        "city": "Jersey City",
                        "state": "NJ",
                        "zipCode": "07302",
                        "country": "United States",
                    },
                    "signatoryName": "Omar A. Hassan",
                    "signatoryTitle": "Managing Director, Banking",
                    "contactEmail": "o.hassan@verifyiq.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 310000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 30",
                "perCheckFees": {
                    "identityVerification": 1.50,
                    "sanctionsScreening": 0.75,
                    "pepScreening": 0.50,
                    "adverseMediaCheck": 2.00,
                    "enhancedDueDiligence": 25.00,
                },
                "penalties": {
                    "latePaymentRate": 2.0,
                    "earlyTerminationFee": 500000,
                    "falseNegativePenalty": 100000,
                },
                "annualMinimumCommitment": 500000,
            },
            "serviceLevel": {
                "uptime": 99.99,
                "verificationSpeed": {
                    "basicKYC": "Under 5 seconds",
                    "enhancedKYC": "Under 30 seconds",
                    "fullEDD": "Under 24 hours",
                },
                "sanctionsListUpdateFrequency": "Real-time",
                "falsePositiveRate": "Below 3%",
                "maintenanceWindow": "No scheduled downtime",
                "dataRetention": "5 years post-relationship end",
                "disasterRecovery": {
                    "rpo": "Zero",
                    "rto": "5 minutes",
                    "backupFrequency": "Continuous",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["BSA/AML", "USA PATRIOT Act", "OFAC", "FinCEN", "FATF", "SOC 2 Type II"],
                "auditFrequency": "Semi-Annual",
                "dataClassification": "Restricted",
                "encryptionStandard": "AES-256-GCM",
                "lastAuditDate": "2024-02-28",
                "sanctionsListsCovered": ["OFAC SDN", "EU Sanctions", "UN Sanctions", "UK HMT"],
            },
        },
    },

    # ── 8. Cloud Hosting – Pinnacle Bank ↔ FinCloud ──
    {
        "agreement_id": "AGR-2024-05103",
        "name": "Pinnacle–FinCloud Infrastructure Hosting",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-05103",
                "type": "Cloud Infrastructure Hosting Agreement",
                "status": "Active",
                "effectiveDate": "2024-05-01",
                "expirationDate": "2027-04-30",
                "autoRenewal": False,
            },
            "parties": {
                "bank": {
                    "name": "Pinnacle Bank & Trust",
                    "registrationNumber": "BNK-776213",
                    "jurisdiction": "State of Tennessee",
                    "address": {
                        "street": "150 Third Avenue South",
                        "city": "Nashville",
                        "state": "TN",
                        "zipCode": "37201",
                        "country": "United States",
                    },
                    "signatoryName": "William S. Donovan",
                    "signatoryTitle": "Chief Technology Officer",
                },
                "thirdParty": {
                    "name": "FinCloud Infrastructure Services",
                    "registrationNumber": "FCI-2020-41208",
                    "jurisdiction": "State of Washington",
                    "address": {
                        "street": "410 Terry Avenue North",
                        "city": "Seattle",
                        "state": "WA",
                        "zipCode": "98109",
                        "country": "United States",
                    },
                    "signatoryName": "Anika Patel",
                    "signatoryTitle": "VP Financial Services",
                    "contactEmail": "a.patel@fincloud.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "monthlyCommit": 165000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 30",
                "computeCosts": {
                    "vcpuPerHour": 0.045,
                    "memoryGBPerHour": 0.006,
                    "gpuPerHour": 2.10,
                },
                "storageCosts": {
                    "ssdPerGBMonth": 0.10,
                    "hddPerGBMonth": 0.023,
                    "archivePerGBMonth": 0.004,
                    "egressPerGB": 0.08,
                },
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 500000,
                    "dataLossPenalty": 5000000,
                },
                "reservedInstanceDiscount": 0.35,
            },
            "serviceLevel": {
                "uptime": 99.999,
                "networkLatency": "Under 1ms within region",
                "storageIOPS": "Minimum 64000 per volume",
                "maintenanceWindow": "Live migration (zero downtime)",
                "dataRetention": "Per customer policy",
                "disasterRecovery": {
                    "rpo": "Configurable (1 min–24 hr)",
                    "rto": "Under 15 minutes",
                    "backupFrequency": "Continuous snapshot",
                    "geoRedundancy": True,
                    "regions": ["us-east-1", "us-west-2", "eu-west-1"],
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["SOC 2 Type II", "SOC 3", "ISO 27001", "FedRAMP High", "PCI DSS"],
                "auditFrequency": "Continuous (automated)",
                "dataClassification": "Multi-tenant Isolation",
                "encryptionStandard": "AES-256-GCM (at rest) + TLS 1.3 (in transit)",
                "lastAuditDate": "2024-04-15",
                "keyManagement": "Customer-managed HSM",
            },
        },
    },

    # ── 9. Card Issuing – Atlantic Credit Union ↔ CardForge ──
    {
        "agreement_id": "AGR-2023-11587",
        "name": "Atlantic–CardForge Card Issuing Program",
        "json_data": {
            "agreement": {
                "id": "AGR-2023-11587",
                "type": "Card Issuing & Processing Agreement",
                "status": "Active",
                "effectiveDate": "2023-11-01",
                "expirationDate": "2026-10-31",
                "autoRenewal": True,
            },
            "parties": {
                "bank": {
                    "name": "Atlantic Community Credit Union",
                    "registrationNumber": "CU-334891",
                    "jurisdiction": "State of Florida",
                    "address": {
                        "street": "400 Brickell Avenue, Suite 600",
                        "city": "Miami",
                        "state": "FL",
                        "zipCode": "33131",
                        "country": "United States",
                    },
                    "signatoryName": "Carlos E. Medina",
                    "signatoryTitle": "VP Card Services",
                },
                "thirdParty": {
                    "name": "CardForge Processing Inc.",
                    "registrationNumber": "CFP-2016-88374",
                    "jurisdiction": "State of Ohio",
                    "address": {
                        "street": "4500 East Royalton Road",
                        "city": "Broadview Heights",
                        "state": "OH",
                        "zipCode": "44147",
                        "country": "United States",
                    },
                    "signatoryName": "Jennifer L. Brooks",
                    "signatoryTitle": "SVP Issuer Relations",
                    "contactEmail": "j.brooks@cardforge.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "baseFee": 55000,
                "billingCycle": "Monthly",
                "paymentTerms": "Net 15",
                "perCardFees": {
                    "cardProduction": 3.50,
                    "instantIssue": 5.00,
                    "virtualCard": 0.50,
                    "replacementCard": 4.00,
                },
                "transactionFees": {
                    "pointOfSale": 0.08,
                    "ecommerce": 0.10,
                    "atmWithdrawal": 0.65,
                    "internationalTransaction": 0.25,
                    "declinedTransaction": 0.03,
                },
                "penalties": {
                    "latePaymentRate": 1.0,
                    "earlyTerminationFee": 150000,
                    "fraudLiabilityThreshold": 0.05,
                },
                "revenueShare": {
                    "interchangeShare": 0.70,
                    "foreignExchangeShare": 0.50,
                },
            },
            "serviceLevel": {
                "uptime": 99.99,
                "authorizationResponseTime": "Under 100ms",
                "cardActivationTime": "Instant",
                "disputeResolutionSLA": "5 business days",
                "maintenanceWindow": "Rolling updates (zero downtime)",
                "dataRetention": "7 years",
                "disasterRecovery": {
                    "rpo": "Zero",
                    "rto": "2 minutes",
                    "backupFrequency": "Synchronous replication",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["PCI DSS Level 1", "PCI PIN", "EMV Certification", "Visa/MC Network Rules", "SOC 2 Type II"],
                "auditFrequency": "Annual",
                "dataClassification": "PCI Scope - Restricted",
                "encryptionStandard": "AES-256 + P2PE",
                "lastAuditDate": "2023-09-15",
                "networkCertifications": ["Visa Ready", "Mastercard Certified"],
            },
        },
    },

    # ── 10. Wealth Management – Graystone Private ↔ WealthOS ──
    {
        "agreement_id": "AGR-2024-06298",
        "name": "Graystone–WealthOS Platform License",
        "json_data": {
            "agreement": {
                "id": "AGR-2024-06298",
                "type": "Wealth Management Platform Agreement",
                "status": "Pending Review",
                "effectiveDate": "2024-08-01",
                "expirationDate": "2029-07-31",
                "autoRenewal": False,
            },
            "parties": {
                "bank": {
                    "name": "Graystone Private Bank & Trust",
                    "registrationNumber": "BNK-882134",
                    "jurisdiction": "State of Illinois",
                    "address": {
                        "street": "233 South Wacker Drive, 54th Floor",
                        "city": "Chicago",
                        "state": "IL",
                        "zipCode": "60606",
                        "country": "United States",
                    },
                    "signatoryName": "Victoria R. Ashworth",
                    "signatoryTitle": "Managing Director, Wealth Management",
                },
                "thirdParty": {
                    "name": "WealthOS Technologies LLC",
                    "registrationNumber": "WOS-2018-29471",
                    "jurisdiction": "State of North Carolina",
                    "address": {
                        "street": "525 Fayetteville Street, Suite 400",
                        "city": "Raleigh",
                        "state": "NC",
                        "zipCode": "27601",
                        "country": "United States",
                    },
                    "signatoryName": "Daniel H. Foster",
                    "signatoryTitle": "Chief Commercial Officer",
                    "contactEmail": "d.foster@wealthos.com",
                },
            },
            "financialTerms": {
                "currency": "USD",
                "licenseFee": 750000,
                "implementationFee": 500000,
                "annualMaintenanceFee": 150000,
                "billingCycle": "Quarterly",
                "paymentTerms": "Net 45",
                "aumBasedFees": {
                    "tier1": {"minAUM": 0, "maxAUM": 1000000000, "basisPoints": 2.5},
                    "tier2": {"minAUM": 1000000001, "maxAUM": 5000000000, "basisPoints": 1.5},
                    "tier3": {"minAUM": 5000000001, "maxAUM": None, "basisPoints": 0.75},
                },
                "penalties": {
                    "latePaymentRate": 1.5,
                    "earlyTerminationFee": 1500000,
                    "dataMigrationAssistanceFee": 250000,
                },
            },
            "serviceLevel": {
                "uptime": 99.95,
                "portfolioCalculationTime": "Under 2 seconds",
                "reportGenerationTime": "Under 30 seconds",
                "responseTime": {
                    "critical": "15 minutes",
                    "high": "1 hour",
                    "medium": "4 hours",
                    "low": "1 business day",
                },
                "maintenanceWindow": "Saturday 23:00-Sunday 05:00 EST",
                "dataRetention": "Lifetime of relationship + 7 years",
                "disasterRecovery": {
                    "rpo": "15 minutes",
                    "rto": "1 hour",
                    "backupFrequency": "Every 15 minutes",
                    "testingFrequency": "Quarterly",
                },
            },
            "compliance": {
                "regulatoryFrameworks": ["SEC Rule 17a-4", "SOC 2 Type II", "FINRA", "Reg S-P", "GDPR"],
                "auditFrequency": "Annual",
                "dataClassification": "Highly Confidential",
                "encryptionStandard": "AES-256-GCM",
                "lastAuditDate": "2024-06-12",
                "fiduciaryCompliance": True,
            },
        },
    },

    # ── 11. ISDA Master Agreement ──
    ISDA_AGREEMENT,
]
