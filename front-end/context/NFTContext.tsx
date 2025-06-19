"use client"

import React, { useState, useEffect, createContext, type ReactNode } from "react"
import { ethers } from "ethers"
import { ipfsService } from "@/lib/ipfs"

interface UserNFT {
  tokenId: string
  campaignId: string
  type: "first" | "top" | "vrf"
  imageUrl: string
  campaignTitle: string
  metadata?: any
}

interface NFTContextType {
  currentAccount: string
  userNFTs: UserNFT[]
  loading: boolean
  error: string | null
  getUserNFTs: () => Promise<UserNFT[]>
  refreshNFTs: () => Promise<void>
  getNFTDetails: (tokenId: number) => Promise<{
    owner: string
    tokenURI: string
    campaignId: string
    metadata?: any
  } | null>
  uploadNFTImage: (file: File) => Promise<string>
  createNFTMetadata: (
    campaignId: string,
    rewardType: "first_supporter" | "top_supporter" | "vrf_winner",
    imageFile?: File,
  ) => Promise<string>
  connectWallet: () => Promise<void>
}

import { NFT_MINTER_ABI, NFT_MINTER_ADDRESS } from "./Constants"

const fetchNFTContract = (
  signerOrProvider: ethers.BrowserProvider | ethers.JsonRpcSigner | ethers.ContractRunner | null | undefined,
) => new ethers.Contract(NFT_MINTER_ADDRESS, NFT_MINTER_ABI, signerOrProvider)

export const NFTContext = createContext<NFTContextType | null>(null)

export const NFTProvider = ({ children }: { children: ReactNode }) => {
  const [currentAccount, setCurrentAccount] = useState("")
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkIfWalletConnected = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length) {
          setCurrentAccount(accounts[0])
          console.log("Wallet connected:", accounts[0])
        } else {
          console.log("No accounts found")
          setCurrentAccount("")
        }
      } else {
        console.log("Ethereum provider not found")
        setCurrentAccount("")
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error)
      setCurrentAccount("")
    }
  }

  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length) {
          setCurrentAccount(accounts[0])
          console.log("Wallet connected:", accounts[0])
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  const setupWalletEventListeners = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0])
          console.log("Account changed:", accounts[0])
        } else {
          setCurrentAccount("")
          console.log("Wallet disconnected")
        }
      })

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }
  }

  useEffect(() => {
    checkIfWalletConnected()
    setupWalletEventListeners()

    // Cleanup event listeners
    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  const determineNFTType = (tokenURI: string): "first" | "top" | "vrf" => {
    if (tokenURI.includes("firstContributor") || tokenURI.includes("first")) return "first"
    if (tokenURI.includes("TopContributor") || tokenURI.includes("top")) return "top"
    if (tokenURI.includes("VRF Winner") || tokenURI.includes("vrf")) return "vrf"
    return "first"
  }

  const fetchMetadataFromIPFS = async (tokenURI: string) => {
    try {
      // If it's an IPFS URL, try to fetch metadata
      if (tokenURI.includes("ipfs://") || tokenURI.includes("/ipfs/")) {
        const response = await fetch(tokenURI)
        if (response.ok) {
          return await response.json()
        }
      }
    } catch (error) {
      console.log("Could not fetch metadata from IPFS:", error)
    }
    return null
  }

  const getUserNFTs = async (): Promise<UserNFT[]> => {
    if (!currentAccount) {
      return []
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchNFTContract(provider)
      const maxCampaigns = 100
      const userNFTsList: UserNFT[] = []

      for (let campaignId = 1; campaignId <= maxCampaigns; campaignId++) {
        try {
          const tokenId = await contract.userToCampaignToken(currentAccount, campaignId)
          const tokenIdNumber = Number(tokenId.toString())

          if (tokenIdNumber > 0) {
            try {
              const tokenURI = await contract.tokenURI(tokenIdNumber)
              const owner = await contract.ownerOf(tokenIdNumber)

              if (owner.toLowerCase() === currentAccount.toLowerCase()) {
                const nftType = determineNFTType(tokenURI)
                const metadata = await fetchMetadataFromIPFS(tokenURI)

                // Use metadata image if available, otherwise use tokenURI
                const imageUrl = metadata?.image || tokenURI

                userNFTsList.push({
                  tokenId: tokenIdNumber.toString(),
                  campaignId: campaignId.toString(),
                  type: nftType,
                  imageUrl: imageUrl,
                  campaignTitle: metadata?.name || `Campaign #${campaignId}`,
                  metadata: metadata,
                })
              }
            } catch (err) {
              console.log(`Error fetching NFT details for campaign ${campaignId}:`, err)
            }
          }
        } catch (err) {
          continue
        }
      }

      return userNFTsList
    } catch (error) {
      console.error("Error fetching user NFTs:", error)
      throw error
    }
  }

  const refreshNFTs = async () => {
    if (!currentAccount) {
      setUserNFTs([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nfts = await getUserNFTs()
      setUserNFTs(nfts)
    } catch (error) {
      console.error("Error refreshing NFTs:", error)
      setError("Failed to load your NFTs")
    } finally {
      setLoading(false)
    }
  }

  const getNFTDetails = async (tokenId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = fetchNFTContract(provider)

      const owner = await contract.ownerOf(tokenId)
      const tokenURI = await contract.tokenURI(tokenId)
      const metadata = await fetchMetadataFromIPFS(tokenURI)

      let campaignId = "0"
      for (let campId = 1; campId <= 100; campId++) {
        try {
          const userToken = await contract.userToCampaignToken(owner, campId)
          if (Number(userToken.toString()) === tokenId) {
            campaignId = campId.toString()
            break
          }
        } catch {
          continue
        }
      }

      return {
        owner,
        tokenURI,
        campaignId,
        metadata,
      }
    } catch (error) {
      console.error("Error fetching NFT details:", error)
      return null
    }
  }

  const uploadNFTImage = async (file: File): Promise<string> => {
    try {
      const hash = await ipfsService.uploadFile(file)
      return ipfsService.getIPFSUrl(hash)
    } catch (error) {
      console.error("Error uploading NFT image:", error)
      throw error
    }
  }

  const createNFTMetadata = async (
    campaignId: string,
    rewardType: "first_supporter" | "top_supporter" | "vrf_winner",
    imageFile?: File,
  ): Promise<string> => {
    try {
      const metadataHash = await ipfsService.createNFTMetadata(campaignId, rewardType, imageFile)
      return ipfsService.getIPFSUrl(metadataHash)
    } catch (error) {
      console.error("Error creating NFT metadata:", error)
      throw error
    }
  }

  useEffect(() => {
    if (currentAccount) {
      refreshNFTs()
    } else {
      setUserNFTs([])
    }
  }, [currentAccount])

  const contextValue: NFTContextType = {
    currentAccount,
    userNFTs,
    loading,
    error,
    getUserNFTs,
    refreshNFTs,
    getNFTDetails,
    uploadNFTImage,
    createNFTMetadata,
    connectWallet,
  }

  return <NFTContext.Provider value={contextValue}>{children}</NFTContext.Provider>
}

export const useNFT = () => {
  const context = React.useContext(NFTContext)
  if (!context) {
    throw new Error("useNFT must be used within an NFTProvider")
  }
  return context
}

export default NFTContext
