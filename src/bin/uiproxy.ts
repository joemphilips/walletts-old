import * as inquirer from 'inquirer';
import { WalletError } from '../lib/errors';
import * as ini from 'ini';
import * as fs from 'fs';

// action for wallet creation
export interface CreateWallet {
  kind: 'createWallet';
  payload: {
    nameSpace: string;
    passPhrase: string;
  };
}
export interface ImportWallet {
  kind: 'importWallet';
  payload: {
    nameSpace: string;
    seed: ReadonlyArray<string>;
    passPhrase: string;
  };
}
export interface DoNothing {
  kind: 'doNothing';
  payload: 'none';
}
export type WalletAction = CreateWallet | ImportWallet | DoNothing;
/**
 * below is default implementation for using the Wallet as CLI.
 */

interface CreateNewWalletAnswers {
  readonly create_new: boolean;
  readonly import: boolean;
  readonly passPhrase: string;
}

// action for setting up blockchain proxy
export interface UseBitcoind {
  kind: 'trustedRPC';
  payload: {
    confPath?: string;
    rpcusername: string;
    rpcpass: string;
    rpcip: string;
    rpcport: string;
  };
}
export interface UseBlockchainInfo {
  kind: 'blockchainInfo';
  payload: null;
}
export type BlockchainAction = UseBitcoind | UseBlockchainInfo;
interface SetupBlockchainProxyAnswers {
  readonly bchtype: string;
  readonly path?: string;
  readonly rpcusername: string;
  readonly rpcpass: string;
  readonly rpcip: string;
  readonly rpcport: string;
}

export interface UIProxy {
  readonly mnemonicLength: number;
  /**
   * must return
   * 1. which action Wallet Service must take
   * 2. information necessary for that action
   */
  readonly setupWalletInteractive: () => Promise<WalletAction>;
  readonly chooseBlockchainProxy: () => Promise<BlockchainAction>;
}

export class CliUIProxy implements UIProxy {
  public readonly mnemonicLength: number;
  constructor(mnemonicLength: number) {
    if (mnemonicLength % 12 !== 0 || mnemonicLength > 36) {
      throw new WalletError('length of mnemonic must be either of 12, 24, 36!');
    }
    this.mnemonicLength = mnemonicLength;
  }

  public async setupWalletInteractive(): Promise<WalletAction> {
    const questions: inquirer.Questions<CreateNewWalletAnswers> = [
      {
        type: 'confirm',
        name: 'create_new',
        message: 'Do you want to Create New Wallet from Random Seed?',
        default: false
      },
      {
        type: 'confirm',
        name: 'import',
        message: 'Do you want to import from existing bip39 seed?',
        default: false
      },
      {
        type: 'input',
        name: 'passPhrase',
        message: 'what is your wallet passphrase?',
        default: 'No Passphrase'
      }
    ];

    const answers: CreateNewWalletAnswers = await inquirer.prompt(questions);

    if (answers.create_new) {
      const q = {
        type: 'input',
        name: 'nameSpace',
        message: 'Please enter your wallet name'
      };
      const nameSpace = await inquirer.prompt<string>(q);
      return {
        kind: 'createWallet',
        payload: { nameSpace, passPhrase: answers.passPhrase }
      };
    } else if (answers.import) {
      const mnemonic = await this._askMnemonic();
      return {
        kind: 'importWallet',
        payload: {
          nameSpace: 'hogeWallet',
          seed: mnemonic,
          passPhrase: 'passPhrase'
        }
      };
    } else {
      return { kind: 'doNothing', payload: 'none' };
    }
  }

  public async _askMnemonic(): Promise<ReadonlyArray<string>> {
    const mnemonics: string[] = [];
    const q = {
      type: 'input',
      name: 'mnemonic',
      message: `Please enter your BIP39 mnemonic seed No.${mnemonics.length +
        1}`
    };
    const m = await inquirer.prompt<string>(q);
    mnemonics.push(m);
    if (mnemonics.length === this.mnemonicLength) {
      return mnemonics;
    } else {
      return this._askMnemonic();
    }
  }

  public async chooseBlockchainProxy(): Promise<BlockchainAction> {
    const questions: inquirer.Questions<SetupBlockchainProxyAnswers> = [
      {
        name: 'bchtype',
        type: 'list',
        message:
          'what do you want to use as a source for blockchain information?',
        choices: ['Bitcoind you trust', 'blockchain.info'],
        default: 'Bitcoind you trust'
      },
      {
        name: 'path',
        type: 'input',
        message: 'where is your bitcoin.conf?',
        default: process.env.HOME + '.bitcoin/bitcoin.conf',
        when: (prevAnswers: any) => prevAnswers.bchtype === 'Bitcoind you trust'
      },
      {
        name: 'rpcusername',
        type: 'input',
        message: 'what is your username for bitcoind rpc?',
        when: (prevAnswers: any) => prevAnswers.bchtype === 'Bitcoind you trust'
      },
      {
        name: 'rpcpass',
        type: 'input',
        message: 'And password?',
        when: (prevAnswers: any) => prevAnswers.bchtype === 'Bitcoind you trust'
      },
      {
        name: 'rpcip',
        type: 'input',
        message: 'And its ip? (e.g. `localhost` or `127.0.0.5` )',
        when: (prevAnswers: any) => prevAnswers.bchtype === 'Bitcoind you trust'
      },
      {
        name: 'rpcport',
        type: 'input',
        message: 'And its port? (e.g. 8332)',
        when: (prevAnswers: any) => prevAnswers.bchtype === 'Bitcoind you trust'
      }
    ];
    const answers: SetupBlockchainProxyAnswers = await inquirer.prompt(
      questions
    );
    const { rpcusername, rpcpass, rpcip, rpcport } = answers;
    if (answers.bchtype === 'Bitcoind you trust') {
      return {
        kind: 'trustedRPC',
        payload: { rpcusername, rpcpass, rpcip, rpcport }
      };
    }
    return { kind: 'blockchainInfo', payload: null };
  }
}
