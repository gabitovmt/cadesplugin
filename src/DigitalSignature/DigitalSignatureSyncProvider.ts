/* eslint-disable no-undef */

import CertificateShortInfo from './CertificateShortInfo';
import CapicomCertInfoType from './CapicomCertInfoType';
import DigitalSignatureProvider from './DigitalSignatureProvider';
import RuError from '../utils/RuError';
import Base64File from '../utils/base64-file';

type Store = CAPICOM.Store;
type Certificates = CAPICOM.Certificates;
type Certificate = CAPICOM.Certificate;
type CPSigner = CAdESCOM.CPSigner;
type CadesSignedData = CAdESCOM.CadesSignedData;

type FilterCertificate = (c: Certificate) => boolean;

export default class DigitalSignatureSyncProvider extends DigitalSignatureProvider {
  public constructor(private readonly cadesplugin: CADESPluginSync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    return this.getCertificates(this.withValidDates);
  }

  public async certificatesWithAlgorithmGOST(): Promise<CertificateShortInfo[]> {
    return this.getCertificates(this.withValidDates, this.withAlgorithmGOST);
  }

  private getCertificates(...filterCertificates: FilterCertificate[]): CertificateShortInfo[] {
    const store = this.store();

    try {
      this.openStore(store);
      return this.findAllCertificates(store)
        .filter((it) => filterCertificates.every((func) => func(it)))
        .map((it) => this.certificateShortInfo(it));
    } finally {
      this.closeStore(store);
    }
  }

  public async signCreate(thumbprint: string, file: File, detached: boolean): Promise<File> {
    const store = this.store();

    try {
      this.openStore(store);

      const certificate: Certificate = this.findCertificateByThumbprint(store, thumbprint);
      const signer: CPSigner = this.signer(certificate);
      const base64Content: string = await (await Base64File.encodeFile(file)).text();
      const signedContent = this.signContent(signer, base64Content, detached);

      return new File([signedContent], `${file.name}.sig`);
    } finally {
      this.closeStore(store);
    }
  }

  private store(): Store {
    return this.cadesplugin.CreateObject('CAPICOM.Store');
  }

  private openStore(store: Store) {
    store.Open(
      this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
      this.cadesplugin.CAPICOM_MY_STORE,
      this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED,
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
      throw RuError.new(
        `Certificate "${thumbprint}" is not found`,
        `Сертификат "${thumbprint}" is not found`,
      );
    } else if (certificates.Count > 1) {
      throw RuError.new(
        `More than one certificate "${thumbprint}" found`,
        `Найдено более одного сертификата "${thumbprint}"`,
      );
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
      issuerDnsName: cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_DNS_NAME)),
    };
  }

  private infoType(infoType: any): CAPICOM.CAPICOM_CERT_INFO_TYPE {
    return infoType as CAPICOM.CAPICOM_CERT_INFO_TYPE;
  }

  private signer(certificate: Certificate): CPSigner {
    const signer: CPSigner = this.cadesplugin.CreateObject('CAdESCOM.CPSigner');

    const signingTimeAttr: CAdESCOM.CPAttribute = this.cadesplugin.CreateObject('CAdESCOM.CPAttribute');
    signingTimeAttr.Name = this.cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME;
    signingTimeAttr.Value = new Date();
    // @ts-ignore
    signer.AuthenticatedAttributes2.Add(signingTimeAttr);

    signer.Certificate = certificate;
    signer.Options = this.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN;

    return signer;
  }

  private signContent(signer: CPSigner, base64Content: string, detached: boolean): string {
    const signedData: CadesSignedData = this.cadesplugin.CreateObject('CAdESCOM.CadesSignedData');
    signedData.ContentEncoding = this.cadesplugin.CADESCOM_BASE64_TO_BINARY;
    signedData.Content = base64Content;

    return signedData.SignCades(signer, this.cadesplugin.CADESCOM_CADES_BES, detached);
  }

  private withAlgorithmGOST(certificate: Certificate): boolean {
    const algorithmId: string = certificate.PublicKey().Algorithm.Value;

    // алгоритм подписи ГОСТ Р 34.10-2012 с ключом 256 бит
    const ALGORITHM_GOST = '1.2.643.7.1.1.1.1';
    return algorithmId === ALGORITHM_GOST;
  }

  private withValidDates(certificate: Certificate): boolean {
    const validFromDate: any = certificate.ValidFromDate;
    const validToDate: any = certificate.ValidToDate;

    const now: number = Date.now();
    const validFromDateMs: number = new Date(validFromDate).getTime();
    const validToDateMs: number = new Date(validToDate).getTime();

    return validFromDateMs <= now && now <= validToDateMs;
  }
}
