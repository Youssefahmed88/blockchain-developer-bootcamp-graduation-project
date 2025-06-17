// IPFS utility functions for uploading and managing NFT metadata

interface NFTMetadata {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
    campaign_id: string
    reward_type: "first_supporter" | "top_supporter" | "vrf_winner"
  }
  
  class IPFSService {
    private apiKey: string
    private apiSecret: string
    private endpoint: string
    private gateway: string
  
    constructor() {
      this.apiKey = process.env.NEXT_PUBLIC_INFURA_IPFS_API_KEY || ""
      this.apiSecret = process.env.NEXT_PUBLIC_INFURA_IPFS_API_KEY_SECRET || ""
      this.endpoint = process.env.NEXT_PUBLIC_INFURA_IPFS_ENDPOINT || "https://ipfs.infura.io:5001"
      this.gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"
    }
  
    // Upload file to IPFS using Infura
    async uploadFile(file: File): Promise<string> {
      try {
        const formData = new FormData()
        formData.append("file", file)
  
        const response = await fetch(`${this.endpoint}/api/v0/add`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
          },
          body: formData,
        })
  
        if (!response.ok) {
          throw new Error(`IPFS upload failed: ${response.statusText}`)
        }
  
        const result = await response.json()
        return result.Hash
      } catch (error) {
        console.error("Error uploading file to IPFS:", error)
        throw error
      }
    }
  
    // Upload JSON metadata to IPFS
    async uploadMetadata(metadata: NFTMetadata): Promise<string> {
      try {
        const blob = new Blob([JSON.stringify(metadata, null, 2)], {
          type: "application/json",
        })
        const file = new File([blob], "metadata.json", { type: "application/json" })
  
        return await this.uploadFile(file)
      } catch (error) {
        console.error("Error uploading metadata to IPFS:", error)
        throw error
      }
    }
  
    // Create complete NFT metadata and upload to IPFS
    async createNFTMetadata(
      campaignId: string,
      rewardType: "first_supporter" | "top_supporter" | "vrf_winner",
      imageFile?: File,
    ): Promise<string> {
      try {
        let imageHash = ""
  
        // Upload image if provided
        if (imageFile) {
          imageHash = await this.uploadFile(imageFile)
        } else {
          // Use default images based on reward type
          const defaultImages = {
            first_supporter: "bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/firstContributor.webp",
            top_supporter: "bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/TopContributor.webp",
            vrf_winner: "bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/VRF Winner.webp",
          }
          imageHash = defaultImages[rewardType]
        }
  
        const metadata: NFTMetadata = {
          name: this.getRewardName(rewardType, campaignId),
          description: this.getRewardDescription(rewardType, campaignId),
          image: `${this.gateway}${imageHash}`,
          attributes: [
            {
              trait_type: "Campaign ID",
              value: campaignId,
            },
            {
              trait_type: "Reward Type",
              value: rewardType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            },
            {
              trait_type: "Rarity",
              value: this.getRewardRarity(rewardType),
            },
            {
              trait_type: "Network",
              value: "Sepolia",
            },
          ],
          campaign_id: campaignId,
          reward_type: rewardType,
        }
  
        return await this.uploadMetadata(metadata)
      } catch (error) {
        console.error("Error creating NFT metadata:", error)
        throw error
      }
    }
  
    // Get reward name based on type
    private getRewardName(rewardType: string, campaignId: string): string {
      const names = {
        first_supporter: `First Supporter - Campaign #${campaignId}`,
        top_supporter: `Top Supporter - Campaign #${campaignId}`,
        vrf_winner: `Lucky Winner - Campaign #${campaignId}`,
      }
      return names[rewardType as keyof typeof names] || `Reward - Campaign #${campaignId}`
    }
  
    // Get reward description based on type
    private getRewardDescription(rewardType: string, campaignId: string): string {
      const descriptions = {
        first_supporter: `Exclusive NFT awarded to the first supporter of Campaign #${campaignId}. This rare collectible represents your pioneering spirit in supporting innovative projects.`,
        top_supporter: `Premium NFT awarded to the highest contributor of Campaign #${campaignId}. This prestigious collectible recognizes your exceptional generosity and commitment.`,
        vrf_winner: `Special NFT awarded to the randomly selected winner of Campaign #${campaignId}. This unique collectible was chosen through Chainlink VRF for provably fair selection.`,
      }
      return descriptions[rewardType as keyof typeof descriptions] || `Reward NFT for Campaign #${campaignId}`
    }
  
    // Get reward rarity based on type
    private getRewardRarity(rewardType: string): string {
      const rarities = {
        first_supporter: "Rare",
        top_supporter: "Epic",
        vrf_winner: "Legendary",
      }
      return rarities[rewardType as keyof typeof rarities] || "Common"
    }
  
    // Get IPFS URL from hash
    getIPFSUrl(hash: string): string {
      return `${this.gateway}${hash}`
    }
  
    // Extract IPFS hash from URL
    extractHashFromUrl(url: string): string {
      const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
      return match ? match[1] : ""
    }
  }
  
  export const ipfsService = new IPFSService()
  export type { NFTMetadata }
  