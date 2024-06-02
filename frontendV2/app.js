window.addEventListener('load', async () => {

    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        window.web3 = new Web3(window.ethereum);

        // Request account access if needed
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.error("User denied account access");
            return;
        }
    } else {
        console.log('MetaMask is not installed. Please install MetaMask to use this app.');
        return;
    }

    // Ensure MetaMask is connected to Sepolia
    const chainId = await web3.eth.getChainId();
    if (chainId !== 11155111) { // 11155111 is Sepolia network chain ID
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }] // 0xaa36a7 is the hex value of 11155111
            });
        } catch (switchError) {
            console.error('Error switching to Sepolia network:', switchError);
            return;
        }
    }

    // Fetch the ABI from the JSON file
    const response = await fetch('ABI/RealEstateTokenFactory.json');
    if (!response.ok) {
        console.error('Failed to load RealEstateTokenFactory.json:', response.statusText);
        return;
    }
    const data = await response.json();
    const contractABI = data.abi;

    const contractAddress = "ContractAddress"; // Replace with your contract address on Sepolia
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Get the current user's account
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    // Ensure the user is the deployer (owner) address
    const ownerAddress = await contract.methods.owner().call();
    if (userAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        alert('Only the deployer can issue token requests.');
        return;
    }

    // Handle the form submission
    document.getElementById('tokenForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const symbol = document.getElementById('symbol').value;
        const initialSupply = document.getElementById('initialSupply').value;

        try {
            const receipt = await contract.methods.issueTokenRequest(userAddress, name, symbol, initialSupply).send({ from: userAddress });
            console.log('Transaction receipt:', receipt);
            alert('Token issue request submitted successfully!');
        } catch (error) {
            console.error('Error calling issueTokenRequest:', error);
            alert('Error submitting token issue request.');
        }
    });

    // Listen for the RequestFulFilled event
    contract.events.RequestFulFilled()
        .on('data', async (event) => {
            const { requestId, response } = event.returnValues;

            try {
                const mintReceipt = await contract.methods._mintFulFillRequest(requestId, response).send({ from: userAddress });
                console.log('Minting transaction receipt:', mintReceipt);
                alert('Token minting completed successfully!');
            } catch (error) {
                console.error('Error calling _mintFulFillRequest:', error);
                alert('Error completing token minting.');
            }
        })
        .on('error', (error) => {
            console.error('Error in RequestFulFilled event listener:', error);
        });
});