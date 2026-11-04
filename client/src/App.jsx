import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
// Dashboard Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import MarketplacePage from "./pages/dashboard/MarketplacePage";
import MarketplaceDetailPage from "./pages/dashboard/MarketplaceDetailPage";
import SellPage from "./pages/dashboard/SellPage";
import SolutionsPage from "./pages/dashboard/SolutionsPage";
import SolutionPostPage from "./pages/dashboard/SolutionPostPage";
import SolutionDetailPage from "./pages/dashboard/SolutionDetailPage";
import ProjectsPage from "./pages/dashboard/ProjectsPage";
import ProjectDetailPage from "./pages/dashboard/ProjectDetailPage";
import ProposalsPage from "./pages/dashboard/ProposalsPage";
import ProposalDetailPage from "./pages/dashboard/ProposalDetailPage";
import ContractsPage from "./pages/dashboard/ContractsPage";
import ContractDetailPage from "./pages/dashboard/ContractDetailPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import EarningsPage from "./pages/dashboard/EarningsPage";
import PortfolioPage from "./pages/dashboard/PortfolioPage";
import ReviewsPage from "./pages/dashboard/ReviewsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
// Admin Pages
import AdminOverviewPage from "./pages/dashboard/admin/AdminOverviewPage";
import AdminProductsPage from "./pages/dashboard/admin/AdminProductsPage";
import AdminRequestsPage from "./pages/dashboard/admin/AdminRequestsPage";
import AdminTransactionsPage from "./pages/dashboard/admin/AdminTransactionsPage";
import AdminUsersPage from "./pages/dashboard/admin/AdminUsersPage";
export default function App() {
    return (<Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />}/>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />}/>
      <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
      <Route path="/reset-password" element={<ResetPasswordPage />}/>
      <Route path="/about" element={<AboutPage />}/>
      <Route path="/blog" element={<BlogPage />}/>
      <Route path="/contact" element={<ContactPage />}/>
      <Route path="/privacy" element={<PrivacyPage />}/>
      <Route path="/terms" element={<TermsPage />}/>

      {/* Dashboard & Workspace Routes with DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />}/>
        <Route path="/marketplace" element={<MarketplacePage />}/>
        <Route path="/marketplace/:id" element={<MarketplaceDetailPage />}/>
        <Route path="/sell" element={<SellPage />}/>
        <Route path="/solutions" element={<SolutionsPage />}/>
        <Route path="/solutions/post" element={<SolutionPostPage />}/>
        <Route path="/solutions/:id" element={<SolutionDetailPage />}/>
        <Route path="/projects" element={<ProjectsPage />}/>
        <Route path="/projects/:id" element={<ProjectDetailPage />}/>
        <Route path="/proposals" element={<ProposalsPage />}/>
        <Route path="/proposals/:id" element={<ProposalDetailPage />}/>
        <Route path="/contracts" element={<ContractsPage />}/>
        <Route path="/contracts/:id" element={<ContractDetailPage />}/>
        <Route path="/messages" element={<MessagesPage />}/>
        <Route path="/earnings" element={<EarningsPage />}/>
        <Route path="/portfolio" element={<PortfolioPage />}/>
        <Route path="/portfolio/:slug" element={<PortfolioPage />}/>
        <Route path="/reviews" element={<ReviewsPage />}/>
        <Route path="/settings" element={<SettingsPage />}/>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminOverviewPage />}/>
        <Route path="/admin/products" element={<AdminProductsPage />}/>
        <Route path="/admin/requests" element={<AdminRequestsPage />}/>
        <Route path="/admin/transactions" element={<AdminTransactionsPage />}/>
        <Route path="/admin/users" element={<AdminUsersPage />}/>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>);
}
