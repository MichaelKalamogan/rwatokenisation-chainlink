document.addEventListener('DOMContentLoaded', function () {
    const app = document.getElementById('app');
    const fileInputContainer = document.getElementById('file-input-container');
    const tokenFormContainer = document.getElementById('token-form-container');
    let assetVerified = false;
  
    function showLoader(container, show) {
      let loader = container.querySelector('.loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader';
        loader.textContent = 'Loading...';
        container.insertBefore(loader, container.firstChild);
      }
      loader.style.display = show ? 'block' : 'none';
    }
  
    function FileInput() {
      fileInputContainer.innerHTML = `
        <form id="file-input-form" class="file-input-form">
          <div class="form-group">
            <label for="assetName">Asset Name:</label>
            <input type="text" id="assetName" class="form-control">
          </div>
          <div class="form-group">
            <label for="assetType">Select Asset Type:</label>
            <select id="assetType" class="form-control">
              <option value="">--Please choose an option--</option>
              <option value="Real Estate">Real Estate</option>
            </select>
          </div>
          <div class="form-group">
            <input type="file" id="fileInput" class="form-control">
          </div>
          <button type="submit" class="submit-button">Submit</button>
        </form>
        <div id="file-message-container" class="message-container"></div>
      `;
  
      const form = document.getElementById('file-input-form');
      const messageContainer = document.getElementById('file-message-container');
      const submitButton = form.querySelector('.submit-button');
  
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const assetName = document.getElementById('assetName').value;
        const assetType = document.getElementById('assetType').value;
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
  
        if (!file) {
          alert('No file selected');
          return;
        }
  
        showLoader(fileInputContainer, true);
        submitButton.disabled = true;
        messageContainer.innerHTML = '';
  
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('assetType', assetType);
          formData.append('assetName', assetName);
  
          const response = await axios.post('https://assetvalidator-simulator.onrender.com/api/validate', formData);
          
          await new Promise(resolve => setTimeout(resolve, 4000));
          showLoader(fileInputContainer, false);
          submitButton.disabled = false;
  
          if (response.status === 200) {
            assetVerified = true;
            alert('File successfully verified');
            TokenForm();
          } else {
            messageContainer.innerHTML = 'File upload failed';
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 4000));
          showLoader(fileInputContainer, false);
          submitButton.disabled = false;
          messageContainer.innerHTML = 'An error occurred during file upload';
          console.error(error);
        }
      });
    }
  
    function TokenForm() {
      tokenFormContainer.innerHTML = `
        <div class="form-group">
          <label for="name">Asset Name:</label>
          <input type="text" id="name" class="form-control">
        </div>
        <div class="form-group">
          <label for="symbol">Select Token Type:</label>
          <select id="symbol" class="form-control">
            <option value="">--Please choose an option--</option>
            <option value="ETH">ETH</option>
            <option value="POLYGON">POLYGON</option>
          </select>
        </div>
        <div class="form-group">
          <label for="initialSupply">Initial Supply:</label>
          <input type="number" id="initialSupply" class="form-control">
        </div>
        <button type="button" class="submit-button" id="mint-button">Mint</button>
        <div id="token-message-container" class="message-container"></div>
      `;
  
      tokenFormContainer.style.display = 'block';
      const mintButton = document.getElementById('mint-button');
      const messageContainer = document.getElementById('token-message-container');
  
      mintButton.addEventListener('click', async function () {
        const name = document.getElementById('name').value;
        const symbol = document.getElementById('symbol').value;
        const initialSupply = document.getElementById('initialSupply').value;
  
        showLoader(tokenFormContainer, true);
        mintButton.disabled = true;
        messageContainer.innerHTML = '';
  
        try {
          const response = await axios.post(
            'https://assetvalidator-simulator.onrender.com/api/validate',
            { name, symbol, initialSupply }
          );
  
          await new Promise(resolve => setTimeout(resolve, 13000));
          showLoader(tokenFormContainer, false);
          mintButton.disabled = false;
  
          if (response.status === 200) {
            messageContainer.innerHTML = 'Data successfully validated';
          } else {
            messageContainer.innerHTML = 'Validation failed';
          }
        } catch (error) {
          messageContainer.innerHTML = 'An error occurred during validation';
          console.error('An error occurred during validation:', error);
          showLoader(tokenFormContainer, false);
          mintButton.disabled = false;
        }
      });
    }
  
    FileInput();
  });
  