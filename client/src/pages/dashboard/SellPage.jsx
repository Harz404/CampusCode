import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Upload, Code2, FileText, Image as ImageIcon, DollarSign, Eye, Rocket, Loader2, X, AlertCircle, FileArchive, Check, Sparkles, Cloud, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input, Textarea, Label } from "../../components/ui/input";
import { CustomSelect } from "../../components/ui/select";
import { CATEGORIES, TECHNOLOGIES, LICENSES } from "../../lib/constants";
import { useUserData } from "../../lib/user-store";
import { useAuth } from "../../hooks/useAuth";
const steps = [
    { id: 1, label: "Basic Info", icon: FileText },
    { id: 2, label: "Technology", icon: Code2 },
    { id: 3, label: "Media", icon: ImageIcon },
    { id: 4, label: "Files", icon: Upload },
    { id: 5, label: "Pricing", icon: DollarSign },
    { id: 6, label: "Preview", icon: Eye },
    { id: 7, label: "Publish", icon: Rocket },
];
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export default function SellPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addProduct } = useUserData();
    const { isAuthenticated } = useAuth();
    const [step, setStep] = useState(1);
    const [projectId, setProjectId] = useState(null);
    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("web-development");
    const [tags, setTags] = useState("");
    // Step 2: Tech Stack
    const [selectedTech, setSelectedTech] = useState(["React", "TypeScript"]);
    const [database, setDatabase] = useState("");
    const [integrations, setIntegrations] = useState("");
    // Step 3: Media
    const [screenshots, setScreenshots] = useState([]);
    const [demoUrl, setDemoUrl] = useState("");
    const [demoVideo, setDemoVideo] = useState("");
    const [dragActiveImages, setDragActiveImages] = useState(false);
    const imageInputRef = useRef(null);
    // Step 4: Files & Source Code Links
    const [sourceCodePackage, setSourceCodePackage] = useState(null);
    const [githubUrl, setGithubUrl] = useState("");
    const [driveUrl, setDriveUrl] = useState("");
    const [documentation, setDocumentation] = useState("");
    const [requirements, setRequirements] = useState("");
    const [dragActiveFiles, setDragActiveFiles] = useState(false);
    const fileArchiveInputRef = useRef(null);
    // Step 5: Pricing
    const [pricing, setPricing] = useState("paid");
    const [price, setPrice] = useState("499");
    const [selectedLicense, setSelectedLicense] = useState("Commercial");
    // Step 7: Publishing state
    const [isPublishing, setIsPublishing] = useState(false);
    const [isAiOptimizing, setIsAiOptimizing] = useState(false);
    const [aiSuccessMessage, setAiSuccessMessage] = useState(null);
    const [publishedSuccess, setPublishedSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [stepErrors, setStepErrors] = useState({});
    // Initialize from search params if passed (e.g. from /projects/:id)
    useEffect(() => {
        const pId = searchParams.get("projectId");
        const pName = searchParams.get("name");
        const pDesc = searchParams.get("description");
        const pCat = searchParams.get("category");
        const pTech = searchParams.get("tech");
        if (pId) {
            setProjectId(pId);
            try {
                const savedSource = localStorage.getItem(`campuscode_source_${pId}`);
                if (savedSource) {
                    const pkg = JSON.parse(savedSource);
                    if (pkg.name)
                        setSourceCodePackage({ name: pkg.name, size: pkg.size || 24000000 });
                    if (pkg.driveUrl)
                        setDriveUrl(pkg.driveUrl);
                }
            }
            catch { }
            fetch(`/api/projects/${pId}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((proj) => {
                if (proj && !proj.error) {
                    if (proj.name)
                        setName(proj.name);
                    if (proj.description) {
                        setDescription(proj.description);
                        setShortDescription(proj.description.slice(0, 120));
                    }
                    if (proj.category)
                        setCategory(proj.category.toLowerCase().replace(/\s+/g, "-"));
                    if (proj.technologies && proj.technologies.length > 0)
                        setSelectedTech(proj.technologies);
                    if (proj.githubRepo) {
                        const fullGh = proj.githubRepo.startsWith("http")
                            ? proj.githubRepo
                            : `https://github.com/${proj.githubRepo}`;
                        setGithubUrl(fullGh);
                    }
                    setDocumentation(`## Setup & Quick Start Guide\n\n1. Extract codebase or clone from GitHub.\n2. Install dependencies:\n   \`\`\`bash\n   npm install\n   \`\`\`\n3. Configure environment variables in \`.env.local\`.\n4. Start development server:\n   \`\`\`bash\n   npm run dev\n   \`\`\`\n5. Open \`http://localhost:5173\` in your browser.`);
                    setRequirements("Node.js 18.0 or higher\nnpm, yarn, or pnpm\nModern browser (Chrome/Edge/Firefox)");
                }
            })
                .catch(() => { });
        }
        if (pName)
            setName(pName);
        if (pDesc) {
            setDescription(pDesc);
            setShortDescription(pDesc.slice(0, 120));
        }
        if (pCat)
            setCategory(pCat.toLowerCase().replace(/\s+/g, "-"));
        if (pTech) {
            const techArr = pTech.split(",").map((t) => t.trim()).filter(Boolean);
            if (techArr.length > 0)
                setSelectedTech(techArr);
        }
    }, [searchParams]);
    const toggleTech = (tech) => {
        setSelectedTech((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]);
    };
    const handleAiOptimize = async () => {
        if (!name.trim() && !description.trim()) {
            setStepErrors((prev) => ({ ...prev, name: "Enter at least a name or draft description first." }));
            return;
        }
        setIsAiOptimizing(true);
        setAiSuccessMessage(null);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "optimize_listing",
                    title: name.trim(),
                    description: description.trim() || shortDescription.trim(),
                    technologies: selectedTech,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.optimization) {
                    if (data.optimization.title && !name.trim())
                        setName(data.optimization.title);
                    if (data.optimization.description) {
                        setDescription(data.optimization.description);
                        if (!shortDescription.trim()) {
                            setShortDescription(data.optimization.description.slice(0, 110) + "...");
                        }
                    }
                    if (data.optimization.tags && data.optimization.tags.length > 0 && !tags.trim()) {
                        setTags(data.optimization.tags.join(", "));
                    }
                    setAiSuccessMessage("✨ Listing enhanced by CampusCode AI!");
                    setTimeout(() => setAiSuccessMessage(null), 4000);
                }
            }
        }
        catch (err) {
            console.error("AI Optimization failed:", err);
        }
        finally {
            setIsAiOptimizing(false);
        }
    };
    const handleImageFiles = (fileList) => {
        if (!fileList || fileList.length === 0)
            return;
        const incoming = Array.from(fileList);
        const validImageFiles = incoming.filter((f) => f.type.startsWith("image/"));
        if (validImageFiles.length === 0) {
            setStepErrors((prev) => ({ ...prev, media: "Please upload valid image files (PNG, JPG, WebP)." }));
            return;
        }
        setStepErrors((prev) => {
            const next = { ...prev };
            delete next.media;
            return next;
        });
        validImageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (result) {
                    setScreenshots((prev) => {
                        if (prev.length >= 6)
                            return prev;
                        return [...prev, { name: file.name, size: file.size, dataUrl: result }];
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    };
    const removeScreenshot = (idx) => {
        setScreenshots((prev) => prev.filter((_, i) => i !== idx));
    };
    const handleArchiveFile = (fileList) => {
        if (!fileList || fileList.length === 0)
            return;
        const file = fileList[0];
        setSourceCodePackage({ name: file.name, size: file.size });
        setStepErrors((prev) => {
            const next = { ...prev };
            delete next.files;
            return next;
        });
    };
    const validateStep = (currentStep) => {
        const errors = {};
        if (currentStep === 1) {
            if (!name.trim())
                errors.name = "Product name is required.";
            if (name.trim().length < 3)
                errors.name = "Product name must be at least 3 characters.";
            if (!shortDescription.trim())
                errors.shortDescription = "Short description is required.";
            if (!description.trim())
                errors.description = "Detailed description is required.";
            if (description.trim().length < 15)
                errors.description = "Detailed description must be at least 15 characters.";
            if (!category)
                errors.category = "Please select a category.";
        }
        else if (currentStep === 2) {
            if (selectedTech.length === 0)
                errors.tech = "Please select at least one technology or framework.";
        }
        else if (currentStep === 3) {
            if (screenshots.length === 0)
                errors.media = "Please upload at least 1 project screenshot.";
        }
        else if (currentStep === 4) {
            if (!sourceCodePackage && !githubUrl.trim() && !driveUrl.trim()) {
                errors.files = "Please provide a Google Drive link, GitHub repository, or upload a source code archive.";
            }
            if (!documentation.trim()) {
                errors.documentation = "Please provide setup, installation, or usage documentation.";
            }
        }
        else if (currentStep === 5) {
            if (pricing === "paid") {
                const numPrice = Number(price);
                if (isNaN(numPrice) || numPrice <= 0) {
                    errors.price = "Please enter a valid price greater than ₹0.";
                }
            }
            if (!selectedLicense) {
                errors.license = "Please select a license.";
            }
        }
        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNext = () => {
        if (validateStep(step)) {
            setStepErrors({});
            setStep((prev) => prev + 1);
        }
    };
    const handlePublish = async () => {
        for (let i = 1; i <= 5; i++) {
            if (!validateStep(i)) {
                setStep(i);
                return;
            }
        }
        setIsPublishing(true);
        setErrorMessage(null);
        try {
            const productPayload = {
                name: name.trim(),
                shortDescription: shortDescription.trim() || description.slice(0, 120),
                description: description.trim(),
                category: category || "web-development",
                technologies: selectedTech.length > 0 ? selectedTech : ["React", "TypeScript"],
                tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : selectedTech,
                price: pricing === "free" ? 0 : Number(price) || 499,
                isFree: pricing === "free",
                license: selectedLicense,
                screenshots: screenshots.map((s) => s.dataUrl),
                demoUrl: demoUrl.trim() || undefined,
                githubUrl: githubUrl.trim() || undefined,
                driveUrl: driveUrl.trim() || undefined,
                documentation: documentation.trim() || undefined,
                requirements: requirements ? requirements.split("\n").map((r) => r.trim()).filter(Boolean) : [],
                projectId: projectId || undefined,
            };
            const res = await addProduct(productPayload);
            if (res) {
                setPublishedSuccess(true);
                setTimeout(() => {
                    navigate("/marketplace");
                }, 1500);
            }
            else {
                setErrorMessage("Failed to publish product. Please check your connection and try again.");
            }
        }
        catch (error) {
            console.error("[SellPage] Failed to publish product:", error);
            setErrorMessage("An unexpected error occurred while publishing. Please try again.");
        }
        finally {
            setIsPublishing(false);
        }
    };
    const categoryOptions = CATEGORIES.map((cat) => ({
        value: cat.slug,
        label: cat.name,
    }));
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Publish to Marketplace</h1>
        <p className="text-[var(--muted-foreground)] mb-8">List your software for sale on CampusCode</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {steps.map((s, i) => (<div key={s.id} className="flex items-center gap-1">
            <button onClick={() => {
                if (s.id < step) {
                    setStep(s.id);
                    setStepErrors({});
                }
                else if (s.id === step) {
                    // current
                }
                else {
                    if (validateStep(step)) {
                        setStep(s.id);
                    }
                }
            }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${step === s.id
                ? "bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]/30"
                : step > s.id
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] opacity-70"}`}>
              {step > s.id ? <CheckCircle2 className="h-3.5 w-3.5"/> : <s.icon className="h-3.5 w-3.5"/>}
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (<div className={`w-4 h-0.5 shrink-0 ${step > s.id ? "bg-emerald-400" : "bg-[var(--border)]"}`}/>)}
          </div>))}
      </div>

      {/* Error Alert Banner */}
      <AnimatePresence>
        {Object.keys(stepErrors).length > 0 && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5"/>
            <div className="space-y-1">
              <p className="font-semibold">Please complete the required fields to continue:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5 opacity-90">
                {Object.values(stepErrors).map((err, i) => (<li key={i}>{err}</li>))}
              </ul>
            </div>
          </motion.div>)}
      </AnimatePresence>

      {/* Step 1: Basic Info */}
      {step === 1 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Basic Information</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAiOptimize} disabled={isAiOptimizing} className="gap-1.5 text-xs text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 cursor-pointer">
                {isAiOptimizing ? (<Loader2 className="h-3.5 w-3.5 animate-spin"/>) : (<Sparkles className="h-3.5 w-3.5 text-[var(--primary)]"/>)}
                <span>{isAiOptimizing ? "Enhancing..." : "AI Auto-Enhance"}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiSuccessMessage && (<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0"/>
                  <span>{aiSuccessMessage}</span>
                </div>)}

              <div>
                <Label className="mb-1.5 block">
                  Product Name <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input placeholder="e.g. AI Resume Analyzer & Scoring Platform" value={name} onChange={(e) => {
                setName(e.target.value);
                if (stepErrors.name)
                    setStepErrors((prev) => ({ ...prev, name: "" }));
            }} className={stepErrors.name ? "border-red-500 ring-1 ring-red-500" : ""}/>
                {stepErrors.name && <p className="text-xs text-red-500 mt-1">{stepErrors.name}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">
                  Category <span className="text-red-500 font-bold">*</span>
                </Label>
                <CustomSelect options={categoryOptions} value={category} onChange={(e) => {
                const val = e?.target ? e.target.value : e;
                setCategory(val);
                if (stepErrors.category)
                    setStepErrors((prev) => ({ ...prev, category: "" }));
            }} placeholder="Select a category"/>
                {stepErrors.category && <p className="text-xs text-red-500 mt-1">{stepErrors.category}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">
                  Short Description / Tagline <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input placeholder="e.g. Automated resume screening with LLM scoring & candidate rank" value={shortDescription} onChange={(e) => {
                setShortDescription(e.target.value);
                if (stepErrors.shortDescription)
                    setStepErrors((prev) => ({ ...prev, shortDescription: "" }));
            }} className={stepErrors.shortDescription ? "border-red-500 ring-1 ring-red-500" : ""}/>
                {stepErrors.shortDescription && <p className="text-xs text-red-500 mt-1">{stepErrors.shortDescription}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">
                  Detailed Description <span className="text-red-500 font-bold">*</span>
                </Label>
                <Textarea placeholder="Describe your product in detail: key features, architecture, use cases, target audience..." rows={6} value={description} onChange={(e) => {
                setDescription(e.target.value);
                if (stepErrors.description)
                    setStepErrors((prev) => ({ ...prev, description: "" }));
            }} className={stepErrors.description ? "border-red-500 ring-1 ring-red-500" : ""}/>
                {stepErrors.description && <p className="text-xs text-red-500 mt-1">{stepErrors.description}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">Tags (comma separated)</Label>
                <Input placeholder="AI, Resume, React, NLP, HR Tech" value={tags} onChange={(e) => setTags(e.target.value)}/>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleNext}>
                  Next <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 2: Technology */}
      {step === 2 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader><CardTitle>Technology Stack</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">
                  Languages & Frameworks <span className="text-red-500 font-bold">*</span> (Select at least 1)
                </Label>
                <div className={`flex flex-wrap gap-2 p-3 rounded-lg border max-h-52 overflow-y-auto ${stepErrors.tech ? "border-red-500 ring-1 ring-red-500" : "border-[var(--border)]"}`}>
                  {TECHNOLOGIES.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (<button type="button" key={tech} onClick={() => {
                        toggleTech(tech);
                        if (stepErrors.tech)
                            setStepErrors((prev) => ({ ...prev, tech: "" }));
                    }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${isSelected
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 hover:text-[var(--foreground)]"}`}>
                        {isSelected && <Check className="h-3 w-3"/>}
                        {tech}
                      </button>);
            })}
                </div>
                {stepErrors.tech && <p className="text-xs text-red-500 mt-1">{stepErrors.tech}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">Database (optional)</Label>
                <Input placeholder="PostgreSQL, MongoDB, Supabase..." value={database} onChange={(e) => setDatabase(e.target.value)}/>
              </div>

              <div>
                <Label className="mb-1.5 block">APIs & Integrations (optional)</Label>
                <Input placeholder="OpenAI, Stripe, Google Cloud, AWS..." value={integrations} onChange={(e) => setIntegrations(e.target.value)}/>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4"/> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 3: Media */}
      {step === 3 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader><CardTitle>Screenshots & Media</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="mb-2 block">
                  Screenshots <span className="text-red-500 font-bold">*</span> (Upload at least 1 image)
                </Label>
                
                <div onDragOver={(e) => { e.preventDefault(); setDragActiveImages(true); }} onDragLeave={(e) => { e.preventDefault(); setDragActiveImages(false); }} onDrop={(e) => {
                e.preventDefault();
                setDragActiveImages(false);
                handleImageFiles(e.dataTransfer.files);
            }} onClick={() => imageInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActiveImages
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : stepErrors.media
                    ? "border-red-500 bg-red-50/20"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30"}`}>
                  <ImageIcon className="h-10 w-10 mx-auto text-[var(--muted-foreground)] mb-3 opacity-60"/>
                  <p className="text-sm font-semibold mb-1">Screenshots & Media</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Drag and drop your project screenshots, dashboard previews, or UI mockups here
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                    Supports PNG, JPG, WebP • Max 6 screenshots
                  </p>
                  <Button type="button" variant="outline" size="sm" className="mt-3 pointer-events-none">
                    <Upload className="h-3.5 w-3.5 mr-1.5"/> Choose Image Files
                  </Button>
                  <input ref={imageInputRef} type="file" accept="image/png, image/jpeg, image/webp, image/gif" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)}/>
                </div>
                {stepErrors.media && <p className="text-xs text-red-500 mt-1">{stepErrors.media}</p>}

                {screenshots.length > 0 && (<div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Uploaded Screenshots ({screenshots.length}/6)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {screenshots.map((s, idx) => (<div key={idx} className="group relative rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] shadow-sm">
                          <img src={s.dataUrl} alt={`Screenshot ${idx + 1}`} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"/>
                          {idx === 0 && (<div className="absolute top-1.5 left-1.5 bg-[var(--primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              Cover
                            </div>)}
                          <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        removeScreenshot(idx);
                    }} className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full opacity-90 transition-colors cursor-pointer" title="Remove screenshot">
                            <X className="h-3.5 w-3.5"/>
                          </button>
                          <div className="p-1.5 text-[10px] text-[var(--muted-foreground)] truncate bg-[var(--card)]/90 border-t border-[var(--border)]">
                            {s.name} ({formatBytes(s.size)})
                          </div>
                        </div>))}
                    </div>
                  </div>)}
              </div>

              <div>
                <Label className="mb-1.5 block">Live Demo URL (optional)</Label>
                <Input placeholder="https://demo.yourproject.com" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)}/>
              </div>

              <div>
                <Label className="mb-1.5 block">Demo Video URL (optional)</Label>
                <Input placeholder="https://youtube.com/watch?v=... or Loom URL" value={demoVideo} onChange={(e) => setDemoVideo(e.target.value)}/>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4"/> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 4: Files */}
      {step === 4 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Files & Source Code Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-blue-500"/>
                  Instant Download & Access Guarantee
                </p>
                <p className="opacity-90">
                  When a client purchases your software, they will immediately receive a direct download link and repository access. Please provide your Google Drive folder link, GitHub repository, or upload the source archive below.
                </p>
              </div>

              {/* Google Drive Link */}
              <div className="space-y-1.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold flex items-center gap-1.5 text-sm">
                    <Cloud className="h-4 w-4 text-[var(--primary)]"/>
                    Google Drive Folder / Download Link
                  </Label>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Recommended for instant zip downloads</span>
                </div>
                <Input placeholder="https://drive.google.com/drive/folders/... or direct link" value={driveUrl} onChange={(e) => {
                setDriveUrl(e.target.value);
                if (stepErrors.files)
                    setStepErrors((prev) => ({ ...prev, files: "" }));
            }} className={stepErrors.files && !githubUrl && !sourceCodePackage ? "border-red-500 ring-1 ring-red-500" : ""}/>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Tip: Ensure sharing settings are set to &quot;Anyone with the link can view/download&quot;.
                </p>
              </div>

              {/* GitHub Repository */}
              <div className="space-y-1.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <Label className="font-semibold flex items-center gap-1.5 text-sm">
                  <Code2 className="h-4 w-4 text-[var(--primary)]"/>
                  GitHub Repository URL
                </Label>
                <Input placeholder="https://github.com/your-username/your-repository" value={githubUrl} onChange={(e) => {
                setGithubUrl(e.target.value);
                if (stepErrors.files)
                    setStepErrors((prev) => ({ ...prev, files: "" }));
            }}/>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Public repo link or repository invitation target for automated access grant.
                </p>
              </div>

              {/* Archive Upload */}
              <div>
                <Label className="mb-2 block font-semibold text-sm">
                  Or Upload Source Code Archive (.zip / .tar.gz)
                </Label>
                
                <div onDragOver={(e) => { e.preventDefault(); setDragActiveFiles(true); }} onDragLeave={(e) => { e.preventDefault(); setDragActiveFiles(false); }} onDrop={(e) => {
                e.preventDefault();
                setDragActiveFiles(false);
                handleArchiveFile(e.dataTransfer.files);
            }} onClick={() => fileArchiveInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragActiveFiles
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30"}`}>
                  <FileArchive className="h-7 w-7 mx-auto text-[var(--muted-foreground)]/60 mb-1.5"/>
                  <p className="text-xs font-semibold mb-0.5">Attach Local .zip / .tar.gz Bundle</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">Click to browse or drop source package here</p>
                  <input ref={fileArchiveInputRef} type="file" accept=".zip, .tar, .gz, .rar, .7z" className="hidden" onChange={(e) => handleArchiveFile(e.target.files)}/>
                </div>

                {sourceCodePackage && (<div className="mt-2 flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4 text-amber-500"/>
                      <span className="text-xs font-medium">{sourceCodePackage.name}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">({formatBytes(sourceCodePackage.size)})</span>
                    </div>
                    <button type="button" onClick={() => setSourceCodePackage(null)} className="p-1 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <X className="h-3.5 w-3.5 text-[var(--muted-foreground)]"/>
                    </button>
                  </div>)}
                {stepErrors.files && <p className="text-xs text-red-500 mt-1.5">{stepErrors.files}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold text-sm">
                  Documentation & Setup Guide <span className="text-red-500 font-bold">*</span>
                </Label>
                <Textarea placeholder="Installation steps, environment variables, dependencies, running locally..." rows={5} value={documentation} onChange={(e) => {
                setDocumentation(e.target.value);
                if (stepErrors.documentation)
                    setStepErrors((prev) => ({ ...prev, documentation: "" }));
            }} className={stepErrors.documentation ? "border-red-500 ring-1 ring-red-500" : ""}/>
                {stepErrors.documentation && <p className="text-xs text-red-500 mt-1">{stepErrors.documentation}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block">System Requirements (optional)</Label>
                <Textarea placeholder="e.g. Node.js 18+, MongoDB, 4GB RAM minimum (one per line)" rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)}/>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-4 w-4"/> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 5: Pricing */}
      {step === 5 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader><CardTitle>Pricing & License</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">
                  Pricing Model <span className="text-red-500 font-bold">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPricing("free")} className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${pricing === "free"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20"
                : "border-[var(--border)] hover:border-[var(--primary)]/40"}`}>
                    <p className="font-semibold text-base">Free / Open</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Open-source, free download for community</p>
                  </button>
                  <button type="button" onClick={() => setPricing("paid")} className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${pricing === "paid"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20"
                : "border-[var(--border)] hover:border-[var(--primary)]/40"}`}>
                    <p className="font-semibold text-base">Paid / Commercial</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Sell access with one-time purchase</p>
                  </button>
                </div>
              </div>

              {pricing === "paid" && (<div>
                  <Label className="mb-1.5 block">
                    Price in INR (₹) <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[var(--muted-foreground)]">₹</span>
                    <Input type="number" placeholder="499" value={price} onChange={(e) => {
                    setPrice(e.target.value);
                    if (stepErrors.price)
                        setStepErrors((prev) => ({ ...prev, price: "" }));
                }} className={`pl-8 ${stepErrors.price ? "border-red-500 ring-1 ring-red-500" : ""}`}/>
                  </div>
                  {stepErrors.price && <p className="text-xs text-red-500 mt-1">{stepErrors.price}</p>}
                  <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                    Platform fee: 10%. You receive <span className="text-[var(--primary)] font-semibold">90%</span> of each sale.
                  </p>
                </div>)}

              <div>
                <Label className="mb-3 block">
                  License <span className="text-red-500 font-bold">*</span>
                </Label>
                <div className="space-y-2">
                  {LICENSES.map((lic) => (<button type="button" key={lic.id} onClick={() => setSelectedLicense(lic.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left ${selectedLicense === lic.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/40"
                    : "border-[var(--border)] hover:bg-[var(--muted)]/50"}`}>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedLicense === lic.id ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]"}`}>
                        {selectedLicense === lic.id && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{lic.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{lic.description}</p>
                      </div>
                    </button>))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="h-4 w-4"/> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 6: Preview */}
      {step === 6 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader><CardTitle>Preview Your Listing</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {screenshots.length > 0 ? (<div className="space-y-2">
                  <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-[var(--border)] bg-black/20">
                    <img src={screenshots[0].dataUrl} alt="Primary Screenshot" className="w-full h-full object-cover"/>
                  </div>
                  {screenshots.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-1">
                      {screenshots.map((s, idx) => (<div key={idx} className="h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-[var(--border)]">
                          <img src={s.dataUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover"/>
                        </div>))}
                    </div>)}
                </div>) : (<div className="h-48 rounded-xl bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/50 flex items-center justify-center">
                  <Code2 className="h-12 w-12 text-[var(--muted-foreground)]/30"/>
                </div>)}

              <div>
                <h2 className="text-2xl font-bold mb-1">{name || "Your Product Name"}</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  {shortDescription || "Short product description."}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {category.replace("-", " ")}
                  </Badge>
                  {selectedTech.map((t) => (<Badge key={t} variant="outline">{t}</Badge>))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Description
                </p>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs space-y-1.5">
                <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Cloud className="h-4 w-4"/> Instant Delivery on Purchase
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {driveUrl && (<Badge variant="secondary" className="gap-1">
                      <Cloud className="h-3 w-3 text-blue-500"/> Google Drive Link Attached
                    </Badge>)}
                  {githubUrl && (<Badge variant="secondary" className="gap-1">
                      <Code2 className="h-3 w-3 text-[var(--primary)]"/> GitHub Repo Link Attached
                    </Badge>)}
                  {sourceCodePackage && (<Badge variant="secondary" className="gap-1">
                      <FileArchive className="h-3 w-3 text-amber-500"/> Zip Archive ({formatBytes(sourceCodePackage.size)})
                    </Badge>)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block">Price</span>
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    {pricing === "free" ? "Free" : `₹${price || "499"}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--muted-foreground)] block">License</span>
                  <Badge variant="outline">{selectedLicense}</Badge>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(5)}>
                  <ArrowLeft className="h-4 w-4"/> Back
                </Button>
                <Button onClick={() => setStep(7)}>
                  Looks Good <ArrowRight className="h-4 w-4"/>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* Step 7: Publish */}
      {step === 7 && (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="text-center">
            <CardContent className="p-8 sm:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-6">
                {publishedSuccess ? (<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>) : (<Rocket className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>)}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {publishedSuccess ? "Product Published Successfully! 🎉" : "Ready to publish?"}
              </h2>
              <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
                {publishedSuccess
                ? "Your product is now live on the marketplace. Redirecting you..."
                : "Your software will be published to the marketplace and available for students & clients to discover."}
              </p>

              {errorMessage && (<div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm max-w-md mx-auto">
                  {errorMessage}
                </div>)}

              {!publishedSuccess && (<div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={() => setStep(6)} disabled={isPublishing}>
                    <ArrowLeft className="h-4 w-4"/> Back to Preview
                  </Button>
                  <Button size="lg" onClick={handlePublish} disabled={isPublishing} className="gap-2">
                    {isPublishing ? (<>
                        <Loader2 className="h-4 w-4 animate-spin"/> Publishing...
                      </>) : (<>
                        <Rocket className="h-4 w-4"/> Publish Product
                      </>)}
                  </Button>
                </div>)}
            </CardContent>
          </Card>
        </motion.div>)}
    </div>);
}
