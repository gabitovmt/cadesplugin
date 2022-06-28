export default class FileValue {
  static fileNameWithCustomExtension(fileName: string, extension: string): string {
    return `${fileName.replace(/\.\w+$/, '')}.${extension}`;
  }
}
