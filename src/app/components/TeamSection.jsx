"use client";

const team = [
  {
    name: "Dr. Prajwal Gautam",
    role: "Principal",
    image: "/images/SSSS.jpeg",
    description: "Leading Everest View with over 25 years of experience in educational administration. Committed to academic excellence and holistic student development."
  },
  {
    name: "Mr. Nir Prasad Gautam",
    role: "Academic Coordinator",
    image: "/images/SSSS.jpeg",
    description: "Oversees curriculum planning, teacher training, and academic standards across all grade levels."
  },
  {
    name: "Mr. Prakash Thapa",
    role: "Senior Teacher — Science",
    image: "/images/SSSS.jpeg",
    description: "A passionate science educator who makes complex concepts simple through hands-on experiments."
  },
  {
    name: "Ms. Sevoke Chandra Gautam",
    role: "Senior Teacher — Mathematics",
    image: "/images/SSSS.jpeg",
    description: "Known for innovative teaching methods that help students develop strong analytical and problem-solving skills."
  }
];

export default function TeamSection() {
  return (
    <section id="team" className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 border border-blue-100 rounded-full">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Our Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Meet the People Behind <span className="text-primary">Everest View</span>
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Dedicated educators and staff committed to shaping the future of every student.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <div key={i} className="group text-center">
              <div className="relative w-40 h-40 mx-auto mb-5 rounded-full overflow-hidden border-4 border-slate-100 shadow-md group-hover:border-primary group-hover:shadow-xl transition-all duration-300">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider mb-3">
                {member.role}
              </span>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
