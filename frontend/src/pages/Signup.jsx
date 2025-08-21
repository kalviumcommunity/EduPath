import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BrainCircuit,
  Building2,
  MessageSquareText,
  ListChecks,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/useAuth";

// Validation schema
const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/,
        "Password must contain at least 1 uppercase letter, 1 number, and 1 special character"
      ),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });





const Signup = ({ navigate }) => {
  const { register } = useAuth();
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = async (values) => {
    try {
      console.log('[Signup] Submit triggered with formData:', values);
      
      const userData = {
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password
      };
      
      console.log('[Signup] Calling register with:', userData);
      const response = await register(userData);
      
      if (response.success) {
        console.log('[Signup] Registration successful, navigating to preferences');
        navigate?.("preferences");
      }
    } catch (error) {
      console.error('[Signup] Error during registration:', error);
    } finally {
      console.log('[Signup] Finalizing submit, loading -> false');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      {/* Global page header with back button */}
      <div className="fixed left-4 top-4 z-50">
        <BackButton onBack={() => navigate?.('landing')} />
      </div>

      {/* Centered container with two columns on md+ */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[0.4fr,0.6fr] rounded-xl overflow-hidden shadow-xl bg-white">
        {/* Left Panel */}
        <div className="hidden md:flex bg-blue-600 text-white p-10 flex-col justify-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold mb-4">Start Your University Journey</h1>
            <p className="text-base mb-8 text-blue-100">
              Create an account to get personalized university recommendations that match your academic profile and preferences.
            </p>
            <ul className="space-y-5 text-lg">
              <li className="flex items-start">
                <BrainCircuit className="h-6 w-6 mr-3 mt-0.5 text-blue-200" />
                <span>AI-powered university matching</span>
              </li>
              <li className="flex items-start">
                <Building2 className="h-6 w-6 mr-3 mt-0.5 text-blue-200" />
                <span>Detailed university profiles</span>
              </li>
              <li className="flex items-start">
                <MessageSquareText className="h-6 w-6 mr-3 mt-0.5 text-blue-200" />
                <span>24/7 AI counselor support</span>
              </li>
              <li className="flex items-start">
                <ListChecks className="h-6 w-6 mr-3 mt-0.5 text-blue-200" />
                <span>Save and compare universities</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel (center form) */}
        <div className="w-full bg-gray-50 flex items-center justify-center p-6 md:p-10">
          <Card className="w-full max-w-xl rounded-xl shadow-md border border-gray-200 bg-white">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
              <CardDescription>It only takes a minute to get started</CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="h-11 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              className="h-11 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            className="h-11 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="h-11 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Must be at least 8 characters with 1 uppercase, 1 number, and 1 special character
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="h-11 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Terms */}
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="text-sm leading-tight">
                          <FormLabel className="font-normal">
                            I agree to the{" "}
                            <a href="#" className="text-blue-600 hover:underline">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-blue-600 hover:underline">
                              Privacy Policy
                            </a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-base font-medium"
                  >
                    Create Account
                  </Button>

                  {/* Login Link */}
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate?.("login")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Log in
                    </button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;