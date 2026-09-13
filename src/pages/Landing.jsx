import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  Users,
  MessageSquare,
  Shield,
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD Video Meetings",
    description:
      "Crystal-clear video calls with up to 100 participants. No downloads required.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Instant Collaboration",
    description:
      "Share screens, collaborate on documents, and work together in real-time.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat & Reactions",
    description:
      "Engage with emoji reactions, polls, and threaded chat during meetings.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, waiting rooms, and passcode protection for every call.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Start a meeting in seconds. Low latency, high performance, always reliable.",
    color: "from-rose-500 to-red-500",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description:
      "Browser-based. Works on desktop, tablet, and mobile without installation.",
    color: "from-cyan-500 to-blue-500",
  },
];

const stats = [
  { value: "10M+", label: "Active Users" },
  { value: "500M+", label: "Meetings Hosted" },
  { value: "99.9%", label: "Uptime" },
  { value: "150+", label: "Countries" },
];

export default function Landing() {
  const heroRef = useRef(null);

  // Subtle parallax on hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrollY * 0.15}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-x-hidden">
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white font-bold shadow-md transition-transform group-hover:scale-105">
              M
            </div>
            <span className="text-xl font-bold text-gray-800">MeetUp</span>
          </Link>

          {/* Right buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-[1.03] hover:shadow-lg"
            >
              Sign Up
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#3e4bc4]/20 blur-3xl animate-pulse" />
          <div
            className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-[#8B5CF6]/20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div
          ref={heroRef}
          className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2"
        >
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-lg">
              <Sparkles className="h-3.5 w-3.5 text-[#3e4bc4]" />
              <span>Meet, collaborate, and connect seamlessly</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-800 sm:text-5xl lg:text-6xl">
              Video meetings
              <br />
              made{" "}
              <span className="bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] bg-clip-text text-transparent">
                beautifully simple
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-gray-600 lg:mx-0 lg:text-lg">
              Connect with anyone, anywhere. Host crystal-clear video calls,
              share your screen, and collaborate in real-time — all from your
              browser.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/signup"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.03] hover:shadow-xl sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-7 py-3.5 text-sm font-semibold text-gray-700 backdrop-blur-lg transition-all hover:bg-white hover:shadow-md sm:w-auto"
              >
                <Play className="h-4 w-4 text-[#3e4bc4]" />
                See how it works
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500 lg:justify-start">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Free forever
              </div>
            </div>
          </div>

          {/* Right: animated mock preview */}
          <div className="relative">
            <div className="relative mx-auto max-w-md animate-[float_6s_ease-in-out_infinite] lg:max-w-full">
              {/* Main preview card */}
              <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl backdrop-blur-xl">
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] p-4">
                  {/* Grid of "participants" */}
                  <div className="grid h-full grid-cols-2 gap-2">
                    {[
                      { name: "Sara", color: "from-pink-400 to-rose-500" },
                      { name: "Rafi", color: "from-blue-400 to-indigo-500" },
                      { name: "Nadia", color: "from-emerald-400 to-teal-500" },
                      { name: "You", color: "from-amber-400 to-orange-500" },
                    ].map((p, i) => (
                      <div
                        key={p.name}
                        className={`relative flex items-center justify-center rounded-lg bg-linear-to-br ${p.color} opacity-90 animate-[fadeIn_0.6s_ease-out_backwards]`}
                        style={{ animationDelay: `${i * 0.15}s` }}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur text-sm font-bold text-white">
                          {p.name.charAt(0)}
                        </div>
                        <span className="absolute bottom-1 left-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controls bar */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gray-100" />
                  <div className="h-9 w-9 rounded-full bg-red-500" />
                  <div className="h-9 w-9 rounded-full bg-gray-100" />
                  <div className="h-9 w-9 rounded-full bg-gray-100" />
                </div>
              </div>

              {/* Floating card 1 */}
              <div
                className="absolute -left-6 top-12 hidden rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur-xl sm:block animate-[float_5s_ease-in-out_infinite]"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">24 Online</p>
                    <p className="text-[10px] text-gray-500">in your meeting</p>
                  </div>
                </div>
              </div>

              {/* Floating card 2 */}
              <div
                className="absolute -right-4 bottom-8 hidden rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur-xl sm:block animate-[float_5s_ease-in-out_infinite]"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Encrypted
                    </p>
                    <p className="text-[10px] text-gray-500">End-to-end</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="relative py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 rounded-3xl border border-white/60 bg-white/60 p-8 shadow-lg backdrop-blur-xl sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="text-center animate-[fadeIn_0.6s_ease-out_backwards]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <p className="bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-[#3e4bc4]/10 px-4 py-1.5 text-xs font-semibold text-[#3e4bc4]">
              FEATURES
            </span>
            <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
              Everything you need to{" "}
              <span className="bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] bg-clip-text text-transparent">
                connect
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Powerful features designed to make every meeting productive,
              secure, and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg transition-all hover:-translate-y-1 hover:shadow-xl animate-[fadeIn_0.6s_ease-out_backwards]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${f.color} text-white shadow-md transition-transform group-hover:scale-110`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] p-10 text-center shadow-2xl sm:p-14">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to start your first meeting?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Join millions of people who use MeetUp to connect, collaborate,
                and get things done.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#3e4bc4] shadow-lg transition-all hover:scale-[1.03] sm:w-auto"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/40 bg-white/60 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-bold text-white">
              M
            </div>
            <span className="font-bold text-gray-800">MeetUp</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} MeetUp. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ================= KEYFRAMES (injected) ================= */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}