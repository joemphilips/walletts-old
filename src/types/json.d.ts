declare module '*/transaction.json' {
  const value: {
    valid: {
      description: string;
      id: string;
      hash: string;
      hex: string;
      coinbase: boolean;
      raw: any;
      virtualSize: number;
      weight: number;
      whex?: string;
      [key: string]: any;
    }[];
    hashForSignature: any[];
    hashForWitnessV0: {
      [key: string]: any;
    };
    invalid: {
      addInput: any;
      fromBuffer: any;
    };
  };
  export default value;
}
