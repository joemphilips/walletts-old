import CoinManager from './coin-manager';
import Keystore, {
  InMemoryKeyRepository,
  default as KeyRepository
} from './key-repository';
import logger, { default as getLogger } from './logger';
import { AccountID } from './primitives/identity';
import * as Logger from 'bunyan';
import { Option } from './primitives/utils';
import { crypto } from 'bitcoinjs-lib';
import hash160 = crypto.hash160;
import { Account, NormalAccount } from './account';
/* tslint:disable-next-line  */
import { Observable } from '@joemphilips/rxjs';

export abstract class AbstractWallet {
  public abstract readonly coinManager: Option<CoinManager>;
  public abstract readonly id: AccountID;
  public abstract readonly accounts: ReadonlyArray<Account> | null;
  public abstract readonly pay: (
    k: Keystore,
    address: string
  ) => Promise<boolean>;
}

interface WalletEvent {
  kind: 'Created';
}

export class BasicWallet extends Observable<WalletEvent>
  implements AbstractWallet {
  public readonly coinManager: Option<CoinManager>;
  private readonly logger: Option<Logger>;
  constructor(
    public readonly id: AccountID,
    public readonly accounts: ReadonlyArray<Account> = [],
    public parentLogger?: Logger
  ) {
    super();
    this.logger = parentLogger
      ? parentLogger.child({ subModule: 'BasicWallet' })
      : null;
    this.coinManager = null;
  }

  public async pay(k: Keystore, address: string): Promise<boolean> {
    if (!this.coinManager) {
      return false;
    }
    await this.coinManager.sign(k);
    return true;
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet extends BasicWallet {}

interface Series {
  readonly id: number;
  readonly isActive: true; // write now it will never deactivate
  readonly pubKeys: ReadonlyArray<Buffer>; // xpub
  readonly pubPrivKeys: ReadonlyArray<Buffer>; // xpriv
  readonly m: number;
}

interface Pool {
  readonly id: number;
  readonly seriesLookup: any;
}
