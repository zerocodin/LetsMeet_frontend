import React from "react";
import {
  Users,
  MessageSquare,
  Bell,
  Sparkles,
  Calendar,
  TrendingUp,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";

const stats = [
  { label: "Friends", value: 12, icon: Users, color: "from-blue-500 to-indigo-500" },
  { label: "Messages", value: 4, icon: MessageSquare, color: "from-pink-500 to-rose-500" },
  { label: "Notifications", value: 3, icon: Bell, color: "from-amber-500 to-orange-500" },
  { label: "Events", value: 2, icon: Calendar, color: "from-emerald-500 to-teal-500" },
];

const feed = [
  {
    id: 1,
    user: "Sara Ahmed",
    handle: "@sara",
    time: "2h ago",
    text: "Just launched my first React side project 🚀",
    likes: 24,
    comments: 5,
  },
  {
    id: 2,
    user: "Rafi Khan",
    handle: "@rafi",
    time: "5h ago",
    text: "Anyone up for a study session this weekend?",
    likes: 12,
    comments: 8,
  },
  {
    id: 3,
    user: "Nadia Islam",
    handle: "@nadia",
    time: "1d ago",
    text: "Coffee and code — my favourite combo ☕💻",
    likes: 40,
    comments: 3,
  },
];

export default function Home() {

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />

      {/* Main content (offset by sidebar width) */}
      <main className="ml-64 min-h-screen p-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening in your world today.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${color} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Feed */}
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Activity</h2>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                Trending now
              </span>
            </div>

            <div className="space-y-4">
              {feed.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-semibold text-white">
                      {post.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {post.user}{" "}
                        <span className="font-normal text-gray-400">
                          {post.handle}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {post.text}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <button className="hover:text-[#3e4bc4]">
                      ❤️ {post.likes}
                    </button>
                    <button className="hover:text-[#3e4bc4]">
                      💬 {post.comments}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Quick tip card */}
            <div className="rounded-2xl border border-white/60 bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] p-5 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Daily Tip</h3>
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                Complete your profile to unlock more connections and personal
                recommendations.
              </p>
              <button className="mt-4 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/30">
                Complete profile
              </button>
            </div>

            {/* Suggested people */}
            <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">
                Suggested for you
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Imran Hossain", handle: "@imran" },
                  { name: "Tasnim Akter", handle: "@tasnim" },
                  { name: "Fahim Rahman", handle: "@fahim" },
                ].map((p) => (
                  <li key={p.handle} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-semibold text-white">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400">{p.handle}</p>
                    </div>
                    <button className="rounded-lg bg-[#3e4bc4] px-3 py-1 text-xs font-semibold text-white hover:bg-[#3540a8]">
                      Follow
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}