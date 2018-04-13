/**
 * Define `Social` Domain entities.
 */
import {CommunityID, UserID} from './identity';

export interface OtherUser {
  readonly kind: 'otherUser';
  readonly id: UserID;
  readonly name: string;
  readonly knownAddresses: ReadonlyArray<string>
  readonly nextAddressToPay: string
}

export interface Community {
  readonly kind: 'community';
  readonly id: CommunityID;
  readonly name: string;
  readonly knownAddresses: ReadonlyArray<string>
  readonly nextAddressToPay: string
}

/* tslint:disable-next-line */
export interface PublicDomain {
  readonly kind: 'publicDomain';
}

export type OuterEntity = OtherUser | Community | PublicDomain;
