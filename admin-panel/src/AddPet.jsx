import { useState, useEffect } from 'react';
import axios from 'axios';

const AddPet = () => {
  const [form, setForm] = useState({
    name: '',
    type: 'Dog',
    age: '',
    sex: 'Male',
    breed: '',
    location: '',
    ownerPhoneNumber: '',
    description: '', // NEW FIELD
  });
  const [imageFile, setImageFile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAdoptionRequests();
  }, []);

  const fetchAdoptionRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/adoptions');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await axios.put(`http://localhost:3001/api/adoptions/${requestId}/status`, { status });
      fetchAdoptionRequests(); // Refresh list
    } catch (err) {
      console.error('Failed to update request', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) formData.append('image', imageFile);

      await axios.post('http://localhost:3001/api/pets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ Pet added successfully!');
      setForm({
        name: '',
        type: 'Dog',
        age: '',
        sex: 'Male',
        breed: '',
        location: '',
        ownerPhoneNumber: '',
        description: '', // Reset this too
      });
      setImageFile(null);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to add pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '900px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Add New Pet</h2>

      {/* Add Pet Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backgroundColor: '#f7f7f7',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          marginBottom: '3rem',
        }}
      >
        <input
          name="name"
          placeholder="Pet Name"
          value={form.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <select name="type" value={form.type} onChange={handleChange} style={selectStyle}>
          <option value="Dog">Dog</option>
          <option value="Cat">Cat</option>
          <option value="Bird">Bird</option>
        </select>
        <input
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <select name="sex" value={form.sex} onChange={handleChange} style={selectStyle}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          style={inputStyle}
        />
        <input type="file" accept="image/*" onChange={handleFileChange} style={fileInputStyle} />
        <input
          name="ownerPhoneNumber"
          placeholder="Owner Phone Number"
          value={form.ownerPhoneNumber}
          onChange={handleChange}
          style={inputStyle}
        />
        <textarea
          name="description"
          placeholder="Description (e.g. temperament, history)"
          value={form.description}
          onChange={handleChange}
          rows="4"
          style={textareaStyle}
        />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Adding...' : 'Add Pet'}
        </button>
        {message && <p style={{ textAlign: 'center', marginTop: '1rem' }}>{message}</p>}
      </form>

      {/* Adoption Requests Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Adoption Requests</h2>
        {requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777' }}>No adoption requests found.</p>
        ) : (
          requests.map((req) => (
            <div
              key={req._id}
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                backgroundColor: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                color: '#333', // Ensures the text is visible
              }}
            >
              <p><strong>User:</strong> {req.user?.name || 'Unknown'}</p>
              <p><strong>Pet:</strong> {req.pet?.name || 'Unknown'}</p>
              <p>
                <strong>Status:</strong>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'orange',
                  }}
                >
                  {req.status}
                </span>
              </p>
              {req.status === 'pending' && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => handleStatusChange(req._id, 'approved')}
                    style={approveButtonStyle}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(req._id, 'rejected')}
                    style={rejectButtonStyle}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// UI Styles
const inputStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const selectStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const fileInputStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const textareaStyle = {
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const buttonStyle = {
  padding: '12px',
  fontSize: '1rem',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const approveButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const rejectButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

export default AddPet;






