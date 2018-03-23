// package: LighthouseServer
// file: backendserver.proto

import * as jspb from "google-protobuf";

export class PingRequest extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

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
    message: string,
  }
}

export class PingResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

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
    message: string,
  }
}

export class ACK extends jspb.Message {
  getAck(): number;
  setAck(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ACK.AsObject;
  static toObject(includeInstance: boolean, msg: ACK): ACK.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ACK, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ACK;
  static deserializeBinaryFromReader(message: ACK, reader: jspb.BinaryReader): ACK;
}

export namespace ACK {
  export type AsObject = {
    ack: number,
  }
}

export class CommunityWalletCommitment extends jspb.Message {
  clearCommunitymemberidList(): void;
  getCommunitymemberidList(): Array<string>;
  setCommunitymemberidList(value: Array<string>): void;
  addCommunitymemberid(value: string, index?: number): string;

  getXpub(): string;
  setXpub(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommunityWalletCommitment.AsObject;
  static toObject(includeInstance: boolean, msg: CommunityWalletCommitment): CommunityWalletCommitment.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CommunityWalletCommitment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommunityWalletCommitment;
  static deserializeBinaryFromReader(message: CommunityWalletCommitment, reader: jspb.BinaryReader): CommunityWalletCommitment;
}

export namespace CommunityWalletCommitment {
  export type AsObject = {
    communitymemberidList: Array<string>,
    xpub: string,
  }
}

export class Output extends jspb.Message {
  getAmount(): number;
  setAmount(value: number): void;

  getScript(): Uint8Array | string;
  getScript_asU8(): Uint8Array;
  getScript_asB64(): string;
  setScript(value: Uint8Array | string): void;

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
    amount: number,
    script: Uint8Array | string,
  }
}

export class PaymentDetails extends jspb.Message {
  getNetwork(): string;
  setNetwork(value: string): void;

  clearOutputsList(): void;
  getOutputsList(): Array<Output>;
  setOutputsList(value: Array<Output>): void;
  addOutputs(value?: Output, index?: number): Output;

  getTime(): number;
  setTime(value: number): void;

  getExpires(): number;
  setExpires(value: number): void;

  getMemo(): string;
  setMemo(value: string): void;

  getPaymentUrl(): string;
  setPaymentUrl(value: string): void;

  getMerchantData(): Uint8Array | string;
  getMerchantData_asU8(): Uint8Array;
  getMerchantData_asB64(): string;
  setMerchantData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentDetails.AsObject;
  static toObject(includeInstance: boolean, msg: PaymentDetails): PaymentDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaymentDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaymentDetails;
  static deserializeBinaryFromReader(message: PaymentDetails, reader: jspb.BinaryReader): PaymentDetails;
}

export namespace PaymentDetails {
  export type AsObject = {
    network: string,
    outputsList: Array<Output.AsObject>,
    time: number,
    expires: number,
    memo: string,
    paymentUrl: string,
    merchantData: Uint8Array | string,
  }
}

export class PaymentRequest extends jspb.Message {
  getPaymentDetailsVersion(): number;
  setPaymentDetailsVersion(value: number): void;

  getPkiType(): string;
  setPkiType(value: string): void;

  getPkiData(): Uint8Array | string;
  getPkiData_asU8(): Uint8Array;
  getPkiData_asB64(): string;
  setPkiData(value: Uint8Array | string): void;

  getSerializedPaymentDetails(): Uint8Array | string;
  getSerializedPaymentDetails_asU8(): Uint8Array;
  getSerializedPaymentDetails_asB64(): string;
  setSerializedPaymentDetails(value: Uint8Array | string): void;

  getSignature(): Uint8Array | string;
  getSignature_asU8(): Uint8Array;
  getSignature_asB64(): string;
  setSignature(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PaymentRequest): PaymentRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaymentRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaymentRequest;
  static deserializeBinaryFromReader(message: PaymentRequest, reader: jspb.BinaryReader): PaymentRequest;
}

export namespace PaymentRequest {
  export type AsObject = {
    paymentDetailsVersion: number,
    pkiType: string,
    pkiData: Uint8Array | string,
    serializedPaymentDetails: Uint8Array | string,
    signature: Uint8Array | string,
  }
}

export class Payment extends jspb.Message {
  getMerchantData(): Uint8Array | string;
  getMerchantData_asU8(): Uint8Array;
  getMerchantData_asB64(): string;
  setMerchantData(value: Uint8Array | string): void;

  clearTransactionsList(): void;
  getTransactionsList(): Array<Uint8Array | string>;
  getTransactionsList_asU8(): Array<Uint8Array>;
  getTransactionsList_asB64(): Array<string>;
  setTransactionsList(value: Array<Uint8Array | string>): void;
  addTransactions(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearRefundToList(): void;
  getRefundToList(): Array<Output>;
  setRefundToList(value: Array<Output>): void;
  addRefundTo(value?: Output, index?: number): Output;

  getMemo(): string;
  setMemo(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Payment.AsObject;
  static toObject(includeInstance: boolean, msg: Payment): Payment.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Payment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Payment;
  static deserializeBinaryFromReader(message: Payment, reader: jspb.BinaryReader): Payment;
}

export namespace Payment {
  export type AsObject = {
    merchantData: Uint8Array | string,
    transactionsList: Array<Uint8Array | string>,
    refundToList: Array<Output.AsObject>,
    memo: string,
  }
}

export class PaymentACK extends jspb.Message {
  hasPayment(): boolean;
  clearPayment(): void;
  getPayment(): Payment | undefined;
  setPayment(value?: Payment): void;

  getMemo(): string;
  setMemo(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaymentACK.AsObject;
  static toObject(includeInstance: boolean, msg: PaymentACK): PaymentACK.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaymentACK, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaymentACK;
  static deserializeBinaryFromReader(message: PaymentACK, reader: jspb.BinaryReader): PaymentACK;
}

export namespace PaymentACK {
  export type AsObject = {
    payment?: Payment.AsObject,
    memo: string,
  }
}

export class ProjectDetail extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  getCoverImage(): Uint8Array | string;
  getCoverImage_asU8(): Uint8Array;
  getCoverImage_asB64(): string;
  setCoverImage(value: Uint8Array | string): void;

  getMinPledgeSize(): number;
  setMinPledgeSize(value: number): void;

  getNetwork(): ProjectDetail.Network;
  setNetwork(value: ProjectDetail.Network): void;

  getOutputAddresses(): string;
  setOutputAddresses(value: string): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getExpirationTime(): number;
  setExpirationTime(value: number): void;

  hasOwnerData(): boolean;
  clearOwnerData(): void;
  getOwnerData(): UserData | undefined;
  setOwnerData(value?: UserData): void;

  clearCoFounderDataList(): void;
  getCoFounderDataList(): Array<UserData>;
  setCoFounderDataList(value: Array<UserData>): void;
  addCoFounderData(value?: UserData, index?: number): UserData;

  getPkiType(): ProjectDetail.PKIType;
  setPkiType(value: ProjectDetail.PKIType): void;

  getPkiData(): Uint8Array | string;
  getPkiData_asU8(): Uint8Array;
  getPkiData_asB64(): string;
  setPkiData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProjectDetail.AsObject;
  static toObject(includeInstance: boolean, msg: ProjectDetail): ProjectDetail.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProjectDetail, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProjectDetail;
  static deserializeBinaryFromReader(message: ProjectDetail, reader: jspb.BinaryReader): ProjectDetail;
}

export namespace ProjectDetail {
  export type AsObject = {
    title: string,
    description: string,
    coverImage: Uint8Array | string,
    minPledgeSize: number,
    network: ProjectDetail.Network,
    outputAddresses: string,
    startTime: number,
    expirationTime: number,
    ownerData?: UserData.AsObject,
    coFounderDataList: Array<UserData.AsObject>,
    pkiType: ProjectDetail.PKIType,
    pkiData: Uint8Array | string,
  }

  export enum Network {
    MAIN = 0,
    TEST = 1,
  }

  export enum PKIType {
    NONE = 0,
    X509SHA256 = 1,
  }
}

export class UserData extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserData.AsObject;
  static toObject(includeInstance: boolean, msg: UserData): UserData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserData;
  static deserializeBinaryFromReader(message: UserData, reader: jspb.BinaryReader): UserData;
}

export namespace UserData {
  export type AsObject = {
    email: string,
  }
}

export class PledgeDetails extends jspb.Message {
  getMemo(): string;
  setMemo(value: string): void;

  hasFunderData(): boolean;
  clearFunderData(): void;
  getFunderData(): UserData | undefined;
  setFunderData(value?: UserData): void;

  getInputValue(): number;
  setInputValue(value: number): void;

  getProjectId(): string;
  setProjectId(value: string): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PledgeDetails.AsObject;
  static toObject(includeInstance: boolean, msg: PledgeDetails): PledgeDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PledgeDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PledgeDetails;
  static deserializeBinaryFromReader(message: PledgeDetails, reader: jspb.BinaryReader): PledgeDetails;
}

export namespace PledgeDetails {
  export type AsObject = {
    memo: string,
    funderData?: UserData.AsObject,
    inputValue: number,
    projectId: string,
    timestamp: number,
  }
}

export class ProjectStatus extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): void;

  getAmountPledgedSofar(): number;
  setAmountPledgedSofar(value: number): void;

  clearPledgesList(): void;
  getPledgesList(): Array<PledgeDetails>;
  setPledgesList(value: Array<PledgeDetails>): void;
  addPledges(value?: PledgeDetails, index?: number): PledgeDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ProjectStatus.AsObject;
  static toObject(includeInstance: boolean, msg: ProjectStatus): ProjectStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ProjectStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ProjectStatus;
  static deserializeBinaryFromReader(message: ProjectStatus, reader: jspb.BinaryReader): ProjectStatus;
}

export namespace ProjectStatus {
  export type AsObject = {
    title: string,
    amountPledgedSofar: number,
    pledgesList: Array<PledgeDetails.AsObject>,
  }
}

