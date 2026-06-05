export const DATA_CATEGORY_OPTIONS = [
  'Personal Identifiable Information (PII)',
  'Financial & Payment Data',
  'Health & Medical Records',
  'Authentication Credentials',
  'Proprietary Trading Data',
  'Employee & HR Data',
  'Intellectual Property',
  'No Sensitive Data',
] as const

export const GEOGRAPHIC_OPTIONS = [
  'North America',
  'Europe (EEA)',
  'United Kingdom',
  'Asia Pacific',
  'Middle East & Africa',
  'Latin America',
] as const

export const CERTIFICATION_OPTIONS = [
  'ISO 27001',
  'SOC 2 Type II',
  'PCI DSS',
  'ISO 22301 (Business Continuity)',
  'NIST Framework',
  'None of the above',
] as const

export const REGULATORY_BODY_OPTIONS = [
  'SEC',
  'FINRA',
  'OCC',
  'FCA',
  'GDPR / ICO',
  'HIPAA',
  'PCI SSC',
  'None',
] as const

export const DATA_VOLUME_OPTIONS = [
  { value: 'Low (<1GB)', label: 'Low (<1GB)' },
  { value: 'Medium (1-100GB)', label: 'Medium (1-100GB)' },
  { value: 'High (>100GB)', label: 'High (>100GB)' },
  { value: 'Unknown', label: 'Unknown' },
] as const

export const DATA_RETENTION_OPTIONS = [
  { value: '< 1 year', label: '< 1 year' },
  { value: '1-3 years', label: '1-3 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '> 5 years', label: '> 5 years' },
] as const
