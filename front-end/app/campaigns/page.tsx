"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { Navbar } from "@/components/navbar"
import { CampaignCard } from "@/components/campaign-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, TrendingUp, Clock, CheckCircle, Target, Wallet, AlertCircle, RefreshCw } from "lucide-react"
import { useCrowdFunding } from "../../context/CrowdFundingContext"

interface Campaign {
  id: string
  creator: string
  title: string
  description: string
  goalAmount: string // عدلت من target
  deadline: string
  amountRaised: string // عدلت من amountCollected
  isOpen: boolean
  goalReached: boolean
  fundsClaimed: boolean
}

export default function CampaignsPage() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const { getCampaigns } = useCrowdFunding()

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")

  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchedCampaigns = await getCampaigns()

      console.log("Fetched campaigns:", fetchedCampaigns)

      // تأكد من أن البيانات صحيحة
      fetchedCampaigns.forEach((campaign: Campaign, index: number) => {
        console.log(`Campaign ${index + 1}:`, {
          id: campaign.id,
          title: campaign.title,
          goalAmount: campaign.goalAmount,
          amountRaised: campaign.amountRaised,
          progressPercentage:
            campaign.goalAmount && campaign.amountRaised
              ? ((Number.parseFloat(campaign.amountRaised) / Number.parseFloat(campaign.goalAmount)) * 100).toFixed(2) +
                "%"
              : "0%",
        })
      })

      setCampaigns(fetchedCampaigns)
      setFilteredCampaigns(fetchedCampaigns)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setError("Failed to load campaigns. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch campaigns on component mount and every 10 seconds
  useEffect(() => {
    fetchCampaigns()
    const interval = setInterval(fetchCampaigns, 10000) // تحديث كل 10 ثواني
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = campaigns

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    switch (selectedFilter) {
      case "active":
        filtered = filtered.filter(
          (c) =>
            Number(c.deadline) * 1000 > Date.now() &&
            Number.parseFloat(c.amountRaised || "0") < Number.parseFloat(c.goalAmount || "1"),
        )
        break
      case "successful":
        filtered = filtered.filter(
          (c) => c.goalReached || Number.parseFloat(c.amountRaised || "0") >= Number.parseFloat(c.goalAmount || "1"),
        )
        break
      case "expired":
        filtered = filtered.filter(
          (c) =>
            Number(c.deadline) * 1000 < Date.now() &&
            !c.goalReached &&
            Number.parseFloat(c.amountRaised || "0") < Number.parseFloat(c.goalAmount || "1"),
        )
        break
      default:
        break
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, selectedFilter])

  const filterOptions = [
    { value: "all", label: "All Campaigns", icon: Target },
    { value: "active", label: "Active", icon: Clock },
    { value: "successful", label: "Successful", icon: CheckCircle },
    { value: "expired", label: "Expired", icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">Browse Campaigns</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCampaigns}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <p className="text-muted-foreground">
              Discover and support innovative projects from creators around the world
            </p>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <Alert className="mb-6">
              <Wallet className="h-4 w-4" />
              <AlertDescription>Connect your wallet to contribute to campaigns and earn NFT rewards.</AlertDescription>
            </Alert>
          )}

          {isConnected && !isCorrectNetwork && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please switch to the correct network (Chain ID: {process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID}) to interact
                with campaigns.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button variant="outline" size="sm" className="ml-2" onClick={fetchCampaigns}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={selectedFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(option.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Campaigns Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-80 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-4"></div>
                    <div className="h-2 bg-muted rounded mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Unable to Load Campaigns</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error loading the campaigns. Please check your connection and try again.
                </p>
                <Button onClick={fetchCampaigns}>Try Again</Button>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  isWalletConnected={isConnected}
                  isCorrectNetwork={isCorrectNetwork}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Campaigns Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "There are no campaigns matching your filters"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}