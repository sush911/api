import { useState } from 'react';
import AddPet from './AddPet'; // adjust path if needed
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      {/* Render AddPet component */}
      <AddPet />

      {/* Optional counter button */}
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.jsx</code> and save to test HMR</p>
      </div>
    </>
  );
}

export default App;
