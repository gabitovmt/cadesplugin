import React, {useState} from 'react';
import './App.css';
import DigitalSignatureProvider from "./DigitalSignature";
import CertificateShortInfo from "./DigitalSignature/CertificateShortInfo";

function App() {
  const [ sourceFile, setSourceFile ] = useState<File | undefined>();
  const [ certificates, setCertificates ] = useState<CertificateShortInfo[]>([]);

  const sourceFileChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files != null && event.target.files.length === 1) {
      setSourceFile(event.target.files[0]);
    } else {
      setSourceFile(undefined);
    }
  }

  const signFile = () => {
    DigitalSignatureProvider.new();
    console.log('test');
  }

  const refreshCertificateList = async () => {
    setCertificates(await DigitalSignatureProvider.new().certificates());
  }

  function renderCertificates(): JSX.Element | null {
    return certificates.length === 0
      ? null
      : <ul>{ certificates.map(it => renderCertificate(it)) }</ul>;
  }

  function renderCertificate(cert: CertificateShortInfo): JSX.Element {
    return (
      <li key={cert.serialNumber}>
        {cert.subjectSimpleName} ({new Date(cert.validToDate + '').toDateString()})
      </li>
    );
  }

  return (
    <div className="App">
      <div className="App__sign-panel">
        <input type="file" onChange={sourceFileChangeHandler} />
        <button type="button" disabled={sourceFile == null} onClick={signFile}>Подписать</button>
      </div>
      <div className="App__certificates-panel">
        <button type="button" onClick={refreshCertificateList}>Обновить список сертификатов</button>
        { renderCertificates() }
      </div>
    </div>
  );
}

export default App;
