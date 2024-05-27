// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract RealEstateToken is ERC20, AccessControl {

    // Role identifier for the minterburner role
    bytes32 public constant MINTBURN_ROLE = keccak256("MINTBURN_ROLE");

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner,
        address minterburner
    ) ERC20(name, symbol) {
        _grantRole(MINTBURN_ROLE, minterburner); // Set the initial minter
        _mint(owner, initialSupply); // Mint initial supply to the owner
    }

   
    function mint(address account, uint256 amount) external onlyRole(MINTBURN_ROLE) returns(bool) {
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount) external onlyRole(MINTBURN_ROLE) returns(bool) {
        _burn(account, amount);
        return true;
    }
}