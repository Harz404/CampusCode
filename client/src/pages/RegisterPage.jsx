import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, GraduationCap, Building2, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TECHNOLOGIES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
export function RegisterPage() {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState("student");
    const [showPassword, setShowPassword] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState(["React", "TypeScript", "Node.js", "MongoDB"]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [college, setCollege] = useState("");
    const [degree, setDegree] = useState("");
    const [gradYear, setGradYear] = useState("2026");
    const [organization, setOrganization] = useState("");
    const [website, setWebsite] = useState("");
    const [bio, setBio] = useState("");
    const toggleSkill = (skill) => {
        setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password)
            return;
        setError("");
        setIsSubmitting(true);
        const result = await register({
            name,
            email,
            password,
            role: role || "student",
            college: college || (role === "student" ? "Engineering University" : undefined),
            degree: degree || (role === "student" ? "B.S. Computer Science" : undefined),
            graduationYear: parseInt(gradYear) || 2026,
            skills: selectedSkills,
            bio: bio || (role === "student" ? "Full-stack developer building modern web applications." : ""),
            organization: organization || (role === "client" ? name : undefined),
            website: website || undefined,
        });
        setIsSubmitting(false);
        if (result.success) {
            navigate("/dashboard");
        }
        else {
            setError(result.error || "Registration failed. Please try again.");
        }
    };
    return (<div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md py-8">
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Code2 className="h-5 w-5"/>
            </div>
            <span className="text-xl font-bold">
              Campus<span className="text-[var(--primary)]">Code</span>
            </span>
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (<div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${step >= s
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4"/> : s}
                </div>
                {s < 3 && (<div className={`w-12 h-0.5 ${step > s ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}/>)}
              </div>))}
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-[var(--muted-foreground)] mb-8 text-sm">Choose how you want to use CampusCode</p>

              <div className="space-y-3 mb-8">
                <button type="button" onClick={() => setRole("student")} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${role === "student"
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-[var(--border)] hover:border-[var(--primary)]/30"}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400"/>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Student Developer</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Build, manage, sell software & solve real client requests
                    </p>
                  </div>
                </button>

                <button type="button" onClick={() => setRole("client")} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${role === "client"
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-[var(--border)] hover:border-[var(--primary)]/30"}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Client / Organization</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Buy software & post project requirements for developers
                    </p>
                  </div>
                </button>
              </div>

              <Button type="button" onClick={() => role && setStep(2)} disabled={!role} className="w-full mb-4 cursor-pointer" size="lg">
                Continue to Account Details
                <ArrowRight className="h-4 w-4 ml-2"/>
              </Button>
            </motion.div>)}

          {/* Step 2: Account Credentials */}
          {step === 2 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-2xl font-bold mb-2">Account details</h1>
              <p className="text-[var(--muted-foreground)] mb-6 text-sm">
                {role === "student" ? "Tell us who you are" : "Set up your client organization credentials"}
              </p>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                if (name && email && password)
                    setStep(3);
            }}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                    {role === "student" ? "Full Name" : "Organization Name"}
                  </label>
                  <Input required placeholder={role === "student" ? "Alex Chen" : "Apex Ventures"} value={name} onChange={(e) => setName(e.target.value)}/>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                    Email Address
                  </label>
                  <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                    Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] cursor-pointer">
                      {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-2"/> Back
                  </Button>
                  <Button type="submit" className="w-full cursor-pointer">
                    Next Step <ArrowRight className="h-4 w-4 ml-2"/>
                  </Button>
                </div>
              </form>
            </motion.div>)}

          {/* Step 3: Profile Details */}
          {step === 3 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-2xl font-bold mb-2">
                {role === "student" ? "Student Developer Profile" : "Client Organization Profile"}
              </h1>
              <p className="text-[var(--muted-foreground)] mb-6 text-sm">
                Finish setting up your profile details
              </p>

              {error && (<div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0"/>
                  {error}
                </div>)}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {role === "student" ? (<>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                          College / University
                        </label>
                        <Input placeholder="Stanford University" value={college} onChange={(e) => setCollege(e.target.value)}/>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                          Degree / Major
                        </label>
                        <Input placeholder="Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)}/>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                        Select Your Skills
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-[var(--border)] max-h-36 overflow-y-auto">
                        {TECHNOLOGIES.slice(0, 16).map((tech) => (<button key={tech} type="button" onClick={() => toggleSkill(tech)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${selectedSkills.includes(tech)
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"}`}>
                            {tech}
                          </button>))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                        Short Bio
                      </label>
                      <Input placeholder="Full-stack engineer passionate about scalable apps..." value={bio} onChange={(e) => setBio(e.target.value)}/>
                    </div>
                  </>) : (<>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                        Organization Website
                      </label>
                      <Input placeholder="https://yourcompany.com" value={website} onChange={(e) => setWebsite(e.target.value)}/>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                        Organization Description
                      </label>
                      <Input placeholder="Early-stage startup building developer productivity tools..." value={bio} onChange={(e) => setBio(e.target.value)}/>
                    </div>
                  </>)}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full cursor-pointer">
                    <ArrowLeft className="h-4 w-4 mr-2"/> Back
                  </Button>
                  <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting || isLoading}>
                    {isSubmitting ? (<>
                        <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                        Creating Account...
                      </>) : ("Complete Registration")}
                  </Button>
                </div>
              </form>
            </motion.div>)}

          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>);
}
export default RegisterPage;
