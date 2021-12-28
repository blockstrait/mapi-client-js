import axios from 'axios';

import { JSONEnvelope } from '../src/json-envelope';
import { MapiClient, TransactionFees } from '../src/mapi-client';

jest.mock('axios');

describe('Get fees for transaction', () => {
  it('returns total fees for transaction with data outputs, and different rate for data', async () => {
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

    // Example from https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/feespec
    const rawTx =
      '0200000001047092d2ef3a0c7192a08560e74d2bbcf1d94c9d89a83d17c67a2adaa9da8546020000006b483045022100918b998c14cfc43125be26208af6b3af6d4029d853a9e2101915e7fc3b4c1fbc02206b6ff5f5d04de56de479321a45e5786051ca4084602f1fabbba7c55f3a44a568412102c6391cb6c2b339a27ca03f4a38785ae3b72a8667ae0d0a2b51f87625711574fcffffffff03cc0c0000000000001976a914f12529a2eaf638dd43cd77a760a2b43cc373972188ac00000000000000009a006a4c96436974796f6e636861696e2c4e657720596f726b7c63697479416c62756d7c75706c6f61647c3139302a2a2a2a71712e636f6d7c68747470733a2f2f636974796f6e636861696e2e6f73732d636e2d686f6e676b6f6e672e616c6979756e63732e636f6d2f3135383032313036303432333461613436646664643333643133336334326631316130633534653030363431632e6a70671e5f3d00000000001976a9140cd5ece936542595830dd9ba8e614104b05d8ae988ac00000000';

    const retrievedFees = getFeeQuoteResponse.fees;

    const dataHexParts = [
      '006a4c96436974796f6e636861696e2c4e657720596f726b7c63697479416c62756d7c75706c6f61647c3139302a2a2a2a71712e636f6d7c68747470733a2f2f636974796f6e636861696e2e6f73732d636e2d686f6e676b6f6e672e616c6979756e63732e636f6d2f3135383032313036303432333461613436646664643333643133336334326631316130633534653030363431632e6a7067',
    ];

    const standardParts = [
      '0200000001047092d2ef3a0c7192a08560e74d2bbcf1d94c9d89a83d17c67a2adaa9da8546020000006b483045022100918b998c14cfc43125be26208af6b3af6d4029d853a9e2101915e7fc3b4c1fbc02206b6ff5f5d04de56de479321a45e5786051ca4084602f1fabbba7c55f3a44a568412102c6391cb6c2b339a27ca03f4a38785ae3b72a8667ae0d0a2b51f87625711574fcffffffff03cc0c0000000000001976a914f12529a2eaf638dd43cd77a760a2b43cc373972188ac00000000000000009a',
      '1e5f3d00000000001976a9140cd5ece936542595830dd9ba8e614104b05d8ae988ac00000000',
    ];

    const dataPartSize = dataHexParts
      .map(p => p.length / 2)
      .reduce((total, size) => total + size, 0);

    const standardPartSize = standardParts
      .map(p => p.length / 2)
      .reduce((total, size) => total + size, 0);

    const dataMiningFees = Math.floor(
      (dataPartSize * retrievedFees[0].miningFee.satoshis) /
        retrievedFees[0].miningFee.bytes
    );
    const standardMiningFees = Math.floor(
      (standardPartSize * retrievedFees[1].miningFee.satoshis) /
        retrievedFees[1].miningFee.bytes
    );

    const dataRelayFees = Math.floor(
      (dataPartSize * retrievedFees[0].relayFee.satoshis) /
        retrievedFees[0].relayFee.bytes
    );
    const standardRelayFees = Math.floor(
      (standardPartSize * retrievedFees[1].relayFee.satoshis) /
        retrievedFees[1].relayFee.bytes
    );

    const expectedFees = {
      mining: dataMiningFees + standardMiningFees,
      relay: dataRelayFees + standardRelayFees,
    };

    const transactionFees: TransactionFees =
      await mapiClient.getFeesForTransaction(rawTx);

    expect(transactionFees).toEqual(expectedFees);
  });
});
