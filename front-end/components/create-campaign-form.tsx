"use client"

import type React from "react"
import { useState } from "react"
import { useAccount, useWriteContract, useChainId } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parseEther } from "viem"
import { CROWDFUNDING_CONTRACT } from "@/lib/contract-config"
import toast from "react-hot-toast"
import { RingLoader } from "react-spinners"

export function CreateCampaignForm() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: "",
    duration: "30",
  })

  const isCorrectNetwork = chainId === Number.parseInt(process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID || "11155111")
  const { writeContractAsync } = useWriteContract()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast.error("يرجى ربط المحفظة أولاً")
      return
    }

    if (!isCorrectNetwork) {
      toast.error("يرجى التبديل إلى الشبكة الصحيحة")
      return
    }

    if (!formData.title || !formData.description || !formData.goalAmount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      setIsLoading(true)
      const loadingToast = toast.loading("جاري إنشاء الحملة...")

      const tx = await writeContractAsync({
        ...CROWDFUNDING_CONTRACT,
        functionName: "launchCampaign",
        args: [formData.title, formData.description, parseEther(formData.goalAmount), BigInt(formData.duration)],
      })

      toast.success("تم إنشاء الحملة بنجاح!", { id: loadingToast })
      console.log("Transaction hash:", tx)

      // إعادة تعيين النموذج
      setFormData({
        title: "",
        description: "",
        goalAmount: "",
        duration: "30",
      })
    } catch (error: any) {
      console.error("خطأ في إنشاء الحملة:", error)

      if (error.code === 4001 || error.message.toLowerCase().includes("rejected")) {
        toast.error("تم إلغاء المعاملة من قبل المستخدم")
      } else if (error.message.toLowerCase().includes("reverted")) {
        toast.error("فشلت المعاملة - تم إرجاعها")
      } else {
        toast.error("فشل في إنشاء الحملة: " + (error.message || "خطأ غير معروف"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء حملة تمويل جماعي جديدة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان الحملة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="أدخل عنوان الحملة"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">وصف الحملة *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="اشرح تفاصيل حملتك وأهدافها"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="goalAmount">المبلغ المستهدف (ETH) *</Label>
            <Input
              id="goalAmount"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.goalAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, goalAmount: e.target.value }))}
              placeholder="0.1"
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">مدة الحملة (بالأيام)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={formData.duration}
              onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!isConnected || !isCorrectNetwork || isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RingLoader color="white" size={16} />
                جاري الإنشاء...
              </div>
            ) : (
              "إنشاء الحملة"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
