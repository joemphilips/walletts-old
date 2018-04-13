/**
 * Define `Social` Domain entities.
 */
import { CommunityID, UserID } from './identity';

export interface OtherUser {
  readonly kind: 'otherUser';
  readonly id: UserID;
  readonly name: string;
  readonly knownAddresses: ReadonlyArray<string>;
  readonly nextAddressToPay: string;
}

export interface Community {
  readonly kind: 'community';
  readonly id: CommunityID;
  readonly name: string;
  readonly knownAddresses: ReadonlyArray<string>;
  readonly nextAddressToPay: string;
}

/* tslint:disable-next-line */
export interface PublicDomain {
  readonly kind: 'publicDomain';
  readonly knownAddresses: ReadonlyArray<string>;
  readonly nextAddressToPay: string;
}

export function isOtherUser(entity: OuterEntity): entity is OtherUser {
  return entity.kind === 'otherUser';
}

export function iSCommunity(entity: OuterEntity): entity is Community {
  return entity.kind === 'community';
}

export function PublicDomain(entity: OuterEntity): entity is OuterEntity {
  return entity.kind === 'publicDomain';
}

export type OuterEntity = OtherUser | Community | PublicDomain;
