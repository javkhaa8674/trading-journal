// types/deposit.ts
export type Deposit = {
    id: string;
    user_id: string;
    account_id: string;
    amount: number;
    method: "bank_transfer" | "crypto" | "credit_card" | "paypal" | "other";
    status: "pending" | "completed" | "failed" | "cancelled";
    transaction_id?: string;
    description?: string;
    date: string;
    created_at: string;
};

export type DepositMethod = {
    id: string;
    name: string;
    icon: string;
    minAmount: number;
    maxAmount: number;
    processingTime: string;
    fee: number;
};