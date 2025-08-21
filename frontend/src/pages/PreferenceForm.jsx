import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { recommendService } from "@/services/api.service";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft } from "lucide-react";
import BackButton from "@/components/BackButton";

const PreferenceForm = ({ navigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { updateProfile, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    field: "",
    degree: "",
    location: "",
    budget: "",
    // Step 2
    priorities: [],
    gpa: "",
    testScores: "",
    activities: "",
  });

  const totalSteps = 2;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      const profilePayload = {
        field: formData.field,
        degree: formData.degree,
        location: formData.location,
        budget: formData.budget ? Number(formData.budget) : null,
        priorities: formData.priorities,
        academics: {
          gpa: formData.gpa ? Number(formData.gpa) : null,
          testScores: formData.testScores || null,
          activities: formData.activities || null,
        },
      };
      try {
        setSaving(true);
        // Update via auth context so user state refreshes
        const resp = await updateProfile(profilePayload);
        if (!resp.success) throw new Error("Profile save failed");
        await refreshUser();
        toast({
          title: "Preferences saved",
          description: "Generating your recommendations...",
        });
        // Eagerly pre-fetch recommendations to warm cache
        try {
          await recommendService.getRecommendations({
            // Send flat; backend normalizes
            ...profilePayload,
          });
        } catch (e) {
          // Non-blocking
        }
        navigate("dashboard");
      } catch (e) {
        console.error("Failed to save profile:", e);
        toast({
          title: "Save failed",
          description: e.message,
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePriorityChange = (priority, checked) => {
    setFormData((prev) => ({
      ...prev,
      priorities: checked
        ? [...prev.priorities, priority]
        : prev.priorities.filter((p) => p !== priority),
    }));
  };

  const priorities = [
    "Academic Reputation",
    "Location & Campus Life",
    "Career Services & Job Placement",
    "Cost & Financial Aid",
    "Research Opportunities",
    "Diversity & Inclusion",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-neutral-50 py-8 px-4"
    >
      {/* Back Button - Top Left Corner */}
      <div className="fixed left-4 top-4 z-50">
        <BackButton onBack={() => navigate("dashboard")} />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Let's Find Your Perfect University
          </h1>
          <p className="text-text-secondary">
            Step {currentStep} of {totalSteps}: Tell us about your preferences
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <Progress value={progress} className="h-3 bg-gray-200" />
        </motion.div>

        {/* Form Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">
                {currentStep === 1
                  ? "Academic Preferences"
                  : "Additional Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">
                      Field of Study
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("field", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select your field of interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer-science">
                          Computer Science
                        </SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="medicine">Medicine</SelectItem>
                        <SelectItem value="arts">Arts & Humanities</SelectItem>
                        <SelectItem value="sciences">
                          Natural Sciences
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">
                      Degree Level
                    </Label>
                    <div className="h-12 rounded-xl border border-gray-200 flex items-center px-4 text-sm bg-gray-50">
                      Bachelor's Degree (default)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">
                      Preferred Location
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("location", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select preferred location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="usa">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                        <SelectItem value="germany">Germany</SelectItem>
                        <SelectItem value="anywhere">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="budget"
                      className="text-text-primary font-medium"
                    >
                      Annual Budget (INR)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        handleInputChange("budget", e.target.value)
                      }
                      className="h-12 rounded-xl border-gray-200"
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-text-primary font-medium text-lg">
                      What matters most to you?
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {priorities.map((priority) => (
                        <div
                          key={priority}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={priority}
                            checked={formData.priorities.includes(priority)}
                            onCheckedChange={(checked) =>
                              handlePriorityChange(priority, checked)
                            }
                          />
                          <Label
                            htmlFor={priority}
                            className="text-text-primary cursor-pointer"
                          >
                            {priority}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gpa"
                      className="text-text-primary font-medium"
                    >
                      Current GPA
                    </Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={formData.gpa}
                      onChange={(e) => handleInputChange("gpa", e.target.value)}
                      className="h-12 rounded-xl border-gray-200"
                      placeholder="e.g., 3.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="testScores"
                      className="text-text-primary font-medium"
                    >
                      Test Scores (SAT/ACT/GRE)
                    </Label>
                    <Input
                      id="testScores"
                      value={formData.testScores}
                      onChange={(e) =>
                        handleInputChange("testScores", e.target.value)
                      }
                      className="h-12 rounded-xl border-gray-200"
                      placeholder="e.g., SAT: 1450, GRE: 320"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="h-12 px-8 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={currentStep === 1 ? "ml-auto" : ""}
                >
                  <Button
                    onClick={handleNext}
                    disabled={saving}
                    className={`h-12 px-8 rounded-xl text-white font-semibold ${
                      currentStep === totalSteps
                        ? "bg-secondary hover:bg-secondary/90"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {saving
                      ? "Saving..."
                      : currentStep === totalSteps
                      ? "Generate Recommendations"
                      : "Next Step"}
                    {!saving && currentStep !== totalSteps && (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PreferenceForm;
