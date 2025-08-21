import React, { useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Shortlist = ({ navigate, setSelectedUniversity }) => {
  const { shortlist, fetchShortlist, removeFromShortlist } = useAuth();

  useEffect(() => {
    fetchShortlist();
  }, []); // eslint-disable-line

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Shortlist</h1>
        <Button variant="outline" onClick={() => navigate("dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {(!shortlist || shortlist.length === 0) && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary mb-4">
              You haven't added any universities yet.
            </p>
            <Button onClick={() => navigate("dashboard")}>
              Browse Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {shortlist &&
          shortlist.map((item) => (
            <Card
              key={item._id}
              className="shadow-sm hover:shadow-md transition"
            >
              <CardHeader>
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <div className="text-sm text-text-secondary">
                  {item.location}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.matchScore != null && (
                  <div className="text-sm">
                    Match Score:{" "}
                    <span className="font-semibold">
                      {Math.round(item.matchScore)}%
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setSelectedUniversity(item)}>
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeFromShortlist(item._id)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default Shortlist;
