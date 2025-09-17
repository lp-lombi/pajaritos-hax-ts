import { AppDataSource } from "../db/data-source";
import { Transaction, TransactionType, Wallet } from "../entities/Economy";
import { PHError } from "../utils/PHError";

export class EconomyService {
    private static instance: EconomyService;
    constructor(
        private walletRepository = AppDataSource.getRepository(Wallet),
        private transactionRepository = AppDataSource.getRepository(Transaction)
    ) {}

    public static getInstance(): EconomyService {
        if (!EconomyService.instance) {
            EconomyService.instance = new EconomyService();
        }
        return EconomyService.instance;
    }

    async getWalletByUserId(userId: number): Promise<Wallet | null> {
        return this.walletRepository.findOne({ where: { userId } });
    }

    async registerTransaction(
        toUserId: number,
        byUserId: number | null,
        amount: number,
        type: TransactionType
    ): Promise<Transaction> {
        const newTransaction = this.transactionRepository.create({
            toUser: { id: toUserId },
            byUser: byUserId && type === "transfer" ? { id: byUserId } : null,
            amount,
            type,
            date: new Date(),
        });
        let toUserWallet = await this.walletRepository.findOne({
            where: { userId: toUserId },
        });
        if (!toUserWallet) {
            toUserWallet = this.walletRepository.create({ userId: toUserId });
            await this.walletRepository.save(toUserWallet);
        }
        if (type === "reward" || type === "transfer") {
            toUserWallet.balance += amount;
            toUserWallet.totalEarned += amount;
            const byUserWallet = byUserId
                ? await this.walletRepository.findOne({ where: { userId: byUserId } })
                : null;
            if (type === "transfer") {
                if (!byUserWallet) {
                    throw new PHError("El usuario origen no registró créditos");
                }
                if (byUserWallet.balance < amount) {
                    throw new PHError("Fondos insuficientes");
                }
                byUserWallet.balance -= amount;
                byUserWallet.totalSpent += amount;
                await this.walletRepository.save(byUserWallet);
            }
        } else if (type === "purchase" || type === "penalty") {
            if (toUserWallet.balance < amount && type === "purchase") {
                throw new PHError("Fondos insuficientes");
            }
            toUserWallet.balance -= amount;
            toUserWallet.totalSpent += amount;
        }
        await this.walletRepository.save(toUserWallet);
        return this.transactionRepository.save(newTransaction);
    }
}
