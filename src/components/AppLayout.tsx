import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import FloatingClouds from "./FloatingClouds";

const AppLayout = () => (
  <div className="min-h-screen bg-background relative overflow-x-hidden">
    <FloatingClouds />
    <main className="relative z-10 max-w-4xl mx-auto">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AppLayout;
