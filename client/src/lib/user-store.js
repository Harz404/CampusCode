import { apiFetch } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
export function useUserData() {
    const { user, token, isAuthenticated } = useAuth();
    const userId = user?.id || null;
    const [projects, setProjects] = useState([]);
    const [products, setProducts] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [demoEarnings, setDemoEarnings] = useState(0);
    const [demoSpent, setDemoSpent] = useState(0);
    const [paymentMonthly, setPaymentMonthly] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (!isAuthenticated || !userId) {
            setDemoEarnings(0); setDemoSpent(0); setPaymentMonthly([]);
            setProjects([]);
            setProducts([]);
            setProposals([]);
            setContracts([]);
            setNotifications([]);
            setIsLoaded(true);
            return;
        }
        let cancelled = false;
        async function fetchUserData() {
            const headers = {};
            if (token)
                headers["Authorization"] = `Bearer ${token}`;
            try {
                const [projectsRes, productsRes, proposalsRes, contractsRes, notifRes, walletRes] = await Promise.all([
                    apiFetch("/api/projects", { headers }).then((r) => (r.ok ? r.json() : { projects: [] })),
                    apiFetch(`/api/products?sellerId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { products: [] })),
                    apiFetch("/api/proposals", { headers }).then((r) => (r.ok ? r.json() : { proposals: [] })),
                    apiFetch(`/api/contracts?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { contracts: [] })),
                    apiFetch(`/api/notifications?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { notifications: [] })),
                    apiFetch("/api/payments/transactions", { headers }).then(r => r.ok ? r.json() : { totalEarned: 0 }),
                ]);
                if (!cancelled) {
                    setDemoEarnings(walletRes.totalEarned || 0);
                    setDemoSpent(walletRes.totalSpent || 0); setPaymentMonthly(walletRes.monthly || []);
                    setProjects(projectsRes.projects || []);
                    setProducts(productsRes.products || []);
                    setProposals(proposalsRes.proposals || []);
                    setContracts(contractsRes.contracts || []);
                    setNotifications(notifRes.notifications || []);
                }
            }
            catch (error) {
                console.error("[useUserData] Failed to fetch user data:", error);
            }
            finally {
                if (!cancelled) {
                    setIsLoaded(true);
                }
            }
        }
        fetchUserData();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, userId, token]);
    const addProject = useCallback(async (newProjectData) => {
        if (!userId)
            return null;
        try {
            const res = await apiFetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: newProjectData.name || "Untitled Project",
                    description: newProjectData.description || "",
                    category: newProjectData.category || "general",
                    technologies: newProjectData.technologies || [],
                    ownerId: userId,
                }),
            });
            if (!res.ok)
                return null;
            const newProject = await res.json();
            setProjects((prev) => [newProject, ...prev]);
            return newProject;
        }
        catch (error) {
            console.error("[useUserData] Error creating project:", error);
            return null;
        }
    }, [userId, token]);
    const deleteProject = useCallback(async (projectId) => {
        try {
            const res = await apiFetch(`/api/projects/${projectId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                setProjects((prev) => prev.filter((p) => p.id !== projectId));
            }
        }
        catch (error) {
            console.error("[useUserData] Error deleting project:", error);
        }
    }, [token]);
    const addProduct = useCallback(async (newProductData) => {
        try {
            const res = await apiFetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    ...newProductData,
                    sellerId: userId || undefined,
                }),
            });
            if (!res.ok)
                return null;
            const newProduct = await res.json();
            setProducts((prev) => [newProduct, ...prev]);
            return newProduct;
        }
        catch (error) {
            console.error("[useUserData] Error creating product:", error);
            return null;
        }
    }, [userId, token]);
    const addProposal = useCallback(async (newProposalData) => {
        if (!userId)
            return null;
        try {
            const res = await apiFetch("/api/proposals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    ...newProposalData,
                    studentId: userId,
                }),
            });
            if (!res.ok)
                return null;
            const newProposal = await res.json();
            setProposals((prev) => [newProposal, ...prev]);
            return newProposal;
        }
        catch (error) {
            console.error("[useUserData] Error creating proposal:", error);
            return null;
        }
    }, [userId, token]);
    const stats = {
        activeProjectsCount: projects.filter((p) => {
            const s = typeof p.status === "string" ? p.status.toLowerCase() : "";
            return s === "active" || s === "planning" || s === "in_progress" || !s;
        }).length,
        publishedProductsCount: products.filter((p) => {
            const s = typeof p.status === "string" ? p.status.toLowerCase() : "";
            return s === "published";
        }).length,
        proposalsCount: proposals.length,
        activeContractsCount: contracts.filter((c) => {
            const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
            return s === "active" || s === "created";
        }).length,
        totalSales: user?.studentProfile?.totalSales || products.reduce((sum, p) => sum + (p.salesCount || 0), 0),
        totalEarnings: demoEarnings,
        totalSpent: demoSpent,
    };
    return {
        isLoaded,
        projects,
        products,
        proposals,
        contracts,
        notifications,
        paymentMonthly,
        stats,
        addProject,
        deleteProject,
        addProduct,
        addProposal,
    };
}
