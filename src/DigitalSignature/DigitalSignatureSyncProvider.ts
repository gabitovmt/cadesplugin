import CertificateShortInfo from "./CertificateShortInfo";
import CapicomCertInfoType from "./CapicomCertInfoType";
import DigitalSignatureProvider from "./DigitalSignatureProvider";

type Store = CAPICOM.Store;
type Certificates = CAPICOM.Certificates;
type Certificate = CAPICOM.Certificate;
type CPSigner = CAdESCOM.CPSigner;
type CadesSignedData = CAdESCOM.CadesSignedData;

export default class DigitalSignatureSyncProvider extends DigitalSignatureProvider {
  public constructor(private readonly cadesplugin: CADESPluginSync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    const store = this.store();

    try {
      this.openStore(store);
      return this.findAllCertificates(store)
        .map(it => this.certificateShortInfo(it));
    } finally {
      this.closeStore(store);
    }
  }

  public async signCreate(thumbprint: string, file: File): Promise<File> {
    const store = this.store();

    try {
      this.openStore(store);

      const certificate: Certificate = this.findCertificateByThumbprint(store, thumbprint);
      const signer: CPSigner = this.signer(certificate);
      const signedContent = this.signContent(signer, await file.text());

      return new File([signedContent], `${file.name}.sig`);
    } finally {
      await this.closeStore(store);
    }
  }

  private store(): Store {
    return this.cadesplugin.CreateObject('CAPICOM.Store');
  }

  private openStore(store: Store) {
    store.Open(
      this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
      this.cadesplugin.CAPICOM_MY_STORE,
      this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
    );
  }

  private closeStore(store: Store) {
    store.Close();
  }

  private findAllCertificates(store: Store): Certificate[] {
    const certificates: Certificate[] = [];
    for (let index = 1, count = store.Certificates.Count; index <= count; index++) {
      certificates.push(store.Certificates.Item(index));
    }

    return certificates;
  }

  private findCertificateByThumbprint(store: Store, thumbprint: string): Certificate {
    const CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
    const certificates: Certificates = store.Certificates.Find(CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);

    if (certificates.Count === 0) {
      throw new TypeError(`Сертификат "${thumbprint}" не найден`);
    } else if (certificates.Count > 1) {
      throw new TypeError(`Найдено более одного сертификата "${thumbprint}"`);
    }

    return certificates.Item(1);
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

  private signer(certificate: Certificate): CPSigner {
    const signer: CPSigner = this.cadesplugin.CreateObject('CAdESCOM.CPSigner');

    const signingTimeAttr: CAdESCOM.CPAttribute = this.cadesplugin.CreateObject("CAdESCOM.CPAttribute");
    signingTimeAttr.Name = this.cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME;
    signingTimeAttr.Value = new Date();
    // @ts-ignore
    signer.AuthenticatedAttributes2.Add(signingTimeAttr);

    signer.Certificate = certificate;
    signer.Options = this.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;

    return signer;
  }

  private signContent(signer: CPSigner, content: string): string {
    const signedData: CadesSignedData = this.cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
    signedData.ContentEncoding = this.cadesplugin.CADESCOM_BASE64_TO_BINARY;
    signedData.Content = btoa(content);

    const detached = false;
    return signedData.SignCades(signer, this.cadesplugin.CADESCOM_CADES_BES, detached);
  }
}
