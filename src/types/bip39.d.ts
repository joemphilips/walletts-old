declare module 'bip39' {
  export function mnemonicToSeed(mnemonic: string, password?: string): Buffer;
  export function entropyToMnemonic(
    entropy: string | Buffer,
    wordlist?: ReadonlyArray<string>
  ): string;
}
