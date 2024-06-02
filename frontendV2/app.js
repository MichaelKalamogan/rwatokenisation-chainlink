// Initialize web3.js with MetaMask
const provider = window.ethereum;
const web3 = new Web3(provider);

// Address of the deployed contract
const contractAddress = '0xB6243cb6E68dd3604758fC44A989C125c3b54a07'; // Your contract address

// Load the ABI from the JSON file
fetch('ABI/RealEstateTokenFactory.json')
    .then(response => response.json()) // Parse JSON data
    .then(abi => {
        // Create a contract instance
        const contract = new web3.eth.Contract(abi, contractAddress);

        // Add event listener for the verify form submission
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

        // Add event listener for the issue token form submission
        const issueTokenForm = document.getElementById('issueTokenForm');
        issueTokenForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!verified) {
                alert('Please verify ownership first.');
                return;
            }

            // Get the user's MetaMask address
            // const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const userAddress = "0xEaF23AaB2d8316f9bBC130F77254B3AE18BaD230";

            // Check if the user is the owner
            const owner = await contract.methods.owner().call();
            // if (userAddress !== owner) {
            //     alert('Only the owner can issue token requests.');
            //     return;
            // }
            console.log("owner found", owner)
            const name = document.getElementById('tokenName').value;
            const symbol = document.getElementById('tokenSymbol').value;
            const initialSupply = document.getElementById('initialSupply').value;

            try {
                const receipt = await contract.methods.issueTokenRequest(userAddress, name, symbol, initialSupply).send({ from: owner });
                console.log('Token request issued', receipt);

                contract.events.RequestFulFilled()
                    .on('data', async (event) => {
                        const requestId = event.returnValues.requestId;
                        const response = event.returnValues.response;

                        try {
                            const mintReceipt = await contract.methods._mintFulFillRequest(requestId, response).send({ from: userAddress });
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
    })
    .catch(error => {
        console.error('Error loading ABI:', error);
    });
