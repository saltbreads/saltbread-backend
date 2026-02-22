export interface TransactionContext<TTx> {
  readonly tx: TTx;
}

export interface ITransactionRunner<TTx> {
  run<T>(callback: (ctx: TransactionContext<TTx>) => Promise<T>): Promise<T>;
}

export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');
