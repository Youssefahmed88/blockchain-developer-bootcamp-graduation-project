"use client"

import { useAccount, useChainId } from "wagmi"

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")

  return (
    <div className="flex flex-col gap-4">
      {/* Web3 Buttons */}
      <div className="flex justify-between gap-4">
        <w3m-button />
        <w3m-network-button />
      </div>

      {/* Connection Status */}
      <div className={`p-3 rounded text-white text-center font-medium ${isConnected ? "bg-green-500" : "bg-red-500"}`}>
        {isConnected ? `متصل: ${address?.slice(0, 6)}...${address?.slice(-4)}` : "غير متصل"}
      </div>

      {/* Network Error */}
      {!isCorrectNetwork && isConnected && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-center">
          يرجى التبديل إلى الشبكة: {process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID}
        </div>
      )}
    </div>
  )
}
