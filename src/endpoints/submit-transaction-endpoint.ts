import { FailedResponseError, UnexpectedError } from '../errors';
import { MapiClientConfig } from '../mapi-client-config';

import { sendPostRequest, ServerErrorResponse } from '../send-request';

/**
 * @internal
 * Parameters to send to the Submit Transaction endpoint.
 */
export interface SubmitTransactionEndpointParams {
  rawtx: string;
}

/**
 * @internal
 * Response returned by the Submit Transaction endpoint.
 */
export interface SubmitTransactionEndpointResponse {
  txid: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  conflictedWith?: string[];
}

/**
 * @internal
 * Represents the Submit Transaction endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#3-query-transaction-status.
 */
export class SubmitTransactionEndpoint {
  private config: MapiClientConfig;

  constructor(config: MapiClientConfig) {
    this.config = config;
  }

  /**
   * This method uses the Submit Transaction endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#2-submit-transaction. All versions up to 1.1.0 of the endpoint are supported.
   */
  async post(
    params: SubmitTransactionEndpointParams
  ): Promise<SubmitTransactionEndpointResponse> {
    const url = `${this.config.baseUrl}/mapi/tx`;

    const data: any = {
      rawtx: params.rawtx,
    };

    let payload;

    try {
      payload = await sendPostRequest(url, data, this.config.bearerToken);
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
      txid: payload.txid,
      currentHighestBlockHash: payload.currentHighestBlockHash,
      currentHighestBlockHeight: payload.currentHighestBlockHeight,
      conflictedWith: payload.conflictedWith,
    };
  }
}
