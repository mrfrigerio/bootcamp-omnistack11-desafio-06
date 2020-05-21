import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import CreateTransactionsService from './CreateTransactionService';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);
    const createTransactionsService = new CreateTransactionsService();

    const data: TransactionDTO[] = [];
    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      data.push({
        title,
        type,
        value,
        category,
      });
    });

    const transactionFunctions: (() => Promise<
      Transaction
    >)[] = await new Promise(resolve =>
      parseCSV.on('end', () => {
        const transactionFunctionsArray = data.map(d => {
          const pendingTransaction = (): Promise<Transaction> =>
            createTransactionsService.execute(d);
          return pendingTransaction;
        });
        resolve(transactionFunctionsArray);
      }),
    );

    async function persist(): Promise<Transaction[]> {
      const transactions: Transaction[] = [];
      while (transactionFunctions.length > 0) {
        const func = transactionFunctions.shift();
        if (func) {
          const transaction = await func();
          transactions.push(transaction);
        }
      }
      return transactions;
    }

    const transactions = await persist();
    return transactions;
  }
}

export default ImportTransactionsService;
