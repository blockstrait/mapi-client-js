import {
  GetFeeQuoteEndpoint,
  GetFeeQuoteEndpointResponse,
} from './endpoints/get-fee-quote-endpoint';
import {
  QueryTransactionStatusEndpoint,
  QueryTransactionStatusEndpointResponse,
} from './endpoints/query-transaction-status-endpoint';
import {
  SubmitTransactionEndpoint,
  SubmitTransactionEndpointResponse,
} from './endpoints/submit-transaction-endpoint';
import { FailedResponseError } from './errors';
import { Fee } from './fee';
import { MapiClientConfig } from './mapi-client-config';

/* eslint @typescript-eslint/no-require-imports: "off" */
const bsv = require('bsv');

/**
 * Information returned by the query transaction status endpoint.
 */
export interface TransactionStatus {
  blockHash: string;
  blockHeight: number;
  confirmations: number;
  txSecondMempoolExpiry: number;
}

/**
 * Parameters to use when calling the {@link MapiClient.submitTransaction} method.
 */
export interface SubmitTransactionParams {
  /** Transaction in raw hex string. */
  rawTx: string;
}

export interface SubmitTransactionResponse {
  /** Transaction ID (hash) of the transaction submitted. */
  txid: string;
}

export interface FeeQuote {
  fees: Fee[];
}

export interface TransactionFees {
  mining: number;
  relay: number;
}

/**
 * @internal
 */
function calculateTxId(rawTx: string) {
  const buf = bsv.crypto.Hash.sha256sha256(Buffer.from(rawTx, 'hex'));

  return buf.reverse().toString('hex');
}

/**
 * Client implementation for the MAPI specification as defined in https://github.com/bitcoin-sv-specs/brfc-merchantapi. The following endpoints are supported:
 * - Query Transaction Status (ver 1.1.0)
 * - Submit Transaction (ver 1.1.0)
 * - Get Fee Quote (ver 1.1.0)
 */
export class MapiClient {
  /** @internal */
  private queryTransactionStatusEndpoint: QueryTransactionStatusEndpoint;
  /** @internal */
  private submitTransactionEndpoint: SubmitTransactionEndpoint;
  /** @internal */
  private getFeeQuoteEndpoint: GetFeeQuoteEndpoint;

  constructor(config: MapiClientConfig) {
    this.queryTransactionStatusEndpoint = new QueryTransactionStatusEndpoint(
      config
    );
    this.submitTransactionEndpoint = new SubmitTransactionEndpoint(config);
    this.getFeeQuoteEndpoint = new GetFeeQuoteEndpoint(config);
  }

  /**
   * Return information about a transaction.
   *
   * @param txid Transaction ID (hash) associated with the transaction to query.
   * @returns Information about the requested transaction (see {@link TransactionStatus} for more details).
   */
  async queryTransactionStatus(txid: string): Promise<TransactionStatus> {
    const response: QueryTransactionStatusEndpointResponse =
      await this.queryTransactionStatusEndpoint.get(txid);

    return {
      blockHash: response.blockHash,
      blockHeight: response.blockHeight,
      confirmations: response.confirmations,
      txSecondMempoolExpiry: response.txSecondMempoolExpiry,
    };
  }

  /**
   * Submit a transaction to the network.
   * @param params See {@link SubmitTransactionParams} for details
   */
  async submitTransaction(
    params: SubmitTransactionParams
  ): Promise<SubmitTransactionResponse> {
    let response: SubmitTransactionEndpointResponse;

    let txid;

    try {
      response = await this.submitTransactionEndpoint.post({
        rawtx: params.rawTx,
      });

      txid = response.txid;
    } catch (error: any) {
      if (error instanceof FailedResponseError) {
        /* Submitting the transaction could have failed because it
         * has already been submitted. As there is no error code
         * that is specific for these types of failures, check manually
         * using the query status endpoint.
         */
        txid = calculateTxId(params.rawTx);

        try {
          await this.queryTransactionStatus(txid);
        } catch (queryError: any) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return { txid };
  }

  /**
   * Get fee quote from a transaction processor.
   * @param params See {@link FeeQuote} for details.
   */
  async getFeeQuote(): Promise<FeeQuote> {
    const response: GetFeeQuoteEndpointResponse =
      await this.getFeeQuoteEndpoint.get();

    return {
      fees: response.fees,
    };
  }

  /**
   * Get fees in satoshis for a specific final transaction.
   * @param rawTx Raw transaction hex string, including change output and placeholder values for the unlocking scripts.
   * @returns See {@link TransactionFees} for details.
   */
  async getFeesForTransaction(rawTx: string): Promise<TransactionFees> {
    let transaction: any;

    try {
      transaction = new bsv.Transaction(rawTx);
    } catch (error) {
      throw new Error('Invalid transaction');
    }

    const response: GetFeeQuoteEndpointResponse =
      await this.getFeeQuoteEndpoint.get();

    const feeInformation: any = {};

    response.fees.forEach((fee: Fee) => {
      feeInformation[fee.feeType] = {
        mining: fee.miningFee,
        relay: fee.relayFee,
      };
    });

    const headerSize =
      4 +
      4 + // size of version + size of locktime
      bsv.encoding.Varint(transaction.inputs.length).toBuffer().length +
      bsv.encoding.Varint(transaction.outputs.length).toBuffer().length;

    const feesAccumulator: any = {
      standard: {
        relay: headerSize * feeInformation.standard.relay.satoshis,
        mining: headerSize * feeInformation.standard.mining.satoshis,
      },
      data: {
        relay: 0,
        mining: 0,
      },
    };

    transaction.inputs.forEach((input: any) => {
      const inputSize = input.toBufferWriter().toBuffer().length;

      feesAccumulator.standard.relay +=
        inputSize * feeInformation.standard.relay.satoshis;
      feesAccumulator.standard.mining +=
        inputSize * feeInformation.standard.mining.satoshis;
    });

    transaction.outputs.forEach((output: any) => {
      const outputSize = output.getSize();

      const isDataOutput =
        output.script &&
        output.script.chunks &&
        output.script.chunks[0].opcodenum === 0 &&
        output.script.chunks[1].opcodenum === 106;

      const rateType = isDataOutput ? 'data' : 'standard';

      feesAccumulator[rateType].relay +=
        outputSize * feeInformation[rateType].relay.satoshis;
      feesAccumulator[rateType].mining +=
        outputSize * feeInformation[rateType].mining.satoshis;
    });

    const transactionFees: any = {
      mining: 0,
      relay: 0,
    };

    Object.keys(feeInformation).forEach(rateType => {
      ['relay', 'mining'].forEach(feeType => {
        let feesForRateAndType = Math.floor(
          feesAccumulator[rateType][feeType] /
            feeInformation[rateType][feeType].bytes
        );

        const feesLowerThanMinAccepted =
          feesForRateAndType === 0 &&
          feeInformation[rateType][feeType].satoshis !== 0;

        if (feesLowerThanMinAccepted) {
          feesForRateAndType = 1;
        }

        transactionFees[feeType] += feesForRateAndType;
      });
    });

    return transactionFees;
  }
}
