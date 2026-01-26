import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/app/components/Layout";
import { Dashboard } from "@/app/components/Dashboard";
import { UploadPage } from "@/app/components/UploadPage";
import { ComparePage } from "@/app/components/ComparePage";
import { ChangeReviewPage } from "@/app/components/ChangeReviewPage";
import { ReviewPage } from "@/app/components/ReviewPage";
import { VersionHistoryPage } from "@/app/components/VersionHistoryPage";
import { GovernancePage } from "@/app/components/GovernancePage";
import { ManagementDashboard } from "@/app/components/ManagementDashboard";
import { EditorPage } from "@/app/components/EditorPage";
import { ComponentGalleryPage } from "@/app/components/ComponentGalleryPage";


export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/change-review" element={<ChangeReviewPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/history" element={<VersionHistoryPage />} />
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/components" element={<ComponentGalleryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}