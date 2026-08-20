export type TradeType = "buy" | "sell";

export type Trade = {
  id: string;
  user_id: string;
  account_id: string;

  symbol: string;
  type: TradeType;

  entry_price: number;
  exit_price: number;
  profit: number;

  lot_size: number;

  stop_loss: number;
  take_profit: number;

  open_time: string;
  close_time: string | null;
};

export type TradeInsert = {
  account_id: string;

  symbol: string;
  type: TradeType;

  entry_price: number;
  exit_price: number;
  profit: number;

  lot_size: number;

  stop_loss: number;
  take_profit: number;

  open_time: string;
  close_time: string | null;
};

export type TradeUpdate = Partial<TradeInsert>;
