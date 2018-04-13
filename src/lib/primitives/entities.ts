/**
 * Define `Social` Domain entities.
 */
import {UserID} from "./identity";

export interface OtherUser {
  readonly kind: "otherUser",
  readonly id: UserID,
  readonly name: string,
}

export interface Community {
  readonly kind: "community",
  readonly name: string,
}

/* tslint:disable-next-line */
export interface PublicDomain {
  readonly kind: "publicDomain"
};

export type OuterEntity = OtherUser | Community | PublicDomain