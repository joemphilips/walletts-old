declare module 'mali-logger' {
  import * as Mali from 'mali';
  interface Options {
    fullName: boolean;
  }
  export default function maliLogger(options?: Partial<Options>): Promise<log>;
  export type log = (
    options: Partial<Options>,
    ctx: Mali.Context,
    start: Date,
    error: any,
    event: any
  ) => any;
}
