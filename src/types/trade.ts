export type Trade = {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  entry_price: number;
  exit_price: number;
  profit: number;
  close_time?: Date | string | number;
};