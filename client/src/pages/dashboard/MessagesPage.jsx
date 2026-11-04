import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, ArrowLeft, MessageSquare, Loader2, Paperclip, MoreVertical, Edit2, Trash2, X, Check, CheckCheck, FileText, Download, ShieldCheck, } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { useSearchParams, useNavigate } from "react-router-dom";
function formatRelative(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)
        return "Just now";
    if (diffMin < 60)
        return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)
        return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7)
        return `${diffDay}d ago`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 5)
        return `${diffWeek}w ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function formatDateSeparator(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
        return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString())
        return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function getOtherParticipant(participants, myId) {
    return participants.find((p) => p.user.id !== myId)?.user || participants[0]?.user || null;
}
function getDisplayName(user) {
    if (!user)
        return "User";
    if (user.role?.toUpperCase() === "CLIENT" && user.clientProfile?.organization) {
        return user.clientProfile.organization;
    }
    return user.name;
}
export default function MessagesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedConvId = searchParams.get("conv");
    const [conversations, setConversations] = useState([]);
    const [selectedConvId, setSelectedConvId] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const fetchConversations = useCallback(async () => {
        if (!user?.id)
            return;
        try {
            const res = await fetch("/api/messages");
            if (!res.ok)
                return;
            const data = await res.json();
            setConversations(data.conversations || []);
        }
        catch (err) {
            console.error("Failed to fetch conversations:", err);
        }
        finally {
            setLoadingConversations(false);
        }
    }, [user?.id]);
    useEffect(() => {
        if (user?.id)
            fetchConversations();
    }, [user?.id, fetchConversations]);
    useEffect(() => {
        if (!user?.id)
            return;
        const interval = setInterval(fetchConversations, 15000);
        return () => clearInterval(interval);
    }, [user?.id, fetchConversations]);
    const fetchMessages = useCallback(async (convId) => {
        if (!convId)
            return;
        try {
            const res = await fetch(`/api/messages?conversationId=${convId}`);
            if (!res.ok)
                return;
            const data = await res.json();
            setMessages(data.messages || []);
        }
        catch (err) {
            console.error("Failed to fetch messages:", err);
        }
    }, []);
    const selectConversation = useCallback(async (convId) => {
        setSelectedConvId(convId);
        setShowMobileChat(true);
        setLoadingMessages(true);
        setMessages([]);
        setEditingMessage(null);
        setPendingAttachment(null);
        await fetchMessages(convId);
        setLoadingMessages(false);
        try {
            await fetch("/api/messages/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: convId }),
            });
            setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)));
        }
        catch { }
    }, [fetchMessages]);
    useEffect(() => {
        if (preselectedConvId) {
            selectConversation(preselectedConvId);
            fetchConversations();
        }
    }, [preselectedConvId, selectConversation, fetchConversations]);
    useEffect(() => {
        if (!selectedConvId)
            return;
        const interval = setInterval(() => fetchMessages(selectedConvId), 5000);
        return () => clearInterval(interval);
    }, [selectedConvId, fetchMessages]);
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuMessageId(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const isImg = file.type.startsWith("image/");
        const reader = new FileReader();
        reader.onload = () => {
            setPendingAttachment({
                file,
                previewUrl: reader.result,
                type: isImg ? "IMAGE" : "FILE",
                name: file.name,
                size: (file.size / 1024).toFixed(1) + " KB",
            });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };
    const handleSend = async () => {
        const text = newMessage.trim();
        if ((!text && !pendingAttachment) || !selectedConvId || !user?.id || sending)
            return;
        if (editingMessage) {
            setSending(true);
            try {
                const res = await fetch(`/api/messages/${editingMessage.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: text }),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? updated : m)));
                }
            }
            catch (err) {
                console.error("Failed to edit message:", err);
            }
            finally {
                setSending(false);
                setEditingMessage(null);
                setNewMessage("");
                inputRef.current?.focus();
            }
            return;
        }
        setSending(true);
        setNewMessage("");
        const attachmentPayload = pendingAttachment ? pendingAttachment.previewUrl : null;
        const messageType = pendingAttachment ? pendingAttachment.type : "TEXT";
        const attachmentName = pendingAttachment?.name;
        const contentToSend = text || (messageType === "IMAGE" ? "📷 Photo" : `📎 ${attachmentName || "Document"}`);
        setPendingAttachment(null);
        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            conversationId: selectedConvId,
            senderId: user.id,
            content: contentToSend,
            type: messageType,
            attachmentUrl: attachmentPayload,
            createdAt: new Date().toISOString(),
            isRead: false,
            sender: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
            },
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setConversations((prev) => prev.map((c) => c.id === selectedConvId
            ? {
                ...c,
                lastMessage: {
                    id: optimisticMsg.id,
                    content: contentToSend,
                    createdAt: optimisticMsg.createdAt,
                    type: messageType,
                },
                updatedAt: optimisticMsg.createdAt,
            }
            : c));
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: selectedConvId,
                    content: contentToSend,
                    type: messageType,
                    attachmentUrl: attachmentPayload,
                }),
            });
            if (res.ok) {
                const savedMsg = await res.json();
                setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? savedMsg : m)));
            }
        }
        catch (err) {
            console.error("Failed to send message:", err);
        }
        finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };
    const handleDeleteMessage = async (msgId) => {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        try {
            await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
        }
        catch (err) {
            console.error("Failed to delete message:", err);
        }
    };
    const handleStartEdit = (msg) => {
        setEditingMessage(msg);
        setNewMessage(msg.content);
        setPendingAttachment(null);
        inputRef.current?.focus();
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        else if (e.key === "Escape" && editingMessage) {
            setEditingMessage(null);
            setNewMessage("");
        }
    };
    const selectedConv = conversations.find((c) => c.id === selectedConvId);
    const otherUser = selectedConv
        ? getOtherParticipant(selectedConv.participants, user?.id || "")
        : null;
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim())
            return true;
        const other = getOtherParticipant(conv.participants, user?.id || "");
        if (!other)
            return false;
        const displayName = getDisplayName(other);
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    if (authLoading) {
        return (<div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]"/>
      </div>);
    }
    if (!user) {
        return (<div className="h-[calc(100vh-4rem)] flex items-center justify-center text-center">
        <div>
          <MessageSquare className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3"/>
          <p className="font-semibold mb-1">Sign in to view messages</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            You need to be logged in to access your conversations.
          </p>
        </div>
      </div>);
    }
    return (<div className="h-[calc(100vh-4rem)] flex overflow-hidden relative">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-[var(--border)] flex flex-col shrink-0 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Messages</h2>
            <Badge variant="outline" className="text-xs">
              {conversations.length} {conversations.length === 1 ? "Chat" : "Chats"}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
            <Input placeholder="Search conversations..." className="pl-10 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (<div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]"/>
            </div>) : filteredConversations.length === 0 ? (<div className="text-center py-12 px-4">
              <MessageSquare className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40"/>
              <p className="font-medium text-sm mb-1">No conversations yet</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Start a conversation from a proposal, contract, or marketplace listing.
              </p>
            </div>) : (filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv.participants, user.id);
            if (!other)
                return null;
            const displayName = getDisplayName(other);
            const isSelected = conv.id === selectedConvId;
            return (<button key={conv.id} onClick={() => selectConversation(conv.id)} className={`w-full flex items-center gap-3 p-4 border-b border-[var(--border)] text-left transition-colors cursor-pointer ${isSelected
                    ? "bg-[var(--primary)]/5 border-l-2 border-l-[var(--primary)]"
                    : "hover:bg-[var(--muted)]/50"}`}>
                  <Avatar name={displayName} size="md"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                        {displayName}
                      </p>
                      <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                        {conv.lastMessage ? formatRelative(conv.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0
                    ? "text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)]"}`}>
                        {conv.lastMessage?.type === "SYSTEM"
                    ? `📌 ${conv.lastMessage.content}`
                    : conv.lastMessage?.type === "IMAGE"
                        ? "📷 Photo"
                        : conv.lastMessage?.type === "FILE"
                            ? "📎 Document"
                            : conv.lastMessage?.content || "No messages"}
                      </p>
                      {conv.unreadCount > 0 && (<Badge className="h-5 min-w-5 px-1.5 text-[10px] shrink-0">
                          {conv.unreadCount}
                        </Badge>)}
                    </div>
                  </div>
                </button>);
        }))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
        {selectedConv && otherUser ? (<>
            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                if (otherUser) {
                    const slug = otherUser.studentProfile?.portfolioUrl || otherUser.id;
                    navigate(`/portfolio/${encodeURIComponent(slug)}`);
                }
            }} title="Click to view profile">
                <button className="md:hidden p-1 mr-1 hover:bg-[var(--muted)] rounded-lg transition-colors" onClick={(e) => {
                e.stopPropagation();
                setShowMobileChat(false);
                setSelectedConvId("");
            }}>
                  <ArrowLeft className="h-5 w-5"/>
                </button>
                <Avatar name={getDisplayName(otherUser)} size="md"/>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{getDisplayName(otherUser)}</p>
                    {otherUser.isVerified && (<ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0"/>)}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {otherUser.role?.toUpperCase() === "CLIENT"
                ? "Client Organization"
                : otherUser.studentProfile?.college || "Student Developer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--background)]/60">
              {loadingMessages ? (<div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]"/>
                </div>) : messages.length === 0 ? (<div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageSquare className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40"/>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No messages yet. Say hello!
                    </p>
                  </div>
                </div>) : (<AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const prevMsg = messages[index - 1];
                    const showDateDivider = !prevMsg ||
                        new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    if (msg.type === "SYSTEM" || msg.type === "system") {
                        return (<div key={msg.id} className="text-center py-2">
                          <span className="text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)] border border-[var(--border)] px-3 py-1 rounded-full inline-block shadow-sm">
                            📌 {msg.content}
                          </span>
                        </div>);
                    }
                    const isSent = msg.senderId === user.id;
                    return (<div key={msg.id} className="space-y-2">
                        {showDateDivider && (<div className="text-center py-2">
                            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] bg-[var(--muted)]/70 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {formatDateSeparator(msg.createdAt)}
                            </span>
                          </div>)}

                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className={`flex ${isSent ? "justify-end" : "justify-start"} group relative`}>
                          <div className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl relative shadow-sm ${isSent
                            ? "bg-[var(--primary)] text-white rounded-br-xs"
                            : "bg-[var(--muted)] text-[var(--foreground)] rounded-bl-xs border border-[var(--border)]/40"}`}>
                            {msg.type === "IMAGE" && msg.attachmentUrl && (<div className="mb-2 rounded-xl overflow-hidden cursor-pointer max-h-64 bg-black/10 border border-white/10" onClick={() => setPreviewImage(msg.attachmentUrl || null)}>
                                <img src={msg.attachmentUrl} alt="Attachment" className="w-full h-full object-cover hover:scale-105 transition-transform"/>
                              </div>)}

                            {msg.type === "FILE" && (<div className={`mb-2 p-2.5 rounded-xl flex items-center gap-2.5 ${isSent ? "bg-black/20 text-white" : "bg-[var(--background)] border border-[var(--border)]"}`}>
                                <div className="p-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                                  <FileText className="h-5 w-5"/>
                                </div>
                                <div className="flex-1 min-w-0 text-xs">
                                  <p className="font-semibold truncate">{msg.content.replace(/^📎\s*/, "")}</p>
                                  <p className="opacity-70 text-[10px]">Document</p>
                                </div>
                                {msg.attachmentUrl && (<a href={msg.attachmentUrl} download="attachment" className="p-1.5 rounded-md hover:bg-white/10 transition-colors" title="Download File" onClick={(e) => e.stopPropagation()}>
                                    <Download className="h-4 w-4"/>
                                  </a>)}
                              </div>)}

                            {msg.type !== "IMAGE" && msg.type !== "FILE" && (<p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>)}

                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px]">
                              <span className={isSent ? "text-white/70" : "text-[var(--muted-foreground)]"}>
                                {formatTime(msg.createdAt)}
                              </span>
                              {isSent && (<span title={msg.isRead ? "Read" : "Delivered"}>
                                  {msg.isRead ? (<CheckCheck className="h-3.5 w-3.5 text-cyan-300 inline"/>) : (<Check className="h-3.5 w-3.5 text-white/60 inline"/>)}
                                </span>)}
                            </div>

                            {isSent && (<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                            }} className="p-1 rounded-full bg-black/30 hover:bg-black/50 text-white/90 cursor-pointer shadow-sm">
                                  <MoreVertical className="h-3.5 w-3.5"/>
                                </button>

                                {activeMenuMessageId === msg.id && (<div className="absolute right-0 top-7 z-20 w-32 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl p-1 text-xs text-[var(--foreground)]" onClick={(e) => e.stopPropagation()}>
                                    {msg.type !== "IMAGE" && msg.type !== "FILE" && (<button onClick={() => {
                                        handleStartEdit(msg);
                                        setActiveMenuMessageId(null);
                                    }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--muted)] text-left cursor-pointer">
                                        <Edit2 className="h-3.5 w-3.5 text-[var(--primary)]"/>
                                        <span>Edit</span>
                                      </button>)}
                                    <button onClick={() => {
                                    handleDeleteMessage(msg.id);
                                    setActiveMenuMessageId(null);
                                }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-500 text-left cursor-pointer">
                                      <Trash2 className="h-3.5 w-3.5"/>
                                      <span>Delete</span>
                                    </button>
                                  </div>)}
                              </div>)}
                          </div>
                        </motion.div>
                      </div>);
                })}
                </AnimatePresence>)}
              <div ref={messagesEndRef}/>
            </div>

            {/* Compose Bar */}
            <div className="border-t border-[var(--border)] bg-[var(--card)] p-3">
              {editingMessage && (<div className="mb-2 p-2 px-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-between text-xs text-[var(--primary)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Edit2 className="h-3.5 w-3.5 shrink-0"/>
                    <span>Editing message: <strong className="font-semibold">{editingMessage.content}</strong></span>
                  </div>
                  <button onClick={() => {
                    setEditingMessage(null);
                    setNewMessage("");
                }} className="p-1 hover:bg-[var(--primary)]/20 rounded cursor-pointer" title="Cancel edit">
                    <X className="h-3.5 w-3.5"/>
                  </button>
                </div>)}

              {pendingAttachment && (<div className="mb-2 p-2 px-3 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {pendingAttachment.type === "IMAGE" ? (<img src={pendingAttachment.previewUrl} alt="Preview" className="h-9 w-9 object-cover rounded-md border border-[var(--border)] shrink-0"/>) : (<div className="p-1.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">
                        <FileText className="h-5 w-5"/>
                      </div>)}
                    <div className="truncate">
                      <p className="font-medium truncate">{pendingAttachment.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">{pendingAttachment.size}</p>
                    </div>
                  </div>
                  <button onClick={() => setPendingAttachment(null)} className="p-1 hover:bg-[var(--muted)] rounded cursor-pointer text-[var(--muted-foreground)] hover:text-red-500">
                    <X className="h-4 w-4"/>
                  </button>
                </div>)}

              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.zip,.txt,.json,.js,.ts,.tsx,.py" className="hidden"/>

                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Attach photo or document">
                  <Paperclip className="h-5 w-5"/>
                </Button>

                <Input ref={inputRef} placeholder={editingMessage ? "Edit message..." : "Type a message..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} className="flex-1" disabled={sending}/>

                <Button size="icon" className="shrink-0 cursor-pointer shadow-md" onClick={handleSend} disabled={(!newMessage.trim() && !pendingAttachment) || sending}>
                  {sending ? (<Loader2 className="h-4 w-4 animate-spin"/>) : editingMessage ? (<Check className="h-4 w-4"/>) : (<Send className="h-4 w-4"/>)}
                </Button>
              </div>
            </div>
          </>) : (<div className="flex-1 flex items-center justify-center text-center px-4">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-[var(--primary)]"/>
              </div>
              <p className="font-semibold mb-1">Select a conversation</p>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                Choose a conversation from the sidebar, or start one from a proposal, contract, or marketplace listing.
              </p>
            </div>
          </div>)}
      </div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {previewImage && (<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-md" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
              <X className="h-6 w-6"/>
            </button>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={previewImage} alt="Full Preview" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}/>
          </div>)}
      </AnimatePresence>
    </div>);
}
