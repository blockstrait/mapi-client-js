import axios from 'axios';

import { JSONEnvelope } from '../src/json-envelope';
import { MapiClient, FeeQuote } from '../src/mapi-client';

jest.mock('axios');

describe('Get fee quote', () => {
  it('returns valid `FeeQuote` object when requesting a fee quote', async () => {
    const getFeeQuoteResponse = {
      apiVersion: '1.1.0',
      timestamp: '2020-11-13T07:37:44.8783319Z',
      expiryTime: '2020-11-13T07:37:44.8783319Z',
      returnResult: 'success',
      resultDescription: '',
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
      minerId:
        '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
      currentHighestBlockHash:
        '39e3a2a0e7ba1b9e331cfd396cef1a2d3baffa51624af2f5512e530f35a8aa43',
      currentHighestBlockHeight: 151,
      fees: [
        {
          feeType: 'standard',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
        {
          feeType: 'data',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
      ],
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(getFeeQuoteResponse),
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

    const feeQuote: FeeQuote = await mapiClient.getFeeQuote();

    const expectedFeeQuote: FeeQuote = {
      fees: [
        {
          feeType: 'standard',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
        {
          feeType: 'data',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
      ],
    };

    expect(feeQuote).toEqual(expectedFeeQuote);
  });

  it('returns valid `FeeQuote` object when a valid JSON envelope signature is returned', async () => {
    const getFeeQuoteResponse = {
      apiVersion: '1.1.0',
      timestamp: '2020-11-13T07:37:44.8783319Z',
      expiryTime: '2020-11-13T07:37:44.8783319Z',
      returnResult: 'success',
      resultDescription: '',
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
      minerId:
        '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
      currentHighestBlockHash:
        '39e3a2a0e7ba1b9e331cfd396cef1a2d3baffa51624af2f5512e530f35a8aa43',
      currentHighestBlockHeight: 151,
      fees: [
        {
          feeType: 'standard',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
        {
          feeType: 'data',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
      ],
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(getFeeQuoteResponse),
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

    const feeQuote: FeeQuote = await mapiClient.getFeeQuote();

    const expectedFeeQuote: FeeQuote = {
      fees: [
        {
          feeType: 'standard',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
        {
          feeType: 'data',
          miningFee: {
            satoshis: 500,
            bytes: 1000,
          },
          relayFee: {
            satoshis: 250,
            bytes: 1000,
          },
        },
      ],
    };

    expect(feeQuote).toEqual(expectedFeeQuote);
  });
});
