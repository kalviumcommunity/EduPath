import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const SuccessStoriesSection = () => {
  const stories = [
    {
      name: "Priya Sharma",
      program: "Computer Science, VIT",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b587?w=150&h=150&fit=crop&crop=face",
      quote: "I was completely lost about which university to choose. EduPath's AI recommendations were spot on! I'm now at VIT studying Computer Science and couldn't be happier with my choice.",
      rating: 5,
    },
    {
      name: "Rahul Kapoor",
      program: "Mechanical Engineering, IIT Delhi",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      quote: "The detailed university insights helped me make an informed decision. The placement stats and alumni reviews were particularly helpful. Now I'm at my dream university!",
      rating: 5,
    },
    {
      name: "Ananya Patel",
      program: "Business Administration, SRCC",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      quote: "The AI counselor understood my preferences better than human counselors I spoke with! It recommended SRCC, which wasn't even on my radar initially, but it turned out to be perfect for me.",
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section id="success-stories" className="py-16 lg:py-24">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Student Success Stories
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hear from students who found their perfect university match with EduPath.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {stories.map((story, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group"
            >
              <div className="card-elegant p-8 h-full hover-lift relative overflow-hidden">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="w-12 h-12 text-primary" />
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(story.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i, duration: 0.3 }}
                    >
                      <Star className="w-5 h-5 fill-secondary text-secondary" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-muted-foreground leading-relaxed mb-8 relative z-10">
                  "{story.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative"
                  >
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-foreground">{story.name}</h4>
                    <p className="text-sm text-muted-foreground">{story.program}</p>
                  </div>
                </div>

                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;