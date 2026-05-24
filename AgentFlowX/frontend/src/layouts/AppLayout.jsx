import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      
      {/* ===== Sidebar ===== */}
      <Sidebar />

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
