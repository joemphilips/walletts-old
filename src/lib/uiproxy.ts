import * as inquirer from 'inquirer';
import { WalletError } from './errors';

export interface WalletAction {
  readonly type: 'createWallet' | 'tryRecover' | 'importWallet' | 'doNothing';
  readonly payload: any;
}

export interface UIProxy {
  createNewWallet(): Promise<WalletAction>;
  readonly mnemonicLength: number;
}

/**
 * below is default implementation for using the Wallet as CLI.
 **/
interface CreateNewWalletAnswers {
  readonly create_new: boolean;
  readonly import: boolean;
}

export class CliUIProxy implements UIProxy {
  public readonly mnemonicLength: number;
  constructor(mnemonicLength: number) {
    if (mnemonicLength % 12 !== 0 || mnemonicLength > 36) {
      throw new WalletError('length of mnemonic must be either of 12, 24, 36!');
    }
    this.mnemonicLength = mnemonicLength;
  }

  public async createNewWallet(): Promise<WalletAction> {
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
      }
    ];

    const answers: CreateNewWalletAnswers = await inquirer.prompt(questions);

    if (answers.create_new) {
      const q = {
        type: 'input',
        name: 'nameSpace',
        message: 'Please enter your wallet name'
      };
      const nameSpace = await inquirer.prompt(q);
      return { type: 'createWallet', payload: nameSpace };
    } else if (answers.import) {
      const mnemonic = this._askMnemonic();
      return { type: 'importWallet', payload: mnemonic };
    } else {
      return { type: 'doNothing', payload: 'none' };
    }
  }

  public async _askMnemonic() {
    const mnemonics: ReadonlyArray<any> = [];
    const q = {
      type: 'input',
      name: 'mnemonic',
      message: `Please enter your BIP39 mnemonic seed ${mnemonics.length + 1}`
    };
    const m = await inquirer.prompt(q);
    mnemonics.push(m);
    if (mnemonics.length === this.mnemonicLength) {
      return mnemonics;
    } else {
      this._askMnemonic();
    }
  }
}