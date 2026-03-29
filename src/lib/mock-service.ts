import type { MetadataConstruct, ExtractionResult } from '@/types'

// ──────────────────────────────────────────────
// Sample PDF generator (creates a real PDF blob)
// ──────────────────────────────────────────────
export function createSamplePdf(): File {
  // Minimal valid PDF with embedded agreement text
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 2048 >>
stream
BT
/F1 16 Tf
50 740 Td
(SERVICE LEVEL AGREEMENT) Tj
/F1 10 Tf
0 -30 Td
(Agreement ID: AGR-2024-00847) Tj
0 -18 Td
(Type: Service Level Agreement) Tj
0 -18 Td
(Status: Active) Tj
0 -18 Td
(Effective Date: January 15, 2024) Tj
0 -18 Td
(Expiration Date: January 14, 2026) Tj
0 -18 Td
(Auto-Renewal: Yes) Tj
0 -30 Td
/F1 14 Tf
(PARTIES) Tj
/F1 10 Tf
0 -22 Td
(Bank: First National Bank Corp) Tj
0 -18 Td
(Registration: BNK-884721) Tj
0 -18 Td
(Jurisdiction: State of Delaware) Tj
0 -18 Td
(Address: 1200 Market Street, Wilmington, DE 19801, United States) Tj
0 -18 Td
(Signatory: Robert J. Mitchell, Chief Operating Officer) Tj
0 -24 Td
(Third Party: TechServe Solutions Inc.) Tj
0 -18 Td
(Registration: TS-2019-44582) Tj
0 -18 Td
(Jurisdiction: State of California) Tj
0 -18 Td
(Address: 500 Technology Drive, Suite 300, San Jose, CA 95112, United States) Tj
0 -18 Td
(Signatory: Sarah L. Chen, VP of Enterprise Partnerships) Tj
0 -30 Td
/F1 14 Tf
(FINANCIAL TERMS) Tj
/F1 10 Tf
0 -22 Td
(Currency: USD) Tj
0 -18 Td
(Base Fee: $250,000.00) Tj
0 -18 Td
(Billing Cycle: Monthly) Tj
0 -18 Td
(Payment Terms: Net 30) Tj
0 -18 Td
(Late Payment Rate: 1.5% per month) Tj
0 -18 Td
(Early Termination Fee: $500,000.00) Tj
0 -18 Td
(SLA Breach Penalty: $25,000.00 per incident) Tj
0 -24 Td
(Volume Tiers:) Tj
0 -18 Td
(  Tier 1: 0-100,000 transactions at $0.05/txn) Tj
0 -18 Td
(  Tier 2: 100,001-500,000 transactions at $0.03/txn) Tj
0 -18 Td
(  Tier 3: 500,001+ transactions at $0.02/txn) Tj
0 -30 Td
/F1 14 Tf
(SERVICE LEVEL) Tj
/F1 10 Tf
0 -22 Td
(Guaranteed Uptime: 99.95%) Tj
0 -18 Td
(Response Times - Critical: 15 min, High: 1 hr, Medium: 4 hrs, Low: 24 hrs) Tj
0 -18 Td
(Maintenance Window: Sunday 02:00-06:00 EST) Tj
0 -18 Td
(Data Retention: 7 years) Tj
0 -18 Td
(RPO: 1 hour | RTO: 4 hours | Backup Frequency: Every 6 hours) Tj
0 -30 Td
/F1 14 Tf
(COMPLIANCE) Tj
/F1 10 Tf
0 -22 Td
(Regulatory Frameworks: SOC 2 Type II, PCI DSS, GDPR, CCPA) Tj
0 -18 Td
(Audit Frequency: Annual | Last Audit: November 20, 2023) Tj
0 -18 Td
(Data Classification: Confidential) Tj
0 -18 Td
(Encryption Standard: AES-256) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000002370 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
2447
%%EOF`

  const blob = new Blob([pdfContent], { type: 'application/pdf' })
  return new File([blob], 'FNB_TechServe_SLA_Agreement_2024.pdf', {
    type: 'application/pdf',
    lastModified: Date.now(),
  })
}

// ──────────────────────────────────────────────
// System 2 input parameters (displayed in UI)
// ──────────────────────────────────────────────
export interface SystemTwoInputParams {
  endpoint: string
  method: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  requestBody: Record<string, unknown>
}

export const systemTwoSampleInput: SystemTwoInputParams = {
  endpoint: '/api/v2/agreements/extract',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json',
    'X-Client-Id': 'datadiff-pro-client',
    'X-Request-Id': 'req_7f8a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
    'Accept': 'application/json',
  },
  queryParams: {
    'agreementId': 'AGR-2024-00847',
    'includeParties': 'true',
    'includeFinancials': 'true',
    'includeCompliance': 'true',
    'format': 'detailed',
    'version': 'latest',
  },
  requestBody: {
    source: 'agreement_database',
    extractionProfile: 'full_detail',
    filters: {
      agreementId: 'AGR-2024-00847',
      status: ['Active', 'PendingReview'],
      dateRange: {
        from: '2024-01-01',
        to: '2026-12-31',
      },
    },
    options: {
      includeMetadata: true,
      resolveReferences: true,
      flattenNested: false,
      maxDepth: 10,
      includeAuditTrail: false,
    },
    outputConfig: {
      format: 'json',
      prettyPrint: true,
      includeNullFields: false,
      dateFormat: 'ISO8601',
      numericPrecision: 4,
    },
  },
}

// ──────────────────────────────────────────────
// Comprehensive metadata construct
// ──────────────────────────────────────────────
export const defaultMetadata: MetadataConstruct = {
  name: 'Bank Agreement Extraction Schema',
  version: '2.1',
  fields: [
    { fieldName: 'Agreement ID', jsonPath: 'agreement.id', description: 'Unique identifier for the agreement', type: 'string' },
    { fieldName: 'Agreement Type', jsonPath: 'agreement.type', description: 'Type/category of the agreement', type: 'string' },
    { fieldName: 'Status', jsonPath: 'agreement.status', description: 'Current status of the agreement', type: 'string' },
    { fieldName: 'Effective Date', jsonPath: 'agreement.effectiveDate', description: 'Date the agreement becomes effective', type: 'date' },
    { fieldName: 'Expiration Date', jsonPath: 'agreement.expirationDate', description: 'Date the agreement expires', type: 'date' },
    { fieldName: 'Auto Renewal', jsonPath: 'agreement.autoRenewal', description: 'Whether the agreement auto-renews', type: 'boolean' },
    { fieldName: 'Bank Name', jsonPath: 'parties.bank.name', description: 'Legal name of the bank entity', type: 'string' },
    { fieldName: 'Bank Registration', jsonPath: 'parties.bank.registrationNumber', description: 'Bank registration/license number', type: 'string' },
    { fieldName: 'Bank Jurisdiction', jsonPath: 'parties.bank.jurisdiction', description: 'Legal jurisdiction of the bank', type: 'string' },
    { fieldName: 'Bank Address', jsonPath: 'parties.bank.address', description: 'Full address of the bank', type: 'object' },
    { fieldName: 'Bank Signatory', jsonPath: 'parties.bank.signatoryName', description: 'Name of the bank signatory', type: 'string' },
    { fieldName: 'Third Party Name', jsonPath: 'parties.thirdParty.name', description: 'Legal name of the third-party entity', type: 'string' },
    { fieldName: 'Third Party Registration', jsonPath: 'parties.thirdParty.registrationNumber', description: 'Third party registration number', type: 'string' },
    { fieldName: 'Third Party Address', jsonPath: 'parties.thirdParty.address', description: 'Full address of the third party', type: 'object' },
    { fieldName: 'Third Party Signatory', jsonPath: 'parties.thirdParty.signatoryName', description: 'Name of the third-party signatory', type: 'string' },
    { fieldName: 'Currency', jsonPath: 'financialTerms.currency', description: 'Currency for all financial terms', type: 'string' },
    { fieldName: 'Base Fee', jsonPath: 'financialTerms.baseFee', description: 'Base fee amount per billing cycle', type: 'number' },
    { fieldName: 'Billing Cycle', jsonPath: 'financialTerms.billingCycle', description: 'Frequency of billing', type: 'string' },
    { fieldName: 'Payment Terms', jsonPath: 'financialTerms.paymentTerms', description: 'Payment due terms', type: 'string' },
    { fieldName: 'Penalties', jsonPath: 'financialTerms.penalties', description: 'Penalty structure', type: 'object' },
    { fieldName: 'Volume Tiers', jsonPath: 'financialTerms.volumeTiers', description: 'Transaction volume pricing tiers', type: 'array' },
    { fieldName: 'Uptime SLA', jsonPath: 'serviceLevel.uptime', description: 'Guaranteed uptime percentage', type: 'number' },
    { fieldName: 'Response Times', jsonPath: 'serviceLevel.responseTime', description: 'SLA response times by severity', type: 'object' },
    { fieldName: 'Maintenance Window', jsonPath: 'serviceLevel.maintenanceWindow', description: 'Scheduled maintenance window', type: 'string' },
    { fieldName: 'Disaster Recovery', jsonPath: 'serviceLevel.disasterRecovery', description: 'DR configuration', type: 'object' },
    { fieldName: 'Regulatory Frameworks', jsonPath: 'compliance.regulatoryFrameworks', description: 'Applicable regulatory frameworks', type: 'array' },
    { fieldName: 'Audit Frequency', jsonPath: 'compliance.auditFrequency', description: 'How often audits are conducted', type: 'string' },
    { fieldName: 'Data Classification', jsonPath: 'compliance.dataClassification', description: 'Security classification of data', type: 'string' },
    { fieldName: 'Encryption Standard', jsonPath: 'compliance.encryptionStandard', description: 'Encryption algorithm used', type: 'string' },
    { fieldName: 'Last Audit Date', jsonPath: 'compliance.lastAuditDate', description: 'Date of the most recent audit', type: 'date' },
  ],
}

// ──────────────────────────────────────────────
// System 1: LLM extraction from PDF + metadata
// ──────────────────────────────────────────────
export async function extractFromPdf(
  _file: File,
  _metadata: MetadataConstruct
): Promise<ExtractionResult> {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500))

  return {
    agreement: {
      id: 'AGR-2024-00847',
      type: 'Service Level Agreement',
      status: 'Active',
      effectiveDate: '2024-01-15',
      expirationDate: '2026-01-14',
      autoRenewal: true,
    },
    parties: {
      bank: {
        name: 'First National Bank Corp',
        registrationNumber: 'BNK-884721',
        jurisdiction: 'State of Delaware',
        address: {
          street: '1200 Market Street',
          city: 'Wilmington',
          state: 'DE',
          zipCode: '19801',
          country: 'United States',
        },
        signatoryName: 'Robert J. Mitchell',
        signatoryTitle: 'Chief Operating Officer',
      },
      thirdParty: {
        name: 'TechServe Solutions Inc.',
        registrationNumber: 'TS-2019-44582',
        jurisdiction: 'State of California',
        address: {
          street: '500 Technology Drive, Suite 300',
          city: 'San Jose',
          state: 'CA',
          zipCode: '95112',
          country: 'United States',
        },
        signatoryName: 'Sarah L. Chen',
        signatoryTitle: 'VP of Enterprise Partnerships',
      },
    },
    financialTerms: {
      currency: 'USD',
      baseFee: 250000,
      billingCycle: 'Monthly',
      paymentTerms: 'Net 30',
      penalties: {
        latePaymentRate: 1.5,
        earlyTerminationFee: 500000,
        slaBreachPenalty: 25000,
      },
      volumeTiers: [
        { minTransactions: 0, maxTransactions: 100000, ratePerTransaction: 0.05 },
        { minTransactions: 100001, maxTransactions: 500000, ratePerTransaction: 0.03 },
        { minTransactions: 500001, maxTransactions: null, ratePerTransaction: 0.02 },
      ],
    },
    serviceLevel: {
      uptime: 99.95,
      responseTime: {
        critical: '15 minutes',
        high: '1 hour',
        medium: '4 hours',
        low: '24 hours',
      },
      maintenanceWindow: 'Sunday 02:00-06:00 EST',
      dataRetention: '7 years',
      disasterRecovery: {
        rpo: '1 hour',
        rto: '4 hours',
        backupFrequency: 'Every 6 hours',
      },
    },
    compliance: {
      regulatoryFrameworks: ['SOC 2 Type II', 'PCI DSS', 'GDPR', 'CCPA'],
      auditFrequency: 'Annual',
      dataClassification: 'Confidential',
      encryptionStandard: 'AES-256',
      lastAuditDate: '2023-11-20',
    },
  }
}

// ──────────────────────────────────────────────
// System 2: Direct system extraction
// Intentional differences from System 1 to demo
// the comparison engine capabilities
// ──────────────────────────────────────────────
export async function extractFromSystemTwo(
  _params?: SystemTwoInputParams
): Promise<ExtractionResult> {
  await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 1200))

  return {
    agreement: {
      id: 'AGR-2024-00847',
      type: 'Service Level Agreement',
      status: 'Active',
      effectiveDate: '2024-01-15',
      expirationDate: '2026-01-15',       // +1 day difference
      autoRenewal: true,
    },
    parties: {
      bank: {
        name: 'First National Bank Corp',
        registrationNumber: 'BNK-884721',
        jurisdiction: 'Delaware',           // Missing "State of"
        address: {
          street: '1200 Market Street',
          city: 'Wilmington',
          state: 'DE',
          zipCode: '19801',
          country: 'US',                    // "US" vs "United States"
        },
        signatoryName: 'Robert Mitchell',   // Missing middle initial
        signatoryTitle: 'Chief Operating Officer',
      },
      thirdParty: {
        name: 'TechServe Solutions Inc',    // Missing trailing period
        registrationNumber: 'TS-2019-44582',
        jurisdiction: 'State of California',
        address: {
          street: '500 Technology Drive',   // Missing ", Suite 300"
          city: 'San Jose',
          state: 'CA',
          zipCode: '95112',
          country: 'US',
        },
        signatoryName: 'Sarah L. Chen',
        signatoryTitle: 'VP Enterprise Partnerships',  // Missing "of"
        contactEmail: 'sarah.chen@techserve.com',      // Extra field
      },
    },
    financialTerms: {
      currency: 'USD',
      baseFee: 250000,
      billingCycle: 'Monthly',
      paymentTerms: 'Net 30',
      penalties: {
        latePaymentRate: 1.5,
        earlyTerminationFee: 750000,        // $500k vs $750k
        slaBreachPenalty: 25000,
      },
      volumeTiers: [
        { minTransactions: 0, maxTransactions: 100000, ratePerTransaction: 0.05 },
        { minTransactions: 100001, maxTransactions: 500000, ratePerTransaction: 0.035 }, // 0.03 vs 0.035
        { minTransactions: 500001, maxTransactions: null, ratePerTransaction: 0.02 },
      ],
      discount: {                           // Extra nested object
        type: 'Volume',
        percentage: 5,
        threshold: 1000000,
      },
    },
    serviceLevel: {
      uptime: 99.9,                         // 99.95 vs 99.9
      responseTime: {
        critical: '15 minutes',
        high: '1 hour',
        medium: '4 hours',
        low: '1 business day',              // "24 hours" vs "1 business day"
      },
      maintenanceWindow: 'Sunday 02:00-06:00 EST',
      dataRetention: '7 years',
      disasterRecovery: {
        rpo: '1 hour',
        rto: '4 hours',
        backupFrequency: 'Every 6 hours',
        testingFrequency: 'Quarterly',      // Extra field
      },
    },
    compliance: {
      regulatoryFrameworks: ['SOC 2 Type II', 'PCI DSS', 'GDPR'],  // Missing CCPA
      auditFrequency: 'Annual',
      dataClassification: 'Highly Confidential',  // "Confidential" vs "Highly Confidential"
      encryptionStandard: 'AES-256',
      // Missing lastAuditDate
    },
  }
}
