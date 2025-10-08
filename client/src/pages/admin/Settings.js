import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { updateAdminProfile, changeAdminPassword, updateAdminNotificationPrefs } from '../../services/adminAuthAPI';
import { 
  User, 
  Lock, 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Edit,
  X,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { admin, setAdmin } = useAdminAuth();
  const [profile, setProfile] = useState({ name: '', phone: '', country: '' });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(profile);
  const [profileMsg, setProfileMsg] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, push: true });
  const [notifMsg, setNotifMsg] = useState('');
  
  const [loading, setLoading] = useState({ profile: false, password: false, notifications: false });

  useEffect(() => {
    if (admin) {
      setProfile({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setForm({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setNotifPrefs(admin.notificationPrefs || { email: true, sms: false, push: true });
    }
  }, [admin]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const res = await updateAdminProfile(form);
      setProfile(res.admin);
      setAdmin(res.admin);
      setEdit(false);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
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
    if (passwords.new.length < 6) {
      setPasswordMsg('New password must be at least 6 characters long.');
      return;
    }
    setLoading(prev => ({ ...prev, password: true }));
    try {
      await changeAdminPassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      setPasswordMsg('Password changed successfully!');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleSaveNotifPrefs = async () => {
    setNotifMsg('');
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const res = await updateAdminNotificationPrefs(notifPrefs);
      setNotifPrefs(res.notificationPrefs);
      setNotifMsg('Notification preferences updated successfully!');
    } catch (err) {
      setNotifMsg(err.response?.data?.message || 'Failed to update notification preferences.');
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your admin account preferences and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 p-6 animate-fade-in-left card-hover">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                 <User className="h-6 w-6 text-white" />
               </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                <p className="text-gray-400 text-sm">Update your personal details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!edit}
                  value={edit ? form.name : profile.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!edit}
                  value={edit ? form.phone : profile.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!edit}
                  value={edit ? form.country : profile.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  placeholder="Enter your country"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {edit ? (
                  <>
                    <button
                       className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-press hover-scale"
                       onClick={handleSaveProfile}
                       disabled={loading.profile}
                     >
                       <Check className="h-4 w-4" />
                       {loading.profile ? 'Saving...' : 'Save Changes'}
                     </button>
                     <button
                       className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 button-press hover-scale"
                       onClick={() => setEdit(false)}
                       disabled={loading.profile}
                     >
                       <X className="h-4 w-4" />
                       Cancel
                     </button>
                  </>
                ) : (
                  <button
                     className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 button-press hover-scale"
                     onClick={() => setEdit(true)}
                   >
                     <Edit className="h-4 w-4" />
                     Edit Profile
                   </button>
                )}
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                   profileMsg.includes('successfully') 
                     ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                     : 'bg-red-500/10 border border-red-500/20 text-red-400'
                 }`}>
                   {profileMsg.includes('successfully') ? (
                     <CheckCircle className="h-5 w-5" />
                   ) : (
                     <AlertCircle className="h-5 w-5" />
                   )}
                   <span className="text-sm">{profileMsg}</span>
                 </div>
              )}
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 p-6 animate-fade-in-right card-hover">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                 <Lock className="h-6 w-6 text-white" />
               </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                <p className="text-gray-400 text-sm">Update your password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <button
                     type="button"
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors button-press"
                     onClick={() => togglePasswordVisibility('current')}
                   >
                     {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                   </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <button
                     type="button"
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors button-press"
                     onClick={() => togglePasswordVisibility('new')}
                   >
                     {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                   </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <button
                     type="button"
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors button-press"
                     onClick={() => togglePasswordVisibility('confirm')}
                   >
                     {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                   </button>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-3 rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6 button-press hover-scale"
                onClick={handleChangePassword}
                disabled={loading.password}
              >
                <Lock className="h-4 w-4" />
                {loading.password ? 'Changing Password...' : 'Change Password'}
              </button>

              {passwordMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                   passwordMsg.includes('successfully') 
                     ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                     : 'bg-red-500/10 border border-red-500/20 text-red-400'
                 }`}>
                   {passwordMsg.includes('successfully') ? (
                     <CheckCircle className="h-5 w-5" />
                   ) : (
                     <AlertCircle className="h-5 w-5" />
                   )}
                   <span className="text-sm">{passwordMsg}</span>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 p-6 animate-fade-in-up card-hover">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
              <p className="text-gray-400 text-sm">Choose how you want to receive notifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer hover-lift">
              <input
                type="checkbox"
                checked={notifPrefs.email}
                onChange={e => setNotifPrefs(p => ({ ...p, email: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-white font-medium">Email Notifications</div>
                <div className="text-gray-400 text-sm">Receive updates via email</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer hover-lift">
              <input
                type="checkbox"
                checked={notifPrefs.sms}
                onChange={e => setNotifPrefs(p => ({ ...p, sms: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-white font-medium">SMS Notifications</div>
                <div className="text-gray-400 text-sm">Receive updates via SMS</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer hover-lift">
              <input
                type="checkbox"
                checked={notifPrefs.push}
                onChange={e => setNotifPrefs(p => ({ ...p, push: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <div className="text-white font-medium">Push Notifications</div>
                <div className="text-gray-400 text-sm">Receive browser notifications</div>
              </div>
            </label>
          </div>

          <button
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-press hover-scale"
            onClick={handleSaveNotifPrefs}
            disabled={loading.notifications}
          >
            <Bell className="h-4 w-4" />
            {loading.notifications ? 'Saving Preferences...' : 'Save Preferences'}
          </button>

          {notifMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mt-4 ${
              notifMsg.includes('successfully') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {notifMsg.includes('successfully') ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{notifMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
