"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Shield, Smartphone, Lock, User } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpTimer, setOtpTimer] = useState(30)

  const [credentials, setCredentials] = useState({
    adminId: "",
    password: "",
    otp: "",
  })
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Reusable function to request OTP (login)
  const requestOtp = async (adminId: string, password: string) => {
    try {
      const response = await fetch(`${base}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId, password }),
      });
      

      const data = await response.json();
      

      if (data.error) {
        throw new Error(data.error);
      }

      return data; // backend might return { success: true, message: "...", ... }
    } catch (err: any) {
      throw new Error(err.message || "Something went wrong while requesting OTP");
    }
  };

  // Handle login -> OTP request
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    

    try {
      await requestOtp(credentials.adminId, credentials.password);

      setStep("otp");

      // Start OTP timer
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/api/admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: credentials.adminId,
          otp: credentials.otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth token
        if (data.token) {
          localStorage.setItem("adminAuth", data.token);
        } else {
          localStorage.setItem("adminAuth", "authenticated");
        }
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtpTimer(30);

    try {
      await requestOtp(credentials.adminId, credentials.password);

      // Restart timer
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-2">Hey Paytm Restaurant Management</p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-4 relative">
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            <CardTitle className="flex items-center justify-center gap-2 relative z-10">
              {step === "credentials" ? (
                <>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  Admin Login
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-orange-600" />
                  </div>
                  OTP Verification
                </>
              )}
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge
                variant={step === "credentials" ? "default" : "secondary"}
                className={`${step === "credentials" ? "bg-orange-500 shadow-md" : "bg-gray-200"} transition-all`}
              >
                1. Credentials
              </Badge>
              <Badge
                variant={step === "otp" ? "default" : "secondary"}
                className={`${step === "otp" ? "bg-orange-500 shadow-md" : "bg-gray-200"} transition-all`}
              >
                2. OTP
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminId">Admin ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="adminId"
                      type="text"
                      placeholder="Enter your Admin ID"
                      value={credentials.adminId}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, adminId: e.target.value }))}
                      className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Continue to OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Smartphone className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-600">OTP sent to registered mobile number ending with ****7890</p>
                  <p className="text-xs text-gray-500">
                    Demo OTP: <span className="font-mono font-bold bg-orange-200 px-2 py-1 rounded">123456</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={credentials.otp}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                    }
                    className="text-center text-lg tracking-widest font-mono border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">{otpTimer > 0 ? `Resend in ${otpTimer}s` : "OTP expired"}</span>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={otpTimer > 0}
                    className="text-orange-500 hover:text-orange-600 disabled:text-gray-400 font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                    disabled={loading || credentials.otp.length !== 6}
                  >
                    {loading ? "Verifying OTP..." : "Login to Dashboard"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent border-orange-200 hover:bg-orange-50 transition-colors"
                    onClick={() => setStep("credentials")}
                  >
                    Back to Credentials
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center text-xs text-gray-500 space-y-1 p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="grid grid-cols-1 gap-1">
                <p>
                  Admin ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">admin001</span>
                </p>
                <p>
                  Password: <span className="font-mono bg-gray-200 px-2 py-1 rounded">admin123</span>
                </p>
                <p>
                  OTP: <span className="font-mono bg-gray-200 px-2 py-1 rounded">123456</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-3 h-3" />
            <span>Secure admin access with two-factor authentication</span>
          </div>
          <div className="flex justify-center gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
