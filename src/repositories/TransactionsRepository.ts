import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const result: Balance = transactions.reduce(
      (balance, transaction) => {
        if (transaction.type === 'income') {
          return {
            ...balance,
            income: balance.income + transaction.value,
            total: balance.total + transaction.value,
          };
        }
        return {
          ...balance,
          outcome: balance.outcome + transaction.value,
          total: balance.total - transaction.value,
        };
      },
      { income: 0, outcome: 0, total: 0 },
    );
    return result;
  }
}

export default TransactionsRepository;
