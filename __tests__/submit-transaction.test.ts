import axios from 'axios';

import { JSONEnvelope } from '../src/json-envelope';
import { MapiClient, SubmitTransactionResponse } from '../src/mapi-client';

jest.mock('axios');

describe('Submit transaction', () => {
  it('returns valid `SubmitTransactionResponse` object after submitting a transaction to the network', async () => {
    const submitTransactionEndpointResponse = {
      apiVersion: '1.1.0',
      timestamp: '2020-11-13T07:37:44.8783319Z',
      returnResult: 'success',
      resultDescription: '',
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
      minerId:
        '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
      currentHighestBlockHash:
        '39e3a2a0e7ba1b9e331cfd396cef1a2d3baffa51624af2f5512e530f35a8aa43',
      currentHighestBlockHeight: 151,
      txSecondMempoolExpiry: 0,
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(submitTransactionEndpointResponse),
      mimeType: 'application/json',
      encoding: 'UTF-8',
    });

    const axiosResponse: any = {
      data: jsonEnvelope.toObject(),
    };

    (axios.post as jest.Mock).mockReset().mockResolvedValueOnce(axiosResponse);

    const mapiClient = new MapiClient({
      baseUrl: 'mAPI endpoint URL',
      bearerToken: 'bearer token',
    });

    const submitTransactionResponse: SubmitTransactionResponse =
      await mapiClient.submitTransaction({
        rawTx:
          '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1c03d7c6082f7376706f6f6c2e636f6d2f3edff034600055b8467f0040ffffffff01247e814a000000001976a914492558fb8ca71a3591316d095afc0f20ef7d42f788ac00000000',
      });

    const expectedResponse: SubmitTransactionResponse = {
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
    };

    expect(submitTransactionResponse).toEqual(expectedResponse);
  });

  it('returns valid `SubmitTransactionResponse` object when a valid JSON envelope signature is returned', async () => {
    const submitTransactionEndpointResponse = {
      apiVersion: '1.1.0',
      timestamp: '2020-11-13T07:37:44.8783319Z',
      returnResult: 'success',
      resultDescription: '',
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
      minerId:
        '030d1fe5c1b560efe196ba40540ce9017c20daa9504c4c4cec6184fc702d9f274e',
      currentHighestBlockHash:
        '39e3a2a0e7ba1b9e331cfd396cef1a2d3baffa51624af2f5512e530f35a8aa43',
      currentHighestBlockHeight: 151,
      txSecondMempoolExpiry: 0,
    };

    const jsonEnvelope = new JSONEnvelope({
      payload: JSON.stringify(submitTransactionEndpointResponse),
      mimeType: 'application/json',
      encoding: 'UTF-8',
    });

    const privateKeyStr =
      'KyfTDHt4VVQ8qbnbg3DfdTjzxgJLVxJJmWiGoSTu4Tzt6okSX5UZ';

    const axiosResponse: any = {
      data: jsonEnvelope.sign(privateKeyStr).toObject(),
    };

    (axios.post as jest.Mock).mockReset().mockResolvedValueOnce(axiosResponse);

    const mapiClient = new MapiClient({
      baseUrl: 'mAPI endpoint URL',
      bearerToken: 'bearer token',
    });

    const submitTransactionResponse: SubmitTransactionResponse =
      await mapiClient.submitTransaction({
        rawTx:
          '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1c03d7c6082f7376706f6f6c2e636f6d2f3edff034600055b8467f0040ffffffff01247e814a000000001976a914492558fb8ca71a3591316d095afc0f20ef7d42f788ac00000000',
      });

    const expectedResponse: SubmitTransactionResponse = {
      txid: 'c1d32f28baa27a376ba977f6a8de6ce0a87041157cef0274b20bfda2b0d8df96',
    };

    expect(submitTransactionResponse).toEqual(expectedResponse);
  });
});
