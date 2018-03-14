import * as inquirer from "inquirer";

export interface WalletAction {
  type: "createWallet" | "tryRecover" | "importWallet" | "doNothing";
  payload: any;
}

export interface UIProxy {
  createNewWallet(): Promise<WalletAction>;
  mnemonicLength: number;
}

/**
 * below is default implementation for using the Wallet as CLI.
 **/
interface CreateNewWalletAnswers {
  create_new: boolean;
  import: boolean;
}

export class CliUIProxy implements UIProxy {
  public mnemonicLength: number;
  constructor(mnemonicLength: number) {
    if (mnemonicLength % 12 !== 0 || mnemonicLength > 36) {
      throw new WalletError("length of mnemonic must be either of 12, 24, 36!");
    }
    this.mnemonicLength = mnemonicLength;
  }

  public async createNewWallet(): Promise<WalletAction> {
    const questions: inquirer.Questions<CreateNewWalletAnswers> = [
      {
        type: "confirm",
        name: "create_new",
        message: "Do you want to Create New Wallet from Random Seed?",
        default: false
      },
      {
        type: "confirm",
        name: "import",
        message: "Do you want to import from existing bip39 seed?",
        default: false
      }
    ];

    let answers: CreateNewWalletAnswers = await inquirer.prompt(questions);

    if (answers.create_new) {
      let q = {
        type: "input",
        name: "nameSpace",
        message: "Please enter your wallet name"
      };
      let nameSpace = await inquirer.prompt(q);
      return { type: "createWallet", payload: nameSpace };
    } else if (answers.import) {
      const mnemonic = this._askMnemonic();
      return { type: "importWallet", payload: mnemonic };
    } else {
      return { type: "doNothing", payload: "none" };
    }
  }

  async _askMnemonic() {
    let mnemonics = [];
    let q = {
      type: "input",
      name: "mnemonic",
      message: `Please enter your BIP39 mnemonic seed ${mnemonics.length + 1}`
    };
    let m = await inquirer.prompt(q);
    mnemonics.push(m);
    if (mnemonics.length === this.mnemonicLength) {
      return mnemonics;
    } else {
      this._askMnemonic();
    }
  }
}
