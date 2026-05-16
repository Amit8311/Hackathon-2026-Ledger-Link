import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, LogOut, Check } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(
    user?.profile_photo ? `http://localhost:8000/uploads/profiles/${user.profile_photo}` : null
  );

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  const handleSave = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) return;
    setSaving(true);
    try {
      const res = await api.patch('/api/users/me', { name: fullName });
      updateUser({ ...user, name: res.data.name });
      setSaved(true);
      setTimeout(() => onClose(), 800);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, profile_photo: res.data.profile_photo });
      setPhotoPreview(`http://localhost:8000/uploads/profiles/${res.data.profile_photo}?t=${Date.now()}`);
    } catch {
      setPhotoPreview(user?.profile_photo ? `http://localhost:8000/uploads/profiles/${user.profile_photo}` : null);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 animate-modal-in">

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900">My Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-600">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 shadow"
            >
              <Camera size={13} color="white" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-xs text-gray-400 mt-2">Click camera icon to change photo</p>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
            <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
            <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input className="input bg-gray-50 text-gray-400" value={user?.email || ''} disabled />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center mb-3">
          {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
