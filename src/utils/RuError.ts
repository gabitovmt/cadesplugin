export default class RuError extends Error {
  private constructor(
    message: string,
    public readonly ruMessage: string,
  ) {
    super(message);
  }

  static new(message: string, ruMessage: string): RuError {
    return new RuError(message, ruMessage);
  }
}
