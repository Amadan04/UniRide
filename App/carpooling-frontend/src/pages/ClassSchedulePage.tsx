import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Calendar, Plus, Trash2, Edit2, Loader2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  extractScheduleFromImage,
  processScheduleEdits,
  getEmptySchedule,
  WeeklySchedule,
  ClassBlock
} from '../services/scheduleExtractor';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const ClassSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
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

  // Load schedule from Firestore
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
      // Find the user document by querying with uid field
      const usersQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        alert('User profile not found. Please make sure you are logged in.');
        return;
      }

      // Update the first matching document
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gray-900/50 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-cyan-400" />
            </button>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">My Class Schedule</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClearSchedule}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
            <button
              onClick={handleSaveSchedule}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4" />
              ) : null}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Upload Timetable Image</h2>
          <p className="text-gray-400 mb-4">
            Upload a screenshot or photo of your class schedule. AI will extract the class times automatically.
          </p>

          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 hover:border-cyan-500/50 transition-colors bg-gray-900/30">
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-cyan-400" />
                <p className="text-white font-medium">Click to upload timetable image</p>
                <p className="text-sm text-gray-400">Supports tables, lists, grids, screenshots</p>
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
            <p className="text-cyan-400 mt-3 text-sm">
              Uploaded: {uploadedImage.name}
            </p>
          )}
        </motion.div>

        {/* Manual Edit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-cyan-400" />
            Manual Editing
          </h2>
          <p className="text-gray-400 mb-4">
            Add, remove, or modify classes using natural language commands.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={editCommand}
              onChange={(e) => setEditCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEdit()}
              placeholder='e.g., "Add class Monday 9-11" or "Remove Wednesday 10AM class"'
              className="flex-1 bg-gray-900/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={handleManualEdit}
              disabled={isLoading || !editCommand.trim()}
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Apply
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Examples: "Add Monday 8-9", "Remove Tuesday 10AM", "Clear Sunday", "Change Wed 2-3 to 2-4"
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-white">Processing schedule...</span>
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
                className="bg-gray-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-5"
              >
                <h3 className="text-lg font-bold text-cyan-400 mb-3 capitalize">
                  {dayLabels[day]}
                </h3>

                {schedule[day].length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {schedule[day].map((classBlock, idx) => (
                      <div
                        key={idx}
                        className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2"
                      >
                        <p className="text-white font-medium">
                          {classBlock.start} - {classBlock.end}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};