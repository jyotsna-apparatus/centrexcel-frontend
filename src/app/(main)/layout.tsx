import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import Header from "@/components/header/Header"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full h-full">
          <Header />
          <section className="p-4 mt-16 w-full h-[calc(100dvh-4rem)]">
            {children}
          </section>
        </main>
      </SidebarProvider>
    </AuthGuard>
  )
}
