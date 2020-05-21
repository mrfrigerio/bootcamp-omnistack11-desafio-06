import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionRepository.getBalance();
    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError(
        "You don't have enought balance to execute this transaction!",
        400,
      );
    }

    let newCategory = await categoryRepository.findOne({
      title: category,
    });

    if (!newCategory) {
      newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: newCategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
