"use client"

import { useState } from "react"
import { useAccount, useWriteContract } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CROWDFUNDING_CONTRACT } from "@/lib/contract-config"
import toast from "react-hot-toast"
import { RingLoader } from "react-spinners"
import { DollarSign, RefreshCw, Gift, X, AlertTriangle, CheckCircle, Trophy } from "lucide-react"

interface Campaign {
  id: number
  creator: string
  topSupporter: string
  firstContributor: string
  randomWinner: string
  title: string
  description: string
  goalAmount: bigint
  deadline: bigint
  amountRaised: bigint
  highestContribution: bigint
  isOpen: boolean
  goalReached: boolean
  fundsClaimed: boolean
  randomWinnerSelected: boolean
}

interface CampaignActionsProps {
  campaign: Campaign
  onUpdate: () => void
}

export function CampaignActions({ campaign, onUpdate }: CampaignActionsProps) {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()

  const isCreator = address && campaign.creator.toLowerCase() === address.toLowerCase()
  const isExpired = Number(campaign.deadline) * 1000 < Date.now()
  const canCloseCampaign = isCreator && isExpired && campaign.isOpen
  const canWithdraw = isCreator && campaign.goalReached && !campaign.fundsClaimed
  const canSelectWinner = isCreator && !campaign.isOpen && !campaign.randomWinnerSelected && campaign.goalReached
  const canRefund = !campaign.goalReached && isExpired && !campaign.isOpen

  // Check if user has contributed (mock check - in real app, check from contract)
  const hasContributed = true // This should be checked from contract

  const handleCloseCampaign = async () => {
    if (!isConnected || !isCreator) return

    try {
      setIsLoading("close")
      const loadingToast = toast.loading("Closing campaign...")

      const tx = await writeContractAsync({
        ...CROWDFUNDING_CONTRACT,
        functionName: "closeCampaign",
        args: [BigInt(campaign.id)],
      })

      toast.success("Campaign closed successfully!", { id: loadingToast })
      onUpdate()
    } catch (error: any) {
      console.error("Error closing campaign:", error)
      toast.error("Failed to close campaign: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(null)
    }
  }

  const handleWithdrawFunds = async () => {
    if (!isConnected || !isCreator) return

    try {
      setIsLoading("withdraw")
      const loadingToast = toast.loading("Withdrawing funds...")

      const tx = await writeContractAsync({
        ...CROWDFUNDING_CONTRACT,
        functionName: "withdrawFunds",
        args: [BigInt(campaign.id)],
      })

      toast.success("Funds withdrawn successfully!", { id: loadingToast })
      onUpdate()
    } catch (error: any) {
      console.error("Error withdrawing funds:", error)
      toast.error("Failed to withdraw funds: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(null)
    }
  }

  const handleSelectRandomWinner = async () => {
    if (!isConnected || !isCreator) return

    try {
      setIsLoading("winner")
      const loadingToast = toast.loading("Selecting random winner...")

      const tx = await writeContractAsync({
        ...CROWDFUNDING_CONTRACT,
        functionName: "selectRandomWinner",
        args: [BigInt(campaign.id)],
      })

      toast.success("Random winner selected and NFT minted!", { id: loadingToast })
      onUpdate()
    } catch (error: any) {
      console.error("Error selecting winner:", error)
      toast.error("Failed to select winner: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(null)
    }
  }

  const handleRefund = async () => {
    if (!isConnected || !hasContributed) return

    try {
      setIsLoading("refund")
      const loadingToast = toast.loading("Processing refund...")

      const tx = await writeContractAsync({
        ...CROWDFUNDING_CONTRACT,
        functionName: "refund",
        args: [BigInt(campaign.id)],
      })

      toast.success("Refund processed successfully!", { id: loadingToast })
      onUpdate()
    } catch (error: any) {
      console.error("Error processing refund:", error)
      toast.error("Failed to process refund: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(null)
    }
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Connect your wallet to perform actions</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Creator Actions */}
      {isCreator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Creator Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canCloseCampaign && (
              <Button
                onClick={handleCloseCampaign}
                variant="outline"
                className="w-full"
                disabled={isLoading === "close"}
              >
                {isLoading === "close" ? (
                  <div className="flex items-center gap-2">
                    <RingLoader color="currentColor" size={16} />
                    Closing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Close Campaign
                  </div>
                )}
              </Button>
            )}

            {canWithdraw && (
              <Button onClick={handleWithdrawFunds} className="w-full" disabled={isLoading === "withdraw"}>
                {isLoading === "withdraw" ? (
                  <div className="flex items-center gap-2">
                    <RingLoader color="white" size={16} />
                    Withdrawing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Withdraw Funds
                  </div>
                )}
              </Button>
            )}

            {canSelectWinner && (
              <Button
                onClick={handleSelectRandomWinner}
                variant="secondary"
                className="w-full"
                disabled={isLoading === "winner"}
              >
                {isLoading === "winner" ? (
                  <div className="flex items-center gap-2">
                    <RingLoader color="currentColor" size={16} />
                    Selecting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Select Random Winner
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contributor Actions */}
      {!isCreator && canRefund && hasContributed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Refund Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This campaign didn't reach its goal. You can request a refund of your contribution.
              </AlertDescription>
            </Alert>
            <Button onClick={handleRefund} variant="outline" className="w-full" disabled={isLoading === "refund"}>
              {isLoading === "refund" ? (
                <div className="flex items-center gap-2">
                  <RingLoader color="currentColor" size={16} />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Request Refund
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {campaign.goalReached && campaign.fundsClaimed && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Campaign completed successfully! Funds have been withdrawn.</AlertDescription>
        </Alert>
      )}

      {!campaign.isOpen && !campaign.goalReached && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Campaign ended without reaching its goal. Refunds are available.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
