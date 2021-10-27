export default interface CertificateShortInfo {
  readonly version: number;
  readonly thumbprint: string;
  readonly subjectName: string;
  readonly serialNumber: string;
  readonly issuerName: string;
  readonly validFromDate: CADES_Common.VarDate;
  readonly validToDate: CADES_Common.VarDate;

  readonly subjectSimpleName: string;
  readonly subjectEmailName: string;
  readonly subjectUpn: string;
  readonly subjectDnsName: string;

  readonly issuerSimpleName: string;
  readonly issuerEmailName: string;
  readonly issuerUpn: string;
  readonly issuerDnsName: string;
}
