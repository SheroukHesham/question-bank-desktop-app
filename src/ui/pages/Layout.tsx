import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/ui/components/ui/sidebar";
import { AppSidebar } from "@/ui/components/Sidebar";
import { toast, Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationGuardProvider } from "../context/NavigationGuardProvider";
import { useEffect } from "react";

const Layout = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  useEffect(() => {
    window.electron.update.onAvailable((version) => {
      toast.info(
        `Update v${version} found — downloading in the background...`,
        {
          position: "top-center",
        },
      );
    });

    window.electron.update.onDownloaded((version) => {
      toast.success(`Update v${version} ready`, {
        description: "Restart now to install it.",
        position: "top-center",
        action: {
          label: "Restart now",
          onClick: () => window.electron.update.install(),
        },
      });
    });
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NavigationGuardProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <div className="flex flex-col w-full">
              <Toaster />
              <Outlet />
            </div>
          </SidebarProvider>
        </NavigationGuardProvider>
      </QueryClientProvider>
    </>
  );
};

export default Layout;
