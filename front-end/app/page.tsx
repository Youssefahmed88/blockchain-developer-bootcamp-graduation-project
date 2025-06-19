"use client"

import { useState, useEffect } from "react"
import { CampaignCard } from "@/components/campaign-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { EthPrice } from "@/components/eth-price"
import { useCrowdFunding } from "../context/CrowdFundingContext"
import Link from "next/link"
import Head from "next/head"
import { Plus, TrendingUp, Users, Target, Rocket, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

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
  highestContribution: string
  isOpen: boolean
  goalReached: boolean
  fundsClaimed: boolean
}

export default function HomePage() {
  const { currentAccount, getCampaigns, connectWallet } = useCrowdFunding()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaised: "0",
    successfulCampaigns: 0,
  })

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const campaignsData = await getCampaigns()
      console.log("Fetched campaigns:", campaignsData)
      setCampaigns(campaignsData)

      const now = Date.now() / 1000
      const activeCampaigns = campaignsData.filter((c: Campaign) => c.isOpen && Number(c.deadline) > now)
      const totalRaised = campaignsData.reduce(
        (sum: number, campaign: Campaign) => sum + Number(campaign.amountRaised),
        0,
      )

      setStats({
        totalCampaigns: campaignsData.length,
        activeCampaigns: activeCampaigns.length,
        totalRaised: totalRaised.toFixed(2),
        successfulCampaigns: campaignsData.filter((c: Campaign) => c.goalReached).length,
      })
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentAccount) {
      fetchCampaigns()
      toast.success("Wallet connected successfully!")
    } else {
      setIsLoading(false)
    }
  }, [currentAccount])

  const featuredCampaigns = campaigns
    .filter((campaign) => {
      const now = Date.now() / 1000
      return campaign.isOpen && Number(campaign.deadline) > now
    })
    .sort((a, b) => Number(b.amountRaised) - Number(a.amountRaised))
    .slice(0, 6)

  return (
    <>
      <Head>
        <meta property="og:image" content="https://drive.google.com/file/d/159OYvVqgSKOgdoe9E09bZTDOoq7rDOWk/view?usp=drive_link" />
        <meta property="og:title" content="Decentralized Crowdfunding" />
        <meta property="og:description" content="Support innovative projects or launch your own using secure blockchain technology" />
        <meta property="og:url" content="https://blockchain-developer-bootcamp-gradu.vercel.app/" />
      </Head>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Rocket className="h-12 w-12 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Decentralized
                <span className="block text-primary">Crowdfunding</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Support innovative projects or launch your own using secure blockchain technology
            </p>

            <div className="mb-8 flex justify-center">
              <Card className="p-4">
                <EthPrice />
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!currentAccount ? (
                <Button size="lg" onClick={connectWallet} className="w-full sm:w-auto">
                  Connect Wallet
                </Button>
              ) : (
                <>
                  <Link href="/create">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                  <Link href="/campaigns">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Browse Campaigns
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Platform Statistics</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCampaigns}
                disabled={isLoading || !currentAccount}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalCampaigns}</div>
                  <div className="text-sm text-muted-foreground">Total Campaigns</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.activeCampaigns}</div>
                  <div className="text-sm text-muted-foreground">Active Campaigns</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalRaised} ETH</div>
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{isLoading ? "..." : stats.successfulCampaigns}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Campaigns */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Campaigns</h2>
              <Link href="/campaigns">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            {!currentAccount ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-muted-foreground mb-4">Connect your wallet to view and interact with campaigns</p>
                  <Button onClick={connectWallet}>Connect Wallet</Button>
                </CardContent>
              </Card>
            ) : isLoading ? (
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
            ) : featuredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
                  <p className="text-muted-foreground mb-4">
                    {campaigns.length > 0
                      ? "All campaigns have ended or reached their goals"
                      : "Be the first to create a crowdfunding campaign on our platform"}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={fetchCampaigns} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Link href="/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple and secure crowdfunding platform powered by blockchain technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Your Campaign</h3>
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet and create a crowdfunding campaign for your project in simple steps
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Raise Funds</h3>
                  <p className="text-muted-foreground text-sm">
                    Share your campaign and collect funding from the community safely and directly
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Achieve Your Goal</h3>
                  <p className="text-muted-foreground text-sm">
                    When you reach your goal, withdraw the funds and start implementing your project
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}