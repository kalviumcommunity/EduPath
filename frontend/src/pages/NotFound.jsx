import { Button } from "@/components/ui/button";

const NotFound = ({ navigate }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-text-secondary mb-6">Oops! Page not found</p>
        <Button 
          onClick={() => navigate('landing')} 
          className="bg-primary hover:bg-primary/90"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
