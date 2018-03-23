// package: lighthouse
// file: walletserver.proto

import * as jspb from "google-protobuf";

export class PingRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PingRequest): PingRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PingRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingRequest;
  static deserializeBinaryFromReader(message: PingRequest, reader: jspb.BinaryReader): PingRequest;
}

export namespace PingRequest {
  export type AsObject = {
  }
}

export class PingResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PingResponse): PingResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PingResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingResponse;
  static deserializeBinaryFromReader(message: PingResponse, reader: jspb.BinaryReader): PingResponse;
}

export namespace PingResponse {
  export type AsObject = {
  }
}

export class TransactionDetails extends jspb.Message {
  getHash(): Uint8Array | string;
  getHash_asU8(): Uint8Array;
  getHash_asB64(): string;
  setHash(value: Uint8Array | string): void;

  getTransaction(): Uint8Array | string;
  getTransaction_asU8(): Uint8Array;
  getTransaction_asB64(): string;
  setTransaction(value: Uint8Array | string): void;

  clearDebitsList(): void;
  getDebitsList(): Array<TransactionDetails.Input>;
  setDebitsList(value: Array<TransactionDetails.Input>): void;
  addDebits(value?: TransactionDetails.Input, index?: number): TransactionDetails.Input;

  clearCreditsList(): void;
  getCreditsList(): Array<TransactionDetails.Output>;
  setCreditsList(value: Array<TransactionDetails.Output>): void;
  addCredits(value?: TransactionDetails.Output, index?: number): TransactionDetails.Output;

  getFee(): number;
  setFee(value: number): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransactionDetails.AsObject;
  static toObject(includeInstance: boolean, msg: TransactionDetails): TransactionDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TransactionDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransactionDetails;
  static deserializeBinaryFromReader(message: TransactionDetails, reader: jspb.BinaryReader): TransactionDetails;
}

export namespace TransactionDetails {
  export type AsObject = {
    hash: Uint8Array | string,
    transaction: Uint8Array | string,
    debitsList: Array<TransactionDetails.Input.AsObject>,
    creditsList: Array<TransactionDetails.Output.AsObject>,
    fee: number,
    timestamp: number,
  }

  export class Input extends jspb.Message {
    getIndex(): number;
    setIndex(value: number): void;

    getPreviousAccount(): number;
    setPreviousAccount(value: number): void;

    getPreviousAmount(): number;
    setPreviousAmount(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Input.AsObject;
    static toObject(includeInstance: boolean, msg: Input): Input.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Input, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Input;
    static deserializeBinaryFromReader(message: Input, reader: jspb.BinaryReader): Input;
  }

  export namespace Input {
    export type AsObject = {
      index: number,
      previousAccount: number,
      previousAmount: number,
    }
  }

  export class Output extends jspb.Message {
    getIndex(): number;
    setIndex(value: number): void;

    getAccount(): number;
    setAccount(value: number): void;

    getInternal(): boolean;
    setInternal(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Output.AsObject;
    static toObject(includeInstance: boolean, msg: Output): Output.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Output, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Output;
    static deserializeBinaryFromReader(message: Output, reader: jspb.BinaryReader): Output;
  }

  export namespace Output {
    export type AsObject = {
      index: number,
      account: number,
      internal: boolean,
    }
  }
}

export class AccountBalance extends jspb.Message {
  getAccount(): number;
  setAccount(value: number): void;

  getTotalBalance(): number;
  setTotalBalance(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccountBalance.AsObject;
  static toObject(includeInstance: boolean, msg: AccountBalance): AccountBalance.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AccountBalance, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccountBalance;
  static deserializeBinaryFromReader(message: AccountBalance, reader: jspb.BinaryReader): AccountBalance;
}

export namespace AccountBalance {
  export type AsObject = {
    account: number,
    totalBalance: number,
  }
}

export class NetworkRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NetworkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: NetworkRequest): NetworkRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NetworkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NetworkRequest;
  static deserializeBinaryFromReader(message: NetworkRequest, reader: jspb.BinaryReader): NetworkRequest;
}

export namespace NetworkRequest {
  export type AsObject = {
  }
}

export class NetworkResponse extends jspb.Message {
  getActiveNetwork(): number;
  setActiveNetwork(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NetworkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: NetworkResponse): NetworkResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NetworkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NetworkResponse;
  static deserializeBinaryFromReader(message: NetworkResponse, reader: jspb.BinaryReader): NetworkResponse;
}

export namespace NetworkResponse {
  export type AsObject = {
    activeNetwork: number,
  }
}

export class CreateWalletRequest extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): void;

  getPassphrase(): string;
  setPassphrase(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateWalletRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateWalletRequest): CreateWalletRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateWalletRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateWalletRequest;
  static deserializeBinaryFromReader(message: CreateWalletRequest, reader: jspb.BinaryReader): CreateWalletRequest;
}

export namespace CreateWalletRequest {
  export type AsObject = {
    namespace: string,
    passphrase: string,
  }
}

export class CreateWalletResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateWalletResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateWalletResponse): CreateWalletResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateWalletResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateWalletResponse;
  static deserializeBinaryFromReader(message: CreateWalletResponse, reader: jspb.BinaryReader): CreateWalletResponse;
}

export namespace CreateWalletResponse {
  export type AsObject = {
    success: boolean,
  }
}

export class ImportWalletRequest extends jspb.Message {
  hasCreateWalletRequest(): boolean;
  clearCreateWalletRequest(): void;
  getCreateWalletRequest(): CreateWalletRequest | undefined;
  setCreateWalletRequest(value?: CreateWalletRequest): void;

  clearSeedList(): void;
  getSeedList(): Array<string>;
  setSeedList(value: Array<string>): void;
  addSeed(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ImportWalletRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ImportWalletRequest): ImportWalletRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ImportWalletRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ImportWalletRequest;
  static deserializeBinaryFromReader(message: ImportWalletRequest, reader: jspb.BinaryReader): ImportWalletRequest;
}

export namespace ImportWalletRequest {
  export type AsObject = {
    createWalletRequest?: CreateWalletRequest.AsObject,
    seedList: Array<string>,
  }
}

export class GetWalletRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWalletRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetWalletRequest): GetWalletRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetWalletRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWalletRequest;
  static deserializeBinaryFromReader(message: GetWalletRequest, reader: jspb.BinaryReader): GetWalletRequest;
}

export namespace GetWalletRequest {
  export type AsObject = {
  }
}

