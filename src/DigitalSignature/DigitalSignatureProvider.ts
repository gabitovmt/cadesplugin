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
   * @param thumbprint  Отпечаток сертификата, с помощью которого подписываем файл
   * @param file        Подписываемый файл
   * @return            Файл с прикреплённой подписью
   */
  async signCreate(thumbprint: string, file: File): Promise<File> {
    throw new TypeError('Method is not implemented');
  }
}
