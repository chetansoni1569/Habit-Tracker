import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitContext';
import { deleteUserAccount } from '../../services/firestore';
import { deleteUser } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { exportToCsv } from '../../utils/analytics';
import { Download, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const { habits, completions, mentalStates, selectedYear, selectedMonth } = useHabits();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const csv = exportToCsv(habits, completions, mentalStates, selectedYear, selectedMonth);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUserAccount(user.uid);
      if (auth?.currentUser) {
        await deleteUser(auth.currentUser);
      }
      await logout();
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setMessage('For security, please sign out and sign back in before deleting your account.');
      } else {
        setMessage('Failed to delete account. Please try again.');
      }
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const providerLabel = user?.isAnonymous
    ? 'Guest / Demo Mode'
    : user?.email?.includes('gmail')
    ? 'Google'
    : 'Email/Password';

  return (
    <div className="page-container">
      <div className="page-title">Settings</div>

      {message && (
        <div className="auth-error" style={{ marginBottom: '16px' }}>{message}</div>
      )}

      {/* Account Section */}
      <div className="settings-section">
        <div className="settings-section-title">Account</div>
        <div className="profile-info-card">
          <div className="profile-stat-row">
            <span className="profile-stat-label">Email</span>
            <span className="profile-stat-value">{profile?.email || user?.email || '—'}</span>
          </div>
          <div className="profile-stat-row">
            <span className="profile-stat-label">Auth Provider</span>
            <span className="profile-stat-value">
              {providerLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="settings-section">
        <div className="settings-section-title">Data Backup & Export</div>
        <div className="profile-info-card">
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Your data is stored permanently in Firebase Firestore. You can export complete snapshots of your records at any time.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} />
              Month CSV ({selectedYear}-{String(selectedMonth + 1).padStart(2, '0')})
            </button>
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!user) return;
                const { getAllHabits, getAllCompletions, getAllMentalStates } = await import('../../services/firestore');
                const { exportFullHistoryCsv } = await import('../../utils/analytics');
                const [h, c, m] = await Promise.all([
                  getAllHabits(user.uid),
                  getAllCompletions(user.uid),
                  getAllMentalStates(user.uid),
                ]);
                const csv = exportFullHistoryCsv(h, c, m);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `habit-tracker-full-history-${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Lifetime CSV
            </button>
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!user) return;
                const { exportAllUserData } = await import('../../services/firestore');
                const data = await exportAllUserData(user.uid);
                const jsonStr = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              Full JSON Backup
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ color: '#7a4444' }}>Danger Zone</div>
        <div className="profile-info-card" style={{ borderColor: '#c9a5a5' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-title" style={{ fontSize: '0.9rem' }}>Delete Account</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Are you sure you want to permanently delete your account? All your habits, completion records, and mental state data will be lost forever.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
