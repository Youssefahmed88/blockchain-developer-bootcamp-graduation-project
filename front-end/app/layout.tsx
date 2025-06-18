import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import Web3ModalProvider from "@/lib/web3modal-provider"
import { Toaster } from "react-hot-toast"
import { CrowdFundingProvider } from "../../context/CrowdFundingContext"
import { NFTProvider } from "../../context/NFTContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CrowdFund - Decentralized Crowdfunding Platform",
  description: "A decentralized crowdfunding platform built on blockchain technology",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3ModalProvider>
            <CrowdFundingProvider>
              <NFTProvider>{children}</NFTProvider>
            </CrowdFundingProvider>
            <Toaster position="top-center" />
          </Web3ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
