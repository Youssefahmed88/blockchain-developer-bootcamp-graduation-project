"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAccount, useChainId } from "wagmi"
import { Navbar } from "@/components/navbar"
import { EthPrice } from "@/components/eth-price"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import toast from "react-hot-toast"
import {
  Calendar,
  Users,
  Trophy,
  Heart,
  Share2,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Clock,
  Target,
  TrendingUp,
  ArrowUpRight,
  Gift,
  Crown,
  CheckCircle,
} from "lucide-react"
import { useCrowdFunding } from "../../../context/CrowdFundingContext"

interface Campaign {
  id: string
  creator: string
  topSupporter: string
  firstContributor: string
  title: string
  description: string
  goalAmount: string
  deadline: string
  amountRaised: string
  isOpen: boolean
  goalReached: boolean
  fundsClaimed: boolean
}

interface Contributor {
  sender: string
  amount: string
  timestamp: string
}

interface Transaction {
  hash: string
  type: string
  from: string
  amount: string
  timestamp: string
  status: "success" | "pending" | "failed"
}

interface TimelineItem {
  title: string
  description: string
  status: "pending" | "current" | "completed"
  timestamp?: string
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = Number(params.id)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contributionAmount, setContributionAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")
  const {
    getCampaigns,
    contributeToCampaign,
    getContributors,
    withdrawCampaignFunds,
    refundCampaign,
  } = useCrowdFunding()

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setIsPageLoading(true)

        const campaigns = await getCampaigns()
        const foundCampaign = campaigns.find((c) => c.id === campaignId.toString())

        if (foundCampaign) {
          setCampaign(foundCampaign)

          const campaignContributors = await getContributors(campaignId)
          setContributors(campaignContributors)

          const mockTransactions: Transaction[] = [
            {
              hash: "0x1234...5678",
              type: "Campaign Created",
              from: foundCampaign.creator,
              amount: "0",
              timestamp: "7 days ago",
              status: "success",
            },
            ...campaignContributors.map((contrib, index) => ({
              hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
              type: "Contribution",
              from: contrib.sender,
              amount: contrib.amount,
              timestamp: contrib.timestamp,
              status: "success" as const,
            })),
          ]
          setTransactions(mockTransactions)
        } else {
          toast.error("Campaign not found")
        }
      } catch (error) {
        console.error("Error fetching campaign:", error)
        toast.error("Failed to load campaign data")
      } finally {
        setIsPageLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId, getCampaigns, getContributors])

  const handleContribute = async () => {
    if (!contributionAmount || Number.parseFloat(contributionAmount) <= 0) {
      toast.error("Please enter a valid contribution amount")
      return
    }

    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }

    if (!isCorrectNetwork) {
      toast.error("Please switch to the correct network")
      return
    }

    try {
      setIsLoading(true)
      const loadingToast = toast.loading("Contributing to campaign...")

      await contributeToCampaign(campaignId, contributionAmount)

      toast.success("Contribution successful!", { id: loadingToast })
      setContributionAmount("")

      const campaigns = await getCampaigns()
      const updatedCampaign = campaigns.find((c) => c.id === campaignId.toString())
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
      }

      const updatedContributors = await getContributors(campaignId)
      setContributors(updatedContributors)
    } catch (error: any) {
      console.error("Contribution failed:", error)
      if (error.code === 4001) {
        toast.error("Transaction canceled by user")
      } else {
        toast.error("Failed to contribute: " + (error.message || "Unknown error"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected || !campaign) return

    try {
      setIsLoading(true)
      const loadingToast = toast.loading("Withdrawing funds...")

      await withdrawCampaignFunds(campaignId)
      toast.success("Funds withdrawn successfully!", { id: loadingToast })

      const campaigns = await getCampaigns()
      const updatedCampaign = campaigns.find((c) => c.id === campaignId.toString())
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
      }
    } catch (error: any) {
      console.error("Withdrawal failed:", error)
      toast.error("Failed to withdraw funds: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!isConnected) return

    try {
      setIsLoading(true)
      const loadingToast = toast.loading("Processing refund...")

      await refundCampaign(campaignId)
      toast.success("Refund processed successfully!", { id: loadingToast })

      const updatedContributors = await getContributors(campaignId)
      setContributors(updatedContributors)
    } catch (error: any) {
      console.error("Refund failed:", error)
      toast.error("Failed to process refund: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      const campaigns = await getCampaigns()
      const updatedCampaign = campaigns.find((c) => c.id === campaignId.toString())
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
      }

      const updatedContributors = await getContributors(campaignId)
      setContributors(updatedContributors)

      toast.success("Data refreshed")
    } catch (error) {
      toast.error("Failed to refresh data")
    }
  }

  const getCampaignTimelineItems = (): TimelineItem[] => {
    if (!campaign) return []

    const items: TimelineItem[] = [
      {
        title: "Campaign Created",
        description: "Campaign launched and accepting contributions",
        status: "completed",
        timestamp: "7 days ago",
      },
    ]

    if (contributors.length > 0) {
      items.push({
        title: "First Contribution",
        description: "Received first contribution from the community",
        status: "completed",
        timestamp: contributors[contributors.length - 1]?.timestamp || "6 days ago",
      })
    }

    const amountRaised = Number.parseFloat(campaign.amountRaised || "0")
    const goalAmount = Number.parseFloat(campaign.goalAmount || "1")
    const progress = goalAmount > 0 ? (amountRaised * 100) / goalAmount : 0

    if (progress >= 25) {
      items.push({
        title: "25% Funded",
        description: "Reached 25% of funding goal",
        status: "completed",
        timestamp: "3 days ago",
      })
    }

    if (campaign.goalReached) {
      items.push({
        title: "Goal Reached",
        description: "Campaign successfully reached its funding goal",
        status: "completed",
        timestamp: "2 days ago",
      })
    } else {
      items.push({
        title: "Goal Achievement",
        description: "Reach the funding goal to unlock rewards",
        status: "pending",
      })
    }

    return items
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Campaign Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The campaign you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const amountRaised = Number.parseFloat(campaign.amountRaised || "0")
  const goalAmount = Number.parseFloat(campaign.goalAmount || "1")
  const progress = goalAmount > 0 ? Math.min((amountRaised * 100) / goalAmount, 100) : 0
  const isExpired = Number(campaign.deadline) * 1000 < Date.now()
  const daysLeft = Math.max(0, Math.ceil((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
  const isCreator = address && campaign.creator.toLowerCase() === address.toLowerCase()
  const isGoalReached = campaign.goalReached || amountRaised >= goalAmount

  const getHighestContributor = () => {
    if (contributors.length === 0) return null
    const sortedContributors = contributors.sort((a, b) => Number.parseFloat(b.amount) - Number.parseFloat(a.amount))
    return sortedContributors[0]
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Campaign #{campaign.id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{daysLeft} days left</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={isGoalReached ? "default" : isExpired ? "destructive" : "secondary"}>
                        {isGoalReached ? "Goal Reached" : isExpired ? "Expired" : "Active"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Raised: {campaign.amountRaised || "0"} ETH</span>
                      <span>Goal: {campaign.goalAmount || "0"} ETH</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(1)}% funded</span>
                      <span>{contributors.length} contributors</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-scroll pr-2 description-container">
                    <p className="text-muted-foreground text-base leading-7 tracking-wide text-justify indent-4">{campaign.description}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Special Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5" />
                    Special Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* First Contributor */}
                    <div className="relative p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/8 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-500/15 rounded-md">
                          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">First Contributor</h3>
                          <p className="text-xs text-blue-700 dark:text-blue-300">Pioneer</p>
                        </div>
                      </div>
                      {campaign.firstContributor && campaign.firstContributor !== "0x0000000000000000000000000000000000000000" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-blue-500/30">
                              <AvatarFallback className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                {campaign.firstContributor.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-mono text-xs font-medium text-blue-900 dark:text-blue-100 truncate"
                                title={campaign.firstContributor}
                              >
                                {campaign.firstContributor.slice(0, 6)}...{campaign.firstContributor.slice(-4)}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {contributors.find((c) => c.sender === campaign.firstContributor)?.amount || "0"} ETH
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-xs text-blue-600 dark:text-blue-400">Awaiting first contribution</p>
                        </div>
                      )}
                    </div>

                    {/* Highest Contributor */}
                    <div className="relative p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/8 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-orange-500/15 rounded-md">
                          <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-orange-900 dark:text-orange-100 text-sm">Top Supporter</h3>
                          <p className="text-xs text-orange-700 dark:text-orange-300">Highest</p>
                        </div>
                      </div>
                      {campaign.topSupporter && campaign.topSupporter !== "0x0000000000000000000000000000000000000000" && contributors.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-orange-500/30">
                              <AvatarFallback className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-medium">
                                {campaign.topSupporter.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-mono text-xs font-medium text-orange-900 dark:text-orange-100 truncate"
                                title={campaign.topSupporter}
                              >
                                {campaign.topSupporter.slice(0, 6)}...{campaign.topSupporter.slice(-4)}
                              </p>
                              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                {(() => {
                                  const topContributor = contributors.find((c) => c.sender === campaign.topSupporter)
                                  const highestAmount =
                                    contributors.length > 0
                                      ? Math.max(...contributors.map((c) => Number.parseFloat(c.amount)))
                                      : 0
                                  return topContributor ? topContributor.amount : highestAmount.toFixed(3)
                                })()} ETH
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-xs text-orange-600 dark:text-orange-400">No contributions yet</p>
                        </div>
                      )}
                    </div>

                    {/* Lucky Winner */}
                    <div className="relative p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/8 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-500/15 rounded-md">
                          <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-purple-900 dark:text-purple-100 text-sm">Lucky Winner</h3>
                          <p className="text-xs text-purple-700 dark:text-purple-300">VRF Selection</p>
                        </div>
                      </div>
                      {isGoalReached || isExpired ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-purple-500/30">
                              <AvatarFallback className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                LW
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs font-medium text-purple-900 dark:text-purple-100">
                                0x1234...5678
                              </p>
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">0.5 ETH</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <Clock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                          <p className="text-xs text-purple-600 dark:text-purple-400">After campaign ends</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Progress Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Campaign Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {getCampaignTimelineItems().map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              item.status === "completed"
                                ? "bg-green-500 border-green-500 text-white"
                                : item.status === "current"
                                ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                : "bg-muted border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {item.status === "completed" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : item.status === "current" ? (
                              <Clock className="h-5 w-5" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-current" />
                            )}
                          </div>
                          {index < getCampaignTimelineItems().length - 1 && (
                            <div
                              className={`w-0.5 h-12 mt-2 ${
                                item.status === "completed" ? "bg-green-500" : "bg-muted-foreground/20"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold ${
                                item.status === "completed"
                                  ? "text-green-700 dark:text-green-400"
                                  : item.status === "current"
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {item.title}
                            </h3>
                            {item.status === "completed" && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Completed
                              </Badge>
                            )}
                            {item.status === "current" && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                In Progress
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          {item.timestamp && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.timestamp}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    All Transactions ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((tx, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                tx.type === "Campaign Created"
                                  ? "bg-blue-100 text-blue-600"
                                  : tx.type === "Contribution"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {tx.type === "Campaign Created" ? (
                                <Target className="h-4 w-4" />
                              ) : tx.type === "Contribution" ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <TrendingUp className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">
                                From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{tx.amount !== "0" ? `${tx.amount} ETH` : "-"}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
                              <Badge variant={tx.status === "success" ? "default" : "secondary"} className="text-xs">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                      <p className="text-muted-foreground">Transaction history will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contribution Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Support This Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isExpired && !isGoalReached && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Contribution Amount (ETH)</label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          placeholder="0.1"
                          disabled={!isConnected || !isCorrectNetwork}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleContribute}
                        className="w-full"
                        disabled={!isConnected || !isCorrectNetwork || isLoading || !contributionAmount}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Contributing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Contribute Now
                          </div>
                        )}
                      </Button>
                    </>
                  )}

                  {isGoalReached && isCreator && (
                    <Button onClick={handleWithdraw} className="w-full" variant="default" disabled={isLoading}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      {isLoading ? "Processing..." : "Withdraw Funds"}
                    </Button>
                  )}

                  {isExpired && !isGoalReached && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3">
                        This campaign has expired. Contributors can request refunds.
                      </p>
                      <Button onClick={handleRefund} variant="outline" className="w-full" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Request Refund"}
                      </Button>
                    </div>
                  )}

                  {!isConnected && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Connect your wallet to contribute to this campaign.</AlertDescription>
                    </Alert>
                  )}

                  {isConnected && !isCorrectNetwork && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please switch to the correct network to interact with this campaign.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* ETH Price */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    ETH Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EthPrice />
                </CardContent>
              </Card>

              {/* Campaign Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="font-mono text-sm">
                      {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-sm">7 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="text-sm">{new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top Contribution:</span>
                    <span className="text-sm font-semibold">
                      {(() => {
                        const highest = getHighestContributor()
                        return highest ? `${highest.amount} ETH` : "0 ETH"
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* About Creator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {campaign.creator.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">Campaign Creator</p>
                    </div>
                  </div>
                  {isCreator && (
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      You are the creator
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}