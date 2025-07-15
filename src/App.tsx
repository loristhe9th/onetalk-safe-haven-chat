// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";

// Import các component và page cần thiết
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./components/auth/AuthPage";
import ChatStart from "./pages/ChatStart";
import ChatWaitingRoom from "./pages/ChatWaitingRoom";
import NotFound from "./pages/NotFound";

// NOTE: Các component UI như Toaster, Sonner, TooltipProvider đã được tạm thời loại bỏ
// để đảm bảo không có lỗi nào từ chúng. Chúng ta sẽ thêm lại sau khi build thành công.

const queryClient = new QueryClient();

// Tách riêng phần định tuyến ra để code sạch sẽ hơn
function AppRoutes() {
  return (
    <Routes>
      {/* Các route không cần đăng nhập */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Index />} />

      {/* Các route được bảo vệ, cần Layout và đăng nhập */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/chat/start" element={<Layout><ChatStart /></Layout>} />
      <Route path="/chat/waiting/:sessionId" element={<Layout><ChatWaitingRoom /></Layout>} />
      
      {/* Route bắt lỗi 404 phải nằm cuối cùng */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;