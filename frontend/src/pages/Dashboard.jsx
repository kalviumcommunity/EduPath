import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  DollarSign,
  Users,
  Trophy,
  BookOpen,
  Star,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/useAuth"; // ensure using hook wrapper
import { recommendService } from "@/services/api.service";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/BackButton";

const Dashboard = ({ navigate, setSelectedUniversity }) => {
  const [universities, setUniversities] = useState([]);
  const [counsellorNote, setCounsellorNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelMeta, setModelMeta] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // If user has a profile, use it to get recommendations
        if (user?.profile) {
          console.log(
            "[Dashboard] Fetching recommendations with profile:",
            user.profile
          );
          const response = await recommendService.getRecommendations(
            user.profile
          );
          console.log("[Dashboard] Recommendation response:", response);

          if (response.success) {
            setUniversities(response.data.recommendedUniversities || []);
            setCounsellorNote(response.data.aiCounsellorNote || "");
            setModelMeta(response.data.modelMeta || null);
          } else {
            throw new Error("Failed to fetch recommendations");
          }
        } else if (!user) {
          navigate(ROUTES.LOGIN);
          return;
        } else {
          // Instead of redirecting immediately every mount, show prompt with button
          toast({
            title: "Profile not complete",
            description:
              "Please complete your preferences to get personalized recommendations.",
            variant: "warning",
          });
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            "Unable to load recommendations."
        );

        // Fallback to sample data for demo purposes
        setUniversities([
          {
            id: 1,
            name: "Massachusetts Institute of Technology",
            location: "Cambridge, MA",
            matchScore: 95,
            placementRate: 98,
            avgSalary: 120000,
            tags: ["Top for CS", "Research Leader", "Innovation Hub"],
            logo: "🏛️",
            ranking: "#1 in Engineering",
          },
          {
            id: 2,
            name: "Stanford University",
            location: "Stanford, CA",
            matchScore: 92,
            placementRate: 96,
            avgSalary: 115000,
            tags: ["Silicon Valley", "Entrepreneurship", "AI Research"],
            logo: "🌲",
            ranking: "#2 in Computer Science",
          },
          {
            id: 3,
            name: "Carnegie Mellon University",
            location: "Pittsburgh, PA",
            matchScore: 89,
            placementRate: 94,
            avgSalary: 110000,
            tags: ["Tech Industry", "Robotics", "Software Engineering"],
            logo: "🤖",
            ranking: "#3 in Technology",
          },
        ]);
        setCounsellorNote(
          "Based on your profile, I recommend these universities that align with your interests and goals."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, navigate]);

  const handleViewDetails = (university) => {
    setSelectedUniversity(university);
    navigate(ROUTES.UNIVERSITY_DETAILS);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-neutral-50"
    >
      {/* Back Button - Top Left Corner */}
      <div className="fixed left-4 top-4 z-50">
        <BackButton onBack={() => navigate(ROUTES.LANDING)} />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">
              Your University Matches
            </h1>
            {modelMeta && (
              <div className="flex items-center space-x-2 text-xs text-text-secondary">
                <span className="px-2 py-1 rounded-full bg-gray-100 border">
                  {modelMeta.provider === "gemini" ? "AI Active" : "Fallback"}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.SHORTLIST)}
                className="text-text-secondary hover:text-text-primary"
              >
                My Shortlist
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="text-text-secondary hover:text-text-primary"
              >
                Profile & History
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    logout();
                  } catch (e) {}
                  navigate(ROUTES.LANDING);
                }}
                className="border-gray-200"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - AI Counsellor's Note */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-xl text-text-primary flex items-center">
                  <Star className="w-5 h-5 mr-2 text-secondary" />
                  AI Counsellor's Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-red-600">
                      Could not load counselor note. Please try again later.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-text-secondary leading-relaxed">
                      {counsellorNote ||
                        "Based on your preferences, I've found university matches that align with your goals and interests."}
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-text-primary mb-2">
                        💡 Key Insight
                      </h4>
                      <p className="text-sm text-text-secondary">
                        Consider exploring each university's specialized
                        programs and research opportunities that match your
                        specific interests.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-xl text-text-primary">
                  Your Priorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user?.profile?.priorities
                      ? user.profile.priorities.map((priority, index) => (
                          <div
                            key={priority}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="text-text-secondary">
                              {priority}
                            </span>
                          </div>
                        ))
                      : [
                          "Academic Reputation",
                          "Career Services & Job Placement",
                          "Research Opportunities",
                          "Cost & Financial Aid",
                        ].map((priority, index) => (
                          <div
                            key={priority}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="text-text-secondary">
                              {priority}
                            </span>
                          </div>
                        ))}

                    {!user?.profile?.priorities && (
                      <Button
                        onClick={() => navigate(ROUTES.PREFERENCES)}
                        variant="outline"
                        className="w-full mt-2 text-sm"
                      >
                        Update Preferences
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - University Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Debug panel removed (debugInfo no longer used) */}
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-2xl font-bold text-text-primary"
            >
              Your University Matches{" "}
              {universities.length > 0 && `(${universities.length})`}
            </motion.h2>

            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-text-secondary">
                    Loading your university matches...
                  </p>
                </div>
              ) : error ? (
                <Card className="shadow-elegant border-0 bg-red-50">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <p className="text-lg text-red-600 mb-4">{error}</p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-100"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : universities.length === 0 ? (
                <Card className="shadow-elegant border-0 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <p className="text-lg text-text-primary mb-4">
                        No university matches found.
                      </p>
                      <Button
                        onClick={() => navigate("preferences")}
                        variant="primary"
                      >
                        Update Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                universities.filter(Boolean).map((university, index) => (
                  <motion.div
                    key={university.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card className="shadow-elegant border-0 hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-4xl">{university.logo}</div>
                            <div>
                              <h3 className="text-xl font-bold text-text-primary">
                                {university.name}
                              </h3>
                              <div className="flex items-center text-text-secondary mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {university.location}
                              </div>
                              <p className="text-sm text-primary font-medium mt-1">
                                {university.ranking}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-accent">
                              {university.matchScore}%
                            </div>
                            <p className="text-sm text-text-secondary">
                              Match Score
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary">
                                Placement Rate
                              </span>
                              <span className="text-sm font-semibold text-text-primary">
                                {university.placementRate}%
                              </span>
                            </div>
                            <Progress
                              value={university.placementRate}
                              className="h-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-text-secondary">
                                Avg. Salary
                              </span>
                              <span className="text-sm font-semibold text-text-primary">
                                ${(university.avgSalary / 1000).toFixed(0)}k
                              </span>
                            </div>
                            <Progress
                              value={(university.avgSalary / 150000) * 100}
                              className="h-2"
                            />
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(university.tags || []).map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Action Button */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => handleViewDetails(university)}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-xl"
                          >
                            View Details
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
