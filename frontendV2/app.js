// Load the ABI from the JSON file
async function loadABI() {
    try {
        const response = await fetch('ABI/RealEstateTokenFactory.json');
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error loading ABI:', error);
        throw error; // Throw the error to indicate failure to load ABI
    }
}

// Initialize web3.js with MetaMask
async function initWeb3() {
    // Check if MetaMask is installed
    if (window.ethereum) {
        try {
            // Request accounts
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            console.log('MetaMask accounts:', accounts);
            return accounts;
        } catch (error) {
            console.error('Error requesting accounts:', error);
            throw error; // Throw the error to indicate failure to request accounts
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
        const contractAddress = '0xB6243cb6E68dd3604758fC44A989C125c3b54a07'; // Your contract address

        // Create a contract instance
        const contract = new web3.eth.Contract(abi, contractAddress);

        // Event listener for the verify form submission
        const verifyForm = document.getElementById('verifyForm');
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Implement file handling and validation logic here
            
            // Set verified to true
            verified = true;

            // Show step 2 form
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
        });

        // Event listener for the issue token form submission
        const issueTokenForm = document.getElementById('issueTokenForm');
        issueTokenForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!verified) {
                alert('Please verify ownership first.');
                return;
            }

            const to = accounts[0];  // Use the current user's address
            const name = document.getElementById('tokenName').value;
            const symbol = document.getElementById('tokenSymbol').value;
            const initialSupply = document.getElementById('initialSupply').value;

            try {
                const receipt = await contract.methods.issueTokenRequest(to, name, symbol, initialSupply).send({ from: accounts[0] });
                console.log('Token request issued', receipt);

                contract.events.RequestFulFilled()
                    .on('data', async (event) => {
                        const requestId = event.returnValues.requestId;
                        const response = event.returnValues.response;

                        try {
                            const mintReceipt = await contract.methods._mintFulFillRequest(requestId, response).send({ from: accounts[0] });
                            console.log('Mint request fulfilled', mintReceipt);
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
        // Handle errors
        console.error('An error occurred:', error);
    }
}

// Call the main function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);
