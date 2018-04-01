import * as bitcoin from 'bitcoinjs-lib';
import { Config } from './config';
import * as Logger from 'bunyan';
import * as rx from 'rxjs';
import { AbstractWallet, BasicWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import secureRandom from 'secure-random';
import * as bip39 from 'bip39';
import { Account, AccountType, NormalAccount } from './account';
import KeyRepository from './key-repository';
import hash160 = bitcoin.crypto.hash160;
import { PurposeField, SupportedCoinType } from './primitives/constants';
import * as util from 'util';
import {BlockchainProxy} from "lib/blockchain-proxy";

interface AbstractWalletService<W extends AbstractWallet> {
  keyRepo: KeyRepository;
  repo: WalletRepository;
  createNew: (nameSpace: string, passPhrase?: string) => Promise<W>;
  createFromSeed: (
    nameSpace: string,
    seed: ReadonlyArray<string>,
    passPhrase: string
  ) => Promise<W>;
  setNewAccountToWallet: (
    wallet: W,
    type: AccountType,
    cointype: SupportedCoinType
  ) => Promise<W | void>;
  discoverAccounts: (wallet: W) => Promise<W>
}

export default class WalletService extends rx.Subject<any>
  implements AbstractWalletService<BasicWallet> {
  private readonly logger: Logger;
  constructor(
    private cfg: Config,
    public readonly keyRepo: KeyRepository,
    public readonly repo: WalletRepository = new WalletRepository(),
    log: Logger
  ) {
    super();
    this.logger = log.child({ subModule: 'WalletService' });
  }

  public async createNew(
    nameSpace: string,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('creating new wallet ...');
    const node = bitcoin.HDNode.fromSeedBuffer(secureRandom(16, {
      type: 'Buffer'
    }) as Buffer);
    const pubKey = node.getPublicKeyBuffer();
    const wallet = new BasicWallet(
      hash160(pubKey).toString('hex'),
      null,
      [],
      this.logger
    );
    this._save(wallet, node);
    return wallet;
  }

  public async createFromSeed(
    nameSpace: string,
    seed: ReadonlyArray<string>,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('creating Wallet from seed...');
    const seedBuffer = bip39.mnemonicToSeed(seed.join(' '), passPhrase);
    const node = bitcoin.HDNode.fromSeedBuffer(seedBuffer);
    const pubkey = node.getPublicKeyBuffer();
    const wallet = new BasicWallet(
      hash160(pubkey).toString('hex'),
      null,
      [],
      this.logger
    );
    this._save(wallet, node);
    return wallet;
  }

  public async discoverAccounts(wallet: BasicWallet, bch: BlockchainProxy, ) {

  }

  public async setNewAccountToWallet(
    wallet: BasicWallet,
    type: AccountType = 'Normal',
    cointype: SupportedCoinType = SupportedCoinType.BTC
  ): Promise<BasicWallet | void> {
    if (type === 'Normal') {
      const accountIndex = wallet.accounts ? wallet.accounts.length : 0;
      const rootNode = this.keyRepo.getHDNode(wallet.id);
      this.logger.trace(`rootNode is ${util.inspect(rootNode)}`);
      if (!rootNode) {
        this.logger.error(`Account can not be created if there are no wallet!`);
        return;
      }
      const accountMasterHD = rootNode.derivePath(
        `m/${PurposeField}/${cointype}/${accountIndex}`
      );
      const id = hash160(accountMasterHD.getPublicKeyBuffer()).toString('hex');
      const account = new NormalAccount(id);
      const walletWithAccount = new BasicWallet(wallet.id, wallet.bchproxy, [
        ...wallet.accounts,
        account
      ] as ReadonlyArray<Account>);
      this._save(account as Account, accountMasterHD);
      return walletWithAccount;
    } else {
      throw new Error(`Account type for ${type} is not supported yet!`);
    }
  }

  private async _save(
    walletOrAcount: BasicWallet | Account,
    key: bitcoin.HDNode
  ): Promise<void> {
    await Promise.all([
      this.keyRepo.setHDNode(walletOrAcount.id, key),
      this.repo.save(walletOrAcount.id, walletOrAcount)
    ]);
    return;
  }
}
