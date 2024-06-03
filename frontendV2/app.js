// Load the token ABI
async function loadTokenABI() {
    try {
        const response = await fetch('ABI/RealEstateToken.json');
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error loading token ABI:', error);
        throw error;
    }
}

// Function to get the balance of the new token for a given address
async function getTokenBalance(tokenAddress, ownerAddress) {
    const web3 = new Web3(window.ethereum);
    const tokenABI = await loadTokenABI();

    const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    const balance = await tokenContract.methods.balanceOf(ownerAddress).call();
    return balance;
}

// Function to parse the transaction receipt and find the new contract address
function getNewContractAddress(receipt) {
    if (receipt.status) {
        for (const log of receipt.logs) {
            // Check for contract creation log
            if (log.topics.length === 0 && log.data.length === 66) {
                return web3.utils.toChecksumAddress('0x' + log.data.slice(26));
            }
        }
    }
    return null;
}

// Load the ABI from the JSON file
async function loadABI() {
    try {
        const response = await fetch('ABI/RealEstateTokenFactory.json');
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error loading ABI:', error);
        throw error; 
    }
}

async function initWeb3() {
    if (window.ethereum) {
        try {
            // Request accounts
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            console.log('MetaMask accounts:', accounts);
            return accounts;
        } catch (error) {
            console.error('Error requesting accounts:', error);
            throw error; 
        }
    } else {
        console.error('MetaMask not installed');
        throw new Error('MetaMask not installed');
    }
}

// Main function to interact with the contract
async function main() {
    try {
        // Load ABI
        const abi = await loadABI();

        // Initialize web3
        const accounts = await initWeb3();
        const provider = window.ethereum;
        const web3 = new Web3(provider);

        // Address of the deployed contract
        const contractAddress = '0xB6243cb6E68dd3604758fC44A989C125c3b54a07'; 

        // Create a contract instance
        const contract = new web3.eth.Contract(abi, contractAddress);

        const verifyForm = document.getElementById('verifyForm');
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Set verified to true
            verified = true;

            // Show step 2 form
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        });

        const issueTokenForm = document.getElementById('issueTokenForm');
        issueTokenForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!verified) {
                alert('Please verify ownership first.');
                return;
            }


            const owner = await contract.methods.owner().call();

            const to = accounts[0]; 
            const name = document.getElementById('tokenName').value;
            const symbol = document.getElementById('tokenSymbol').value;
            const initialSupply = document.getElementById('initialSupply').value;

            try {

                const receipt = await contract.methods.issueTokenRequest(to, name, symbol, initialSupply).send({ from: owner });

                console.log('Token request issued', receipt);

                contract.events.RequestFulFilled()
                    .on('data', async (event) => {
                        const requestId = event.returnValues.requestId;
                        const response = event.returnValues.response;

                        try {

                            const mintReceipt = await contract.methods._mintFulFillRequest(requestId, response).send({ from: owner });
                            console.log('Mint request fulfilled', mintReceipt);

                            const tokenAddress = getNewContractAddress(mintReceipt);

                            // Get the balance of the new token
                            const balance = await getTokenBalance(tokenAddress, to);

                            console.log(`Your token is created at address: ${tokenAddress}`);
                            console.log(`Token balance for ${to}: ${balance}`);
                            document.getElementById('tokenAddress').innerText = `Your token is created at address: ${tokenAddress}`;
                            document.getElementById('tokenBalance').innerText = `Token balance for ${to}: ${balance}`;

                        } catch (error) {
                            console.error('Error fulfilling mint request', error);
                        }
                    })
                    .on('error', (error) => {
                        console.error('Error on RequestFulFilled event', error);
                    });

            } catch (error) {
                console.error('Error issuing token request', error);
            }
        });

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

document.addEventListener('DOMContentLoaded', main);
