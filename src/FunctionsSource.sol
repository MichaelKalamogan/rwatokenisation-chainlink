// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract FunctionsSource {

    string public getInfo = "const { ethers } = await import('npm:ethers@6.10.0');"
"const abiCoder = ethers.AbiCoder.defaultAbiCoder();"
"const apiResponse = await Functions.makeHttpRequest({"
 "   url: `https://assetvalidator-simulator.onrender.com/api/validate`,"
"});" "const validity = String(apiResponse.data.validate);"
"const encoded = abiCoder.encode([`string`], [validity]);"
"return ethers.getBytes(encoded);";
}


