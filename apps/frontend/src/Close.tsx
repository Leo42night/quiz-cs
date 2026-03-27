import './App.css';

function ClosedPage() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "20px"
    }}>
      <h2>
        Fase 1 (Minggu 1-4) berakhir,<br />
        silakan tunggu fase 2 dibuka
      </h2>
    </div>
  );
}

function App() {
  return <ClosedPage />;
}

export default App;
