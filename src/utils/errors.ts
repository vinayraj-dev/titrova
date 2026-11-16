/** An error whose message is safe and useful to show to the person using a tool. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}

/** Convert anything thrown into a user-facing message. Never leaks stack traces. */
export function toMessage(err: unknown): string {
  if (err instanceof ToolError) return err.message;
  return 'Something went wrong while processing your input. Please check it and try again.';
}
