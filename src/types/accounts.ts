// src/types/accounts.ts

export interface Account {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  broker_id?: string | null;
  mode: string;

  // ✅ Санхүүгийн талбарууд
  start_balance: number; // Данс эхэлсэн түвшин (тогтмол)
  initial_balance: number; // Одоогийн дансны хэмжээ (өөрчлөгддөг)
  target_balance: number; // Зорилтот түвшин
  max_loss_limit: number; // Алдагдал хязгаар (мөнгөн дүн)
  max_drawdown_percent: number; // Алдагдал хувь

  status: "active" | "achieved" | "closed";
  created_at: string;
  updated_at?: string;
  last_trade_date?: string | null;
  // balance УСТГАСАН ✅
}

export interface AccountWithBroker extends Account {
  broker_name?: string;
  broker_logo?: string;
  broker_leverage?: string;
  broker_website?: string;
  broker_description?: string;
  broker_is_default?: boolean;
}

export interface AccountFormData {
  name: string;
  broker: string;
  broker_name?: string;
  broker_id?: string | null;
  mode: string;
  start_balance: number; // Данс эхлэх үеийн баланс
  initial_balance: number; // Одоогийн баланс
  target_balance: number; // Зорилтот
  max_loss_limit: number; // Алдагдал хязгаар
  max_drawdown_percent: number; // Алдагдал хувь
  status: "active" | "achieved" | "closed";
  last_trade_date?: string | null;
}

export interface AccountProgress {
  startBalance: number; // Эхлэл
  currentBalance: number; // Одоогийн
  target: number; // Зорилт
  lossLimit: number; // Алдагдал хязгаар
  percentage: number; // Progress %
  profit: number; // Ашиг/Алдагдал
  profitPercent: number; // Ашиг %
  distanceToLoss: number; // Алдагдал хүртэл
  totalRange: number; // Нийт хүрээ
}
