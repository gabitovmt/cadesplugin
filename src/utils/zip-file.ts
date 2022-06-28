import PizZip from 'pizzip';

export default class ZipFile {
  static async zip(zipFileName: string, files: File[]): Promise<File> {
    const zip = new PizZip();

    await Promise.all(files.map((file) => ZipFile.zipFile(zip, file)));

    const zipContent: Blob = zip.generate({ type: 'blob' });

    return new File([zipContent], zipFileName);
  }

  private static async zipFile(zip: PizZip, file: File) {
    zip.file(file.name, await file.arrayBuffer());
  }
}
