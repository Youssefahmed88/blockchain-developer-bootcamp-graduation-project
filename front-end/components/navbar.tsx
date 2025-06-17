"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { Plus, Home, List, Trophy } from "lucide-react"
import { useAccount, useChainId } from "wagmi"

export function Navbar() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            CrowdFund
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-2" />
                Browse Campaigns
              </Button>
            </Link>
            <Link href="/create">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
            <Link href="/rewards">
              <Button variant="ghost" size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                Rewards
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Web3 Wallet Connection */}
          <div className="flex items-center gap-2">
            <w3m-button />
            <w3m-network-button />
          </div>

          {/* Connection Status */}
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* Network Error Banner */}
      {!isCorrectNetwork && isConnected && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-center py-2 text-sm">
          Please switch to Chain ID: {process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID}
        </div>
      )}
    </nav>
  )
}
