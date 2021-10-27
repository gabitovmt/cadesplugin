import CertificateShortInfo from "./CertificateShortInfo";
import CapicomCertInfoType from "./CapicomCertInfoType";
import DigitalSignatureProvider from "./DigitalSignatureProvider";

export default class DigitalSignatureAsyncProvider extends DigitalSignatureProvider {
  public constructor(private readonly cadesplugin: CADESPluginAsync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    const store = await this.cadesplugin.CreateObjectAsync('CAdESCOM.Store');

    try {
      await store.Open(
        this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
        this.cadesplugin.CAPICOM_MY_STORE,
        this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
      );

      const certificates = await store.Certificates;
      const result: CertificateShortInfo[] = [];
      for (let index = 1, count = await certificates.Count; index <= count; index++) {
        result.push(await this.certificateShortInfo(await certificates.Item(index)));
      }

      return result;
    } finally {
      await store.Close();
    }
  }

  private async certificateShortInfo(cert: CAPICOM.CertificateAsync): Promise<CertificateShortInfo> {
    return {
      version: await cert.Version,
      thumbprint: await cert.Thumbprint,
      subjectName: await cert.SubjectName,
      serialNumber: await cert.SerialNumber,
      issuerName: await cert.IssuerName,
      validFromDate: await cert.ValidFromDate,
      validToDate: await cert.ValidToDate,
      subjectSimpleName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_SIMPLE_NAME)),
      subjectEmailName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_EMAIL_NAME)),
      subjectUpn: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_UPN)),
      subjectDnsName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_SUBJECT_DNS_NAME)),
      issuerSimpleName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_SIMPLE_NAME)),
      issuerEmailName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_EMAIL_NAME)),
      issuerUpn: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_UPN)),
      issuerDnsName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_DNS_NAME))
    }
  }

  private infoType(infoType: any): CAPICOM.CAPICOM_CERT_INFO_TYPE {
    return infoType as CAPICOM.CAPICOM_CERT_INFO_TYPE;
  }
}
