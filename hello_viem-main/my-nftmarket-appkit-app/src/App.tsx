// src/App.tsx
import { useState } from "react"
import {
  useAccount,
  useDisconnect,
  useContractWrite,
  useContractRead,
  useSwitchNetwork,
  useNetwork,
} from "wagmi"
import { parseUnits } from "viem"
import nftMarketJson from "./abis/NFTMarket.json"
import erc20Json from "./abis/MyERC20.json"

const NFT_MARKET_ADDRESS = "0x7f8770B0923a52f35168C66A5d65e8AF4bf2D44B"
const NFT_MARKET_ABI = nftMarketJson.abi

const ERC20_ADDRESS = "0xYourERC20TokenAddress" // 替换成你实际的ERC20地址
const ERC20_ABI = erc20Json.abi
const TOKEN_DECIMALS = 18

function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { chain } = useNetwork()
  const { chains, switchNetwork } = useSwitchNetwork()

  const [tokenId, setTokenId] = useState("")
  const [price, setPrice] = useState("")

  const { data: listings, refetch } = useContractRead({
    address: NFT_MARKET_ADDRESS,
    abi: NFT_MARKET_ABI,
    functionName: "getListing",
    watch: true,
  })

  const { write: listNFT } = useContractWrite({
    address: NFT_MARKET_ADDRESS,
    abi: NFT_MARKET_ABI,
    functionName: "list",
    onSuccess: () => {
      alert("NFT 上架成功！")
      refetch()
    },
    onError(error) {
      alert("上架失败：" + (error as any).message)
    },
  })

  const { write: buyNFT } = useContractWrite({
    address: NFT_MARKET_ADDRESS,
    abi: NFT_MARKET_ABI,
    functionName: "buyNFT",
    onSuccess: () => {
      alert("购买成功！")
      refetch()
    },
    onError(error) {
      alert("购买失败：" + (error as any).message)
    },
  })

  const { write: approveToken } = useContractWrite({
    address: ERC20_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
  })

  const handleBuyNFT = async (listing: any) => {
    if (!approveToken || !buyNFT) return
    try {
      alert("请求授权支付...")
      approveToken({
        args: [NFT_MARKET_ADDRESS, BigInt(listing.price)],
        onSuccess() {
          alert("授权成功，开始购买...")
          buyNFT({
            args: [BigInt(listing.id)],
          })
        },
        onError(error) {
          alert("授权失败：" + (error as any).message)
        },
      })
    } catch (error) {
      alert("购买流程失败：" + (error as any).message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>NFT Market</h2>
      <w3m-button />

      {isConnected && (
        <>
          <p>当前连接网络: {chain?.name} (chainId: {chain?.id})</p>
          <button onClick={() => disconnect()}>断开钱包</button>

          <h4>网络切换</h4>
          {chains.map((x) => (
            <button
              key={x.id}
              disabled={!switchNetwork || x.id === chain?.id}
              onClick={() => switchNetwork?.(x.id)}
              style={{ marginRight: "8px" }}
            >
              切换到 {x.name}
            </button>
          ))}

          <h3>上架 NFT</h3>
          <input
            placeholder="Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          <input
            placeholder="价格（ERC20 Token）"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            onClick={() =>
              listNFT?.({
                args: [BigInt(tokenId), parseUnits(price, TOKEN_DECIMALS)],
              })
            }
            disabled={!tokenId || !price}
          >
            上架 NFT
          </button>

          <h3>可购买的 NFT</h3>
          <ul>
            {Array.isArray(listings) && listings.length > 0 ? (
              listings.map((nft: any, idx: number) => (
                <li key={idx}>
                  Token #{nft.tokenId.toString()} - 价格:{" "}
                  {Number(nft.price) / 10 ** TOKEN_DECIMALS} ERC20 Token
                  <button onClick={() => handleBuyNFT(nft)}>购买</button>
                </li>
              ))
            ) : (
              <p>暂无 NFT 上架</p>
            )}
          </ul>
        </>
      )}

      {!isConnected && <p>请先连接钱包</p>}
    </div>
  )
}

export default App
