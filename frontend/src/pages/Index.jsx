import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import SuccessStoriesSection from "@/components/sections/SuccessStoriesSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";

const Index = ({ navigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-background"
    >
      <Header navigate={navigate} />
      <main>
        <HeroSection navigate={navigate} />
        <HowItWorksSection />
        <SuccessStoriesSection />
        <CTASection navigate={navigate} />
      </main>
      <Footer />
    </motion.div>
  );
};

export default Index;
