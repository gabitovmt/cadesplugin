import CertificateShortInfo from "./CertificateShortInfo";
import CapicomCertInfoType from "./CapicomCertInfoType";
import DigitalSignatureProvider from "./DigitalSignatureProvider";

export default class DigitalSignatureSyncProvider extends DigitalSignatureProvider {
  constructor(private readonly cadesplugin: CADESPluginSync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    const store = this.cadesplugin.CreateObject('CAPICOM.Store');

    try {
      store.Open(
        this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
        this.cadesplugin.CAPICOM_MY_STORE,
        this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
      );

      const certificates = store.Certificates;
      const result: CertificateShortInfo[] = [];
      for (let index = 1, count = certificates.Count; index <= count; index++) {
        result.push(this.certificateShortInfo(certificates.Item(index)));
      }

      return result;
    } finally {
      store.Close();
    }
  }

  private certificateShortInfo(cert: CAPICOM.Certificate): CertificateShortInfo {
    return {
      version: cert.Version,
      thumbprint: cert.Thumbprint,
      subjectName: cert.SubjectName,
      serialNumber: cert.SerialNumber,
      issuerName: cert.IssuerName,
      validFromDate: cert.ValidFromDate,
      validToDate: cert.ValidToDate,
      subjectSimpleName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME)),
      subjectEmailName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME)),
      subjectUpn: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_UPN)),
      subjectDnsName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_DNS_NAME)),
      issuerSimpleName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME)),
      issuerEmailName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_EMAIL_NAME)),
      issuerUpn: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_UPN)),
      issuerDnsName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_DNS_NAME))
    }
  }

  private infoType(infoType: any): CAPICOM.CAPICOM_CERT_INFO_TYPE {
    return infoType as CAPICOM.CAPICOM_CERT_INFO_TYPE;
  }
}
