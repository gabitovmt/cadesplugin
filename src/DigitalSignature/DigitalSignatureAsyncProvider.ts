import CertificateShortInfo from "./CertificateShortInfo";
import CapicomCertInfoType from "./CapicomCertInfoType";
import DigitalSignatureProvider from "./DigitalSignatureProvider";

type StoreAsync = CAPICOM.StoreAsync;
type CertificatesAsync = CAPICOM.CertificatesAsync;
type CertificateAsync = CAPICOM.CertificateAsync;
type CPSignerAsync = CAdESCOM.CPSignerAsync;
type CadesSignedDataAsync = CAdESCOM.CadesSignedDataAsync;

export default class DigitalSignatureAsyncProvider extends DigitalSignatureProvider {
  public constructor(private readonly cadesplugin: CADESPluginAsync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    const store = await this.store();

    try {
      await this.openStore(store);

      const certificates: CertificateShortInfo[] = [];
      for (let cert of await this.findAllCertificates(store)) {
        certificates.push(await this.certificateShortInfo(cert));
      }

      return certificates;
    } finally {
      await this.closeStore(store);
    }
  }

  public async signCreate(thumbprint: string, file: File): Promise<File> {
    const store = await this.store();

    try {
      await this.openStore(store);

      const certificate: CertificateAsync = await this.findCertificateByThumbprint(store, thumbprint);
      const signer: CPSignerAsync = await this.signer(certificate);

      const t = await SignCadesBES_Async_File(signer, btoa(await file.text()));
      return new File([t], `${file.name}.p7s`);
      // const signedContent = await this.signContent(signer, await file.text());
      //
      // return new File([signedContent], `${file.name}.p7s`);
    } finally {
      await this.closeStore(store);
    }
  }

  private async store(): Promise<StoreAsync> {
    return await this.cadesplugin.CreateObjectAsync('CAdESCOM.Store');
  }

  private async openStore(store: StoreAsync): Promise<void> {
    await store.Open(
      this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
      this.cadesplugin.CAPICOM_MY_STORE,
      this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED
    );
  }

  private async closeStore(store: StoreAsync): Promise<void> {
    await store.Close();
  }

  private async findAllCertificates(store: StoreAsync): Promise<CertificateAsync[]> {
    const storeCertificates: CertificatesAsync = await store.Certificates;
    const certificates: CertificateAsync[] = [];
    for (let index = 1, count = await storeCertificates.Count; index <= count; index++) {
      certificates.push(await storeCertificates.Item(index));
    }

    return certificates;
  }

  private async findCertificateByThumbprint(store: StoreAsync, thumbprint: string): Promise<CertificateAsync> {
    const CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
    const certificates: CertificatesAsync =
      await (await store.Certificates).Find(CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);

    const count = await certificates.Count;
    if (count === 0) {
      throw new TypeError(`Сертификат "${thumbprint}" не найден`);
    } else if (count > 1) {
      throw new TypeError(`Найдено более одного сертификата "${thumbprint}"`);
    }

    return certificates.Item(1);
  }

  private async certificateShortInfo(cert: CertificateAsync): Promise<CertificateShortInfo> {
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

  private async signer(certificate: CertificateAsync): Promise<CPSignerAsync> {
    const signer: CPSignerAsync = await this.cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');

    const signingTimeAttr = await this.cadesplugin.CreateObjectAsync("CAdESCOM.CPAttribute");
    await signingTimeAttr.propset_Name(this.cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME);
    await signingTimeAttr.propset_Value(new Date());
    // @ts-ignore
    await (await signer.AuthenticatedAttributes2).Add(signingTimeAttr);

    await signer.propset_Certificate(certificate);
    await signer.propset_Options(this.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);

    return signer;
  }

  private async signContent(signer: CPSignerAsync, content: string): Promise<string> {
    console.log(btoa(content));
    const signedData: CadesSignedDataAsync =
      await this.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
    await signedData.propset_ContentEncoding(this.cadesplugin.CADESCOM_BASE64_TO_BINARY);
    await signedData.propset_Content(btoa(content));
    await signer.propset_Options(this.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);

    const detached = false;
    const signedContent = await signedData.SignCades(signer, this.cadesplugin.CADESCOM_CADES_BES, detached);

    return atob(signedContent);
  }
}


function SignCadesBES_Async_File(oSigner: any, fileContent: any): Promise<string> {
  return new Promise((resolve, reject) => {
    cadesplugin.async_spawn(function*() {
      var Signature;
      var detached=false;
      // @ts-ignore
      var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
      // @ts-ignore
      yield oSignedData.propset_ContentEncoding(1); //CADESCOM_BASE64_TO_BINARY
      var dataToSign = fileContent;
      // @ts-ignore
      yield oSignedData.propset_Content(dataToSign);
      var CADES_BES = 1;
      // @ts-ignore
      Signature = yield oSignedData.SignCades(oSigner, CADES_BES,detached);
      // @ts-ignore
      resolve(Signature);
    });
  });
}
