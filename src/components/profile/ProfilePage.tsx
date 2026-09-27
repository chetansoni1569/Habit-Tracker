import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitContext';
import { updateUserProfile } from '../../services/firestore';
import { calculateMonthStats } from '../../utils/analytics';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { activeHabits, completions, selectedYear, selectedMonth } = useHabits();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    return calculateMonthStats(activeHabits, completions, selectedYear, selectedMonth);
  }, [activeHabits, completions, selectedYear, selectedMonth]);

  const activeHabitsCount = activeHabits.length;

  const getInitial = () => {
    if (profile?.name) return profile.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        username: username.trim(),
      });
      await refreshProfile();
      setMessage('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setMessage('Failed to update profile. Please try again.');
    }
    setLoading(false);
  };

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="page-container">
      <div className="page-title">Profile</div>

      {message && (
        <div className={message.includes('Failed') ? 'auth-error' : 'auth-success'} style={{ marginBottom: '16px' }}>
          {message}
        </div>
      )}

      <div className="profile-avatar-section">
        <div className="profile-avatar-large">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name || 'Profile'} />
          ) : (
            getInitial()
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {profile?.name || 'User'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            @{profile?.username || 'user'}
          </div>
        </div>
      </div>

      <div className="profile-info-card">
        {editing ? (
          <>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Name</span>
              <span className="profile-stat-value">{profile?.name || '—'}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Email</span>
              <span className="profile-stat-value">{profile?.email || user?.email || '—'}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Username</span>
              <span className="profile-stat-value">@{profile?.username || '—'}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Joined</span>
              <span className="profile-stat-value">{joinDate}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Active Habits</span>
              <span className="profile-stat-value">{activeHabitsCount}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label">Monthly Completion</span>
              <span className="profile-stat-value">{stats.percentage}%</span>
            </div>
            <div style={{ marginTop: '12px' }}>
              <button className="btn-primary" onClick={() => {
                setName(profile?.name || '');
                setUsername(profile?.username || '');
                setEditing(true);
              }}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
