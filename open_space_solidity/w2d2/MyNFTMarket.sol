// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.0;
 import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
 import "@openzeppelin/contracts/utils/Counters.sol";
 import "./MyERC20.sol";

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
    MyERC20 public immutable myERC20;

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
        myERC20 = MyERC20(_tokenAddress);
    }

    /**
     * 上架 NFT
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
     * 购买NFT：只负责购买流程的启动
     */
    function buyNFT(address nftContract, uint256 tokenId) external {

        Listing storage listing = listings[nftContract][tokenId];
        MyERC721 nft = MyERC721(nftContract);
        require(listing.price > 0, "NFTMarket: This NFT is not listed for sale.");
        // 使用transferWithCallBack转账购买
        myERC20.transferWithCallBack(listing.seller, listing.price);
        // nft合约里面的转账
        nft.transferFrom(listing.seller, msg.sender, tokenId);

        emit NFTSold(nftContract, tokenId, listing.seller, msg.sender, listing.price);
        delete listings[nftContract][tokenId];
    }

    /**
     * 重写回调函数: 这个函数才是真正的执行token转账，nft转账的逻辑
     */
    function tokensReceived(address from,uint256 amount) external override returns (bool) {
        require(msg.sender == address(myERC20), "NFTMarket: Only the official market token can call this function.");
        
        (address nftContract, uint256 tokenId) = abi.decode(msg.data, (address, uint256));
        
        Listing storage listing = listings[nftContract][tokenId];
        MyERC721 nft = MyERC721(nftContract);

        require(listing.price > 0, "NFTMarket: This NFT is not listed for sale.");
        require(amount == listing.price, "NFTMarket: Incorrect amount of tokens sent.");
        
        // 转移token
        myERC20.transfer(listing.seller, amount);
        // 转移nft
        nft.transferFrom(listing.seller, from, tokenId);
        
        emit NFTSold(nftContract, tokenId, listing.seller, from, listing.price);
        // 删除列表中已经交易掉nft
        delete listings[nftContract][tokenId];
        
        return true;
    }
}




 