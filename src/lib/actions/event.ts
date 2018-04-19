export interface DomainEvent {
  readonly type: string;
  readonly payload: { readonly [key: string]: any };
}
