import { useState, useRef } from 'react';
import { X, Camera, Check } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const nameParts = (user?.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName]   = useState(nameParts.slice(1).join(' ') || '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
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
      toast.success('Profile updated');
      setTimeout(() => onClose(), 700);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, profile_photo: res.data.profile_photo });
      setPhotoPreview(`http://localhost:8000/uploads/profiles/${res.data.profile_photo}?t=${Date.now()}`);
      toast.success('Photo updated');
    } catch {
      setPhotoPreview(user?.profile_photo ? `http://localhost:8000/uploads/profiles/${user.profile_photo}` : null);
      toast.error('Photo upload failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-sm mx-4 animate-modal-in overflow-hidden"
           style={{ boxShadow: '0 24px 60px -12px rgba(15,15,17,.18)' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-ink text-[15px]">Edit Profile</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink-2 transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center overflow-hidden"
                   style={{ width: 72, height: 72 }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[22px] font-bold text-brand-600">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center shadow transition-colors"
              >
                <Camera size={11} color="white" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-[11px] text-ink-3 mt-2">Click camera icon to update photo</p>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-ink-3 font-medium mb-1">First Name</label>
                <input className="input text-[13px]" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-ink-3 font-medium mb-1">Last Name</label>
                <input className="input text-[13px]" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ink-3 font-medium mb-1">Email</label>
              <input className="input text-[13px] opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-brand flex-1">
              {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
