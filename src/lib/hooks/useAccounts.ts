import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useAccounts() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    const fetchAccounts = async () => {
      // Нэвтэрсэн хэрэглэгчийн ID-г авна
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAccounts([])
        return
      }

      // Зөвхөн тухайн хэрэглэгчийн account-г сонгоно
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)  // user_id баганаар шүүнэ

      setAccounts(data || [])
    }

    fetchAccounts()
  }, [])

  return accounts
}