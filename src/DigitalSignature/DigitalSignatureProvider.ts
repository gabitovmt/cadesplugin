import '../cadesplugin_api';
import CertificateShortInfo from "./CertificateShortInfo";
import CapicomCertInfoType from "./CapicomCertInfoType";

/**
 * cadesplugin загружается в глобальную область видимости
 */
declare var cadesplugin: Promise<any>;

let digitalSignatureProvider: DigitalSignatureProvider | null = null;

export default class DigitalSignatureProvider {
  static new(): DigitalSignatureProvider {
    if (digitalSignatureProvider == null) {
      throw new TypeError('cadesplugin is not loaded');
    }

    return digitalSignatureProvider;
  }

  async certificates(): Promise<CertificateShortInfo[]> {
    throw new TypeError('Method is not implemented');
  }

  async signCreate(file: File): Promise<File> {
    throw new TypeError('Method is not implemented');
  }

  async signVerify(file: File): Promise<boolean> {
    throw new TypeError('Method is not implemented');
  }
}

class DigitalSignatureSyncProvider extends DigitalSignatureProvider {
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

class DigitalSignatureAsyncProvider extends DigitalSignatureProvider {
  constructor(private readonly cadesplugin: CADESPluginAsync) {
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

// async function main(): Promise<void> {
//   if (canAsync(cadesplugin as CADESPlugin)) {
//     await getCertificatesList(cadesplugin);
//     const signature = await SignCreate(cadesplugin, '1628BD226C5BB9B56C860AFA9FE6C461D22F8DFF', 'data');
//     if (signature !== null) {
//       const result = await SignVerify(cadesplugin, signature, 'data');
//       alert(result);
//     }

    // console.log('test 1');
  // } else {

    // console.log('test 2');
//     getCertificatesListSync(cadesplugin);
//     const signature = SignCreateSync(cadesplugin, '1628BD226C5BB9B56C860AFA9FE6C461D22F8DFF', 'data');
//     if (signature !== null) {
//       const result = SignVerifySync(cadesplugin, signature, 'data');
//       alert(result);
//     }
//   }
// }

// async function getCertificatesList(cadesplugin: CADESPluginAsync): Promise<void> {
//   const store = await cadesplugin.CreateObjectAsync('CAPICOM.Store');
//
//   await store.Open(
//     cadesplugin.CAPICOM_CURRENT_USER_STORE,
//     cadesplugin.CAPICOM_MY_STORE,
//     cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
//
//   const certificates = await store.Certificates;
//
//   const div = document.getElementById('certs');
//   if (div) {
//     const certCount = await certificates.Count;
//     for (let i = 1; i <= certCount; ++i) {
//       const cert = await certificates.Item(i);
//       const elem = document.createElement('p');
//       elem.innerHTML = `${await cert.Thumbprint}<br/>${await cert.SubjectName}`;
//       div.appendChild(elem);
//     }
//   }
//
//   await store.Close();
// }
//
// function getCertificatesListSync(cadesplugin: CADESPluginSync): void {
//   const store = cadesplugin.CreateObject('CAPICOM.Store');
//
//   store.Open(
//     cadesplugin.CAPICOM_CURRENT_USER_STORE,
//     cadesplugin.CAPICOM_MY_STORE,
//     cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
//
//   const div = document.getElementById('certs');
//   if (div) {
//     for (let i = 1; i <= store.Certificates.Count; ++i) {
//       const cert = store.Certificates.Item(i);
//       const elem = document.createElement('p');
//       elem.innerHTML = `${cert.Thumbprint}<br/>${cert.SubjectName}`;
//       div.appendChild(elem);
//     }
//   }
//
//   store.Close();
// }
//
// async function SignCreate(cadesplugin: CADESPluginAsync, thumbprint: string, dataToSign: string): Promise<string | null> {
//   const store = await cadesplugin.CreateObjectAsync('CAPICOM.Store');
//
//   await store.Open(
//     cadesplugin.CAPICOM_CURRENT_USER_STORE,
//     cadesplugin.CAPICOM_MY_STORE,
//     cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
//
//   const certs = await store.Certificates;
//   const result = await certs.Find(cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
//
//   if (await result.Count < 1) {
//     alert('Certificate not found.');
//     return null;
//   }
//
//   const cert = await result.Item(1);
//   const signer = await cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');
//   await signer.propset_Certificate(cert);
//
//   const signedData = await cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
//   await signedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
//   await signedData.propset_Content(dataToSign);
//
//   let signedMessage = '';
//   try {
//     signedMessage = await signedData.SignCades(signer, cadesplugin.CADESCOM_CADES_BES, true);
//   } catch (err) {
//     alert(cadesplugin.getLastError(err));
//     return null;
//   }
//
//   await store.Close();
//
//   return signedMessage;
// }
//
// function SignCreateSync(cadesplugin: CADESPluginSync, thumbprint: string, dataToSign: string): string | null {
//   const store = cadesplugin.CreateObject('CAPICOM.Store');
//
//   store.Open(
//     cadesplugin.CAPICOM_CURRENT_USER_STORE,
//     cadesplugin.CAPICOM_MY_STORE,
//     cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
//
//   const result = store.Certificates.Find(cadesplugin.CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
//
//   if (result.Count < 1) {
//     alert('Certificate not found.');
//     return null;
//   }
//
//   const cert = result.Item(1);
//   const signer = cadesplugin.CreateObject('CAdESCOM.CPSigner');
//   signer.Certificate = cert;
//
//   const signedData = cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
//   signedData.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
//   signedData.Content = dataToSign;
//
//   let signedMessage = '';
//   try {
//     signedMessage = signedData.SignCades(signer, cadesplugin.CADESCOM_CADES_BES, true);
//   } catch (err) {
//     alert(cadesplugin.getLastError(err));
//     return null;
//   }
//
//   store.Close();
//
//   return signedMessage;
// }
//
// async function SignVerify(cadesplugin: CADESPluginAsync, signature: string, origData: string): Promise<boolean> {
//   const data = await cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
//   try {
//     await data.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY);
//     await data.propset_Content(origData);
//     await data.VerifyCades(signature, cadesplugin.CADESCOM_CADES_BES, true);
//     return true;
//   } catch (err) {
//     alert(cadesplugin.getLastError(err));
//     return false;
//   }
// }
//
// function SignVerifySync(cadesplugin: CADESPluginSync, signature: string, origData: string): boolean {
//   const data = cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
//   try {
//     data.ContentEncoding = cadesplugin.CADESCOM_BASE64_TO_BINARY;
//     data.Content = origData;
//     data.VerifyCades(signature, cadesplugin.CADESCOM_CADES_BES, true);
//     return true;
//   } catch (err) {
//     alert(cadesplugin.getLastError(err));
//     return false;
//   }
// }
//




/**
 * Пробуем получить cadesplugin
 */
function init(): void {
  const canPromise = /*!!(window as any).Promise*/false;
  if (canPromise) {
    cadesplugin.then(
      () => main(),
      e => console.error(e)
    );
  } else {
    window.addEventListener("message", cadespluginMessageListener, false);
    window.postMessage("cadesplugin_echo_request", "*");
  }
}

/**
 * Если браузер не поддерживает Promise, то вынуждены получить синхронную версию cadesplugin
 */
function cadespluginMessageListener(event: MessageEvent<any>) {
  if (event.data == 'cadesplugin_loaded') {
    main();
    window.removeEventListener('message', cadespluginMessageListener);
  } else if (event.data == 'cadesplugin_load_error') {
    console.error('Cannot load plugin.');
    window.removeEventListener('message', cadespluginMessageListener);
  }
}

/**
 * Получить асинхронную версию cadesplugin, если он поддерживается
 *
 * @param cadesplugin
 */
function canAsync(cadesplugin: CADESPlugin): cadesplugin is CADESPluginAsync {
  return !!(cadesplugin as CADESPluginAsync).CreateObjectAsync;
}

function main() {
  if (canAsync(cadesplugin as CADESPlugin)) {
    digitalSignatureProvider = new DigitalSignatureAsyncProvider(cadesplugin as CADESPluginAsync);
  } else {
    digitalSignatureProvider = new DigitalSignatureSyncProvider(cadesplugin as CADESPluginSync);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});