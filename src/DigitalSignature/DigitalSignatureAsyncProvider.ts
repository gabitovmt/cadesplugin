/* eslint-disable no-undef */

import CertificateShortInfo from './CertificateShortInfo';
import CapicomCertInfoType from './CapicomCertInfoType';
import DigitalSignatureProvider from './DigitalSignatureProvider';
import RuError from '../utils/RuError';
import Base64File from '../utils/base64-file';

type StoreAsync = CAPICOM.StoreAsync;
type CertificatesAsync = CAPICOM.CertificatesAsync;
type CertificateAsync = CAPICOM.CertificateAsync;
type CPSignerAsync = CAdESCOM.CPSignerAsync;
type CadesSignedDataAsync = CAdESCOM.CadesSignedDataAsync;

type FilterCertificate = (c: CertificateAsync) => Promise<CertificateAsync | null>;

export default class DigitalSignatureAsyncProvider extends DigitalSignatureProvider {
  public constructor(private readonly cadesplugin: CADESPluginAsync) {
    super();
  }

  public async certificates(): Promise<CertificateShortInfo[]> {
    return this.getCertificates(this.certWithValidDates);
  }

  public async certificatesWithAlgorithmGOST(): Promise<CertificateShortInfo[]> {
    return this.getCertificates(this.certWithValidDates, this.certWithAlgorithmGOST);
  }

  private async getCertificates(...filterCertificates: FilterCertificate[]): Promise<CertificateShortInfo[]> {
    const store = await this.store();

    try {
      await this.openStore(store);

      const certificates: CertificateAsync[] = await this.findAllCertificates(store);

      return this.certificatesShorInfo(await this.filterCertificates(certificates, ...filterCertificates));
    } finally {
      await this.closeStore(store);
    }
  }

  public async signCreate(thumbprint: string, file: File, detached: boolean): Promise<File> {
    const store = await this.store();

    try {
      await this.openStore(store);

      const certificate: CertificateAsync = await this.findCertificateByThumbprint(store, thumbprint);
      const signer: CPSignerAsync = await this.signer(certificate);
      const base64Content: string = await (await Base64File.encodeFile(file)).text();
      const signedContent = await this.signContent(signer, base64Content, detached);

      return new File([signedContent], `${file.name}.sig`);
    } finally {
      await this.closeStore(store);
    }
  }

  private async store(): Promise<StoreAsync> {
    return this.cadesplugin.CreateObjectAsync('CAdESCOM.Store');
  }

  private async openStore(store: StoreAsync): Promise<void> {
    await store.Open(
      this.cadesplugin.CAPICOM_CURRENT_USER_STORE,
      this.cadesplugin.CAPICOM_MY_STORE,
      this.cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED,
    );
  }

  private async closeStore(store: StoreAsync): Promise<void> {
    await store.Close();
  }

  private async findAllCertificates(store: StoreAsync): Promise<CertificateAsync[]> {
    const storeCertificates: CertificatesAsync = await store.Certificates;
    const certificates: Promise<CertificateAsync>[] = [];
    for (let index = 1, count = await storeCertificates.Count; index <= count; index++) {
      certificates.push(storeCertificates.Item(index));
    }

    return Promise.all(certificates);
  }

  private async findCertificateByThumbprint(store: StoreAsync, thumbprint: string): Promise<CertificateAsync> {
    const CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
    const certificates: CertificatesAsync = await (await store.Certificates).Find(CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);

    const count = await certificates.Count;
    if (count === 0) {
      throw RuError.new(
        `Certificate "${thumbprint}" is not found`,
        `Сертификат "${thumbprint}" is not found`,
      );
    } else if (count > 1) {
      throw RuError.new(
        `More than one certificate "${thumbprint}" found`,
        `Найдено более одного сертификата "${thumbprint}"`,
      );
    }

    return certificates.Item(1);
  }

  private async certificatesShorInfo(certificates: CertificateAsync[]): Promise<CertificateShortInfo[]> {
    return Promise.all(
      certificates.map((it) => this.certificateShortInfo(it)),
    );
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
      issuerDnsName: await cert.GetInfo(this.infoType(CapicomCertInfoType.CAPICOM_CERT_INFO_ISSUER_DNS_NAME)),
    };
  }

  private infoType(infoType: any): CAPICOM.CAPICOM_CERT_INFO_TYPE {
    return infoType as CAPICOM.CAPICOM_CERT_INFO_TYPE;
  }

  private async signer(certificate: CertificateAsync): Promise<CPSignerAsync> {
    const signer: CPSignerAsync = await this.cadesplugin.CreateObjectAsync('CAdESCOM.CPSigner');

    const signingTimeAttr = await this.cadesplugin.CreateObjectAsync('CAdESCOM.CPAttribute');
    await signingTimeAttr.propset_Name(this.cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME);
    await signingTimeAttr.propset_Value(new Date());
    // @ts-ignore
    await (await signer.AuthenticatedAttributes2).Add(signingTimeAttr);

    await signer.propset_Certificate(certificate);
    await signer.propset_Options(this.cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);

    return signer;
  }

  private async signContent(signer: CPSignerAsync, base64Content: string, detached: boolean): Promise<string> {
    const signedData: CadesSignedDataAsync = await this.cadesplugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
    await signedData.propset_ContentEncoding(this.cadesplugin.CADESCOM_BASE64_TO_BINARY);
    await signedData.propset_Content(base64Content);

    return signedData.SignCades(signer, this.cadesplugin.CADESCOM_CADES_BES, detached);
  }

  private async filterCertificates(
    certificates: CertificateAsync[], ...filterCertificates: FilterCertificate[]
  ): Promise<CertificateAsync[]> {
    if (filterCertificates.length === 0) {
      return certificates;
    }

    const filterCert: FilterCertificate = filterCertificates[0];
    const filteredCertificates: CertificateAsync[] = (await Promise.all(
      certificates.map((it) => filterCert(it)),
    )).filter((it) => it != null) as CertificateAsync[];

    return this.filterCertificates(filteredCertificates, ...filterCertificates.slice(1));
  }

  private async certWithAlgorithmGOST(certificate: CertificateAsync): Promise<CertificateAsync | null> {
    const publicKey = await certificate.PublicKey();
    const algorithm = await publicKey.Algorithm;
    const algorithmId: string = await algorithm.Value;

    // Алгоритм подписи ГОСТ Р 34.10-2012 с ключом 256 бит
    const ALGORITHM_GOST = '1.2.643.7.1.1.1.1';
    return algorithmId === ALGORITHM_GOST ? certificate : null;
  }

  private async certWithValidDates(certificate: CertificateAsync): Promise<CertificateAsync | null> {
    const validFromDate: any = await certificate.ValidFromDate;
    const validToDate: any = await certificate.ValidToDate;

    const now: number = Date.now();
    const validFromDateMs: number = new Date(validFromDate).getTime();
    const validToDateMs: number = new Date(validToDate).getTime();

    return validFromDateMs <= now && now <= validToDateMs ? certificate : null;
  }
}
