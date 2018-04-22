import * as bitcoin from 'bitcoinjs-lib';
import { Config } from './config';
import * as Logger from 'bunyan';
import * as rx from '@joemphilips/rxjs';
import {
  AbstractWallet,
  AccountMap,
  BasicWallet,
  NormalAccountMap
} from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import secureRandom from 'secure-random';
import * as bip39 from 'bip39';
import { Account, AccountType, NormalAccount } from './account';
import KeyRepository from './key-repository';
import hash160 = bitcoin.crypto.hash160;
import { PurposeField, SupportedCoinType } from './primitives/constants';
import * as util from 'util';
import { BlockchainProxy, ObservableBlockchain } from './blockchain-proxy';
import { Satoshi } from './primitives/satoshi';
/* tslint:disable no-submodule-imports */
import { none } from 'fp-ts/lib/Option';
import NormalAccountService, {
  AbstractAccountService,
  trySyncAccount
} from './account-service';
import CoinManager from './coin-manager';
import { AccountID } from './primitives/identity';
import { accountCreated } from './actions/account-event';

interface AbstractWalletService<
  W extends AbstractWallet,
  A extends Account,
  AS extends AbstractAccountService<A>
> {
  keyRepo: KeyRepository;
  repo: WalletRepository;
  as: AS;
  createNew: (
    nameSpace: string,
    network: bitcoin.Network,
    passPhrase?: string
  ) => Promise<W>;
  createFromSeed: (
    nameSpace: string,
    seed: ReadonlyArray<string>,
    network: bitcoin.Network,
    passPhrase: string
  ) => Promise<W>;
  setNewAccountToWallet: (
    wallet: W,
    informationSource: ObservableBlockchain,
    bchProxy: BlockchainProxy,
    type: AccountType,
    cointype: SupportedCoinType
  ) => Promise<W | void>;
  discoverAccounts: (
    wallet: W,
    bch: BlockchainProxy,
    informationSource: ObservableBlockchain,
    startHeight: number,
    stopHeight: number
  ) => Promise<W | null>;
  getAddressForWalletAccount: (
    wallet: W,
    accountId: AccountID
  ) => Promise<[W, string, string]>;
}

export default class WalletService
  implements
    AbstractWalletService<BasicWallet, NormalAccount, NormalAccountService> {
  private readonly logger: Logger;
  constructor(
    private cfg: Config,
    public readonly keyRepo: KeyRepository,
    public readonly repo: WalletRepository = new WalletRepository(),
    log: Logger,
    public readonly as: NormalAccountService = new NormalAccountService(
      log,
      keyRepo
    )
  ) {
    this.logger = log.child({ subModule: 'WalletService' });
  }

  public async createNew(
    nameSpace: string,
    network: bitcoin.Network = bitcoin.networks.bitcoin,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('creating new wallet ...');
    const node = bitcoin.HDNode.fromSeedBuffer(
      secureRandom(16, {
        type: 'Buffer'
      }) as Buffer,
      network
    );
    const pubKey = node.getPublicKeyBuffer();
    const wallet = new BasicWallet(
      hash160(pubKey).toString('hex'),
      this.logger
    );
    this._save(wallet, node);
    return wallet;
  }

  public async createFromSeed(
    nameSpace: string,
    seed: ReadonlyArray<string>,
    network: bitcoin.Network = bitcoin.networks.bitcoin,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('creating Wallet from seed...');
    const seedBuffer = bip39.mnemonicToSeed(seed.join(' '), passPhrase);
    const node = bitcoin.HDNode.fromSeedBuffer(seedBuffer, network);
    const pubkey = node.getPublicKeyBuffer();
    const wallet = new BasicWallet(
      hash160(pubkey).toString('hex'),
      this.logger
    );
    this._save(wallet, node);
    return wallet;
  }

  public async discoverAccounts(
    wallet: BasicWallet,
    bch: BlockchainProxy,
    accountsInformationSource: ObservableBlockchain, // not necessary for syncing process, but required for creating accounts.
    startHeight = 0,
    stopHeight = 0,
    cointype: SupportedCoinType = SupportedCoinType.BTC
  ): Promise<BasicWallet> {
    if (await bch.isPruned()) {
      this.logger.error(`cannot recover wallet if blockchain is pruned!`);
      return wallet;
    }

    const master = await this.keyRepo.getHDNode(wallet.id).catch(e => {
      this.logger.error(`${e.toString()}`);
    });
    if (!master) {
      this.logger.warn(`could not find HDNode for this wallet!`);
      return wallet;
    }

    const recoveredWallet = await this.syncHDNode(
      master.derivePath(`${PurposeField}'/${cointype}'`),
      bch,
      wallet,
      accountsInformationSource
    );

    return recoveredWallet;
  }

  public async setNewAccountToWallet(
    wallet: BasicWallet,
    informationSource: ObservableBlockchain,
    bchProxy: BlockchainProxy,
    type: AccountType = AccountType.Normal,
    cointype: SupportedCoinType = SupportedCoinType.BTC
  ): Promise<BasicWallet | void> {
    if (type === AccountType.Normal) {
      const accountIndex = wallet.accounts ? wallet.accounts.size : 0;
      const rootNode = await this.keyRepo.getHDNode(wallet.id).catch(e => {
        this.logger.error(`Account can not be created if there are no wallet!`);
        this.logger.error(`${e.toString()}`);
      });
      this.logger.trace(`rootNode is ${util.inspect(rootNode)}`);
      if (!rootNode) {
        return;
      }
      const accountMasterHD = rootNode.derivePath(
        `${PurposeField}'/${cointype}'/${accountIndex}'`
      );
      const account = await this.as.createFromHD(
        accountMasterHD,
        wallet.accounts.size,
        informationSource,
        bchProxy
      );
      const walletWithAccount = new BasicWallet(
        wallet.id,
        this.logger,
        wallet.accounts.set(account.id, account)
      );
      this._save(wallet, rootNode);
      return walletWithAccount;
    } else {
      throw new Error(`Account type for ${type} is not supported yet!`);
    }
  }

  public async getAddressForWalletAccount(
    w: BasicWallet,
    id: AccountID
  ): Promise<[BasicWallet, string, string]> {
    const account = w.accounts.get(id);
    if (!account) {
      throw new Error(`no accounts found for ${id}`);
    }
    const [a, addr, change] = await this.as.getAddressForAccount(account);
    const newWallet = new BasicWallet(
      w.id,
      this.logger,
      w.accounts.set(a.id, a)
    );
    return [newWallet, addr, change];
  }

  // TODO: decouple this function as a separate object.
  private async syncHDNode(
    masternode: bitcoin.HDNode,
    proxy: BlockchainProxy,
    wallet: BasicWallet,
    accountsInformationSource: ObservableBlockchain
  ): Promise<BasicWallet> {
    let i: number = 0;
    const accounts: NormalAccountMap = new Map();

    while (true) {
      const accountMasterHD = masternode.derive(i);
      const a = await this.as.createFromHD(
        accountMasterHD,
        i,
        accountsInformationSource,
        proxy
      );
      trySyncAccount(a)
        .run()
        .then(r =>
          r.map((acc: NormalAccount) =>
            acc.next({ type: 'syncFinished', payload: {} })
          )
        )
        .catch(r =>
          r.mapLeft((e: Error) =>
            this.logger.error(
              `Something went wrong while syncing the account with the blockchain. ${e}`
            )
          )
        );
      if (!a) {
        break;
      }
      accounts.set(a.id, a);
      i++;
    }

    const w = new BasicWallet(wallet.id, wallet.parentLogger, accounts);
    this._save(w, masternode);
    return w;
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
