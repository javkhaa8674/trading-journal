// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id, user_id, name, mode, status, last_trade_date")
    .neq("mode", "live")
    .neq("mode", "demo")
    .neq("mode", "backtest")
    .eq("status", "active");

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const now = new Date();

  for (const acc of accounts || []) {
    if (!acc.last_trade_date) continue;

    const last = new Date(acc.last_trade_date);
    const diffDays = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );

    const remaining = 30 - diffDays;

    if (remaining <= 0) {
      await supabase.from("notifications").insert({
        user_id: acc.user_id,
        type: "account_inactive",
        title: "Account suspended risk",
        message: `${acc.name} account will be closed (30+ days inactive)`,
        read: false,
      });
    } else if (remaining <= 5) {
      await supabase.from("notifications").insert({
        user_id: acc.user_id,
        type: "warning",
        title: "Inactivity warning",
        message: `${acc.name} has ${remaining} days left`,
        read: false,
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: accounts?.length || 0 }),
    { status: 200 },
  );
});
