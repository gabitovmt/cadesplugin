import React, {useState} from 'react';
import './App.css';

function App() {
  const [ sourceFile, setSourceFile ] = useState<File | undefined>();

  const sourceFileChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files != null && event.target.files.length === 1) {
      setSourceFile(event.target.files[0]);
    } else {
      setSourceFile(undefined);
    }
  }

  const signButtonClickHandler = () => {
    console.log('test');
  }

  return (
    <div className="App">
      <input type="file" onChange={sourceFileChangeHandler} />
      <button type="button" disabled={sourceFile == null} onClick={signButtonClickHandler}>Подписать</button>
    </div>
  );
}

export default App;
