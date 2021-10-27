import CertificateShortInfo from "./CertificateShortInfo";

/**
 * Провайдер ЭЦП
 */
export default class DigitalSignatureProvider {
  static new(): DigitalSignatureProvider {
    if (this.instance == null) {
      throw new TypeError('cadesplugin is not loaded');
    }

    return this.instance;
  }

  static instance: DigitalSignatureProvider | null = null;

  /**
   * Получить список доступных сертификатов
   */
  async certificates(): Promise<CertificateShortInfo[]> {
    throw new TypeError('Method is not implemented');
  }

  /**
   * Подписать файл
   *
   * @param file Подписываемый файл
   * @return Файл с прикреплённой подписью
   */
  async signCreate(file: File): Promise<File> {
    throw new TypeError('Method is not implemented');
  }

  /**
   * Проверка подписи у файла
   *
   * @param file Проверяемый файл
   * @return Подпись валидная?
   */
  async signVerify(file: File): Promise<boolean> {
    throw new TypeError('Method is not implemented');
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




