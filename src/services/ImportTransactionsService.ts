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
      columns: true,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);
    const createTransactionsService = new CreateTransactionsService();

    const data: TransactionDTO[] = [];
    parseCSV.on('data', line => {
      data.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions = Promise.all(
      data.map(async d => {
        const transaction = await createTransactionsService.execute(d);
        return transaction;
      }),
    );

    return transactions;
  }
}

export default ImportTransactionsService;
