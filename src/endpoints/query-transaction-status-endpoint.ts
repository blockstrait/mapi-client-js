import { FailedResponseError, UnexpectedError } from '../errors';
import { MapiClientConfig } from '../mapi-client-config';

import { sendGetRequest, ServerErrorResponse } from '../send-request';

/**
 * @internal
 * Response returned by the Query Transaction Status endpoint.
 */
export interface QueryTransactionStatusEndpointResponse {
  blockHash: string;
  blockHeight: number;
  confirmations: number;
  txSecondMempoolExpiry: number;
}

/**
 * @internal
 * Represents the Query Transaction Status endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#3-query-transaction-status.
 */
export class QueryTransactionStatusEndpoint {
  private config: MapiClientConfig;

  constructor(config: MapiClientConfig) {
    this.config = config;
  }

  /**
   * @internal
   * This method uses the Query Transaction Status endpoint, described in https://github.com/bitcoin-sv-specs/brfc-merchantapi#3-query-transaction-status. All versions up to 1.1.0 of the endpoint are supported.
   */
  async get(txid: string): Promise<QueryTransactionStatusEndpointResponse> {
    const url = `${this.config.baseUrl}/mapi/tx/${txid}`;

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
      blockHash: payload.blockHash,
      blockHeight: payload.blockHeight,
      confirmations: payload.confirmations,
      txSecondMempoolExpiry: payload.txSecondMempoolExpiry,
    };
  }
}
