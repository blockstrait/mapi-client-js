/**
 * Represents a Fee object returned by transaction processors, as described in https://github.com/bitcoin-sv-specs/brfc-misc/tree/master/feespec.
 */
export interface Fee {
  feeType: string;
  miningFee: {
    satoshis: number;
    bytes: number;
  };
  relayFee: {
    satoshis: number;
    bytes: number;
  };
}
