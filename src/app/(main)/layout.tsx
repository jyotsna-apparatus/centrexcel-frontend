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
            <section className="h-[calc(100dvh-4rem)] w-full overflow-auto bg-black/90 px-4 py-6 md:px-8 md:py-8">
              {children}
            </section>
          </main>
        </SidebarProvider>
      </OnboardingGuard>
    </AuthGuard>
  );
}
