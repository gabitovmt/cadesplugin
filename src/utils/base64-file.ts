import base64 from 'base64-js';

export default class Base64File {
  static async decodeFile(b64: File): Promise<File> {
    let b64WithoutNewLines = Base64File.base64ContentWithoutNewLines(
      await b64.text()
    );

    if (b64WithoutNewLines.length % 4 > 0) {
      b64WithoutNewLines = b64WithoutNewLines.padEnd(
        b64WithoutNewLines.length + (4 - (b64WithoutNewLines.length % 4)),
        '='
      );
    }

    return new File([base64.toByteArray(b64WithoutNewLines)], b64.name);
  }

  private static base64ContentWithoutNewLines(rawB64: string): string {
    return rawB64.replace(/[\n\r]/g, '');
  }

  static async encodeFile(raw: File): Promise<File> {
    const uint8: Uint8Array = new Uint8Array(await raw.arrayBuffer());

    return new File([base64.fromByteArray(uint8)], raw.name);
  }
}
