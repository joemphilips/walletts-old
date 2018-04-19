import { DomainEvent } from './event';
import { Satoshi } from '../primitives/satoshi';
import { Account } from '../account';
import { AccountID } from '../primitives/identity';

// Action creators
export const watchingAdddressUpdated = (
  addr: string
): WatchingAddressUpdatedEvent => ({
  type: 'watchingAddressUpdated',
  payload: { address: addr }
});
export const accountCreated = (a: Account): AccountCreatedEvent => ({
  type: 'accountCreated',
  payload: { id: a.id }
});
export const credit = (amount: Satoshi): CreditEvent => ({
  type: 'credit',
  payload: { amount }
});
export const debit = (amount: Satoshi): DebitEvent => ({
  type: 'debit',
  payload: { amount }
});

export interface WatchingAddressUpdatedEvent extends DomainEvent {
  type: 'watchingAddressUpdated';
  payload: { address: string };
}

export interface AccountCreatedEvent extends DomainEvent {
  type: 'accountCreated';
  payload: { id: AccountID };
}

export interface CreditEvent extends DomainEvent {
  type: 'credit';
  payload: { amount: Satoshi };
}

export interface DebitEvent extends DomainEvent {
  type: 'debit';
  payload: { amount: Satoshi };
}

export type NormalAccountEvent =
  | WatchingAddressUpdatedEvent
  | AccountCreatedEvent
  | CreditEvent
  | DebitEvent;
