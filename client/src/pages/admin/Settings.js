import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { updateAdminProfile, changeAdminPassword, updateAdminNotificationPrefs } from '../../services/adminAuthAPI';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { FiSave } from 'react-icons/fi';

const Settings = () => {
  const { admin, setAdmin } = useAdminAuth();
  const [profile, setProfile] = useState({ name: '', phone: '', country: '' });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(profile);
  const [profileMsg, setProfileMsg] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, push: true });
  const [notifMsg, setNotifMsg] = useState('');

  useEffect(() => {
    if (admin) {
      setProfile({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setForm({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setNotifPrefs(admin.notificationPrefs || { email: true, sms: false, push: true });
    }
  }, [admin]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    try {
      const res = await updateAdminProfile(form);
      setProfile(res.admin);
      setAdmin(res.admin);
      setEdit(false);
      setProfileMsg('Profile updated!');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordMsg('All fields are required.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    try {
      await changeAdminPassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      setPasswordMsg('Password changed successfully!');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleSaveNotifPrefs = async () => {
    setNotifMsg('');
    try {
      const res = await updateAdminNotificationPrefs(notifPrefs);
      setNotifPrefs(res.notificationPrefs);
      setNotifMsg('Notification preferences updated!');
    } catch (err) {
      setNotifMsg(err.response?.data?.message || 'Failed to update notification preferences.');
    }
  };

  const actions = edit ? (
    <>
      <button
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
        onClick={() => setEdit(false)}
      >
        Cancel
      </button>
      <button
        className="px-4 py-2 bg-gold hover:bg-yellow-600 text-black rounded-lg flex items-center space-x-2 transition-colors"
        onClick={handleSaveProfile}
      >
        <FiSave />
        <span>Save Changes</span>
      </button>
    </>
  ) : (
    <button
      className="px-4 py-2 bg-gold hover:bg-yellow-600 text-black rounded-lg flex items-center space-x-2 transition-colors"
      onClick={() => setEdit(true)}
    >
      <FiSave />
      <span>Edit Profile</span>
    </button>
  );

  return (
    <AdminPageLayout title="Account Settings" actions={actions}>
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Section */}
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-100">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  disabled={!edit}
                  value={edit ? form.name : profile.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <input
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  disabled={!edit}
                  value={edit ? form.phone : profile.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Country</label>
                <input
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  disabled={!edit}
                  value={edit ? form.country : profile.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>
            {profileMsg && (
              <div className="mt-4 p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                {profileMsg}
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-100">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  value={passwords.current}
                  onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  value={passwords.new}
                  onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <button
                className="w-full bg-gold hover:bg-yellow-600 text-black px-4 py-2 rounded-lg transition-colors font-medium"
                onClick={handleChangePassword}
              >
                Update Password
              </button>
              {passwordMsg && (
                <div className="mt-2 p-3 bg-green-500/20 text-green-400 rounded-lg">
                  {passwordMsg}
                </div>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-gray-700/50 backdrop-blur rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-100">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gold rounded border-gray-600 focus:ring-gold focus:ring-offset-gray-800"
                    checked={notifPrefs.email}
                    onChange={e => setNotifPrefs(p => ({ ...p, email: e.target.checked }))}
                  />
                  <span className="text-gray-300 group-hover:text-gray-100">Email Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gold rounded border-gray-600 focus:ring-gold focus:ring-offset-gray-800"
                    checked={notifPrefs.sms}
                    onChange={e => setNotifPrefs(p => ({ ...p, sms: e.target.checked }))}
                  />
                  <span className="text-gray-300 group-hover:text-gray-100">SMS Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gold rounded border-gray-600 focus:ring-gold focus:ring-offset-gray-800"
                    checked={notifPrefs.push}
                    onChange={e => setNotifPrefs(p => ({ ...p, push: e.target.checked }))}
                  />
                  <span className="text-gray-300 group-hover:text-gray-100">Push Notifications</span>
                </label>
              </div>
              <button
                className="w-full bg-gold hover:bg-yellow-600 text-black px-4 py-2 rounded-lg transition-colors font-medium mt-4"
                onClick={handleSaveNotifPrefs}
              >
                Save Notification Preferences
              </button>
              {notifMsg && (
                <div className="mt-2 p-3 bg-green-500/20 text-green-400 rounded-lg">
                  {notifMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default Settings;
