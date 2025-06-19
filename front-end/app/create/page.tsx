"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAccount, useChainId } from "wagmi"
import { Navbar } from "@/components/navbar"
import { Timeline } from "@/components/timeline"
import { EthPrice } from "@/components/eth-price"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import { RingLoader } from "react-spinners"
import { CheckCircle, Info, Rocket, DollarSign, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useCrowdFunding } from "../../context/CrowdFundingContext"

interface Transaction {
  txHash?: string
  type: string
  status: string
  timeStamp: string
  chainId?: number
}

interface TimelineItem {
  title: string
  description: string
  status: "pending" | "current" | "completed"
}

interface FormErrors {
  title?: string
  description?: string
  goalAmount?: string
  duration?: string
}

type DurationUnit = "minutes" | "hours" | "days"

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(false)
  const [trans, setTrans] = useState<Transaction[]>([])
  const [campaignsCount, setCampaignsCount] = useState(0)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: "",
    duration: "30",
    durationUnit: "days" as DurationUnit,
  })

  const { createCampaign, getCampaigns } = useCrowdFunding()

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")

  useEffect(() => {
    const fetchCampaigns = async () => {
      const campaigns = await getCampaigns()
      setCampaignsCount(campaigns.length)
    }
    if (isConnected && isCorrectNetwork) {
      fetchCampaigns()
    }
  }, [isConnected, isCorrectNetwork, getCampaigns])

  // Convert duration to minutes for validation and contract
  const getDurationInMinutes = () => {
    const duration = Number.parseFloat(formData.duration)
    switch (formData.durationUnit) {
      case "minutes":
        return duration
      case "hours":
        return duration * 60
      case "days":
        return duration * 24 * 60
      default:
        return duration
    }
  }

  // Get duration limits based on unit
  const getDurationLimits = () => {
    switch (formData.durationUnit) {
      case "minutes":
        return { min: 5, max: 525600 } // 5 minutes to 1 year
      case "hours":
        return { min: 0.083, max: 8760 } // ~5 minutes to 1 year
      case "days":
        return { min: 0.0035, max: 365 } // ~5 minutes to 1 year
      default:
        return { min: 1, max: 365 }
    }
  }

  // Format duration for display
  const formatDurationDisplay = () => {
    const duration = Number.parseFloat(formData.duration)
    if (!duration) return ""

    const totalMinutes = getDurationInMinutes()
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = Math.floor(totalMinutes % 60)

    const parts = []
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`)
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`)

    return parts.join(", ")
  }

  // Get end date
  const getEndDate = () => {
    const totalMinutes = getDurationInMinutes()
    const endDate = new Date(Date.now() + totalMinutes * 60 * 1000)
    return endDate.toLocaleString()
  }

  // Form validation
  const validateForm = useCallback(() => {
    const errors: FormErrors = {}

    if (!formData.title.trim()) {
      errors.title = "Campaign title is required"
    } else if (formData.title.length < 10) {
      errors.title = "Title should be at least 10 characters"
    } else if (formData.title.length > 100) {
      errors.title = "Title should not exceed 100 characters"
    }

    if (!formData.description.trim()) {
      errors.description = "Campaign description is required"
    } else if (formData.description.length < 50) {
      errors.description = "Description should be at least 50 characters"
    }

    if (!formData.goalAmount) {
      errors.goalAmount = "Funding goal is required"
    } else if (Number.parseFloat(formData.goalAmount) <= 0) {
      errors.goalAmount = "Goal amount must be greater than zero"
    } else if (Number.parseFloat(formData.goalAmount) < 0.001) {
      errors.goalAmount = "Minimum goal is 0.001 ETH"
    }

    const durationInMinutes = getDurationInMinutes()
    if (!formData.duration || Number.parseFloat(formData.duration) <= 0) {
      errors.duration = "Duration is required"
    } else if (durationInMinutes < 5) {
      errors.duration = "Minimum duration is 5 minutes"
    } else if (durationInMinutes > 525600) {
      // 1 year in minutes
      errors.duration = "Maximum duration is 1 year"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // Timeline items based on form completion
  const getTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [
      {
        title: "Connect Wallet",
        description: "Connect your Web3 wallet to get started",
        status: isConnected ? "completed" : "current",
      },
      {
        title: "Fill Campaign Details",
        description: "Provide title, description, and funding goal",
        status:
          isConnected && formData.title && formData.description && formData.goalAmount
            ? "completed"
            : isConnected
              ? "current"
              : "pending",
      },
      {
        title: "Review & Submit",
        description: "Review your campaign details and submit to blockchain",
        status: isConnected && formData.title && formData.description && formData.goalAmount ? "current" : "pending",
      },
      {
        title: "Campaign Live",
        description: "Your campaign is live and accepting contributions",
        status: "pending",
      },
    ]

    // Update last item if we have successful transactions
    if (trans.some((t) => t.status === "Success")) {
      items[3].status = "completed"
    }

    return items
  }

  const handleDurationUnitChange = (unit: DurationUnit) => {
    setFormData((prev) => {
      // Convert current duration to new unit
      const currentMinutes = getDurationInMinutes()
      let newDuration: number

      switch (unit) {
        case "minutes":
          newDuration = currentMinutes
          break
        case "hours":
          newDuration = currentMinutes / 60
          break
        case "days":
          newDuration = currentMinutes / (24 * 60)
          break
        default:
          newDuration = currentMinutes / (24 * 60)
      }

      return {
        ...prev,
        durationUnit: unit,
        duration: newDuration > 0 ? newDuration.toString() : "1",
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!isCorrectNetwork) {
      toast.error("Please switch to the correct network")
      return
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting")
      return
    }

    try {
      setIsLoading(true)
      const loadingToast = toast.loading("Creating campaign...")

      // Convert duration to days for the contract (assuming contract expects days)
      const durationInMinutes = getDurationInMinutes()
      const durationInDays = Math.max(1, Math.ceil(durationInMinutes / (24 * 60)))

      const tx = await createCampaign({
        title: formData.title,
        description: formData.description,
        goalAmount: Number.parseFloat(formData.goalAmount),
        period: durationInDays, // Send as days to contract
      })

      toast.success("Campaign created successfully!", { id: loadingToast })
      console.log("Transaction hash:", tx.hash)

      setTrans((prev) => [
        ...prev,
        {
          txHash: tx.hash,
          type: "Create Campaign",
          status: "Success",
          timeStamp: new Date().toLocaleDateString(),
          chainId,
        },
      ])

      // Reset form
      setFormData({
        title: "",
        description: "",
        goalAmount: "",
        duration: "30",
        durationUnit: "days",
      })

      // Refresh campaigns count
      const campaigns = await getCampaigns()
      setCampaignsCount(campaigns.length)
    } catch (error: any) {
      console.error("Error creating campaign:", error)

      let status = "Failed"
      if (error.code === 4001 || error.message.toLowerCase().includes("rejected")) {
        toast.error("Transaction canceled by user")
        status = "Canceled"
      } else if (error.message.toLowerCase().includes("reverted")) {
        toast.error("Transaction reverted")
        status = "Reverted"
      } else {
        toast.error("Failed to create campaign: " + (error.message || "Unknown error"))
      }

      setTrans((prev) => [
        ...prev,
        {
          type: "Create Campaign",
          status,
          timeStamp: new Date().toLocaleDateString(),
          chainId,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getExplorerUrl = (txHash: string | undefined, chainId: number | undefined) => {
    if (!txHash || !chainId) return ""
    const explorers: { [key: number]: string } = {
      1: `https://etherscan.io/tx/${txHash}`,
      11155111: `https://sepolia.etherscan.io/tx/${txHash}`,
    }
    return explorers[chainId] || ""
  }

  const handleClearHistory = () => {
    setTrans([])
    toast.success("Transaction history cleared")
  }

  const limits = getDurationLimits()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Rocket className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Create Crowdfunding Campaign</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Launch your project and raise funding from the community using secure blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Educational App for Children"
                        required
                        disabled={!isConnected || !isCorrectNetwork}
                        className={formErrors.title ? "border-red-500" : ""}
                      />
                      {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.title.length}/100 characters - Choose a clear and attractive title
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Campaign Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Explain your project details, goals, and how you'll use the funding..."
                        rows={6}
                        required
                        disabled={!isConnected || !isCorrectNetwork}
                        className={formErrors.description ? "border-red-500" : ""}
                      />
                      {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.description.length}/2000 characters - Detailed description helps contributors
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="goalAmount">Funding Goal (ETH) *</Label>
                        <Input
                          id="goalAmount"
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={formData.goalAmount}
                          onChange={(e) => setFormData((prev) => ({ ...prev, goalAmount: e.target.value }))}
                          placeholder="1.0"
                          required
                          disabled={!isConnected || !isCorrectNetwork}
                          className={formErrors.goalAmount ? "border-red-500" : ""}
                        />
                        {formErrors.goalAmount && <p className="text-xs text-red-500 mt-1">{formErrors.goalAmount}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum: 0.001 ETH
                          {formData.goalAmount && (
                            <span className="block">
                              ≈ ${(Number.parseFloat(formData.goalAmount) * 2000).toLocaleString()} USD
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="duration">Campaign Duration *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="duration"
                            type="number"
                            step={
                              formData.durationUnit === "minutes"
                                ? "1"
                                : formData.durationUnit === "hours"
                                  ? "0.1"
                                  : "0.01"
                            }
                            min={limits.min}
                            max={limits.max}
                            value={formData.duration}
                            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                            disabled={!isConnected || !isCorrectNetwork}
                            className={`flex-1 ${formErrors.duration ? "border-red-500" : ""}`}
                          />
                          <Select
                            value={formData.durationUnit}
                            onValueChange={handleDurationUnitChange}
                            disabled={!isConnected || !isCorrectNetwork}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Min</SelectItem>
                              <SelectItem value="hours">Hrs</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formErrors.duration && <p className="text-xs text-red-500 mt-1">{formErrors.duration}</p>}
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>Minimum: 5 minutes</p>
                          {formData.duration && getDurationInMinutes() >= 5 && (
                            <div className="mt-1 space-y-1">
                              <p>
                                <strong>Duration:</strong> {formatDurationDisplay()}
                              </p>
                              <p>
                                <strong>Ends:</strong> {getEndDate()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Duration Warning */}
                    {getDurationInMinutes() < 60 && getDurationInMinutes() >= 5 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Short Duration:</strong> Your campaign duration is less than 1 hour. Consider if this
                          gives contributors enough time to discover and support your project.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Preview */}
                    {formData.title && formData.goalAmount && formData.duration && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p>
                              <strong>Preview:</strong> "{formData.title}"
                            </p>
                            <p>
                              Goal: {formData.goalAmount} ETH • Duration: {formatDurationDisplay()}
                            </p>
                            <p>Campaign ends: {getEndDate()}</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={!isConnected || !isCorrectNetwork || isLoading || Object.keys(formErrors).length > 0}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RingLoader color="white" size={16} />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4" />
                          Create Campaign
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Creation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline items={getTimelineItems()} />
                </CardContent>
              </Card>

              {/* Duration Info */}
              {formData.duration && getDurationInMinutes() >= 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Duration Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Duration:</span>
                      <span className="font-semibold">{formatDurationDisplay()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Minutes:</span>
                      <span className="font-semibold">{Math.floor(getDurationInMinutes()).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span className="font-semibold text-sm">{getEndDate()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

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

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Campaigns:</span>
                    <span className="font-semibold">{campaignsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Campaigns:</span>
                    <span className="font-semibold">{trans.filter((t) => t.status === "Success").length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Success Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Write a clear and detailed project description</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Set a realistic and achievable funding goal</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Choose appropriate campaign duration</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Share your campaign on social media</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Engage with contributors and provide regular updates</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Back to Home
                    </Button>
                  </Link>
                  <Link href="/campaigns" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Browse Campaigns
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transaction History */}
          {trans.length > 0 && (
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Transaction History</h2>
                <Button onClick={handleClearHistory} variant="outline" size="sm">
                  Clear History
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Type</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Date</th>
                          <th className="p-4 text-left text-sm font-medium">Transaction Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trans.map((tx, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-4 text-sm">{tx.type}</td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  tx.status === "Success"
                                    ? "bg-green-100 text-green-800"
                                    : tx.status === "Canceled"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{tx.timeStamp}</td>
                            <td className="p-4">
                              {tx.txHash ? (
                                <a
                                  href={getExplorerUrl(tx.txHash, tx.chainId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
