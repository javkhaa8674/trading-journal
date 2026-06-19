// src/types/broker.ts
export interface Broker {
    id: string;
    user_id: string;
    name: string;
    logo_url?: string;
    leverage?: string;
    website?: string;
    description?: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface BrokerWithStats extends Broker {
    account_count: number;
    total_balance: number;
}

export interface BrokerFormData {
    name: string;
    logo_url?: string;
    leverage?: string;
    website?: string;
    description?: string;
    is_default: boolean;
}
