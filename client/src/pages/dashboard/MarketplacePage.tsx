import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Code2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function MarketplacePage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== "all") queryParams.set("category", selectedCategory);
        if (search) queryParams.set("search", search);
        if (priceFilter === "free") queryParams.set("free", "true");
        if (priceFilter === "paid") queryParams.set("free", "false");
        queryParams.set("sort", sortBy);

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        let apiProducts: Product[] = [];
        if (res.ok) {
          const data = await res.json();
          apiProducts = data.products || [];
        }

        if (!cancelled) {
          setProductList(apiProducts);
        }
      } catch (err) {
        console.error("[Marketplace] Error fetching products:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [search, selectedCategory, priceFilter, sortBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Software Marketplace</h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            Discover and purchase software built by verified student developers
          </p>
        </div>

        <Link to="/sell">
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-[var(--primary)] to-emerald-600 hover:opacity-90 text-white shadow-md text-xs cursor-pointer">
            + Publish Your Software
          </Button>
        </Link>
      </motion.div>

      {/* Search and Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search products, technologies, or keywords..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] px-3 text-sm custom-select cursor-pointer"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] px-3 text-sm custom-select cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
            }`}
          >
            All Products
          </button>
          {CATEGORIES.map((cat: any) => {
            const catKey = cat.slug || cat.id;
            const isSelected = selectedCategory === catKey || selectedCategory === cat.id || selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productList.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link to={`/marketplace/${product.slug || product.id}`}>
                <Card className="h-full hover:border-[var(--primary)]/50 transition-all hover:shadow-lg group flex flex-col justify-between overflow-hidden">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      {product.screenshots && product.screenshots.length > 0 ? (
                        <div className="h-40 rounded-lg overflow-hidden mb-4 bg-black/20 border border-[var(--border)]">
                          <img
                            src={product.screenshots[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="h-40 rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/50 mb-4 flex items-center justify-center group-hover:from-[var(--primary)]/5 group-hover:to-purple-500/5 transition-colors">
                          <Code2 className="h-10 w-10 text-[var(--muted-foreground)]/40 group-hover:text-[var(--primary)] transition-colors" />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-base group-hover:text-[var(--primary)] transition-colors">
                          {product.name}
                        </h3>
                        <span className="font-bold text-sm shrink-0">
                          {product.isFree || product.price === 0 ? (
                            <Badge variant="success">Free</Badge>
                          ) : (
                            formatCurrency(product.price)
                          )}
                        </span>
                      </div>

                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4">
                        {product.shortDescription || product.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(product.technologies || []).slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs font-normal">
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{product.rating ?? 5.0}</span>
                          <span>({product.reviewCount ?? 0})</span>
                        </div>
                        <span>{(product.salesCount ?? 0).toLocaleString()} sales</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && productList.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-1">No products found</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Try adjusting your search query or filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;

