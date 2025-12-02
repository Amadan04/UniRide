import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Calendar, Plus, Trash2, Edit2, Loader2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useUITheme } from '../../../context/UIThemeContext';
import {
  extractScheduleFromImage,
  processScheduleEdits,
  getEmptySchedule,
  WeeklySchedule,
  ClassBlock
} from '../../../services/scheduleExtractor';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';
import { CleanInput } from '../components/CleanInput';

export const CleanClassSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const { isDark } = useUITheme();
  const [schedule, setSchedule] = useState<WeeklySchedule>(getEmptySchedule());
  const [isLoading, setIsLoading] = useState(false);
  const [editCommand, setEditCommand] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const dayLabels = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday'
  };

  useEffect(() => {
    if (userData?.classSchedule) {
      setSchedule(userData.classSchedule);
    }
  }, [userData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(file);
    setIsLoading(true);

    try {
      const extractedSchedule = await extractScheduleFromImage(file);
      setSchedule(extractedSchedule);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to extract schedule from image. Please make sure you have configured the OpenRouter API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEdit = async () => {
    if (!editCommand.trim()) return;

    setIsLoading(true);

    try {
      const updatedSchedule = await processScheduleEdits(editCommand, schedule);
      setSchedule(updatedSchedule);
      setEditCommand('');
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to process edit command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!currentUser) return;

    setIsSaving(true);

    try {
      const usersQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        alert('User profile not found. Please make sure you are logged in.');
        return;
      }

      const userDocRef = usersSnapshot.docs[0].ref;
      await updateDoc(userDocRef, {
        classSchedule: schedule
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      console.log('Schedule saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save schedule: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSchedule = () => {
    if (confirm('Are you sure you want to clear your entire schedule?')) {
      setSchedule(getEmptySchedule());
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-50 shadow-sm ${
          isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500 flex-shrink-0" />
              <h1 className={`text-lg sm:text-2xl font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>My Class Schedule</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleClearSchedule}
              className="px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xs:inline">Clear All</span>
              <span className="xs:hidden">Clear</span>
            </button>
            <CleanButton
              onClick={handleSaveSchedule}
              disabled={isSaving}
              className="whitespace-nowrap"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 inline mr-1" />
              ) : null}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
            </CleanButton>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CleanCard padding="lg" className="mb-6">
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Upload Timetable Image</h2>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload a screenshot or photo of your class schedule. AI will extract the class times automatically.
            </p>

            <label className="cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
                isDark
                  ? 'border-teal-700 hover:border-teal-600 bg-teal-900/20'
                  : 'border-teal-300 hover:border-teal-400 bg-teal-50/30'
              }`}>
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-teal-500" />
                  <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Click to upload timetable image</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Supports tables, lists, grids, screenshots</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>

            {uploadedImage && (
              <p className="text-teal-600 mt-3 text-sm">
                Uploaded: {uploadedImage.name}
              </p>
            )}
          </CleanCard>
        </motion.div>

        {/* Manual Edit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CleanCard padding="lg" className="mb-6">
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              <Edit2 className="w-5 h-5 text-teal-500" />
              Manual Editing
            </h2>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Add, remove, or modify classes using natural language commands.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={editCommand}
                onChange={(e) => setEditCommand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualEdit()}
                placeholder='e.g., "Add class Monday 9-11" or "Remove Wednesday 10AM class"'
                className={`flex-1 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark
                    ? 'bg-gray-700 text-gray-100 placeholder-gray-500 border border-gray-600'
                    : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200'
                }`}
                disabled={isLoading}
              />
              <CleanButton
                onClick={handleManualEdit}
                disabled={isLoading || !editCommand.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Apply
              </CleanButton>
            </div>

            <div className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Examples: "Add Monday 8-9", "Remove Tuesday 10AM", "Clear Sunday", "Change Wed 2-3 to 2-4"
            </div>
          </CleanCard>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <span className={`ml-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Processing schedule...</span>
          </div>
        )}

        {/* Schedule Display */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {days.map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CleanCard padding="md">
                  <h3 className="text-lg font-bold text-teal-600 mb-3 capitalize">
                    {dayLabels[day]}
                  </h3>

                  {schedule[day].length === 0 ? (
                    <p className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {schedule[day].map((classBlock, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg px-3 py-2 ${
                            isDark ? 'bg-teal-900/30 border border-teal-700' : 'bg-teal-50 border border-teal-200'
                          }`}
                        >
                          <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {classBlock.start} - {classBlock.end}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CleanCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};