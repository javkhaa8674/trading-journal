"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useAccounts() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from("accounts")
        .select("*")

      setAccounts(data || [])
    }

    fetchAccounts()
  }, [])

  return accounts
}