import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Users,
  BookOpen,
  DollarSign,
  Trophy,
  Star,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import { universityService } from "@/services/api.service";
import { useAuth } from '@/contexts/useAuth';
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/BackButton";

const UniversityDetails = ({ navigate, selectedUniversity }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [university, setUniversity] = useState(selectedUniversity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToShortlist } = useAuth();

  useEffect(() => {
    if (!selectedUniversity) {
      const stored = localStorage.getItem("selectedUniversity");
      if (stored) {
        try {
          setUniversity(JSON.parse(stored));
        } catch {}
      }
    }
    // Only fetch detailed info if we have a selected university
    const fetchUniversityDetails = async () => {
      if (!selectedUniversity?.id) return;

      setLoading(true);
      try {
        const response = await universityService.getUniversityById(
          selectedUniversity.id
        );
        console.log("RESPONSE:", response);
        if (response.success) {
          // Merge the detailed data with any existing data
          setUniversity({
            ...selectedUniversity,
            ...response.data,
          });
        } else {
          throw new Error("Failed to fetch university details");
        }
      } catch (err) {
        console.error("Error fetching university details:", err);
        setError("Unable to load complete university details.");
        toast({
          title: "Error",
          description:
            "Could not load complete university data. Some information may be missing.",
          variant: "destructive",
        });
        // Keep the existing selected university data
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityDetails();
  }, [selectedUniversity]);

  if (!selectedUniversity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No university selected</p>
          <Button onClick={() => navigate("dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Courses & Fees" },
    { id: "placements", label: "Placements" },
    { id: "campus", label: "Campus Life" },
    { id: "admissions", label: "Admissions" },
  ];

  // Dynamically create facts from university data, with fallbacks
  const quickFacts = [
    {
      icon: Users,
      label: "Total Students",
      value: university.studentCount || "11,500",
    },
    {
      icon: BookOpen,
      label: "Student-Faculty Ratio",
      value: university.studentFacultyRatio || "3:1",
    },
    {
      icon: Trophy,
      label: "Acceptance Rate",
      value: university.acceptanceRate || "7%",
    },
    {
      icon: Star,
      label: "QS World Ranking",
      value: university.ranking || "#1",
    },
  ];

  // Helpers
  const formatLocation = (loc) => {
    if (!loc) return "Location unavailable";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") {
      const { city, state } = loc;
      return [city, state].filter(Boolean).join(", ");
    }
    return String(loc);
  };

  const displayRanking =
    university.ranking ||
    university.benchmarks?.ranking ||
    university.benchmarks?.ranking === 0
      ? university.ranking || university.benchmarks?.ranking
      : null;
  const displayTags = university.tags || university.keyFeatures || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-neutral-50"
    >
      {/* Back Button - Top Left Corner */}
      <div className="fixed left-4 top-4 z-50">
        <BackButton onBack={() => navigate('dashboard')} />
      </div>

      {/* Header Image with Overlay */}
      <div className="relative h-64 lg:h-80 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container-custom h-full flex items-end pb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white"
          >
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate("dashboard")}
                className="text-white hover:bg-white/20 p-2 mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-4xl mr-4">{university.logo}</div>
              {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 inline-block px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm shadow-sm">
              {university.name}
            </h1>
            <div className="flex items-center text-lg opacity-90">
              <MapPin className="w-5 h-5 mr-2" />
              {formatLocation(university.location)}
            </div>
            {university.matchScore && (
              <div className="mt-2 bg-white/20 px-3 py-1 rounded-full inline-flex items-center">
                <span className="text-white font-medium">
                  {university.matchScore}% Match
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">
                    About the University
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray max-w-none">
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {university.description ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: university.description,
                          }}
                        />
                      ) : (
                        <>
                          <p className="text-text-secondary leading-relaxed">
                            {university.name} is a prestigious institution
                            renowned for its academic excellence and innovation.
                            The university has established itself as a leader in{" "}
                            {displayTags?.[0] || "education"}.
                          </p>
                          <p className="text-text-secondary leading-relaxed">
                            With a strong emphasis on research and practical
                            learning, the university prepares students for
                            successful careers. Its faculty includes leading
                            experts in their fields.
                          </p>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">
                    Academic Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {(
                        university.programs ||
                        university.courses?.map((c) => c.name) || [
                          "Computer Science & Engineering",
                          "Electrical Engineering",
                          "Mechanical Engineering",
                          "Business Administration",
                          "Physics & Mathematics",
                          "Biological Sciences",
                        ]
                      ).map((program, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="text-text-secondary">{program}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">
                    Quick Facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickFacts.map((fact, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <fact.icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-text-secondary">
                          {fact.label}
                        </p>
                        <p className="font-semibold text-text-primary">
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-0 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">
                    Tuition & Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Tuition (Annual)
                        </span>
                        <span className="font-semibold text-text-primary">
                          ${university.tuition?.toLocaleString() || "57,590"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Room & Board
                        </span>
                        <span className="font-semibold text-text-primary">
                          $
                          {university.roomAndBoard?.toLocaleString() ||
                            "17,800"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-text-primary">
                          Total Annual Cost
                        </span>
                        <span className="font-bold text-lg text-secondary">
                          $
                          {(
                            (university.tuition || 57590) +
                            (university.roomAndBoard || 17800)
                          ).toLocaleString()}
                        </span>
                      </div>
                      {university.withinBudget !== false && (
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <div className="flex items-center text-green-800">
                            <Trophy className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                              Within budget ✓
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={async () => {
                  try {
                    await addToShortlist(university._id || university.id, university.matchScore);
                    navigate('shortlist');
                  } catch (e) {
                    console.error('Add shortlist failed', e);
                  }
                }} className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl text-lg">
                  Add to My Shortlist
                </Button>
              </motion.div>

              {/* Chat with AI Counselor */}
              <Card className="shadow-elegant border-0 bg-blue-50 mt-6">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Have questions about {university.name}?
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Chat with our AI counselor for personalized guidance and
                      answers about admissions, programs, campus life, and more.
                    </p>
                    <Button
                      onClick={() => navigate("chat")}
                      className="bg-primary hover:bg-primary/90 w-full"
                    >
                      Chat with AI Counselor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "courses" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">
                  Computer Science Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Bachelor of Science in Computer Science",
                      duration: "4 years",
                      fee: "$57,590/year",
                    },
                    {
                      // Removed advanced degree listings for undergraduate focus
                      name: "Bachelor Research Track in CS",
                      duration: "1-2 years",
                      fee: "$57,590/year",
                    },
                    {
                      // Removed PhD listing for undergraduate focus
                      name: "Bachelor Honors Project in CS",
                      duration: "4-6 years",
                      fee: "Funded",
                    },
                  ].map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {course.name}
                        </h4>
                        <p className="text-sm text-text-secondary flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-secondary">
                          {course.fee}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "placements" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">
                  Placement Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-text-secondary">
                          Placement Rate
                        </span>
                        <span className="font-semibold text-text-primary">
                          98%
                        </span>
                      </div>
                      <Progress value={98} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-text-secondary">
                          Average Salary
                        </span>
                        <span className="font-semibold text-text-primary">
                          $120,000
                        </span>
                      </div>
                      <Progress value={80} className="h-3" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-text-primary">
                      Top Recruiters
                    </h4>
                    <div className="space-y-2">
                      {["Google", "Microsoft", "Apple", "Amazon", "Tesla"].map(
                        (company, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="mr-2"
                          >
                            {company}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Other tabs would have similar structure */}
        {(activeTab === "campus" || activeTab === "admissions") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">
                  {activeTab === "campus"
                    ? "Campus Life"
                    : "Admissions Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  {activeTab === "campus"
                    ? "MIT offers a vibrant campus life with numerous student organizations, research opportunities, and a collaborative learning environment."
                    : "MIT has a highly selective admissions process. Applications are reviewed holistically, considering academic achievements, extracurricular activities, and personal qualities."}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UniversityDetails;
