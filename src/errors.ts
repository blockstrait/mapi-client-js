export class InvalidResponseError extends Error {
  constructor() {
    super('Invalid response received');
  }
}

export class InvalidSignatureError extends Error {
  constructor() {
    super('Invalid signature');
  }
}

export class MalformedResponseError extends Error {
  constructor(message: string) {
    super(`Malformed response received: ${message}`);
  }
}

export class FailedResponseError extends Error {
  constructor(message: string) {
    super(`Failed response received: ${message}`);
  }
}

export class UnexpectedError extends Error {
  constructor(message: string) {
    super(`Unexpected error: ${message}`);
  }
}
