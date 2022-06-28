import CertificateShortInfo from './CertificateShortInfo';
import RuError from '../utils/RuError';
import SignCreateProps from './SignCreateProps';
import ZipFile from '../utils/zip-file';
import FileExtension from '../utils/file-extension';
import FileValue from '../utils/file-value';
import Base64File from '../utils/base64-file';

const CADESPLUGIN_MAX_TIME_LOAD_SEC = 1;
const noCadespluginError = RuError.new(
  'cadesplugin is not loaded',
  'CryptoPro Extension for CAdES Browser plug-in не обнаружен',
);

/**
 * Провайдер ЭЦП
 */
export default class DigitalSignatureProvider {
  static async new(): Promise<DigitalSignatureProvider> {
    if (this.instance) {
      return Promise.resolve(this.instance);
    }
    if (this.instance === null) {
      return Promise.reject(noCadespluginError);
    }

    return new Promise((resolve, reject) => {
      let count = 0;
      const intervalId = setInterval(() => {
        if (this.instance) {
          clearInterval(intervalId);
          resolve(this.instance);
        } else if (this.instance === null || count > CADESPLUGIN_MAX_TIME_LOAD_SEC) {
          clearInterval(intervalId);
          this.instance = null;
          reject(noCadespluginError);
        } else {
          count += 1;
        }
      }, 1000);
    });
  }

  /**
   * undefined - ещё не загружен,
   * null - загрузить не удалось
   */
  static instance: DigitalSignatureProvider | null | undefined;

  /**
   * Получить список доступных сертификатов
   */
  async certificates(): Promise<CertificateShortInfo[]> {
    throw new TypeError('Method is not implemented');
  }

  /**
   * Получить список доступных сертификатов с алгоритмом подписи ГОСТ Р 34.10-2012 с ключом 256 бит
   */
  async certificatesWithAlgorithmGOST(): Promise<CertificateShortInfo[]> {
    throw new TypeError('Method is not implemented');
  }

  /**
   * Подписать файл с настройками по умолчанию
   *
   * @param thumbprint  Отпечаток сертификата, с помощью которого подписываем файл
   * @param file        Подписываемый файл
   * @return            ZIP архив. Содержит исходный файл и отсоединённую подпись в кодировке DER
   */
  async signCreateDefault(thumbprint: string, file: File): Promise<File> {
    return this.signCreateExtended({
      thumbprint,
      file,
      isDetached: true,
      isZip: true,
      isBase64: false,
    });
  }

  /**
   * Подписать файл без архивирования
   *
   * @param thumbprint  Отпечаток сертификата, с помощью которого подписываем файл
   * @param file        Подписываемый файл
   * @return            Отсоединённая подпись в кодировке DER
   */
  async signCreateDefaultWithoutZip(thumbprint: string, file: File): Promise<File> {
    return this.signCreateExtended({
      thumbprint,
      file,
      isDetached: true,
      isZip: false,
      isBase64: false,
    });
  }

  /**
   * Подписать файл. Расширенная версия метода signCreate
   *
   * @param props Параметры подписи
   * @return      Файл. Зависит от параметров подписи
   */
  async signCreateExtended(props: SignCreateProps): Promise<File> {
    const digitalSignature = await this.digitalSignatureFile(props);

    if (!props.isDetached || !props.isZip) {
      return digitalSignature;
    }

    const zipFileName = FileValue.fileNameWithCustomExtension(props.file.name, FileExtension.Zip);

    return ZipFile.zip(zipFileName, [props.file, digitalSignature]);
  }

  private async digitalSignatureFile(props: SignCreateProps): Promise<File> {
    const digitalSignature = await this.signCreate(props.thumbprint, props.file, props.isDetached);

    if (!props.isBase64) {
      return Base64File.decodeFile(digitalSignature);
    }

    return digitalSignature;
  }

  /**
   * Подписать файл
   * @param thumbprint  Отпечаток сертификата, с помощью которого подписываем файл
   * @param file        Подписываемый файл
   * @param detached    Подпись отсоединённая?
   * @return            Файл с присоединённой подписью, если detached = false;
   *                    Файл отсоединённой подписи в противном случае
   */
  async signCreate(thumbprint: string, file: File, detached: boolean): Promise<File> {
    throw new TypeError('Method is not implemented');
  }
}
