import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = ({ navigate }) => {
  return (
    <section className="py-16 lg:py-24 overflow-hidden">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-muted px-4 py-2 rounded-full text-sm font-medium text-muted-foreground"
              >
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>AI-Powered University Matching</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight"
              >
                Your Future,{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Personalized.
                </span>
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight"
              >
                Find the perfect university with AI.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl"
              >
                Stop the endless searching. Get a data-driven, personalized list of 
                universities that match your academics, interests, and dreams.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-xl btn-press hover-lift group"
                onClick={() => navigate && navigate('signup')}
              >
                Find My University Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-semibold rounded-xl hover-scale border-2"
              >
                Watch How It Works
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap gap-8 pt-8"
            >
              <div className="text-center sm:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">10,000+</div>
                <div className="text-muted-foreground font-medium">Universities Analyzed</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">95%</div>
                <div className="text-muted-foreground font-medium">Match Accuracy</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">50,000+</div>
                <div className="text-muted-foreground font-medium">Students Helped</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Main Illustration Container */}
              <div className="relative aspect-square bg-gradient-hero rounded-3xl p-8 overflow-hidden">
                {/* Floating Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-8 right-8 w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <div className="w-8 h-8 bg-white rounded-lg" />
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, 15, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute top-16 left-8 w-12 h-12 bg-accent rounded-xl shadow-lg"
                />

                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    x: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-16 right-12 w-10 h-10 bg-white/20 rounded-full shadow-lg"
                />

                {/* Central University Building */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
                  className="absolute inset-x-8 bottom-8 h-32 bg-white/90 rounded-2xl shadow-2xl flex items-end justify-center overflow-hidden"
                >
                  <div className="w-full h-24 bg-gradient-to-t from-primary/20 to-transparent rounded-t-2xl" />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center"
                  >
                    <div className="w-6 h-6 bg-white rounded-sm" />
                  </motion.div>
                </motion.div>

                {/* Floating Graduation Caps */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      y: [0, -20, 0],
                      rotate: 360
                    }}
                    transition={{ 
                      delay: 1 + i * 0.3,
                      duration: 2,
                      y: { duration: 3 + i, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                    }}
                    className={`absolute w-8 h-8 bg-secondary rounded-lg shadow-lg ${
                      i === 0 ? 'top-1/4 left-1/4' : 
                      i === 1 ? 'top-1/3 right-1/4' : 
                      'bottom-1/3 left-1/3'
                    }`}
                  />
                ))}

                {/* Sparkle Effects */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                    className={`absolute w-2 h-2 bg-white rounded-full ${
                      i % 2 === 0 ? 'animate-pulse' : 'animate-bounce'
                    }`}
                    style={{
                      left: `${20 + (i * 15)}%`,
                      top: `${15 + (i * 12)}%`,
                    }}
                  />
                ))}
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-xl rounded-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;