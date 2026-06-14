'use client'

const features = [
  {
    icon: '📊',
    title: 'Academic Dashboard',
    desc: 'Real-time overview of attendance, grades, performance analytics, and progress tracking.',
  },
  {
    icon: '🧑‍🏫',
    title: 'Attendance Management',
    desc: 'Automated daily attendance system with student-wise and class-wise reports.',
  },
  {
    icon: '📝',
    title: 'Examination System',
    desc: 'Create exams, publish results, and generate report cards instantly.',
  },
  {
    icon: '💰',
    title: 'Fee Management',
    desc: 'Track payments, generate invoices, and manage due fees with automated alerts.',
  },
  {
    icon: '📚',
    title: 'Learning Management',
    desc: 'Upload assignments, study materials, and manage digital classrooms.',
  },
  {
    icon: '🔔',
    title: 'Notifications & Alerts',
    desc: 'Instant SMS/email updates for attendance, results, and school announcements.',
  },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-2 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50"
    >

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-slate-300/20 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">

          <span className="inline-flex items-center px-5 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold tracking-wider uppercase">
            Core ERP Modules
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Everything your school needs,
            <span className="text-slate-500 font-semibold">
              {" "}in one simple platform
            </span>
          </h2>

          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage academics, administration, and communication smoothly with a clean and intuitive ERP system.
          </p>

        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            >

              <div className="absolute inset-0 bg-gradient-to-br from-slate-200/0 via-transparent to-slate-300/0 opacity-0 group-hover:opacity-100 group-hover:from-slate-200/30 group-hover:to-slate-300/30 transition-all duration-500" />

              <div className="relative z-10 w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              <h3 className="relative z-10 text-lg font-bold text-slate-900 mb-2 tracking-tight">
                {feature.title}
              </h3>

              <p className="relative z-10 text-slate-600 leading-relaxed text-sm">
                {feature.desc}
              </p>

              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 group-hover:w-full transition-all duration-500 rounded-full" />
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}