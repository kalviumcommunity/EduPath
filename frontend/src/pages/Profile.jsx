import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Clock, BookOpen, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";

const Profile = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState('preferences');

  const tabs = [
    { id: 'preferences', label: 'My Preferences' },
    { id: 'history', label: 'Recommendation History' }
  ];

  const recommendationHistory = [
    {
      date: "Dec 15, 2024",
      query: "Computer Science, $50k budget, US",
      matches: 3,
      status: "Active"
    },
    {
      date: "Dec 10, 2024", 
      query: "Engineering, No budget limit, Canada",
      matches: 5,
      status: "Viewed"
    }
  ];

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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-text-primary">Profile & Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
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
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-xl text-text-primary flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Full Name</Label>
                    <Input
                      defaultValue="John Smith"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Email</Label>
                    <Input
                      defaultValue="john.smith@email.com"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-xl text-text-primary flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Academic Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Field of Study</Label>
                    <Input
                      defaultValue="Computer Science"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Degree Level</Label>
                    <Input
                      defaultValue="Bachelor's Degree"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Preferred Location</Label>
                    <Input
                      defaultValue="United States"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-primary font-medium">Budget (USD)</Label>
                    <Input
                      defaultValue="50000"
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl">
                  Save Changes
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle className="text-xl text-text-primary flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Search History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendationHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-primary font-medium">{item.query}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{item.date} • {item.matches} matches found</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                        <Button variant="outline" size="sm">
                          View Results
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile;