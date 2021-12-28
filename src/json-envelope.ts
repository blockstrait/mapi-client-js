/* eslint @typescript-eslint/no-require-imports: "off" */
const bsv = require('bsv');

export interface JSONEnvelopeObject {
  payload: string;
  encoding: string;
  mimeType: string;
  signature?: string;
  publicKey?: string;
}

export class JSONEnvelope {
  readonly payload: string;
  readonly encoding: string;
  readonly mimeType: string;
  private signature: any;
  private publicKey: any;

  constructor(params: JSONEnvelopeObject) {
    this.payload = params.payload;
    this.encoding = params.encoding;
    this.mimeType = params.mimeType;

    this.publicKey = null;
    this.signature = null;

    if (params.signature) {
      if (params.publicKey === undefined) {
        throw new TypeError('`publicKey` parameter is required');
      }

      try {
        this.publicKey = bsv.PublicKey.fromString(params.publicKey);
      } catch {
        throw new Error('`publicKey` parameter is invalid');
      }

      try {
        this.signature = bsv.crypto.Signature.fromString(params.signature);
      } catch {
        throw new Error('`signature` parameter is invalid');
      }

      const payloadHash = bsv.crypto.Hash.sha256(
        bsv.deps.Buffer.from(params.payload)
      );

      const isSignatureValid = bsv.crypto.ECDSA.verify(
        payloadHash,
        this.signature,
        this.publicKey
      );

      if (!isSignatureValid) {
        throw new Error('Invalid signature');
      }
    }
  }

  sign(privateKeyStr: string): JSONEnvelope {
    let privateKey;

    try {
      privateKey = bsv.PrivateKey.fromString(privateKeyStr);
    } catch (error) {
      throw new Error('Invalid private key');
    }

    const publicKey = privateKey.publicKey.toString();

    const hash = bsv.crypto.Hash.sha256(bsv.deps.Buffer.from(this.payload));

    const signature = bsv.crypto.ECDSA.sign(hash, privateKey).toString();

    return new JSONEnvelope({
      payload: this.payload,
      mimeType: this.mimeType,
      encoding: this.encoding,
      publicKey,
      signature,
    });
  }

  toObject(): JSONEnvelopeObject {
    const objectRepr: JSONEnvelopeObject = {
      payload: this.payload,
      mimeType: this.mimeType,
      encoding: this.encoding,
    };

    if (this.publicKey && this.signature) {
      objectRepr.publicKey = this.publicKey.toString();
      objectRepr.signature = this.signature.toString();
    }

    return objectRepr;
  }
}
