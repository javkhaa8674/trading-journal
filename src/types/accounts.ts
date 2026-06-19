export interface Account {
    id: string;
    user_id: string;
    name: string;
    broker: string;
    broker_id?: string | null;
    mode: string;
    balance: number;
    start_balance?: number;
    status: "active" | "achieved" | "closed";
    created_at: string;
    updated_at?: string;
    last_trade_date?: string | null;
}

export interface AccountWithBroker extends Account {
    broker_name?: string;
    broker_logo?: string;
    broker_leverage?: string;
    broker_website?: string;
    broker_description?: string;
    broker_is_default?: boolean;
}
