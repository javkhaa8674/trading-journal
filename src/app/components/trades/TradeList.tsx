import { useRouter } from "next/navigation";

type Trade = {
  id: string;
  symbol: string;
  type: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  open_time: Date;
  close_time: Date;
  stop_loss: number;
  take_profit: number;
  profit: number;
};

type Props = {
  trades: Trade[];
  onDelete: (id: string) => void;
};

export default function TradeList({ trades, onDelete }: Props) {
  const router = useRouter();

  if (trades.length === 0) {
    return <div>No trades yet</div>;
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Trades</h1>

        <button
          onClick={() => router.push("/trades/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Trade
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border rounded-xl overflow-hidden">
        <thead>
          <tr className="border-b">
            <th className="p-2 bg-gray-100">Symbol</th>
            <th>Type</th>
            <th>Entry Price</th>
            <th>Exit Price</th>
            <th>Lot Size</th>
            <th>Open Date</th>
            <th>Close Date</th>
            <th>Stop Loss</th>
            <th>Take Profit</th>
            <th>Profit</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="text-center border-b">
              <td className="p-2">{t.symbol}</td>

              <td
                className={
                  t.type === "buy"
                    ? "text-blue-600 font-medium"
                    : "text-orange-600 font-medium"
                }
              >
                {t.type}
              </td>

              <td>{t.entry_price}</td>
              <td>{t.exit_price}</td>
              <td>{t.lot_size}</td>
              <td>{t.open_time.toLocaleString()}</td>
              <td>{t.close_time.toLocaleString()}</td>
              <td>{t.stop_loss}</td>
              <td>{t.take_profit}</td>

              <td
                className={
                  t.profit > 0
                    ? "text-green-600 font-semibold"
                    : t.profit < 0
                      ? "text-red-600 font-semibold"
                      : ""
                }
              >
                {Number(t.profit).toFixed(2)}
              </td>

              {/* 🗑️ DELETE BUTTON */}
              <td>
                <button
                  onClick={() => onDelete(t.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
