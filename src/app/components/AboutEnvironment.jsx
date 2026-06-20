"use client";
import React from "react";
import { 
  SparklesIcon, 
  UserGroupIcon, 
  HomeModernIcon, 
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon
} from "@heroicons/react/24/solid";

const features = [
  {
    title: "Experienced Faculty",
    description: "Qualified and dedicated teachers who nurture every student with personalized attention and modern teaching methodologies.",
    icon: HomeModernIcon,
    color: "blue"
  },
  {
    title: "Sports & Athletics",
    description: "Well-maintained playgrounds, indoor games facilities, and regular sports events to promote physical fitness and teamwork.",
    icon: ShieldCheckIcon,
    color: "green"
  },
  {
    title: "Science & Computer Labs",
    description: "Fully equipped laboratories for physics, chemistry, biology, and computer science with hands-on practical learning approach.",
    icon: UserGroupIcon,
    color: "indigo"
  },
  {
    title: "Library & Resource Center",
    description: "A well-stocked library with thousands of books, digital resources, and quiet reading zones for research and self-study.",
    icon: ChatBubbleLeftEllipsisIcon,
    color: "purple"
  },
  {
    title: "Transportation",
    description: "Safe and reliable school bus service covering major routes with GPS tracking and trained attendants for student safety.",
    icon: StarIcon,
    color: "amber"
  },
  {
    title: "Smart Classrooms",
    description: "Every classroom equipped with interactive smart boards, projectors, and audio-visual aids for engaging digital lessons.",
    icon: SparklesIcon,
    color: "red"
  }
];

const testimonials = [
  {
    name: "Dr. Sameer Pathak",
    role: "Parent",
    comment: "The practical approach to science here is amazing. My son doesn't just read about experiments; he performs them in the advanced labs every week.",
    image: "images/comment.jpg",
    rating: 5
  },
  {
    name: "Anjali Sharma",
    role: "Grade 10 Student",
    comment: "We learn through projects and field trips. This practical way of studying makes complex theories very easy to understand and remember.",
    image: "images/comment.jpg",
    rating: 5
  },
  {
    name: "Rajesh Hamal",
    role: "Alumni",
    comment: "The coding workshops and robotics club gave me a head start in my engineering career. The school focus on industry-relevant skills is commendable.",
     image: "images/comment.jpg",
     rating: 4
  },
  {
    name: "Sunita Gurung",
    role: "Senior Teacher",
    comment: "Our curriculum is 60% practical based. We believe that 'doing' is the best form of 'knowing', especially in modern education.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5
  },
  {
    name: "Prakash Thapa",
    role: "School Owner",
    comment: "We've invested heavily in digital infrastructure to ensure students get hands-on experience with the tools of tomorrow.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5
  },
  {
    name: "Maya Shrestha",
    role: "Parent",
    comment: "The outdoor learning sessions in the green campus are my child's favorite. It's a refreshing and practical way to study nature.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 4
  }
];

export default function AboutEnvironment() {
  return (
    <section id="about" className="py-4 bg-[#f8fafc] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Our Campus</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            A Glimpse Into Our <span className="text-primary italic">School Environment</span>
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Explore the facilities and physical surroundings that make Everest View a premier institution for learning and development.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-4">
          {features.map((feature, i) => (
            <div key={i} className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fadeIn" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200/0 via-transparent to-slate-300/0 opacity-0 group-hover:opacity-100 group-hover:from-slate-200/30 group-hover:to-slate-300/30 transition-all duration-500" />
              <div className={`relative z-10 w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-all duration-300 ${
                feature.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" :
                feature.color === "green" ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white" :
                "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
              }`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="relative z-10 text-lg font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
              <p className="relative z-10 text-slate-600 leading-relaxed text-sm">{feature.description}</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-slate-900 group-hover:w-full transition-all duration-500 rounded-full" />
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="relative">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-amber-50 border border-amber-100 rounded-full">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              <span className="text-primary italic">Community Voices</span>
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Hear from parents, students, and alumni about their experience at Everest View.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.slice(0, 3).map((item, i) => (
              <div key={i} className="glass p-5 rounded-2xl border-white/40 shadow-sm relative group hover:bg-white transition-colors duration-300 animate-slideUp" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="flex gap-1 mb-2">
                  {[...Array(item.rating)].map((_, idx) => (
                    <StarIcon key={idx} className="w-4 h-4 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 italic text-sm leading-relaxed mb-3">
                  &ldquo;{item.comment}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">{item.name}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
