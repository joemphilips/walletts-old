declare module 'secure-random' {
  export default function secureRandom(
    count: number,
    options: Options
  ): any[] | Buffer | Uint8Array;
  interface Options {
    type: 'Array' | 'Buffer' | 'Uint8Array';
  }
}
