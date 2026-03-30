import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import Header from "@/components/header/Header";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full h-full">
            <Header />
            <section className="p-4  w-full h-[calc(100dvh-4rem)]">
              {children}
            </section>
          </main>
        </SidebarProvider>
      </OnboardingGuard>
    </AuthGuard>
  );
}
