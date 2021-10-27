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


  public async signCreate(certSubjectName: string, file: File): Promise<File> {
    const certificate: CAPICOM.CertificateAsync = await this.certificateBySubjectName(certSubjectName);

    const signer: CAdESCOM.CPSignerAsync = await this.cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');
    await signer.propset_Certificate(certificate);
    await signer.propset_CheckCertificate(true);
    await signer.propset_TSAAddress('http://cryptopro.ru/tsp/');

    const signedData: CAdESCOM.CadesSignedDataAsync =
      await this.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
    await signedData.propset_Content(await file.text());

    return await signedData.SignCades(signer, 0x5d) as any as File;
  }

  private async certificateBySubjectName(subjectName: string): Promise<CAPICOM.CertificateAsync> {
    const store = await this.cadesplugin.CreateObjectAsync('CAdESCOM.Store');

    try {
      await store.Open(
        this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
        this.cadesplugin.CAPICOM_MY_STORE,
        this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
      );

      const allCertificates = await store.Certificates;
      const certificates = await allCertificates.Find(0, subjectName);
      const count = await certificates.Count;
      if (count === 0) {
        throw new TypeError(`Сертификат "${subjectName}" не найден`);
      } else if (count > 1) {
        throw new TypeError(`Найдено более одного сертификата "${subjectName}"`);
      }

      return certificates.Item(1);
    } finally {
      // await store.Close();
    }
  }
}
