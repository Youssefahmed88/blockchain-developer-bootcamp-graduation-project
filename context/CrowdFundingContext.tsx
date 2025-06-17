"use client"

import React, { useState, useEffect, createContext, type ReactNode } from "react"
import { ethers } from "ethers"

interface Contribution {
  sender: string
  amount: string
  timestamp: string
}

interface CrowdFundingContextType {
  currentAccount: string
  connectWallet: () => Promise<void>
  createCampaign: (campaign: { title: string; description: string; goalAmount: number; period: number }) => Promise<any>
  getCampaigns: () => Promise<any[]>
  getEthPriceInUSD: (amount: string) => Promise<string>
  contributeToCampaign: (campaignId: number, amount: string) => Promise<void>
  getCampaignDetails: (campaignId: number) => Promise<{
    creator: string
    firstContributor: string
    topSupporter: string
    highestContribution: string
    goalReached: boolean
    amountRaised: string
  } | null>
  getContributors: (campaignId: number) => Promise<Contribution[]>
  withdrawCampaignFunds: (campaignId: number) => Promise<void>
  refundCampaign: (campaignId: number) => Promise<void>
  getOwner: () => Promise<string>
  checkLinkBalance: () => Promise<string>
}

// استبدل هذا بالعنوان وABI الحقيقيين للعقد
import { CROWDFUNDING_ABI, CROWDFUNDING_ADDRESS } from "./Constants"

const fetchContract = (
  signerOrProvider: ethers.BrowserProvider | ethers.JsonRpcSigner | ethers.ContractRunner | null | undefined,
) => new ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signerOrProvider)

export const CrowdFundingContext = createContext<CrowdFundingContextType | null>(null)

export const CrowdFundingProvider = ({ children }: { children: ReactNode }) => {
  const [currentAccount, setCurrentAccount] = useState("")

  const createCampaign = async (campaign: {
    title: string
    description: string
    goalAmount: number
    period: number
  }) => {
    const { title, description, goalAmount, period } = campaign
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = fetchContract(signer)

      const transaction = await contract.launchCampaign(
        title,
        description,
        ethers.parseEther(goalAmount.toString()),
        period,
      )

      await transaction.wait()
      return transaction
    } catch (error) {
      console.error("Error creating campaign:", error)
      throw error
    }
  }

  const getCampaigns = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchContract(provider)

      const campaignsCount = await contract.campaignsCount()
      const campaigns = []

      for (let i = 1; i <= campaignsCount; i++) {
        const campaign = await contract.campaigns(i)

        campaigns.push({
          id: campaign.id.toString(),
          creator: campaign.creator,
          topSupporter: campaign.topSupporter,
          firstContributor: campaign.firstContributor,
          title: campaign.title,
          description: campaign.description,
          goalAmount: ethers.formatEther(campaign.goalAmount.toString()),
          deadline: campaign.deadline.toString(),
          amountRaised: ethers.formatEther(campaign.amountRaised.toString()),
          highestContribution: ethers.formatEther(campaign.highestContribution.toString()),
          isOpen: campaign.isOpen,
          goalReached: campaign.goalReached,
          fundsClaimed: campaign.fundsClaimed,
        })
      }

      return campaigns
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      return []
    }
  }

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log("Error connecting to wallet", error)
      throw error
    }
  }

  const checkIfWalletConnected = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length) {
        setCurrentAccount(accounts[0])
      }
    } catch (error) {
      console.log("Something went wrong while connecting to wallet.")
    }
  }

  useEffect(() => {
    checkIfWalletConnected()
  }, [])

  const getEthPriceInUSD = async (amount: string) => {
    return (Number.parseFloat(amount) * 2000).toString()
  }

  const contributeToCampaign = async (campaignId: number, amount: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = fetchContract(signer)

      const tx = await contract.contribute(campaignId, {
        value: ethers.parseEther(amount),
      })

      await tx.wait()
    } catch (error) {
      console.error("Contribution failed:", error)
      throw error
    }
  }

  const withdrawCampaignFunds = async (campaignId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = fetchContract(signer)

      const tx = await contract.withdrawFunds(campaignId)
      await tx.wait()
    } catch (error) {
      console.error("Withdraw failed:", error)
      throw error
    }
  }

  const refundCampaign = async (campaignId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = fetchContract(signer)

      const tx = await contract.refund(campaignId)
      await tx.wait()
    } catch (error) {
      console.error("Refund failed:", error)
      throw error
    }
  }

  const getCampaignDetails = async (campaignId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchContract(provider)

      const campaign = await contract.campaigns(campaignId)

      return {
        creator: campaign.creator,
        firstContributor: campaign.firstContributor,
        topSupporter: campaign.topSupporter,
        highestContribution: ethers.formatEther(campaign.highestContribution),
        goalReached: campaign.goalReached,
        amountRaised: ethers.formatEther(campaign.amountRaised),
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
      return null
    }
  }

  const getContributors = async (campaignId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = fetchContract(signer)

      const contributorsRaw = await contract.getContributors(campaignId)

      const contributors = contributorsRaw.map((contrib: any) => ({
        sender: contrib.sender,
        amount: ethers.formatEther(contrib.amount),
        timestamp: new Date(Number(contrib.timestamp) * 1000).toLocaleString(),
      }))

      return contributors
    } catch (error) {
      console.error("Error fetching contributors:", error)
      return []
    }
  }

  const getOwner = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchContract(provider)

      const ownerAddress = await contract.owner()
      return ownerAddress
    } catch (error) {
      console.error("Error fetching owner:", error)
      return ""
    }
  }

  const checkLinkBalance = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchContract(provider)

      const balance = await contract.checkLinkBalance()
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("Error checking LINK balance:", error)
      return "0"
    }
  }

  const contextValue: CrowdFundingContextType = {
    currentAccount,
    createCampaign,
    getCampaigns,
    connectWallet,
    getEthPriceInUSD,
    contributeToCampaign,
    getCampaignDetails,
    getContributors,
    withdrawCampaignFunds,
    refundCampaign,
    getOwner,
    checkLinkBalance,
  }

  return <CrowdFundingContext.Provider value={contextValue}>{children}</CrowdFundingContext.Provider>
}

export const useCrowdFunding = () => {
  const context = React.useContext(CrowdFundingContext)
  if (!context) {
    throw new Error("useCrowdFunding must be used within a CrowdFundingProvider")
  }
  return context
}

export default CrowdFundingContext
