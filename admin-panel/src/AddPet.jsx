import { useState, useEffect } from 'react';
import axios from 'axios';

const AddPet = () => {
  // PET FORM STATE
  const [form, setForm] = useState({
    name: '',
    type: 'Dog',
    age: '',
    sex: 'Male',
    breed: '',
    location: '',
    ownerPhoneNumber: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);

  // ADOPTION REQUESTS
  const [requests, setRequests] = useState([]);

  // NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationType, setNotificationType] = useState('announcement'); // default type
  const [editingNotificationId, setEditingNotificationId] = useState(null); // track editing

  // LOADING & MESSAGES
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [adminMessages, setAdminMessages] = useState({});

  // Dummy logged-in user id for demo
  const loggedInUserId = 'user123';

  // Fetch adoption requests and notifications on mount
  useEffect(() => {
    fetchAdoptionRequests();
    fetchNotifications(loggedInUserId);
  }, []);

  // Adoption requests fetch
  const fetchAdoptionRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/adoptions/admin');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  // Notifications fetch
  const fetchNotifications = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/notifications/user/${userId}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Admin message input for adoption requests
  const handleAdminMessageChange = (requestId, msg) => {
    setAdminMessages(prev => ({ ...prev, [requestId]: msg }));
  };

  // Update adoption request status
  const handleStatusChange = async (requestId, status) => {
    const adminMessage = adminMessages[requestId] || '';
    try {
      await axios.put(`http://localhost:3001/api/adoptions/${requestId}/status`, {
        status,
        adminMessage,
      });
      fetchAdoptionRequests();
      setAdminMessages(prev => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      console.error('Failed to update request', err);
    }
  };

  // Delete adoption request
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/adoptions/${requestId}`);
      fetchAdoptionRequests();
    } catch (err) {
      console.error('Failed to delete request', err);
    }
  };

  // Handle pet form input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle image file input
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Submit new pet
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
        description: '',
      });
      setImageFile(null);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to add pet');
    } finally {
      setLoading(false);
    }
  };

  // --- NOTIFICATION CRUD ---

  // Create or update notification
  const handleSaveNotification = async () => {
    if (!notificationTitle.trim() || !notificationMsg.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      if (editingNotificationId) {
        // Update existing notification
        await axios.put(`http://localhost:3001/api/notifications/${editingNotificationId}`, {
          title: notificationTitle.trim(),
          message: notificationMsg.trim(),
          type: notificationType,
        });
        alert('Notification updated');
      } else {
        // Create new notification
        await axios.post('http://localhost:3001/api/notifications', {
          userId: null, // admin sending global notification, adjust if sending personal notif
          title: notificationTitle.trim(),
          message: notificationMsg.trim(),
          type: notificationType,
        });
        alert('Notification created');
      }
      setNotificationTitle('');
      setNotificationMsg('');
      setNotificationType('announcement');
      setEditingNotificationId(null);
      fetchNotifications(loggedInUserId);
    } catch (err) {
      console.error('Failed to save notification', err);
      alert('Failed to save notification');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/notifications/${id}`);
      fetchNotifications(loggedInUserId);
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  // Mark read/unread toggle
  const toggleReadStatus = async (note) => {
    try {
      await axios.put(`http://localhost:3001/api/notifications/${note._id}`, {
        ...note,
        isRead: !note.isRead,
      });
      fetchNotifications(loggedInUserId);
    } catch (err) {
      console.error('Failed to toggle read status', err);
    }
  };

  // Load notification data to edit form
  const handleEditNotification = (note) => {
    setEditingNotificationId(note._id);
    setNotificationTitle(note.title);
    setNotificationMsg(note.message);
    setNotificationType(note.type);
  };

  // --- STYLES (same as before) ---
  const sectionStyle = {
    background: '#1e1e2f',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
    padding: '2rem',
    marginBottom: '2.5rem',
    color: '#eee',
  };

  const sectionTitle = {
    fontSize: '1.7rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #444',
    paddingBottom: '0.5rem',
    color: '#f5a623',
  };

  const formGrid = {
    display: 'grid',
    gap: '1.2rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontWeight: '600',
    color: '#ccc',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: '#2a2a3f',
    color: '#eee',
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
  };

  const buttonPrimary = {
    padding: '12px',
    backgroundColor: '#f5a623',
    color: '#1e1e2f',
    fontWeight: '700',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const buttonSecondary = {
    padding: '10px 16px',
    backgroundColor: '#555',
    color: '#eee',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginLeft: '0.5rem',
  };

  const buttonApprove = {
    ...buttonPrimary,
    backgroundColor: '#2ecc71',
    color: '#1e1e2f',
    marginRight: '0.5rem',
  };

  const buttonReject = {
    ...buttonPrimary,
    backgroundColor: '#e74c3c',
    color: '#1e1e2f',
    marginRight: '0.5rem',
  };

  const requestCard = {
    background: '#2a2a3f',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
    color: '#eee',
  };

  const notificationCard = (isRead) => ({
    background: isRead ? '#1a1a2f' : '#2a2a3f',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.7rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
    color: '#eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });

  const getStatusStyle = (status) => ({
    padding: '3px 10px',
    borderRadius: '15px',
    fontWeight: '700',
    color: '#1e1e2f',
    backgroundColor:
      status === 'approved' ? '#2ecc71' :
      status === 'rejected' ? '#e74c3c' :
      '#f5a623',
  });

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: '2rem' }}>
      {/* --- Add Pet Section --- */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Add Pet</h2>
        <form onSubmit={handleSubmit} style={formGrid}>
          <input
            type="text"
            name="name"
            placeholder="Pet's Name"
            value={form.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            style={inputStyle}
          >
            <option>Dog</option>
            <option>Cat</option>
            <option>Bird</option>
            <option>Other</option>
          </select>
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <select
            name="sex"
            value={form.sex}
            onChange={handleChange}
            style={inputStyle}
          >
            <option>Male</option>
            <option>Female</option>
          </select>
          <input
            type="text"
            name="breed"
            placeholder="Breed"
            value={form.breed}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="ownerPhoneNumber"
            placeholder="Owner Phone Number"
            value={form.ownerPhoneNumber}
            onChange={handleChange}
            style={inputStyle}
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={textareaStyle}
          />
          <input type="file" onChange={handleFileChange} accept="image/*" />
          <button type="submit" style={buttonPrimary} disabled={loading}>
            {loading ? 'Adding...' : 'Add Pet'}
          </button>
          {message && <p>{message}</p>}
        </form>
      </section>

      {/* --- Adoption Requests Section --- */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Adoption Requests</h2>
        {requests.length === 0 && <p>No adoption requests yet.</p>}
        {requests.map((request) => (
          <div key={request._id} style={requestCard}>
            <p><strong>Pet:</strong> {request.petName}</p>
            <p><strong>Requester:</strong> {request.requesterName}</p>
            <p><strong>Message:</strong> {request.message}</p>
            <p><strong>Status:</strong> <span style={getStatusStyle(request.status)}>{request.status}</span></p>
            <textarea
              placeholder="Admin message..."
              value={adminMessages[request._id] || ''}
              onChange={(e) => handleAdminMessageChange(request._id, e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '0.5rem', backgroundColor: '#333', color: '#eee', border: 'none' }}
            />
            <div>
              <button style={buttonApprove} onClick={() => handleStatusChange(request._id, 'approved')}>Approve</button>
              <button style={buttonReject} onClick={() => handleStatusChange(request._id, 'rejected')}>Reject</button>
              <button style={buttonSecondary} onClick={() => handleDeleteRequest(request._id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>

      {/* --- Notifications Section --- */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Notifications</h2>

        {/* Notification Form */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Title"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.5rem' }}
          />
          <textarea
            rows={3}
            placeholder="Message"
            value={notificationMsg}
            onChange={(e) => setNotificationMsg(e.target.value)}
            style={{ ...textareaStyle, marginBottom: '0.5rem' }}
          />
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.5rem', width: '200px' }}
          >
            <option value="announcement">Announcement</option>
            <option value="reminder">Reminder</option>
            <option value="alert">Alert</option>
          </select>
          <div>
            <button style={buttonPrimary} onClick={handleSaveNotification}>
              {editingNotificationId ? 'Update Notification' : 'Add Notification'}
            </button>
            {editingNotificationId && (
              <button
                style={buttonSecondary}
                onClick={() => {
                  setEditingNotificationId(null);
                  setNotificationTitle('');
                  setNotificationMsg('');
                  setNotificationType('announcement');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 && <p>No notifications.</p>}
        {notifications.map((note) => (
          <div key={note._id} style={notificationCard(note.isRead)}>
            <div style={{ flex: 1 }}>
              <strong>{note.title}</strong> <small>({note.type})</small>
              <p>{note.message}</p>
              <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                {new Date(note.createdAt).toLocaleString()}
              </p>
              <p>Status: {note.isRead ? 'Read' : 'Unread'}</p>
            </div>
            <div>
              <button style={buttonSecondary} onClick={() => toggleReadStatus(note)}>
                Mark {note.isRead ? 'Unread' : 'Read'}
              </button>
              <button style={buttonSecondary} onClick={() => handleEditNotification(note)}>Edit</button>
              <button style={buttonReject} onClick={() => handleDeleteNotification(note._id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AddPet;
