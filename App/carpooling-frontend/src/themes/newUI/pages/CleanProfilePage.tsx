import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth, storage } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { User, Mail, Calendar, GraduationCap, Star, ArrowLeft, Save, Camera, Loader, Palette, Sun, Moon, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';
import { CleanInput } from '../components/CleanInput';
import { useUITheme } from '../../../context/UIThemeContext';

export const CleanProfilePage: React.FC = () => {
  const { userData, currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { isDark, theme, colorMode, setTheme, setColorMode, savePreferencesToDatabase } = useUITheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    age: userData?.age?.toString() || '',
    university: userData?.university || '',
    newPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        name: formData.name,
        age: parseInt(formData.age),
        university: formData.university,
      });

      if (formData.newPassword) {
        await updatePassword(currentUser, formData.newPassword);
      }

      await refreshUserData();
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${userData.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', userData.uid), {
        profileImage: url,
        updatedAt: new Date().toISOString()
      });

      await refreshUserData();
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error?.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleThemeChange = async (newTheme: 'neon' | 'clean') => {
    setTheme(newTheme);
    if (userData?.uid) {
      // Save immediately to database
      setTimeout(async () => {
        await savePreferencesToDatabase(userData.uid);
        toast.success(`Theme changed to ${newTheme === 'neon' ? 'Neon' : 'Clean'}!`);
      }, 100);
    }
  };

  const handleColorModeChange = async (newMode: 'light' | 'dark') => {
    setColorMode(newMode);
    if (userData?.uid) {
      // Save immediately to database
      setTimeout(async () => {
        await savePreferencesToDatabase(userData.uid);
        toast.success(`${newMode === 'dark' ? 'Dark' : 'Light'} mode enabled!`);
      }, 100);
    }
  };

  const handleRoleSwitch = async () => {
    if (!userData || !currentUser || loading) return;

    setLoading(true);
    try {
      // Check for active rides
      const ridesQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'active')
      );
      const activeRidesSnapshot = await getDocs(ridesQuery);

      // Check if user is involved in any active ride
      const hasActiveRides = activeRidesSnapshot.docs.some((rideDoc) => {
        const ride = rideDoc.data();
        // Check if user is the driver
        if (ride.driverID === userData.uid) return true;
        // Check if user is a passenger
        if (ride.passengers?.some((p: any) => p.uid === userData.uid)) return true;
        return false;
      });

      if (hasActiveRides) {
        toast.error('Please complete or cancel your active rides before switching roles');
        setLoading(false);
        return;
      }

      // Switch role
      const newRole = userData.role === 'driver' ? 'rider' : 'driver';

      await updateDoc(doc(db, 'users', userData.uid), {
        role: newRole
      });

      await refreshUserData();
      toast.success(`Successfully switched to ${newRole} mode!`);

      // Redirect to home page to refresh the UI
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <CleanCard padding="lg">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                {userData.profileImage ? (
                  <img
                    src={userData.profileImage}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {uploading && (
              <p className="text-teal-600 text-sm mt-2">Uploading...</p>
            )}

            {!uploading && (
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-2`}>Click to upload avatar</p>
            )}
          </div>

          <h1 className={`text-4xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} text-center mb-2`}>{userData.name}</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mb-6 capitalize`}>{userData.role}</p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{userData.avgRating?.toFixed(1) || '5.0'}</span>
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ({userData.ratingsCount || 0} ratings)
            </span>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <Mail className="w-5 h-5 text-teal-500" />
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Email</p>
                  <p className={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{userData.email}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <Calendar className="w-5 h-5 text-teal-500" />
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Age</p>
                  <p className={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{userData.age}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <User className="w-5 h-5 text-teal-500" />
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Gender</p>
                  <p className={`${isDark ? 'text-gray-100' : 'text-gray-900'} capitalize`}>{userData.gender}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <GraduationCap className="w-5 h-5 text-teal-500" />
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>University</p>
                  <p className={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{userData.university}</p>
                </div>
              </div>

              {/* Theme Preferences */}
              <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'} space-y-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="w-5 h-5 text-teal-500" />
                  <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>Theme Preferences</p>
                </div>

                {/* UI Theme Selection */}
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>UI Theme</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleThemeChange('neon')}
                      className={`p-3 rounded-lg border-2 transition ${
                        theme === 'neon'
                          ? 'border-teal-500 bg-teal-500/10'
                          : isDark
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p className={`font-semibold ${theme === 'neon' ? 'text-teal-500' : isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        ✨ Neon
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vibrant & Bold</p>
                    </button>

                    <button
                      onClick={() => handleThemeChange('clean')}
                      className={`p-3 rounded-lg border-2 transition ${
                        theme === 'clean'
                          ? 'border-teal-500 bg-teal-500/10'
                          : isDark
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p className={`font-semibold ${theme === 'clean' ? 'text-teal-500' : isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        🎨 Clean
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Simple & Modern</p>
                    </button>
                  </div>
                </div>

                {/* Color Mode Selection */}
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Color Mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleColorModeChange('light')}
                      className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                        colorMode === 'light'
                          ? 'border-teal-500 bg-teal-500/10'
                          : isDark
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Sun className={`w-5 h-5 ${colorMode === 'light' ? 'text-teal-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      <p className={`font-semibold ${colorMode === 'light' ? 'text-teal-500' : isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Light
                      </p>
                    </button>

                    <button
                      onClick={() => handleColorModeChange('dark')}
                      className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                        colorMode === 'dark'
                          ? 'border-teal-500 bg-teal-500/10'
                          : isDark
                          ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Moon className={`w-5 h-5 ${colorMode === 'dark' ? 'text-teal-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      <p className={`font-semibold ${colorMode === 'dark' ? 'text-teal-500' : isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Dark
                      </p>
                    </button>
                  </div>
                </div>

                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                  Your theme preferences are saved automatically and will sync across all devices.
                </p>
              </div>

              <CleanButton
                onClick={() => setEditing(true)}
                fullWidth
                size="lg"
              >
                Edit Profile
              </CleanButton>

              {/* Role Switch Button */}
              <button
                onClick={handleRoleSwitch}
                disabled={loading}
                className={`w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  !loading && 'hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                <RefreshCw className={`w-5 h-5 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Switching...' : `Switch to ${userData.role === 'driver' ? 'Rider' : 'Driver'} Mode`}
              </button>

              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-center mt-2`}>
                Note: You can only switch roles when you have no active rides
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm`}>Name</label>
                <CleanInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm`}>Age</label>
                <CleanInput
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm`}>University</label>
                <CleanInput
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 text-sm`}>
                  New Password (leave blank to keep current)
                </label>
                <CleanInput
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-3">
                <CleanButton
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </CleanButton>

                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className={`px-6 py-3 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border rounded-lg transition`}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </CleanCard>
      </div>
    </div>
  );
};