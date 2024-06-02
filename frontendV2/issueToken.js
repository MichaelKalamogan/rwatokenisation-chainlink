const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('HTTP://127.0.0.1:7545');
    
    const privateKey = 'ee6be932ab02379201a0e8760a0c9273955409b0f94f4920121543fa8ee07c68';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Load the contract
    const contractAddress = '0xYourContractAddress';
    const contractABI = [ /* ABI goes here */ ];
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Call contract functions as needed
    try {
        const userAddress = await wallet.getAddress();
        const name = "TokenName"; // Replace with the token name
        const symbol = "TokenSymbol"; // Replace with the token symbol
        const initialSupply = 1000; // Replace with the initial supply

        const tx = await contract.issueTokenRequest(userAddress, name, symbol, initialSupply);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Transaction hash:", tx.hash);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
