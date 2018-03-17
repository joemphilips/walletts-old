declare module 'blockchain.info/blockexplorer' {
  interface Options {
    apiCode?: string;
  }

  interface AddressOptions extends Options {
    limit?: number;
    offset?: number;
  }

  interface UTXOOptions extends Options {
    confirmations?: number;
    limit?: number;
  }

  interface Block {
    hash: string;
    version: number;
    previous_block: string;
    merkle_root: string;
    time: number;
    bits: number;
    fee: number;
    nonce: number;
    t_tx: number;
    size: number;
    block_index: number;
    main_chain: boolean;
    height: number;
    received_time: number;
    relayed_by: string;
    transactions: Transaction[];
  }

  interface Transaction {
    double_spend: boolean;
    block_height: number;
    time: number;
    relayed_by: string;
    hash: string;
    tx_index: number;
    version: number;
    size: number;
    inputs: Input[];
    Outputs: Output[];
  }

  interface Input {
    n: string;
    value: number;
    address: string;
    tx_index: number;
    type: number;
    script: string;
    script_sig: string;
    sequence: number;
  }

  interface Output {
    n: string;
    value: number;
    address: string;
    tx_index: number;
    script: string;
    spent: number;
  }

  interface Address {
    hash160: string;
    address: string;
    n_tx: number;
    total_received: number;
    total_sent: number;
    final_balance: number;
    transactions: Transaction[];
  }

  interface UnspentOutput {
    tx_hash: string;
    tx_index: number;
    tx_output_n: number;
    script: string;
    value: number;
    value_hex: string;
    confirmations: number;
  }

  interface Balance {
    final_balance: number;
    n_tx: number;
    total_received: number;
  }

  interface LatestBlock {
    hash: string;
    time: number;
    block_index: number;
    height: number;
    tx_indexes: number[];
  }

  interface SimpleBlock {
    height: number;
    hash: string;
    time: number;
    main_chain: boolean;
  }

  export function usingNetwork(network: number): explorer;
  export interface explorer {
    getBlock: (blockchash: string, options?: Options) => Promise<Block>;
    getTx: (txHash: string, options?: Options) => Promise<Transaction>;
    getBlockHeight: (height: string, options?: Options) => Promise<Block[]>;
    getAddress: (address: string, options?: AddressOptions) => Promise<Address>;
    getMultiAddress: (
      addresses: string[],
      options?: AddressOptions
    ) => Promise<Address[]>;
    getUnspentOutputs: (
      address: string,
      options?: UTXOOptions
    ) => Promise<UnspentOutput[]>;
    getBalance: (addresses: string, options?: Options) => Promise<Balance[]>;
    getLatestBlock: (options?: Options) => Promise<LatestBlock>;
    getUnconfirmedTx: (options?: Options) => Promise<Transaction[]>;
    getBlocks: (time: string, options?: Options) => Promise<SimpleBlock>;
  }
}
