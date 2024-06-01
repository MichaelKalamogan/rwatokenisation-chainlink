import axios from 'axios';
import React, { useState } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import './TokenForm.css';

function TokenForm() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState(0);
  const [message, setMessage] = useState(''); // Add state for message

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSymbolChange = (e) => {
    setSymbol(e.target.value);
  };

  const handleInitialSupplyChange = (e) => {
    setInitialSupply(e.target.value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://assetvalidator-simulator.onrender.com/api/validate',
        {
          name,
          symbol,
          initialSupply,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 13000));

      if (response.status === 200) {
        setMessage('Data successfully validated');
      } else {
        setMessage('Validation failed');
      }
    } catch (error) {
      setMessage('An error occurred during validation');
      console.error('An error occurred during validation:', error);
    } finally {
      setLoading(false);
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
      <div className='form-group'>
        <label htmlFor='assetName'>Asset Name:</label>
        <input
          type='text'
          id='name'
          value={name}
          onChange={handleNameChange}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='assetType'>Select Token Type:</label>
        <select
          id='assetType'
          value={symbol}
          onChange={handleSymbolChange}
          className='form-control'
        >
          <option value=''>--Please choose an option--</option>
          <option value='ETH'>ETH</option>
          <option value='POLYGON'>POLYGON</option>
        </select>
      </div>
      <div className='form-group'>
        <label htmlFor='initialSupply'>Initial Supply:</label>
        <input
          type='number'
          id='initialSupply'
          value={initialSupply}
          onChange={handleInitialSupplyChange}
          className='form-control'
        />
      </div>
      <button type='button' className='submit-button' onClick={handleSubmit} disabled={loading}>
        Mint
      </button>

      {message && (
        <div className='message-container'>
          <h3>{message}</h3>
        </div>
      )}
    </div>
  );
}

export default TokenForm;
