"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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
      title: "Real-time Song Voting",
      description:
        "Everyone in the room can vote on their favorite songs in real-time",
      icon: "🗳️",
    },
    {
      title: "Spotify-Powered Playback",
      description:
        "Seamless integration with Spotify for high-quality music streaming",
      icon: "🎵",
    },
    {
      title: "Admin Moderation",
      description:
        "Room admins can approve or reject song requests to keep the vibe right",
      icon: "🛡️",
    },
    {
      title: "Live Queue Updates",
      description: "Watch the queue update instantly as votes come in",
      icon: "⚡",
    },
    {
      title: "Party & Group Friendly",
      description:
        "Perfect for parties, gatherings, or any group listening session",
      icon: "🎉",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Admin Creates Room",
      description: "Create a room and connect your Spotify account",
      icon: "🎛️",
    },
    {
      number: "2",
      title: "Users Join & Request",
      description: "Friends join the room and request their favorite songs",
      icon: "👥",
    },
    {
      number: "3",
      title: "Everyone Upvotes",
      description: "Vote on songs to decide what plays next",
      icon: "👍",
    },
    {
      number: "4",
      title: "Top Song Plays",
      description: "The most upvoted song plays automatically",
      icon: "▶️",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      <div className="relative">
        <section className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Let the Crowd Choose the Music 🎶
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
            >
              Create a room, connect Spotify, and let your friends vote on what
              plays next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/admin">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(var(--primary), 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg shadow-lg hover:shadow-primary/50 transition-all"
                >
                  Create Room (Admin)
                </motion.button>
              </Link>

              <Link href="/join">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 30px rgba(var(--secondary), 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold text-lg shadow-lg hover:shadow-secondary/50 transition-all"
                >
                  Join Room (User)
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 bg-card/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-center mb-16"
            >
              How It Works
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="relative p-6 bg-card rounded-xl border border-border shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                  <div className="text-5xl mb-4 mt-2">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-center mb-16"
            >
              Features
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    transition: { duration: 0.2 },
                  }}
                  className="p-6 bg-card rounded-xl border border-border shadow-md hover:border-primary/50 transition-all"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Start Your Music Room in Seconds
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                Join thousands of music lovers creating the perfect playlist
                together
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/admin">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 40px rgba(var(--primary), 0.6)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-10 py-5 bg-primary text-primary-foreground rounded-lg font-bold text-xl shadow-xl hover:shadow-primary/60 transition-all"
                  >
                    Create Room
                  </motion.button>
                </Link>

                <Link href="/join">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 40px rgba(var(--secondary), 0.6)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-10 py-5 bg-secondary text-secondary-foreground rounded-lg font-bold text-xl shadow-xl hover:shadow-secondary/60 transition-all"
                  >
                    Join Room
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto text-center text-muted-foreground">
            <p>© 2026 PulseQ. Let the crowd choose the music.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
