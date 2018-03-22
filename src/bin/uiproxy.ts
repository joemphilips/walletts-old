import * as inquirer from 'inquirer';
import { WalletError } from '../lib/errors';

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

export interface UIProxy {
  readonly mnemonicLength: number;
  /**
   * must return
   * 1. which action Wallet Service must take
   * 2. information necessary for that action
   */
  readonly setupWalletInteractive: () => Promise<WalletAction>;
}

/**
 * below is default implementation for using the Wallet as CLI.
 */

interface CreateNewWalletAnswers {
  readonly create_new: boolean;
  readonly import: boolean;
  readonly passPhrase: string;
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
}
