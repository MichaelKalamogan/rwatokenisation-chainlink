// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "./RealEstateToken.sol";

contract RealEstateTokenFactoryCCIP is ConfirmedOwner, CCIPReceiver, ReentrancyGuard {
    enum PayFeesIn {
        Native,
        LINK
    }
    LinkTokenInterface internal immutable i_linkToken;
    uint256 private constant GAS_LIMIT_CCIP = 2_000_000;

    mapping(uint64 => bool) public allowlistedChains; 
    mapping(string => mapping(string => address)) public tokenContracts;

    event ChainEnabled(uint64 chainSelector, address xTokenAddress, bytes ccipExtraArgs);
    event ChainDisabled(uint64 chainSelector);
    event CrossChainSent(address token_owner, uint256 amount, uint64 destinationChainSelector);
    event CrossChainReceived(address to, uint256 amount, uint64 sourceChainSelector);

    error NotEnoughBalanceForFees(uint256 currentBalance, uint256 calculatedFees);
    error ChainNotEnabled(uint64 chainSelector);
    error SenderNotEnabled(address sender);
    error Token_TransferFailed();
    error InvalidReceiverAddress();

    constructor(
        address ccipRouterAddress,
        address linkTokenAddress
    ) ConfirmedOwner(msg.sender)CCIPReceiver(ccipRouterAddress) {
        if (ccipRouterAddress == address(0)) revert InvalidRouter(address(0));
        i_linkToken = LinkTokenInterface(linkTokenAddress);
    }

    /// @dev Updates the allowlist status of a destination chain for transactions.
    /// @notice This function can only be called by the owner.
    /// @param _destinationChainSelector The selector of the destination chain to be updated.
    function allowlistDestinationChain(
        uint64 _destinationChainSelector
    ) external onlyOwner {
        allowlistedChains[_destinationChainSelector] = true;
    }

    /// @dev Sends data to mint the token to owner address on the destination chain and burns that amount of token in the current chain.
    /// @notice nonReentrant and allowed to send data only on whitelisted chains.
    /// @param tokenAddress The address of token.
    /// @param token_owner The address of the owner of rwa token.
    /// @param amount The amount of the token to transfer on the destination blockchain.
    /// @param destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param destinationChaincontract The address of receiver contract on the destination blockchain.
    /// @param payFeesIn Prefered choice of fees payment for sending the message cross chain. 0 for native and 1 for LINK.
    /// @return messageId The ID of the message that was sent. 
    function crossChainTransfer(
        address tokenAddress,
        address token_owner,
        uint256 amount,
        uint64 destinationChainSelector,
        address destinationChaincontract,
        PayFeesIn payFeesIn
    ) external nonReentrant returns (bytes32 messageId) {
        onlyAllowlistedChain(destinationChainSelector);
        if (token_owner == address(0)) revert InvalidReceiverAddress();

        RealEstateToken token = RealEstateToken(tokenAddress);
        if (token.balanceOf(msg.sender) < amount) revert Token_TransferFailed();
        token.burn(token_owner, amount);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationChaincontract), //The contract address on destination chain
            data: abi.encode(token.name(), token.symbol(), token_owner, amount), // Data of token
            tokenAmounts: new Client.EVMTokenAmount[](0) , // setting null value
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({ gasLimit: GAS_LIMIT_CCIP }) // Additional arguments, setting gas limit
            ),
            feeToken: payFeesIn == PayFeesIn.LINK ? address(i_linkToken) : address(0)
        });

        uint256 fees = IRouterClient(i_ccipRouter).getFee(destinationChainSelector, message); //Calculating fees
        
        if (payFeesIn == PayFeesIn.LINK) {
            if (fees > i_linkToken.balanceOf(address(this))) {
                revert NotEnoughBalanceForFees(i_linkToken.balanceOf(address(this)), fees);
            }
            i_linkToken.approve(address(i_ccipRouter), fees);
            messageId = IRouterClient(i_ccipRouter).ccipSend(destinationChainSelector, message);
        } else {
            if (fees > address(this).balance) {
                revert NotEnoughBalanceForFees(address(this).balance, fees);
            }
            messageId = IRouterClient(i_ccipRouter).ccipSend{value: fees}(destinationChainSelector, message);
        }
      
        emit CrossChainSent(token_owner, amount, destinationChainSelector);

        return messageId;
    }

    /// @dev Fetches the details of the received message and checks if the token already exists and mints token accordingly in destination chain.
    /// @notice This function is called by the router contract from chainlink and checks if called from correct source chain or not.
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        onlyAllowlistedChain(message.sourceChainSelector);

        uint64 sourceChainSelector = message.sourceChainSelector;

        (string memory name, string memory symbol, address to, uint256 amount) =
            abi.decode(message.data, (string, string, address, uint256));
        
        // Check if the token already exists on chain
        address tokenAddress = tokenContracts[name][symbol];
        // If token already exists, mint additional tokens
        if (tokenAddress != address(0)) {
            RealEstateToken(tokenAddress).mint(to, amount);
        // If token doesn't exist, create a new token
        } else {
            RealEstateToken newToken = new RealEstateToken(name, symbol, amount, to, address(this));
            tokenContracts[name][symbol] = address(newToken);
        }

        emit CrossChainReceived(to, amount, sourceChainSelector);
    }

    function updateTokenContracts(string memory name, string memory symbol, address tokenAddress) external {
        tokenContracts[name][symbol] = tokenAddress;
    }

   
    function onlyAllowlistedChain(uint64 _destinationChainSelector) internal view {
        if (!allowlistedChains[_destinationChainSelector]) {
            revert ChainNotEnabled(_destinationChainSelector);
        }
    }

 
}