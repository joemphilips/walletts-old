import { DomainEvent } from './event';

export interface WalletCreatedEvent extends DomainEvent {
  type: 'walletCreated';
  payload: { id: string };
}

export type WalletEvent = WalletCreatedEvent;
