// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.0;
 import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
 import "@openzeppelin/contracts/utils/Counters.sol";
 import "/w2d1/BaseERC20.sol";

// MyERC721
 contract MyERC721 is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    constructor() ERC721(unicode"集训营学员卡", "CAMP") {}
    
    function mint(address student, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(student, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
 }

 // NFT市场合约
 contract NFTMarket is TokenRecipient {
    // 市场使用的支付 Token
    BaseERC20 public immutable baseERC20;

    // 结构体：存储上架信息
    struct Listing {
        address seller;
        uint256 price;
    }

    // 映射：(NFT合约地址 => (Token ID => 上架信息))
    mapping(address => mapping(uint256 => Listing)) public listings;

    // 事件
    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event NFTSold(
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address indexed buyer,
        uint256 price
    );

    /**
     * @dev 构造函数，设置市场使用的 ERC20 Token 地址。
     * @param _tokenAddress MarketToken 的合约地址。
     */
    constructor(address _tokenAddress) {
        baseERC20 = BaseERC20(_tokenAddress);
    }

    /**
     * @dev 上架 NFT
     */
    function list(address nftContract, uint256 tokenId, uint256 price) external {
        MyERC721 nft = MyERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "NFTMarket: You are not the owner of this NFT.");
        require(price > 0, "NFTMarket: Price must be greater than zero.");
        require(nft.getApproved(tokenId) == address(this), "NFTMarket: The market must be approved to transfer the NFT.");

        listings[nftContract][tokenId] = Listing(msg.sender, price);
        emit NFTListed(nftContract, tokenId, msg.sender, price);
    }

    /**
     * @dev 购买 NFT (拉取模式)
     */
    function buyNFT(address nftContract, uint256 tokenId) external {
        Listing storage listing = listings[nftContract][tokenId];
        MyERC721 nft = MyERC721(nftContract);
        require(listing.price > 0, "NFTMarket: This NFT is not listed for sale.");
        // 使用transferWithCallBack转账购买
        baseERC20.transferWithCallBack(listing.seller, listing.price);
        nft.transferFrom(listing.seller, msg.sender, tokenId);

        emit NFTSold(nftContract, tokenId, listing.seller, msg.sender, listing.price);
        delete listings[nftContract][tokenId];
    }

    /**
     * 重写接受函数
     */
    function tokensReceived(address from,uint256 amount) external override returns (bool) {
        require(msg.sender == address(baseERC20), "NFTMarket: Only the official market token can call this function.");
        
        (address nftContract, uint256 tokenId) = abi.decode(msg.data, (address, uint256));
        
        Listing storage listing = listings[nftContract][tokenId];
        MyERC721 nft = MyERC721(nftContract);

        require(listing.price > 0, "NFTMarket: This NFT is not listed for sale.");
        require(amount == listing.price, "NFTMarket: Incorrect amount of tokens sent.");
        
        // 转移token
        baseERC20.transfer(listing.seller, amount);
        // 转移nft
        nft.transferFrom(listing.seller, from, tokenId);
        
        emit NFTSold(nftContract, tokenId, listing.seller, from, listing.price);
        // 删除已经交易掉nft
        delete listings[nftContract][tokenId];
        
        return true;
    }
}




 