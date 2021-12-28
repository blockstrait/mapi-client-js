import { FailedResponseError, UnexpectedError } from '../errors';
import { Fee } from '../fee';
import { MapiClientConfig } from '../mapi-client-config';
import { sendGetRequest, ServerErrorResponse } from '../send-request';

/**
 * @internal
 * Response returned by the Get Fee Quote endpoint.
 */
export interface GetFeeQuoteEndpointResponse {
  timestamp: string;
  expiryTime: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  fees: Fee[];
}

/**
 * @internal
 * Represents the Get Fee Quote endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#1-get-fee-quote.
 */
export class GetFeeQuoteEndpoint {
  private config: MapiClientConfig;

  constructor(config: MapiClientConfig) {
    this.config = config;
  }

  /**
   * @internal
   * This method uses the Get Fee Quote endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#1-get-fee-quote. All versions up to 1.1.0 of the endpoint are supported.
   */
  async get(): Promise<GetFeeQuoteEndpointResponse> {
    const url = `${this.config.baseUrl}/mapi/feeQuote`;

    let payload;

    try {
      payload = await sendGetRequest(url, this.config.bearerToken);
    } catch (error: any) {
      if (error instanceof ServerErrorResponse) {
        throw new FailedResponseError(error.message);
      } else {
        throw new UnexpectedError(error.message);
      }
    }

    if (payload.returnResult !== 'success') {
      throw new FailedResponseError('Response unsuccessful');
    }

    return {
      timestamp: payload.timestamp,
      expiryTime: payload.expiryTime,
      currentHighestBlockHash: payload.currentHighestBlockHash,
      currentHighestBlockHeight: payload.currentHighestBlockHeight,
      fees: payload.fees,
    };
  }
}
