declare module 'bip39' {
  export function mnemonicToSeed(mnemonic: string, password?: string): Buffer;
}
