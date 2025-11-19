import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, GraduationCap, Star, ArrowLeft, Save, Camera, Loader } from 'lucide-react';
import { pageTransition, scaleIn } from '../animations/motionVariants';
import { useToast } from '../context/ToastContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';



export const ProfilePage: React.FC = () => {
  const { userData, currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      // Reset input
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      // Reset input
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
      // Reset input to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 py-12 px-4"
      {...pageTransition}
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <motion.div
          className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl shadow-2xl p-8"
          {...scaleIn}
        >
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
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
              
              {/* Upload overlay */}
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
              <p className="text-cyan-300 text-sm mt-2">Uploading...</p>
            )}
            
            {!uploading && (
              <p className="text-cyan-300/70 text-xs mt-2">Click to upload avatar</p>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white text-center mb-2">{userData.name}</h1>
          <p className="text-cyan-300 text-center mb-6 capitalize">{userData.role}</p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="text-2xl font-bold text-white">{userData.avgRating?.toFixed(1) || '5.0'}</span>
            <span className="text-cyan-300">
              ({userData.ratingsCount || 0} ratings)
            </span>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-cyan-400/20">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-cyan-300 text-sm">Email</p>
                  <p className="text-white">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-cyan-400/20">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-cyan-300 text-sm">Age</p>
                  <p className="text-white">{userData.age}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-cyan-400/20">
                <User className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-cyan-300 text-sm">Gender</p>
                  <p className="text-white capitalize">{userData.gender}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-cyan-400/20">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-cyan-300 text-sm">University</p>
                  <p className="text-white">{userData.university}</p>
                </div>
              </div>

              <motion.button
                onClick={() => setEditing(true)}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/50 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Edit Profile
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-cyan-300 mb-2 text-sm">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm">University</label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-cyan-300 mb-2 text-sm">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 bg-white/5 border border-cyan-400/30 text-cyan-400 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
