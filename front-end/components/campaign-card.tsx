"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  creator?: string
  owner?: string
  title: string
  description: string
  goalAmount: string // عدلت من target
  deadline: string
  amountRaised: string // عدلت من amountCollected
  isOpen?: boolean
  goalReached?: boolean
  fundsClaimed?: boolean
}

interface CampaignCardProps {
  campaign: Campaign
  isWalletConnected?: boolean
  isCorrectNetwork?: boolean
}

export function CampaignCard({ campaign, isWalletConnected = false, isCorrectNetwork = true }: CampaignCardProps) {
  // تأكد من وجود البيانات وتحويلها للأرقام
  const goalAmount = Number.parseFloat(campaign.goalAmount || "0")
  const amountRaised = Number.parseFloat(campaign.amountRaised || "0")

  // حساب النسبة المئوية
  const progressPercentage = goalAmount > 0 ? Math.min((amountRaised / goalAmount) * 100, 100) : 0

  // تحويل الـ deadline لتاريخ
  const deadlineDate = new Date(Number(campaign.deadline) * 1000)
  const isExpired = deadlineDate.getTime() < Date.now()
  const daysLeft = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  // تحديد حالة الحملة
  const getStatus = () => {
    if (campaign.goalReached || progressPercentage >= 100) return "successful"
    if (isExpired) return "expired"
    return "active"
  }

  const status = getStatus()

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500" },
    successful: { label: "Successful", color: "bg-blue-500" },
    expired: { label: "Expired", color: "bg-gray-500" },
  }

  // Debug logging
  console.log(`Campaign ${campaign.id}:`, {
    goalAmount,
    amountRaised,
    progressPercentage,
    status,
  })

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge className={`${statusConfig[status].color} text-white`}>{statusConfig[status].label}</Badge>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isExpired ? "Ended" : `${daysLeft}d left`}
            </div>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{campaign.description}</p>

        {/* Progress Section */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{progressPercentage.toFixed(1)}%</span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="font-medium">{amountRaised.toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{goalAmount.toFixed(4)} ETH</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Link href={`/campaign/${campaign.id}`} className="w-full">
            <Button
              className="w-full"
              variant={status === "active" ? "default" : "outline"}
              disabled={!isWalletConnected || !isCorrectNetwork}
            >
              {!isWalletConnected
                ? "Connect Wallet"
                : !isCorrectNetwork
                  ? "Wrong Network"
                  : status === "active"
                    ? "Support Project"
                    : "View Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}