"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Linkedin, Instagram, Github } from "lucide-react";

export default function AboutPage() {
  const [formData, setFormData] = useState({ name: "", email: "", topic: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", topic: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button className="glass px-6 py-3 hover:scale-105 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-800 dark:text-gray-200" />
              <span className="text-gray-800 dark:text-gray-200 font-semibold">Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="glass-card p-10">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              About the Developer
            </h1>
            <p className="text-xl text-gray-700">
              Hi! I'm <span className="font-bold text-purple-600">Burak Cetin</span>
            </p>
          </div>

          <div className="space-y-6 mb-10">
            <p className="text-lg text-gray-700 leading-relaxed">
              I created <span className="font-semibold text-purple-600">Dutch Vocab</span> to help people learn Dutch vocabulary in an interactive and engaging way. 
              This app combines beautiful glassmorphism design with practical learning features like practice sentences, YouGlish integration, and progress tracking.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              As a developer passionate about creating useful tools, I believe learning should be both effective and enjoyable. 
              Feel free to reach out if you have suggestions, feedback, or just want to connect!
            </p>
          </div>

          {/* Contact Form Section */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Send Me a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 glass rounded-xl border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 glass rounded-xl border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Feedback, suggestion, or question"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 glass rounded-xl border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Tell me what's on your mind..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
              
              {submitStatus === "success" && (
                <div className="p-4 glass rounded-xl bg-green-50/50 border border-green-200">
                  <p className="text-green-700 font-semibold text-center">✓ Message sent successfully! I'll get back to you soon.</p>
                </div>
              )}
              
              {submitStatus === "error" && (
                <div className="p-4 glass rounded-xl bg-red-50/50 border border-red-200">
                  <p className="text-red-700 font-semibold text-center">✗ Failed to send message. Please try again or email me directly at burakcetinctn@gmail.com</p>
                </div>
              )}
            </form>
          </div>

          {/* Social Links */}
          <div className="mt-10 pt-10 border-t border-purple-200 dark:border-purple-800">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Or Connect Via Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/in/burakcetindev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 glass rounded-2xl hover:shadow-lg transition-all group bg-gradient-to-r from-blue-50/50 to-cyan-50/50"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  LinkedIn
                </p>
                <p className="text-sm text-gray-600">@burakcetindev</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/iamburakcetin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 glass rounded-2xl hover:shadow-lg transition-all group bg-gradient-to-r from-pink-50/50 to-purple-50/50"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  Instagram
                </p>
                <p className="text-sm text-gray-600">@iamburakcetin</p>
              </div>
            </a>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-10 pt-8 border-t border-purple-200 dark:border-purple-800">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Made with ❤️ using Next.js, React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
