import React, {useState} from 'react';
import './App.css';
import DigitalSignatureProvider from "./DigitalSignature";
import CertificateShortInfo from "./DigitalSignature/CertificateShortInfo";

function App() {
  const [ sourceFile, setSourceFile ] = useState<File | undefined>();
  const [ certificates, setCertificates ] = useState<CertificateShortInfo[]>([]);
  const [ chosenCertificate, setChosenCertificate ] = useState<string | undefined>();

  const sourceFileChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files != null && event.target.files.length === 1) {
      setSourceFile(event.target.files[0]);
      const certList = await DigitalSignatureProvider.new().certificates();
      setCertificates(certList);
      certList.length && setChosenCertificate(certList[0].thumbprint);
    } else {
      setSourceFile(undefined);
      setCertificates([]);
    }
  }

  const chosenCertificateChangeHandler = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setChosenCertificate(event.target.value);
  }

  const signFile = () => {
    if (chosenCertificate != null && sourceFile != null) {
      console.log(DigitalSignatureProvider.new().signCreate(chosenCertificate, sourceFile));
    }
  }

  function renderChooseSigningFile(): JSX.Element {
    return (
      <label>Подписываемый файл: <input type="file" onChange={sourceFileChangeHandler} /></label>
    );
  }

  function renderChooseCertificate(): JSX.Element {
    return (
      <label>Сертификат: <select value={chosenCertificate} onChange={chosenCertificateChangeHandler}>
        { certificates.map(it => renderCertificate(it)) }
      </select></label>
    );
  }

  function renderCertificate(cert: CertificateShortInfo): JSX.Element {
    return (
      <option key={cert.serialNumber} value={cert.thumbprint}>
        {cert.subjectSimpleName} ({new Date(cert.validToDate + '').toDateString()})
      </option>
    );
  }

  return (
    <div className="App">
      <div className="App__sign-panel">
        { renderChooseSigningFile() }
        { certificates.length ? renderChooseCertificate() : null }
        <button
          type="button"
          disabled={sourceFile == null || chosenCertificate == null}
          onClick={signFile}
        >Подписать</button>
      </div>
    </div>
  );
}

export default App;
