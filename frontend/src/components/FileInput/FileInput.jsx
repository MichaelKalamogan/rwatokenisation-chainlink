import axios from 'axios';
import React, { useState } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import './FileInput.css';

function FileInput(props) {
  const { setAssetVerified } = props;
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [assetType, setAssetType] = useState('');
  const [assetName, setAssetName] = useState('');
  const [message, setMessage] = useState('');

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
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assetType', assetType);
        formData.append('assetName', assetName);

        const response = await axios.post(
          'https://assetvalidator-simulator.onrender.com/api/validate',
          formData,
        );

        await new Promise((resolve) => setTimeout(resolve, 4000));
        setLoading(false);

        if (response.status === 200) {
          setAssetVerified(true);
          window.alert('File successfully verified');
        } else {
          setMessage('File upload failed');
        }
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        setLoading(false);
        setMessage('An error occurred during file upload');
        console.log(error);
      }
    } else {
      window.alert('No file selected');
    }
  };

  return (
    <div className='file-input-container'>
      <ClipLoader
        color='blue'
        loading={loading}
        size={150}
        aria-label='Loading Spinner'
        data-testid='loader'
      />
      <form onSubmit={handleSubmit} className='file-input-form'>
        <div className='form-group'>
          <label htmlFor='assetName'>Asset Name:</label>
          <input
            type='text'
            id='assetName'
            value={assetName}
            onChange={handleAssetNameChange}
            className='form-control'
          />
        </div>
        <div className='form-group'>
          <label htmlFor='assetType'>Select Asset Type:</label>
          <select
            id='assetType'
            value={assetType}
            onChange={handleAssetTypeChange}
            className='form-control'
          >
            <option value=''>--Please choose an option--</option>
            <option value='Real Estate'>Real Estate</option>
          </select>
        </div>
        <div className='form-group'>
          <input
            type='file'
            onChange={handleFileChange}
            className='form-control'
          />
        </div>
        <button type='submit' className='submit-button' disabled={loading}>
          Submit
        </button>
      </form>

      {message && (
        <div className='message-container'>
          <h3>{message}</h3>
        </div>
      )}
    </div>
  );
}

export default FileInput;
