"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface EthPrice {
  usd: number
  usd_24h_change: number
  last_updated_at: number
}

export function EthPrice() {
  const [ethPrice, setEthPrice] = useState<EthPrice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true",
        )
        const data = await response.json()
        setEthPrice({
          usd: data.ethereum.usd,
          usd_24h_change: data.ethereum.usd_24h_change,
          last_updated_at: data.ethereum.last_updated_at,
        })
      } catch (error) {
        console.error("Failed to fetch ETH price:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEthPrice()
    const interval = setInterval(fetchEthPrice, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span>Loading ETH price...</span>
      </div>
    )
  }

  if (!ethPrice) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span>ETH price unavailable</span>
      </div>
    )
  }

  const isPositive = ethPrice.usd_24h_change > 0
  const lastUpdated = new Date(ethPrice.last_updated_at * 1000).toLocaleTimeString()

  return (
    <div className="flex items-center gap-2 text-sm">
      <DollarSign className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">${ethPrice.usd.toLocaleString()}</span>
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-xs">{Math.abs(ethPrice.usd_24h_change).toFixed(2)}%</span>
      </div>
      <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>
    </div>
  )
}
