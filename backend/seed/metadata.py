"""
Metadata constructs for PDF extraction.

Each construct defines the fields, JSON paths, descriptions, and types
that guide the LLM when extracting structured data from agreement PDFs.
There is one general-purpose schema and 10 agreement-specific schemas.
"""

# ── General-purpose bank agreement extraction schema ──
GENERAL_METADATA = {
    "name": "General Bank Agreement Extraction Schema",
    "version": "3.0",
    "fields": [
        {"fieldName": "Agreement ID", "jsonPath": "agreement.id", "description": "Unique identifier for the agreement", "type": "string"},
        {"fieldName": "Agreement Type", "jsonPath": "agreement.type", "description": "Type/category of the agreement", "type": "string"},
        {"fieldName": "Status", "jsonPath": "agreement.status", "description": "Current status of the agreement", "type": "string"},
        {"fieldName": "Effective Date", "jsonPath": "agreement.effectiveDate", "description": "Date the agreement becomes effective", "type": "date"},
        {"fieldName": "Expiration Date", "jsonPath": "agreement.expirationDate", "description": "Date the agreement expires", "type": "date"},
        {"fieldName": "Auto Renewal", "jsonPath": "agreement.autoRenewal", "description": "Whether the agreement auto-renews", "type": "boolean"},
        {"fieldName": "Bank Name", "jsonPath": "parties.bank.name", "description": "Legal name of the bank entity", "type": "string"},
        {"fieldName": "Bank Registration", "jsonPath": "parties.bank.registrationNumber", "description": "Bank registration/license number", "type": "string"},
        {"fieldName": "Bank Jurisdiction", "jsonPath": "parties.bank.jurisdiction", "description": "Legal jurisdiction of the bank", "type": "string"},
        {"fieldName": "Bank Address", "jsonPath": "parties.bank.address", "description": "Full address of the bank", "type": "object"},
        {"fieldName": "Bank Signatory", "jsonPath": "parties.bank.signatoryName", "description": "Name of the bank signatory", "type": "string"},
        {"fieldName": "Bank Signatory Title", "jsonPath": "parties.bank.signatoryTitle", "description": "Title of the bank signatory", "type": "string"},
        {"fieldName": "Third Party Name", "jsonPath": "parties.thirdParty.name", "description": "Legal name of the third-party entity", "type": "string"},
        {"fieldName": "Third Party Registration", "jsonPath": "parties.thirdParty.registrationNumber", "description": "Third party registration number", "type": "string"},
        {"fieldName": "Third Party Jurisdiction", "jsonPath": "parties.thirdParty.jurisdiction", "description": "Legal jurisdiction of the third party", "type": "string"},
        {"fieldName": "Third Party Address", "jsonPath": "parties.thirdParty.address", "description": "Full address of the third party", "type": "object"},
        {"fieldName": "Third Party Signatory", "jsonPath": "parties.thirdParty.signatoryName", "description": "Name of the third-party signatory", "type": "string"},
        {"fieldName": "Third Party Contact Email", "jsonPath": "parties.thirdParty.contactEmail", "description": "Contact email for the third party", "type": "string"},
        {"fieldName": "Currency", "jsonPath": "financialTerms.currency", "description": "Currency for financial terms", "type": "string"},
        {"fieldName": "Base Fee", "jsonPath": "financialTerms.baseFee", "description": "Base/platform fee amount", "type": "number"},
        {"fieldName": "Billing Cycle", "jsonPath": "financialTerms.billingCycle", "description": "Frequency of billing", "type": "string"},
        {"fieldName": "Payment Terms", "jsonPath": "financialTerms.paymentTerms", "description": "Payment due terms", "type": "string"},
        {"fieldName": "Late Payment Rate", "jsonPath": "financialTerms.penalties.latePaymentRate", "description": "Late payment interest rate (%)", "type": "number"},
        {"fieldName": "Early Termination Fee", "jsonPath": "financialTerms.penalties.earlyTerminationFee", "description": "Fee for early contract termination", "type": "number"},
        {"fieldName": "Uptime SLA", "jsonPath": "serviceLevel.uptime", "description": "Guaranteed uptime percentage", "type": "number"},
        {"fieldName": "Response Times", "jsonPath": "serviceLevel.responseTime", "description": "SLA response times by severity", "type": "object"},
        {"fieldName": "Maintenance Window", "jsonPath": "serviceLevel.maintenanceWindow", "description": "Scheduled maintenance window", "type": "string"},
        {"fieldName": "Data Retention", "jsonPath": "serviceLevel.dataRetention", "description": "Data retention period", "type": "string"},
        {"fieldName": "Disaster Recovery", "jsonPath": "serviceLevel.disasterRecovery", "description": "DR configuration (RPO/RTO/backups)", "type": "object"},
        {"fieldName": "Regulatory Frameworks", "jsonPath": "compliance.regulatoryFrameworks", "description": "Applicable regulatory frameworks", "type": "array"},
        {"fieldName": "Audit Frequency", "jsonPath": "compliance.auditFrequency", "description": "How often audits are conducted", "type": "string"},
        {"fieldName": "Data Classification", "jsonPath": "compliance.dataClassification", "description": "Security classification of data", "type": "string"},
        {"fieldName": "Encryption Standard", "jsonPath": "compliance.encryptionStandard", "description": "Encryption algorithm/standard used", "type": "string"},
        {"fieldName": "Last Audit Date", "jsonPath": "compliance.lastAuditDate", "description": "Date of the most recent audit", "type": "date"},
    ],
}


# ── Agreement-specific metadata schemas ──
# These add domain-specific fields on top of the general ones.

AGREEMENT_METADATA = {
    # 1. SLA
    "AGR-2024-00847": {
        "name": "SLA Agreement Extraction Schema",
        "version": "2.1",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "SLA Breach Penalty", "jsonPath": "financialTerms.penalties.slaBreachPenalty", "description": "Penalty per SLA breach incident", "type": "number"},
            {"fieldName": "Volume Tiers", "jsonPath": "financialTerms.volumeTiers", "description": "Transaction volume pricing tiers", "type": "array"},
            {"fieldName": "Volume Discount", "jsonPath": "financialTerms.discount", "description": "Volume-based discount terms", "type": "object"},
            {"fieldName": "DR Testing Frequency", "jsonPath": "serviceLevel.disasterRecovery.testingFrequency", "description": "How often DR is tested", "type": "string"},
        ],
    },

    # 2. Data Processing
    "AGR-2024-01293": {
        "name": "Data Processing Agreement Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Data Breach Penalty", "jsonPath": "financialTerms.penalties.dataBreachPenalty", "description": "Penalty for data breach", "type": "number"},
            {"fieldName": "Volume Tiers", "jsonPath": "financialTerms.volumeTiers", "description": "Record volume pricing tiers", "type": "array"},
            {"fieldName": "DR Testing Frequency", "jsonPath": "serviceLevel.disasterRecovery.testingFrequency", "description": "DR testing cadence", "type": "string"},
            {"fieldName": "Data Residency", "jsonPath": "compliance.dataResidency", "description": "Data residency requirement", "type": "string"},
        ],
    },

    # 3. Payment Processing
    "AGR-2023-07821": {
        "name": "Payment Processing Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "ACH Debit Fee", "jsonPath": "financialTerms.transactionFees.achDebit", "description": "Per-transaction ACH debit fee", "type": "number"},
            {"fieldName": "ACH Credit Fee", "jsonPath": "financialTerms.transactionFees.achCredit", "description": "Per-transaction ACH credit fee", "type": "number"},
            {"fieldName": "Wire Transfer Fee", "jsonPath": "financialTerms.transactionFees.wireTransfer", "description": "Per wire transfer fee", "type": "number"},
            {"fieldName": "Real-Time Payment Fee", "jsonPath": "financialTerms.transactionFees.realTimePayment", "description": "Per real-time payment fee", "type": "number"},
            {"fieldName": "International Wire Fee", "jsonPath": "financialTerms.transactionFees.internationalWire", "description": "Per international wire fee", "type": "number"},
            {"fieldName": "Monthly Minimum", "jsonPath": "financialTerms.monthlyMinimum", "description": "Monthly minimum commitment", "type": "number"},
            {"fieldName": "Chargeback Penalty", "jsonPath": "financialTerms.penalties.chargebackPenalty", "description": "Per chargeback penalty", "type": "number"},
            {"fieldName": "Transaction Processing Times", "jsonPath": "serviceLevel.transactionProcessingTime", "description": "Processing times by payment type", "type": "object"},
            {"fieldName": "PCI Compliance Level", "jsonPath": "compliance.pciComplianceLevel", "description": "PCI DSS compliance level", "type": "number"},
            {"fieldName": "Geo Redundancy", "jsonPath": "serviceLevel.disasterRecovery.geoRedundancy", "description": "Geographic redundancy enabled", "type": "boolean"},
        ],
    },

    # 4. Core Banking
    "AGR-2024-02156": {
        "name": "Core Banking Platform Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "License Fee", "jsonPath": "financialTerms.licenseFee", "description": "One-time license fee", "type": "number"},
            {"fieldName": "Annual Maintenance Fee", "jsonPath": "financialTerms.annualMaintenanceFee", "description": "Annual maintenance/support fee", "type": "number"},
            {"fieldName": "Implementation Fee", "jsonPath": "financialTerms.implementationFee", "description": "One-time implementation fee", "type": "number"},
            {"fieldName": "User Tiers", "jsonPath": "financialTerms.userTiers", "description": "User-based pricing tiers", "type": "array"},
        ],
    },

    # 5. Cybersecurity
    "AGR-2024-03490": {
        "name": "Managed Security Services Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Monitoring Coverage", "jsonPath": "serviceLevel.monitoringCoverage", "description": "Security monitoring availability", "type": "string"},
            {"fieldName": "Incident Response Time", "jsonPath": "serviceLevel.incidentResponseTime", "description": "Incident response SLAs by severity", "type": "object"},
            {"fieldName": "Threat Detection SLA", "jsonPath": "serviceLevel.threatDetectionSLA", "description": "Max time to detect threats", "type": "string"},
            {"fieldName": "False Positive Rate", "jsonPath": "serviceLevel.falsePositiveRate", "description": "Max acceptable false positive rate", "type": "string"},
            {"fieldName": "Penetration Testing Fee", "jsonPath": "financialTerms.additionalServices.penetrationTesting", "description": "Annual pen test fee", "type": "number"},
            {"fieldName": "Red Team Exercise Fee", "jsonPath": "financialTerms.additionalServices.redTeamExercise", "description": "Red team exercise fee", "type": "number"},
            {"fieldName": "Threat Intel Feed Fee", "jsonPath": "financialTerms.additionalServices.threatIntelFeed", "description": "Annual threat intel subscription", "type": "number"},
            {"fieldName": "Clearance Level", "jsonPath": "compliance.clearanceLevel", "description": "Security clearance or certification level", "type": "string"},
            {"fieldName": "Incident Response SLA Breach Penalty", "jsonPath": "financialTerms.penalties.incidentResponseSLA_breach", "description": "Penalty for breaching IR SLAs", "type": "number"},
        ],
    },

    # 6. Lending Platform
    "AGR-2023-09134": {
        "name": "Digital Lending Platform Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Platform Fee", "jsonPath": "financialTerms.platformFee", "description": "Monthly platform fee", "type": "number"},
            {"fieldName": "Origination Fee Share", "jsonPath": "financialTerms.revenueShare.originationFeeShare", "description": "Revenue share on origination fees", "type": "number"},
            {"fieldName": "Interest Income Share", "jsonPath": "financialTerms.revenueShare.interestIncomeShare", "description": "Revenue share on interest income", "type": "number"},
            {"fieldName": "Loan Volume Minimum", "jsonPath": "financialTerms.loanVolumeMinimum", "description": "Minimum annual loan volume", "type": "number"},
            {"fieldName": "Application Processing Time", "jsonPath": "serviceLevel.applicationProcessingTime", "description": "Max time to process a loan application", "type": "string"},
            {"fieldName": "Decision Engine Latency", "jsonPath": "serviceLevel.decisionEngineLatency", "description": "Max latency for credit decisions", "type": "string"},
            {"fieldName": "Fair Lending Compliance", "jsonPath": "compliance.fairLendingCompliance", "description": "Fair lending compliance certified", "type": "boolean"},
            {"fieldName": "Regulatory Violation Penalty", "jsonPath": "financialTerms.penalties.regulatoryViolationPenalty", "description": "Penalty for regulatory violations", "type": "number"},
        ],
    },

    # 7. KYC/AML
    "AGR-2024-04672": {
        "name": "KYC/AML Service Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Identity Verification Fee", "jsonPath": "financialTerms.perCheckFees.identityVerification", "description": "Per identity check fee", "type": "number"},
            {"fieldName": "Sanctions Screening Fee", "jsonPath": "financialTerms.perCheckFees.sanctionsScreening", "description": "Per sanctions screening fee", "type": "number"},
            {"fieldName": "PEP Screening Fee", "jsonPath": "financialTerms.perCheckFees.pepScreening", "description": "Per PEP screening fee", "type": "number"},
            {"fieldName": "Adverse Media Check Fee", "jsonPath": "financialTerms.perCheckFees.adverseMediaCheck", "description": "Per adverse media check fee", "type": "number"},
            {"fieldName": "Enhanced Due Diligence Fee", "jsonPath": "financialTerms.perCheckFees.enhancedDueDiligence", "description": "Per EDD fee", "type": "number"},
            {"fieldName": "Annual Minimum Commitment", "jsonPath": "financialTerms.annualMinimumCommitment", "description": "Annual minimum spend commitment", "type": "number"},
            {"fieldName": "False Negative Penalty", "jsonPath": "financialTerms.penalties.falseNegativePenalty", "description": "Penalty for missed sanctions/PEP hits", "type": "number"},
            {"fieldName": "Verification Speed", "jsonPath": "serviceLevel.verificationSpeed", "description": "KYC verification speed by tier", "type": "object"},
            {"fieldName": "Sanctions List Update Frequency", "jsonPath": "serviceLevel.sanctionsListUpdateFrequency", "description": "How often sanctions lists are refreshed", "type": "string"},
            {"fieldName": "Sanctions Lists Covered", "jsonPath": "compliance.sanctionsListsCovered", "description": "Which sanctions lists are monitored", "type": "array"},
        ],
    },

    # 8. Cloud Hosting
    "AGR-2024-05103": {
        "name": "Cloud Infrastructure Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Monthly Commit", "jsonPath": "financialTerms.monthlyCommit", "description": "Monthly spending commitment", "type": "number"},
            {"fieldName": "vCPU Cost/Hour", "jsonPath": "financialTerms.computeCosts.vcpuPerHour", "description": "Per vCPU per hour cost", "type": "number"},
            {"fieldName": "Memory Cost/Hour", "jsonPath": "financialTerms.computeCosts.memoryGBPerHour", "description": "Per GB memory per hour cost", "type": "number"},
            {"fieldName": "GPU Cost/Hour", "jsonPath": "financialTerms.computeCosts.gpuPerHour", "description": "Per GPU per hour cost", "type": "number"},
            {"fieldName": "SSD Storage Cost", "jsonPath": "financialTerms.storageCosts.ssdPerGBMonth", "description": "SSD per GB per month", "type": "number"},
            {"fieldName": "Egress Cost", "jsonPath": "financialTerms.storageCosts.egressPerGB", "description": "Data egress per GB cost", "type": "number"},
            {"fieldName": "Reserved Instance Discount", "jsonPath": "financialTerms.reservedInstanceDiscount", "description": "Reserved instance discount rate", "type": "number"},
            {"fieldName": "Data Loss Penalty", "jsonPath": "financialTerms.penalties.dataLossPenalty", "description": "Penalty for data loss incidents", "type": "number"},
            {"fieldName": "Network Latency SLA", "jsonPath": "serviceLevel.networkLatency", "description": "Network latency guarantee", "type": "string"},
            {"fieldName": "Storage IOPS SLA", "jsonPath": "serviceLevel.storageIOPS", "description": "Storage IOPS guarantee", "type": "string"},
            {"fieldName": "DR Regions", "jsonPath": "serviceLevel.disasterRecovery.regions", "description": "Available DR regions", "type": "array"},
            {"fieldName": "Key Management", "jsonPath": "compliance.keyManagement", "description": "Encryption key management model", "type": "string"},
        ],
    },

    # 9. Card Issuing
    "AGR-2023-11587": {
        "name": "Card Issuing & Processing Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "Card Production Fee", "jsonPath": "financialTerms.perCardFees.cardProduction", "description": "Physical card production fee", "type": "number"},
            {"fieldName": "Instant Issue Fee", "jsonPath": "financialTerms.perCardFees.instantIssue", "description": "In-branch instant issue fee", "type": "number"},
            {"fieldName": "Virtual Card Fee", "jsonPath": "financialTerms.perCardFees.virtualCard", "description": "Virtual card issuance fee", "type": "number"},
            {"fieldName": "POS Transaction Fee", "jsonPath": "financialTerms.transactionFees.pointOfSale", "description": "Per POS transaction fee", "type": "number"},
            {"fieldName": "E-commerce Transaction Fee", "jsonPath": "financialTerms.transactionFees.ecommerce", "description": "Per e-commerce transaction fee", "type": "number"},
            {"fieldName": "ATM Withdrawal Fee", "jsonPath": "financialTerms.transactionFees.atmWithdrawal", "description": "Per ATM withdrawal fee", "type": "number"},
            {"fieldName": "Interchange Share", "jsonPath": "financialTerms.revenueShare.interchangeShare", "description": "Issuer share of interchange", "type": "number"},
            {"fieldName": "Authorization Response Time", "jsonPath": "serviceLevel.authorizationResponseTime", "description": "Max authorization response time", "type": "string"},
            {"fieldName": "Dispute Resolution SLA", "jsonPath": "serviceLevel.disputeResolutionSLA", "description": "Dispute resolution timeframe", "type": "string"},
            {"fieldName": "Network Certifications", "jsonPath": "compliance.networkCertifications", "description": "Card network certifications", "type": "array"},
        ],
    },

    # 10. Wealth Management
    "AGR-2024-06298": {
        "name": "Wealth Management Platform Extraction Schema",
        "version": "1.0",
        "fields": GENERAL_METADATA["fields"] + [
            {"fieldName": "License Fee", "jsonPath": "financialTerms.licenseFee", "description": "Platform license fee", "type": "number"},
            {"fieldName": "Implementation Fee", "jsonPath": "financialTerms.implementationFee", "description": "One-time implementation fee", "type": "number"},
            {"fieldName": "Annual Maintenance Fee", "jsonPath": "financialTerms.annualMaintenanceFee", "description": "Annual maintenance/support fee", "type": "number"},
            {"fieldName": "AUM-Based Fee Tiers", "jsonPath": "financialTerms.aumBasedFees", "description": "Assets under management fee tiers", "type": "object"},
            {"fieldName": "Data Migration Fee", "jsonPath": "financialTerms.penalties.dataMigrationAssistanceFee", "description": "Fee for data migration assistance", "type": "number"},
            {"fieldName": "Portfolio Calculation Time", "jsonPath": "serviceLevel.portfolioCalculationTime", "description": "Max portfolio calc time", "type": "string"},
            {"fieldName": "Report Generation Time", "jsonPath": "serviceLevel.reportGenerationTime", "description": "Max report generation time", "type": "string"},
            {"fieldName": "Fiduciary Compliance", "jsonPath": "compliance.fiduciaryCompliance", "description": "Fiduciary compliance certified", "type": "boolean"},
        ],
    },
}
