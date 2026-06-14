'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  BookOpenIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  TrashIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const OwnerClassesPage = () => {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [formData, setFormData] = useState({
    subject: '',
    grade: 'Grade 10',
    section: 'A',
    time: '10:00 AM - 11:00 AM',
    room: 'Room 101',
    teacherId: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/teachers')
      ]);

      if (classesRes.ok && teachersRes.ok) {
        const classesData = await classesRes.json();
        const teachersData = await teachersRes.json();
        setClasses(classesData);
        setTeachers(teachersData);
        if (teachersData.length > 0) {
          setFormData(prev => ({ ...prev, teacherId: teachersData[0]._id }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Failed to delete class: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) {
      alert("Please select a teacher. If no teachers exist, please add a teacher first.");
      return;
    }

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          subject: '',
          grade: 'Grade 10',
          section: 'A',
          time: '10:00 AM - 11:00 AM',
          room: 'Room 101',
          teacherId: teachers.length > 0 ? teachers[0]._id : ''
        });
        fetchData();
        setToast({ type: 'success', text: 'Class schedule added successfully!' });
        setTimeout(() => setToast(null), 3000);
      } else {
        const errData = await res.json();
        setToast({ type: 'error', text: errData.error || 'Failed to add class.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  // Filter classes based on search term and selected grade
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cls.teacherId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cls.room || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || cls.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  // Unique grades for filter dropdown
  const uniqueGrades = ['All', ...new Set(classes.map(c => c.grade))];

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpenIcon className="w-8 h-8 text-indigo-600" />
            Class Schedules & Assign
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic classes, rooms, time slots, and assigned teachers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          Add Class Schedule
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpenIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classes</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{classes.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <AcademicCapIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Grades</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {new Set(classes.map(c => c.grade)).size}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Teachers</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {new Set(classes.map(c => c.teacherId?._id).filter(Boolean)).size}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject, teacher name, or room..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 whitespace-nowrap px-2">Filter Grade:</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
          >
            {uniqueGrades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <BookOpenIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No class schedules found</h3>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search query or add a new class schedule.</p>
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div 
              key={cls._id} 
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      {cls.subject.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cls.subject}</h3>
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg mt-1">
                        {cls.grade} {cls.section ? `• Sec ${cls.section}` : ''}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(cls._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Class"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 py-4 border-t border-b border-slate-50 my-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <ClockIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <span className="font-medium">{cls.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPinIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium">{cls.room || 'Unassigned Room'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {cls.teacherId?.name ? cls.teacherId.name.charAt(0) : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Teacher</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{cls.teacherId?.name || 'No Teacher Assigned'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Class Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-float my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6 text-indigo-600" />
                Add New Class Schedule
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Advanced Mathematics, Physics, English"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                  >
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. A, B, Rose"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Schedule Time</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 10:00 AM - 11:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Room 101, Science Lab"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Teacher</label>
                {teachers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                    No teachers available. Please add a teacher from the Teachers portal first.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                  >
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.teacherId || teacher.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teachers.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all animate-float ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default OwnerClassesPage;
