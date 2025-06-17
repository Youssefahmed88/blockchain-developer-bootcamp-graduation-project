"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createWeb3Modal } from "@web3modal/wagmi/react"
import { type State, WagmiProvider } from "wagmi"
import { config, projectId } from "./wagmi-config"
import type { ReactNode } from "react"

const queryClient = new QueryClient()

if (!projectId) throw new Error("Project ID is not defined")

createWeb3Modal({
  projectId,
  wagmiConfig: config,
  enableAnalytics: true,
  enableOnramp: true,
})

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
