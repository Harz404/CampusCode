import { PasswordSecurity } from "@/components/shared/PasswordSecurity";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, CreditCard, Save, Check, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input, Textarea, Label } from "../../components/ui/input";
import { Avatar } from "../../components/ui/avatar";
import { useAuth } from "../../hooks/useAuth";
const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
];
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.studentProfile?.bio || "");
    const [college, setCollege] = useState(user?.studentProfile?.college || "");
    const [degree, setDegree] = useState(user?.studentProfile?.degree || "");
    const [github, setGithub] = useState(user?.studentProfile?.github || "");
    const [linkedin, setLinkedin] = useState(user?.studentProfile?.linkedin || "");
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");
    useEffect(() => {
        setName(user?.name || ""); setEmail(user?.email || "");
        setBio(user?.studentProfile?.bio || ""); setCollege(user?.studentProfile?.college || "");
        setDegree(user?.studentProfile?.degree || ""); setGithub(user?.studentProfile?.github || "");
        setLinkedin(user?.studentProfile?.linkedin || "");
    }, [user]);
    const handleSave = async (e) => {
        e.preventDefault();
        setSavedSuccess(false);
        setSaveError("");
        const result = await updateProfile({ name, bio, college, degree, github, linkedin });
        if (!result.success) { setSaveError(result.error || "Could not save your profile"); return; }
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {saveError && <p role="alert" className="text-red-500 mb-4">{saveError}</p>}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      </motion.div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab.id
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}>
                <tab.icon className="h-4 w-4"/>
                {tab.label}
              </button>))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "profile" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Profile Photo</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar name={name || "User"} size="xl"/>
                    <div>
                      <Button variant="outline" size="sm">Upload Photo</Button>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block">Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required/>
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Email Address</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required/>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about your developer experience..."/>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block">College / University</Label>
                        <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Stanford University"/>
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Degree / Major</Label>
                        <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. B.S. Computer Science"/>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block">GitHub Profile</Label>
                        <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/yourhandle"/>
                      </div>
                      <div>
                        <Label className="mb-1.5 block">LinkedIn Profile</Label>
                        <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourhandle"/>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" className="gap-2">
                        {savedSuccess ? <Check className="h-4 w-4 text-emerald-300"/> : <Save className="h-4 w-4"/>}
                        {savedSuccess ? "Saved Successfully!" : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>)}

          {activeTab === "notifications" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                { label: "New proposal received", desc: "When someone submits a proposal on your requirement" },
                { label: "Proposal accepted", desc: "When your proposal is accepted by a client" },
                { label: "New message", desc: "When you receive a new message" },
                { label: "Milestone completed", desc: "When a milestone is marked as complete" },
                { label: "Payment received", desc: "When you receive a payment" },
            ].map((item, i) => (<div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked={i < 4} className="h-4 w-4 rounded accent-[var(--primary)]"/>
                    </div>))}
                </CardContent>
              </Card>
            </motion.div>)}

          {activeTab === "security" && <PasswordSecurity />}

          {activeTab === "billing" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader><CardTitle>Payout Bank Account / UPI</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">UPI ID / VPA</Label>
                    <Input placeholder="yourhandle@upi"/>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Bank Account Number</Label>
                    <Input placeholder="0000 0000 0000"/>
                  </div>
                  <Button>Save Payout Details</Button>
                </CardContent>
              </Card>
            </motion.div>)}
        </div>
      </div>
    </div>);
}
