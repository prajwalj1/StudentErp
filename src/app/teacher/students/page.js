'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PlusIcon, UserIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

export default function TeacherStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [myGrades, setMyGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', grade: '', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });

  const [filterGrade, setFilterGrade] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailStudent, setDetailStudent] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) {
      router.replace('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'TEACHER') {
      fetchStudents();
    }
  }, [status, session]);

  useEffect(() => {
    if (myGrades.length > 0 && !formData.grade) {
      setFormData(prev => ({ ...prev, grade: myGrades[0] }));
    }
  }, [myGrades]);

  const fetchStudents = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes')
      ]);
      if (studentsRes.ok && classesRes.ok) {
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();
        const assigned = classesData.filter(c => {
          if (!c.teacherId || !c.teacherId.email || !session?.user?.email) return false;
          return c.teacherId.email.toLowerCase() === session.user.email.toLowerCase();
        });
        const gradeSet = new Set(assigned.map(c => c.grade).filter(Boolean));
        setMyGrades([...gradeSet]);
        const filtered = studentsData.filter(s => gradeSet.has(s.grade));
        setStudents(filtered);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesGrade = filterGrade === 'All' || student.grade === filterGrade;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const uniqueGrades = ['All', ...new Set(students.map(s => s.grade))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', grade: myGrades[0] || '', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });
        fetchStudents();
      } else {
        const errData = await res.json();
        alert(`Failed to add student: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const modalOverlay = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserIcon className="w-8 h-8 text-blue-600" />
            Students
          </h1>
          <p className="text-slate-500 text-sm mt-1">View and add students.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm flex-1 md:w-64 bg-slate-50"
          />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-semibold text-slate-600 bg-slate-50 cursor-pointer"
          >
            {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all duration-300"
          >
            <PlusIcon className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold w-16">Roll</th>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Grade/Class</th>
                <th className="px-6 py-4 font-bold">Father's Name</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No students matching your filters.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                      {student.rollNumber || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {student.grade} {student.section ? `(Sec ${student.section})` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.fatherName || '-'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDetailStudent(student)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailStudent && (
        <div className={`${modalOverlay} overflow-y-auto`}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                Student Details
              </h2>
              <button onClick={() => setDetailStudent(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                  {detailStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{detailStudent.name}</p>
                  <p className="text-sm text-slate-500">Roll: {detailStudent.rollNumber || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Grade</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.grade}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Section</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.section || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Father's Name</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.fatherName || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Father's Mobile</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.fatherMobile || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Date of Birth (Nepali)</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.dob || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Address</p>
                  <p className="font-bold text-slate-900 mt-1">{detailStudent.address || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className={modalOverlay + ' overflow-y-auto'}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                Add New Student
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Aarav Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                  <select required value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700 cursor-pointer">
                    {myGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                  <input type="text" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. A, B" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input type="text" value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Ram Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Mobile</label>
                  <input type="text" value={formData.fatherMobile} onChange={e => setFormData({ ...formData, fatherMobile: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 98XXXXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth (Nepali)</label>
                  <NepaliDatePicker
                    value={formData.dob ? formData.dob.replace(/-/g, '/') : ''}
                    onChange={(date, nepaliDateString) => {
                      setFormData({ ...formData, dob: nepaliDateString || '' });
                    }}
                    locale="en"
                    placeholder="YYYY/MM/DD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Kathmandu, Nepal" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
