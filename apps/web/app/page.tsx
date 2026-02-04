"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Music,
  Vote,
  Shield,
  Zap,
  PartyPopper,
  Users,
  Play,
  Headphones,
  ArrowRight,
  Sparkles,
  Radio,
  Heart,
} from "lucide-react";

export default function Page() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      title: "Real-time Voting",
      description:
        "Everyone votes on their favorite songs in real-time. Democracy at its finest.",
      icon: Vote,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Spotify Integration",
      description:
        "Seamless playback powered by Spotify. High-quality streaming guaranteed.",
      icon: Music,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Admin Controls",
      description:
        "Room admins can approve or reject requests to keep the vibe right.",
      icon: Shield,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Live Updates",
      description:
        "Watch the queue update instantly as votes come in. No refresh needed.",
      icon: Zap,
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: "Party Ready",
      description:
        "Perfect for parties, gatherings, or any group listening session.",
      icon: PartyPopper,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Collaborative",
      description:
        "Build the perfect playlist together with friends and family.",
      icon: Heart,
      gradient: "from-red-500 to-pink-500",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Room",
      description: "Admin creates a room and connects their Spotify account",
      icon: Headphones,
    },
    {
      number: "02",
      title: "Share Code",
      description: "Share the unique room code with your friends",
      icon: Users,
    },
    {
      number: "03",
      title: "Vote & Request",
      description: "Everyone votes on songs and requests their favorites",
      icon: Vote,
    },
    {
      number: "04",
      title: "Enjoy Music",
      description: "The most upvoted song plays automatically",
      icon: Play,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                  <Music className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text">
                  PulseQ
                </span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/join"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Join Room
                </Link>
                <Link href="/admin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                  >
                    Create Room
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                Collaborative Music Experience
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Let the{" "}
              <span className="bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Crowd
              </span>{" "}
              Choose
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              the Music
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed px-4"
            >
              Create a room, connect Spotify, and let your friends vote on what
              plays next. The perfect DJ for every party.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            >
              <Link href="/admin" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto group px-8 py-4 bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  Create Room
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link href="/join" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 py-4 bg-card/80 backdrop-blur-sm border border-border text-foreground rounded-xl font-semibold text-lg hover:bg-card hover:border-primary/30 transition-all"
                >
                  Join a Room
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-muted-foreground text-sm px-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Real-time sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Unlimited guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Spotify powered</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 sm:py-24 px-4 relative">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Get your music room up and running in four simple steps
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="group relative p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-3xl font-bold text-muted-foreground/30 group-hover:text-primary/30 transition-colors">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Powerful Features
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Everything you need for the perfect collaborative music
                experience
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="group p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/40 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10" />
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="max-w-3xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your
                <br />
                <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  Music Room?
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto px-4">
                Join thousands of music lovers creating the perfect playlist
                together. No downloads required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <Link href="/admin" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto group px-10 py-5 bg-linear-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <Link href="/join" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto px-10 py-5 bg-card/80 backdrop-blur-sm border border-border text-foreground rounded-xl font-bold text-lg hover:bg-card hover:border-primary/30 transition-all"
                  >
                    Join Existing Room
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center">
                  <Music className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">PulseQ</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                © 2026 PulseQ. Let the crowd choose the music.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
