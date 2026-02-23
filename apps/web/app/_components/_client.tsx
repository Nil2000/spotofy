"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import {
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
  Music,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function LandingPage() {
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
        <Navbar>
          <Link
            href="/join"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Join Room
          </Link>
          <Link href="/admin">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="px-4 py-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                Create Room
              </Button>
            </motion.div>
          </Link>
        </Navbar>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-20 pb-16 relative">
          {/* Floating Background Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { Icon: Music, top: "20%", left: "15%", scale: 0.8, delay: 0 },
              {
                Icon: Headphones,
                top: "70%",
                left: "80%",
                scale: 0.6,
                delay: 1.5,
              },
              { Icon: Radio, top: "30%", left: "85%", scale: 0.9, delay: 0.8 },
              {
                Icon: Sparkles,
                top: "80%",
                left: "20%",
                scale: 0.7,
                delay: 2.2,
              },
            ].map(({ Icon, top, left, scale, delay }, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/10"
                initial={{
                  top,
                  left,
                  scale,
                  opacity: 0.3,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 20, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
              >
                <Icon size={60 * scale} />
              </motion.div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="mb-6"
            >
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 h-auto rounded-full border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8 backdrop-blur-md shadow-sm hover:bg-primary/10 transition-colors"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Collaborative Music Experience
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tight leading-[1.1]"
            >
              Let the{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                  Crowd
                </span>
                <motion.span
                  className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full blur-sm"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
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
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed px-4 font-light"
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <Button className="relative w-full sm:w-auto h-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Create Room
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  </Button>
                </motion.div>
              </Link>

              <Link href="/join" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-auto px-8 py-4 bg-card/50 backdrop-blur-md border-border/50 text-foreground rounded-xl font-semibold text-lg hover:bg-card/80 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all duration-300"
                  >
                    Join a Room
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-muted-foreground text-sm px-4"
            >
              {[
                { icon: Zap, text: "Real-time sync" },
                { icon: Users, text: "Unlimited guests" },
                { icon: Radio, text: "Spotify powered" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full border border-border/50"
                  whileHover={{
                    y: -2,
                    backgroundColor: "rgba(var(--muted), 0.5)",
                  }}
                >
                  {item.text === "Real-time sync" ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  ) : (
                    <item.icon className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 sm:py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />

          {/* Decorative Elements */}
          <div className="absolute top-40 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring" }}
              className="text-center mb-16 sm:mb-24"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg sm:text-xl font-light">
                Get your music room up and running in four simple steps
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative h-full"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative h-full p-8 bg-card/60 backdrop-blur-xl rounded-3xl border-border/50 hover:border-primary/50 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center overflow-hidden z-10">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />

                    <CardContent className="px-0 flex-1 flex flex-col items-center w-full">
                      <div className="relative mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner border border-primary/10">
                          <step.icon className="w-10 h-10 text-primary group-hover:text-primary transition-colors" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-5xl font-black text-muted-foreground/10 group-hover:text-primary/20 transition-colors duration-500 select-none">
                          {step.number}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mb-4 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed font-light">
                        {step.description}
                      </p>
                    </CardContent>

                    {/* Connecting Line (Desktop) */}
                    {index < steps.length - 1 && (
                      <div className="hidden xl:block absolute top-1/2 -right-4 w-8 h-0.5 bg-linear-to-r from-border/50 to-transparent z-0" />
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 sm:py-32 px-4 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-muted/50 via-background to-background pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring" }}
              className="text-center mb-16 sm:mb-24"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                Powerful Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg sm:text-xl font-light">
                Everything you need for the perfect collaborative music
                experience
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative h-full"
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                  />
                  <Card className="relative h-full p-8 bg-card/40 backdrop-blur-md rounded-3xl border-border/50 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-12">
                      <feature.icon className="w-32 h-32" />
                    </div>

                    <CardContent className="px-0 relative z-10">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed font-light">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-linear-to-tr from-primary/20 to-accent/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] p-8 sm:p-16 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--primary),0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--primary),0.1)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight relative z-10">
                Ready to Start Your
                <br />
                <span className="relative inline-block mt-2">
                  <span className="relative z-10 bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                    Music Room?
                  </span>
                  <motion.span
                    className="absolute bottom-1 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full blur-md"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto px-4 font-light relative z-10">
                Join thousands of music lovers creating the perfect playlist
                together. No downloads required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 relative z-10">
                <Link href="/admin" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <Button className="relative w-full sm:w-auto group h-auto px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2">
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <motion.div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </Button>
                  </motion.div>
                </Link>

                <Link href="/join" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto h-auto px-10 py-5 bg-background/50 backdrop-blur-md border-border/50 text-foreground rounded-2xl font-bold text-lg hover:bg-background/80 hover:border-primary/50 transition-all duration-300"
                    >
                      Join Existing Room
                    </Button>
                  </motion.div>
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
                <Separator orientation="vertical" className="h-4" />
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
