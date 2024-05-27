// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "./RealEstateToken.sol";
import "./FunctionsSource.sol";
import "./RealEstateTokenFactoryCCIP.sol";

contract RealEstateTokenFactory is ConfirmedOwner, ReentrancyGuard, FunctionsClient {   
    using FunctionsRequest for FunctionsRequest.Request;

    struct tokenRequest {
        address to;
        string name;
        string symbol;
        uint256 initialSupply;
    }

    FunctionsSource internal immutable i_functionsSource;
    RealEstateTokenFactoryCCIP internal immutable i_realestateccip;
    uint256 constant AMOY_POLYGON_CHAIN_ID = 80002;
    address constant AMOY_FUNCTIONS_ROUTER_CHAINLINK_FUNCTIONS = 0xC22a79eBA640940ABB6dF0f7982cc119578E11De;
    bytes32 constant AMOY_DON_ID = hex"66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000";
    uint64 immutable i_subId;
    uint32 private constant GAS_LIMIT_CHAINLINK_FUNCTIONS = 300_000;
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    mapping(bytes32 => tokenRequest) internal s_issueTo;

    event RequestFulFilled (bytes32 requestId, bytes response);


    error OnlyOnAmoyPolygon();
    error LatestIssueInProgress();
    error MintRequestFailed(bytes32 requestId);

    constructor(
        uint64 subId,
        address realestatetokenfactoryccip
    ) ConfirmedOwner(msg.sender) FunctionsClient(AMOY_FUNCTIONS_ROUTER_CHAINLINK_FUNCTIONS) {
        i_functionsSource = new FunctionsSource();
        i_realestateccip = RealEstateTokenFactoryCCIP(realestatetokenfactoryccip);
        i_subId = subId;
    }

    /// @dev Requests token issue to chainlink functions
    /// @notice This function can only be called by the owner and only on amoy polygon pos network.
    /// @param to The address of the real estate owner who wants to tokenize it.
    /// @param name The name of token to be issued.
    /// @param symbol The symbol of token to be issued.
    /// @param initialSupply The initial supply of token to be issued.
    /// @return requestid 
    function issueTokenRequest(
        address to,
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external onlyOwner returns (bytes32) {
        onlyOnAmoyPolygon();

        if (s_lastRequestId != bytes32(0)) revert LatestIssueInProgress();
        
        // request sent to yield offchain data via js script in i_functionsSource.getInfo() about validity of ownership
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(i_functionsSource.getInfo());
        s_lastRequestId = _sendRequest(req.encodeCBOR(), i_subId, GAS_LIMIT_CHAINLINK_FUNCTIONS, AMOY_DON_ID);

        s_issueTo[s_lastRequestId] = tokenRequest(to, name, symbol, initialSupply);

        return s_lastRequestId;
    }

    /// @dev Callback function which is called by chainlink functions upon requesting issuance
    /// @notice Due to chainlink functions being in beta stage can not call gas extensive functions which consumes over 300_000 gas
    /// @notice And hence By not directly calling mintfullfill request function it is just emiting log and future calls will be handled in backend 
    /// @param requestId The requestId
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory /* err */
    ) internal override {
        if (s_lastRequestId != requestId) revert MintRequestFailed(requestId);

        s_lastResponse = response;

        emit RequestFulFilled (requestId, response);
    }
    
    /// @dev Called backend when log is emitted after fulfillrequest to mint the tokens upon validating the response.
    /// @param requestId The requestId
    /// @return The address of the token 
    function _mintFulFillRequest(
        bytes32 requestId,
        bytes memory response
    ) external returns (address) {
        if (requestId != s_lastRequestId) revert MintRequestFailed(requestId);
        if (keccak256(response) != keccak256(abi.encode("ok"))) revert MintRequestFailed(requestId);

        tokenRequest memory request = s_issueTo[requestId];

        RealEstateToken newToken = new RealEstateToken(request.name, request.symbol, request.initialSupply, request.to, address(i_realestateccip));
        i_realestateccip.updateTokenContracts(request.name, request.symbol, address(newToken)); //tracking token address with name and symbol
        s_lastRequestId = bytes32(0);
        s_lastResponse = "";

        return address(newToken);
    }

    function onlyOnAmoyPolygon() internal view {
        if (block.chainid != AMOY_POLYGON_CHAIN_ID) {
            revert OnlyOnAmoyPolygon();
        }
    }

/* Thes functions are of no use in this contract. They are here because remix was estimating gas out of limit when
the contract size was small (a bit absurd and strange but true). */ 
    function onlyRouter(address sender) internal pure {
        if (sender != address(0)) {
            revert OnlyOnAmoyPolygon();
        }
    }

    function onlyAllowlistedChain(uint64 _destinationChainSelector) internal pure {
        if (_destinationChainSelector!=0) {
            revert OnlyOnAmoyPolygon();
        }
    }

    function onlyAllowlistedSource(uint64 _destinationChainSelector, address source) internal pure {
       if (_destinationChainSelector!=0 && source!=address(0)) {
            revert OnlyOnAmoyPolygon();
        }
    }
}
