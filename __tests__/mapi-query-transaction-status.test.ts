import axios from 'axios';

import { JSONEnvelope } from '../src/json-envelope';
import { MapiClient, TransactionStatus } from '../src/mapi-client';

jest.mock('axios');

describe('Query transaction status', () => {
  it('returns valid `TransactionStatus` object when requesting transaction status', async () => {
    const queryTransactionStatusResponse = {
      apiVersion: '1.1.0',
      returnResult: 'success',
      blockHash:
        '0000000000000000022a3ed8faa3cd3e8f497109dac14f11f1f5e6e62d1da721',
      blockHeight: 684277,
      confirmations: 112,
      minerId:
        '0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087',
      txSecondMempoolExpiry: 0,
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(queryTransactionStatusResponse),
      mimeType: 'application/json',
      encoding: 'UTF-8',
    });

    const axiosResponse: any = {
      data: jsonEnvelope.toObject(),
    };

    (axios.get as jest.Mock).mockReset().mockResolvedValueOnce(axiosResponse);

    const mapiClient = new MapiClient({
      baseUrl: 'mAPI endpoint URL',
      bearerToken: 'bearer token',
    });

    const transactionStatus: TransactionStatus =
      await mapiClient.queryTransactionStatus(
        '29b41056a1b560a2f0c29844be048c886510c7e8788c6483f8a862710660f626'
      );

    const expectedTransationStatus: TransactionStatus = {
      blockHash: queryTransactionStatusResponse.blockHash,
      blockHeight: queryTransactionStatusResponse.blockHeight,
      confirmations: queryTransactionStatusResponse.confirmations,
      txSecondMempoolExpiry:
        queryTransactionStatusResponse.txSecondMempoolExpiry,
    };

    expect(transactionStatus).toEqual(expectedTransationStatus);
  });

  it('returns valid `TransactionStatus` object when a valid JSON envelope signature is returned', async () => {
    const queryTransactionStatusResponse = {
      apiVersion: '1.1.0',
      returnResult: 'success',
      blockHash:
        '0000000000000000022a3ed8faa3cd3e8f497109dac14f11f1f5e6e62d1da721',
      blockHeight: 684277,
      confirmations: 112,
      minerId:
        '0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087',
      txSecondMempoolExpiry: 0,
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(queryTransactionStatusResponse),
      mimeType: 'application/json',
      encoding: 'UTF-8',
    });

    const privateKeyStr =
      'KyfTDHt4VVQ8qbnbg3DfdTjzxgJLVxJJmWiGoSTu4Tzt6okSX5UZ';

    const axiosResponse: any = {
      data: jsonEnvelope.sign(privateKeyStr).toObject(),
    };

    (axios.get as jest.Mock).mockReset().mockResolvedValueOnce(axiosResponse);

    const mapiClient = new MapiClient({
      baseUrl: 'mAPI endpoint URL',
      bearerToken: 'bearer token',
    });

    const transactionStatus: TransactionStatus =
      await mapiClient.queryTransactionStatus(
        '29b41056a1b560a2f0c29844be048c886510c7e8788c6483f8a862710660f626'
      );

    const expectedTransationStatus: TransactionStatus = {
      blockHash: queryTransactionStatusResponse.blockHash,
      blockHeight: queryTransactionStatusResponse.blockHeight,
      confirmations: queryTransactionStatusResponse.confirmations,
      txSecondMempoolExpiry:
        queryTransactionStatusResponse.txSecondMempoolExpiry,
    };

    expect(transactionStatus).toEqual(expectedTransationStatus);
  });
});
