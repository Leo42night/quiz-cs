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
        Fase 2 (Minggu 5-8) berakhir,<br />
        Fase 3 akan dibuka Segera
      </h2>
    </div>
  );
}

function App() {
  return <ClosedPage />;
}

export default App;