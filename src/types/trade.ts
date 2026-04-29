export type Trade = {
  account_id: string;
  id: string;
  symbol: string;
  type: "buy" | "sell";
  entry_price: number;
  exit_price: number;
  profit: number;
  lot_size: number;
  stop_loss: number;
  take_profit: number;
  open_time: Date | string | number;
  close_time?: Date | string | number;
};