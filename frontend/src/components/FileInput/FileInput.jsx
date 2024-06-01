import React, { useState } from 'react';
import axios from 'axios';
import './FileInput.css';

function FileInput(props) {
  const [file, setFile] = useState(null);
  const [assetType, setAssetType] = useState('');
  const [assetName, setAssetName] = useState('');

  const handleAssetTypeChange = (e) => {
    setAssetType(e.target.value);
  };

  const handleAssetNameChange = (e) => {
    setAssetName(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      try {
        // const formData = new FormData();
        // formData.append('file', file);

        const response = await axios.post(
          '/https://assetvalidator-simulator.onrender.com/api/validate',
          {
            method: 'POST',
            body: {
              "assetType": assetType,
              "assetName": assetName
            }
          },
        );

        if (response.ok) {
          console.log('File successfully uploaded');
        } else {
          console.error('File upload failed');
        }
      } catch (error) {
        console.error('An error occurred during file upload:', error);
      }
    } else {
      console.log('No file selected');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor='assetName'>Asset Name:</label>
        <input
          type='text'
          id='assetName'
          value={assetName}
          onChange={handleAssetNameChange}
        />
        <br />
        <label htmlFor='assetType'>Select Asset Type:</label>
        <select
          id='assetType'
          value={assetType}
          onChange={handleAssetTypeChange}
        >
          <option value=''>--Please choose an option--</option>
          <option value='Real Estate'>Real Estate</option>
          <option value='Bond'>Bond</option>
          <option value='Funds'>Funds</option>
        </select>
        <br />
        <input type='file' onChange={handleFileChange} />
        <br />
        <button onClick={handleSubmit}>Submit</button>
      </form>
    </div>
  );
}

export default FileInput;
