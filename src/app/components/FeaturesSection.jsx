'use client'
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  BellIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: ChartBarIcon,
    title: 'Academic Dashboard',
    desc: 'Real-time overview of attendance, grades, performance analytics, and progress tracking.',
    color: 'blue',
  },
  {
    icon: UserGroupIcon,
    title: 'Attendance Management',
    desc: 'Automated daily attendance system with student-wise and class-wise reports.',
    color: 'green',
  },
  {
    icon: DocumentTextIcon,
    title: 'Examination System',
    desc: 'Create exams, publish results, and generate report cards instantly.',
    color: 'indigo',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Fee Management',
    desc: 'Track payments, generate invoices, and manage due fees with automated alerts.',
    color: 'amber',
  },
  {
    icon: BookOpenIcon,
    title: 'Learning Management',
    desc: 'Upload assignments, study materials, and manage digital classrooms.',
    color: 'purple',
  },
  {
    icon: BellIcon,
    title: 'Notifications & Alerts',
    desc: 'Instant SMS/email updates for attendance, results, and school announcements.',
    color: 'red',
  },
]

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600', hoverText: 'group-hover:text-white' },
  green: { bg: 'bg-green-50', text: 'text-green-600', hoverBg: 'group-hover:bg-green-600', hoverText: 'group-hover:text-white' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-600', hoverText: 'group-hover:text-white' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600', hoverText: 'group-hover:text-white' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600', hoverText: 'group-hover:text-white' },
  red: { bg: 'bg-red-50', text: 'text-red-600', hoverBg: 'group-hover:bg-red-600', hoverText: 'group-hover:text-white' },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-4 bg-[#f8fafc] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8 animate-slideUp">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Core ERP Modules</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Everything your school needs,
            <span className="text-primary italic"> in one simple platform</span>
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage academics, administration, and communication smoothly with a clean and intuitive ERP system.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const c = colorMap[feature.color]
            return (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fadeIn"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200/0 via-transparent to-slate-300/0 opacity-0 group-hover:opacity-100 group-hover:from-slate-200/30 group-hover:to-slate-300/30 transition-all duration-500" />
                <div className={`relative z-10 w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 ${c.bg} ${c.text} ${c.hoverBg} ${c.hoverText}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="relative z-10 text-lg font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
                <p className="relative z-10 text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 group-hover:w-full transition-all duration-500 rounded-full" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
