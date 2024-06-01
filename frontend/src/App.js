import {useState} from 'react'
import './App.css';
import FileInput from './components/FileInput/FileInput';
import TokenForm from './components/TokenForm/TokenForm';

function App() {
  const [assetVerified, setAssetVerified] = useState(false)
  return (
    <div className="App">
      <h1>RWA Tokenisation Project</h1>
      <FileInput setAssetVerified={setAssetVerified}></FileInput>
      <br></br>
      {assetVerified ? <TokenForm></TokenForm>: <></>}
    </div>
  );
}

export default App;
