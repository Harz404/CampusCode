import { apiFetch } from "@/lib/api";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Lightbulb, User, FolderKanban, ArrowRight } from "lucide-react";
const typeIcons = {
    product: Package,
    solution: Lightbulb,
    student: User,
    project: FolderKanban,
};
const typeColors = {
    product: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    solution: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    student: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
    project: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
};
export function SearchBar({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const [prodRes, solRes] = await Promise.all([
                    apiFetch(`/api/products?search=${encodeURIComponent(query.trim())}`).then((r) => r.ok ? r.json() : { products: [] }),
                    apiFetch(`/api/solutions?search=${encodeURIComponent(query.trim())}`).then((r) => r.ok ? r.json() : { requests: [] }),
                ]);
                if (!cancelled) {
                    const combined = [
                        ...(prodRes.products || []).slice(0, 4).map((p) => ({
                            id: p.id,
                            type: "product",
                            title: p.name,
                            subtitle: p.shortDescription || p.category,
                            url: `/marketplace/${p.slug || p.id}`,
                        })),
                        ...(solRes.requests || []).slice(0, 4).map((r) => ({
                            id: r.id,
                            type: "solution",
                            title: r.title,
                            subtitle: `Budget: ₹${r.budgetMin || 0} - ₹${r.budgetMax || 0}`,
                            url: `/solutions/${r.id}`,
                        })),
                    ];
                    setResults(combined);
                }
            }
            catch (err) {
                console.error("[SearchBar] Error:", err);
            }
        }, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        else {
            setQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        }
        else if (e.key === "Enter" && results[selectedIndex]) {
            onClose();
            navigate(results[selectedIndex].url);
        }
    }, [results, selectedIndex, onClose, navigate]);
    return (<AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
          <div className="flex justify-center pt-[15vh] px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="relative z-10 w-full max-w-xl">
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
                  <Search className="h-5 w-5 text-[var(--muted-foreground)] shrink-0"/>
                  <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search products, requests, developers, projects..." className="flex-1 h-14 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"/>
                  <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-[var(--muted)] text-[10px] text-[var(--muted-foreground)] font-mono">
                    ESC
                  </kbd>
                </div>

                {results.length > 0 && (<div className="max-h-80 overflow-y-auto p-2">
                    {results.map((result, idx) => {
                    const Icon = typeIcons[result.type];
                    return (<Link key={`${result.type}-${result.id}`} to={result.url} onClick={onClose} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${idx === selectedIndex
                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "hover:bg-[var(--muted)]"}`}>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeColors[result.type]}`}>
                            <Icon className="h-4 w-4"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{result.subtitle}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0"/>
                        </Link>);
                })}
                  </div>)}

                {query.length >= 2 && results.length === 0 && (<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No results found for &ldquo;{query}&rdquo;
                  </div>)}

                {!query && (<div className="p-4 text-xs text-[var(--muted-foreground)] text-center">
                    Type to search across products, solution requests, developers, and projects
                  </div>)}
              </div>
            </motion.div>
          </div>
        </div>)}
    </AnimatePresence>);
}
