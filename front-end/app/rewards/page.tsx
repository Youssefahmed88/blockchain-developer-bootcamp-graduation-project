"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Crown, Gift, Search, Grid, List, AlertCircle, Wallet, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useNFT } from "../../context/NFTContext"
import { Navbar } from "@/components/navbar"

interface UserNFT {
  tokenId: string
  campaignId: string
  type: "first" | "top" | "vrf"
  imageUrl: string
  campaignTitle: string
}

const NFT_TYPES = {
  first: {
    label: "First Supporter",
    icon: Trophy,
    color: "bg-blue-500",
    description: "First to contribute to the campaign",
  },
  top: {
    label: "Top Supporter",
    icon: Crown,
    color: "bg-yellow-500",
    description: "Highest contributor to the campaign",
  },
  vrf: {
    label: "Lucky Winner",
    icon: Gift,
    color: "bg-purple-500",
    description: "Randomly selected winner",
  },
}

export default function RewardsPage() {
  const { currentAccount, userNFTs, loading, error, refreshNFTs } = useNFT()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    // Clear any previous errors when component mounts
    if (error) {
      console.log("Clearing previous NFT context errors")
    }
  }, [])

  // Helper functions to replace the removed context functions
  const getNFTsByType = (nftType: "first" | "top" | "vrf") => {
    return userNFTs.filter((nft) => nft.type === nftType)
  }

  const getNFTsByCampaign = (campaignId: string) => {
    return userNFTs.filter((nft) => nft.campaignId === campaignId)
  }

  // Filter NFTs based on search and filters
  const filteredNFTs = userNFTs.filter((nft) => {
    const matchesSearch =
      nft.tokenId.toString().includes(searchTerm) ||
      nft.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      NFT_TYPES[nft.type].label.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "all" || nft.type === selectedType
    const matchesCampaign = selectedCampaign === "all" || nft.campaignId === selectedCampaign

    return matchesSearch && matchesType && matchesCampaign
  })

  // Group NFTs by campaign
  const nftsByCampaign = filteredNFTs.reduce(
    (acc, nft) => {
      if (!acc[nft.campaignId]) {
        acc[nft.campaignId] = []
      }
      acc[nft.campaignId].push(nft)
      return acc
    },
    {} as Record<string, typeof userNFTs>,
  )

  const uniqueCampaigns = [...new Set(userNFTs.map((nft) => nft.campaignId))]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your rewards...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Rewards</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNFTs}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your exclusive NFT rewards earned from participating in crowdfunding campaigns
          </p>
        </div>

        {/* Connection Status */}
        {!currentAccount && (
          <Alert className="mb-8">
            <Wallet className="h-4 w-4" />
            <AlertDescription>Please connect your wallet to view your rewards.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Error loading rewards: {error}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshNFTs}>
                    Retry
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {currentAccount && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Trophy className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rewards</p>
                    <p className="text-2xl font-bold">{userNFTs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Crown className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campaigns</p>
                    <p className="text-2xl font-bold">{uniqueCampaigns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Gift className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lucky Winners</p>
                    <p className="text-2xl font-bold">{getNFTsByType("vrf").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">First Supporters</p>
                    <p className="text-2xl font-bold">{getNFTsByType("first").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Only show content if connected */}
        {currentAccount ? (
          <>
            {userNFTs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rewards Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any NFT rewards yet. Participate in crowdfunding campaigns to earn exclusive rewards!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={refreshNFTs} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Again
                    </Button>
                    <Link href="/campaigns">
                      <Button>
                        <Trophy className="h-4 w-4 mr-2" />
                        Browse Campaigns
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filters */}
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by token ID, campaign, or reward type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Reward Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="first">First Supporter</SelectItem>
                          <SelectItem value="top">Top Supporter</SelectItem>
                          <SelectItem value="vrf">Lucky Winner</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Campaign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Campaigns</SelectItem>
                          {uniqueCampaigns.map((campaignId) => (
                            <SelectItem key={campaignId} value={campaignId}>
                              Campaign #{campaignId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rewards Display */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All Rewards ({filteredNFTs.length})</TabsTrigger>
                    <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    {filteredNFTs.length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Rewards Found</h3>
                          <p className="text-muted-foreground mb-4">Try adjusting your search criteria or filters</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "space-y-4"
                        }
                      >
                        {filteredNFTs.map((nft) => (
                          <RewardCard key={nft.tokenId} nft={nft} viewMode={viewMode} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="campaigns" className="mt-6">
                    <div className="space-y-8">
                      {Object.keys(nftsByCampaign).length === 0 ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Campaign Rewards</h3>
                            <p className="text-muted-foreground">No rewards found matching your current filters.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        Object.entries(nftsByCampaign).map(([campaignId, campaignNFTs]) => {
                          const campaignTitle = campaignNFTs[0]?.campaignTitle || `Campaign #${campaignId}`
                          return (
                            <Card key={campaignId}>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Trophy className="h-5 w-5" />
                                  {campaignTitle}
                                  <Badge variant="secondary">{campaignNFTs.length} Rewards</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {campaignNFTs.map((nft) => (
                                    <RewardCard key={nft.tokenId} nft={nft} viewMode="grid" />
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// Reward Card Component
function RewardCard({ nft, viewMode }: { nft: UserNFT; viewMode: "grid" | "list" }) {
  const nftType = NFT_TYPES[nft.type]
  const Icon = nftType.icon

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
              <Image
                src={nft.imageUrl || "/placeholder.svg?height=64&width=64"}
                alt={`Reward #${nft.tokenId}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-1 right-1">
                <Badge className={`${nftType.color} text-white text-xs`}>
                  <Icon className="h-3 w-3" />
                </Badge>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Reward #{nft.tokenId}</h3>
                <Badge className={`${nftType.color} text-white`}>{nftType.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {nft.campaignTitle} • Token #{nft.tokenId}
              </p>
              <p className="text-xs text-muted-foreground">{nftType.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
          <Image
            src={nft.imageUrl || "/placeholder.svg?height=300&width=300"}
            alt={`Reward #${nft.tokenId}`}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${nftType.color} text-white`}>{nftType.label}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <h3 className="font-semibold">Reward #{nft.tokenId}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{nft.campaignTitle}</p>
          <p className="text-xs text-muted-foreground">{nftType.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
