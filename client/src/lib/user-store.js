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
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (!isAuthenticated || !userId) {
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
                const [projectsRes, productsRes, proposalsRes, contractsRes, notifRes] = await Promise.all([
                    fetch(`/api/projects?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { projects: [] })),
                    fetch(`/api/products?sellerId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { products: [] })),
                    fetch(`/api/proposals?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { proposals: [] })),
                    fetch(`/api/contracts?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { contracts: [] })),
                    fetch(`/api/notifications?userId=${userId}`, { headers }).then((r) => (r.ok ? r.json() : { notifications: [] })),
                ]);
                if (!cancelled) {
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
            const res = await fetch("/api/projects", {
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
            const res = await fetch(`/api/projects/${projectId}`, {
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
            const res = await fetch("/api/products", {
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
            const res = await fetch("/api/proposals", {
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
            return s === "published" || s === "pending_review" || s === "active" || !s;
        }).length,
        proposalsCount: proposals.length,
        activeContractsCount: contracts.filter((c) => {
            const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
            return s === "active" || s === "created";
        }).length,
        totalSales: user?.studentProfile?.totalSales || products.reduce((sum, p) => sum + (p.salesCount || 0), 0),
        totalEarnings: user?.studentProfile?.totalEarnings ||
            products.reduce((sum, p) => sum + (p.salesCount || 0) * (p.price || 0), 0),
    };
    return {
        isLoaded,
        projects,
        products,
        proposals,
        contracts,
        notifications,
        stats,
        addProject,
        deleteProject,
        addProduct,
        addProposal,
    };
}
