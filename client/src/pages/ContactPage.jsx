import React, { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
export function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !message)
            return;
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsSubmitting(false);
        setIsSent(true);
    };
    return (<div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Navbar />
      <div className="flex-1 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="secondary" className="px-3 py-1 text-xs mx-auto">Get in Touch</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Contact the CampusCode Team</h1>
            <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
              Have questions about developer verification, escrow contracts, or technical features? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Card className="border-[var(--border)]">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Email Support</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">support@campuscode.dev</p>
                    <p className="text-xs text-[var(--muted-foreground)]">partnerships@campuscode.dev</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--border)]">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Live Developer Chat</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Available Mon-Fri, 9am - 7pm IST</p>
                    <p className="text-xs text-emerald-500 font-medium">Average reply &lt; 15 mins</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--border)]">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Headquarters</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Bangalore, Karnataka, India</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-lg">Send us a message</CardTitle>
                </CardHeader>
                <CardContent>
                  {isSent ? (<div className="text-center py-12 space-y-3">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto"/>
                      <h3 className="text-xl font-bold">Message Sent!</h3>
                      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">
                        Thank you for reaching out. A CampusCode specialist will get back to you shortly.
                      </p>
                      <Button variant="outline" onClick={() => setIsSent(false)} className="mt-4">
                        Send another message
                      </Button>
                    </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Your Name</label>
                          <Input required placeholder="Alex Rivera" value={name} onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Your Email</label>
                          <Input required type="email" placeholder="alex@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Subject</label>
                        <Input placeholder="General Inquiry or Feedback" value={subject} onChange={(e) => setSubject(e.target.value)}/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Message</label>
                        <textarea required rows={5} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="How can we help you?" value={message} onChange={(e) => setMessage(e.target.value)}/>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto cursor-pointer gap-2">
                        {isSubmitting ? (<>
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            Sending...
                          </>) : (<>
                            <Send className="h-4 w-4"/>
                            Send Message
                          </>)}
                      </Button>
                    </form>)}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>);
}
export default ContactPage;
