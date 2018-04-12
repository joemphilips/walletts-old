import * as bitcoin from 'bitcoinjs-lib';
import { Config } from './config';
import * as Logger from 'bunyan';
import * as rx from '@joemphilips/rxjs';
import { AbstractWallet, BasicWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import secureRandom from 'secure-random';
import * as bip39 from 'bip39';
import { Account, AccountType, NormalAccount } from './account';
import KeyRepository from './key-repository';
import hash160 = bitcoin.crypto.hash160;
import { PurposeField, SupportedCoinType } from './primitives/constants';
import * as util from 'util';
import { BlockchainProxy, ObservableBlockchain } from './blockchain-proxy';
import { Balance } from './primitives/balance';
/* tslint:disable no-submodule-imports */
import { none } from 'fp-ts/lib/Option';
import NormalAccountService, {
  AbstractAccountService
} from './account-service';
import CoinManager from './coin-manager';

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
}

export default class WalletService extends rx.Subject<any>
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
    super();
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
      [],
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
      [],
      this.logger
    );
    this._save(wallet, node);
    return wallet;
  }

  public async discoverAccounts(
    wallet: BasicWallet,
    bch: BlockchainProxy,
    accountsInformationSource: ObservableBlockchain, // not necessary for syncing process, but required in Account.
    startHeight = 0,
    stopHeight = 0
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

    const recoveredWallet = this.syncHDNode(
      master,
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
      const accountIndex = wallet.accounts ? wallet.accounts.length : 0;
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
        wallet.accounts.length,
        informationSource,
        bchProxy
      );
      const walletWithAccount = new BasicWallet(wallet.id, [
        ...wallet.accounts,
        account
      ] as ReadonlyArray<Account>);
      this._save(wallet, rootNode);
      return walletWithAccount;
    } else {
      throw new Error(`Account type for ${type} is not supported yet!`);
    }
  }

  // TODO: decouple this function as separate object.
  private syncHDNode(
    masternode: bitcoin.HDNode,
    proxy: BlockchainProxy,
    wallet: BasicWallet,
    accountsInformationSource: ObservableBlockchain
  ): BasicWallet {
    let i: number = 0;
    let balanceSoFar = 0;

    /**
     * returns the last index of address found in the blockchain.
     * @returns {Account | null}
     */
    const recoverAddress = async (
      node: bitcoin.HDNode,
      accountNumber: number,
      bch: ObservableBlockchain
    ): Promise<Account | null> => {
      const addresses = [];
      for (const j of Array(20)) {
        i
          ? addresses.push(node.derive(i + j).getAddress())
          : addresses.push(node.derive(j).getAddress());
      }
      const res = await proxy.getAddressesWithBalance(addresses);
      if (!res) {
        const id = hash160(node.getPublicKeyBuffer()).toString('hex');
        const manager = new CoinManager(this.logger, this.keyRepo, proxy);
        return new NormalAccount(
          id,
          accountNumber,
          manager,
          bch,
          none,
          AccountType.Normal,
          new Balance(balanceSoFar)
        );
      }
      i += res.i;
      balanceSoFar += Object.values(res.addresses).reduce(
        (prev, value) => prev + value,
        0
      );
      return recoverAddress(node, accountNumber, bch);
    };

    let accountIndex = 0;
    const accounts: Account[] = [];
    let endSync = false;
    while (!endSync) {
      recoverAddress(
        masternode.derive(accountIndex),
        accountIndex,
        accountsInformationSource
      ).then(account => {
        if (account) {
          accountIndex++;
          accounts.push(account);
        } else {
          endSync = true;
        }
      });
    }
    this.logger.info(`recovered ${accountIndex} accounts from seed`);
    return new BasicWallet(wallet.id, accounts, wallet.parentLogger);
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
