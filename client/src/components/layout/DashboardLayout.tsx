import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LogOut, 
  Menu, 
  Bell, 
  ChevronRight, 
  Home as HomeIcon, 
  HelpCircle, 
  MessageSquare, 
  Building, 
  Edit, 
  Users,
  FileCheck,
  Gavel,
  Rocket,
  Shuffle,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

const domainIcons = {
  "Access Reviews": <FileCheck className="h-5 w-5 mr-3 text-blue-500" />,
  "Generic Governance Questions": <Gavel className="h-5 w-5 mr-3 text-indigo-500" />,
  "Application Onboarding": <Rocket className="h-5 w-5 mr-3 text-orange-500" />,
  "Segregation of Duties (SOD)": <Shuffle className="h-5 w-5 mr-3 text-purple-500" />,
  "AD/Directory Services": <Folder className="h-5 w-5 mr-3 text-green-500" />
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [currentLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isLinkActive = (path: string) => {
    return currentLocation === path;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-white shadow-md w-64 flex-shrink-0 ${
          mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 md:relative md:z-0' : 'hidden md:block'
        } h-full`}
      >
        {/* Logo and Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="bg-primary p-1.5 rounded text-white">
              <span className="font-bold text-sm">IdG</span>
            </div>
            <h1 className="ml-2 text-lg font-bold text-slate-800">IdGov Platform</h1>
            
            {/* Mobile close button */}
            <button 
              className="ml-auto md:hidden" 
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <span className="text-slate-500">&times;</span>
            </button>
          </div>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-2 overflow-y-auto h-[calc(100vh-160px)]">
          <div className="space-y-1">
            <Link href="/">
              <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                isLinkActive('/') ? 'border-l-4 border-primary bg-blue-50' : ''
              }`}>
                <HomeIcon className="h-5 w-5 mr-3 text-slate-500" />
                Dashboard
              </a>
            </Link>
            <Link href="/questionnaires">
              <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                isLinkActive('/questionnaires') ? 'border-l-4 border-primary bg-blue-50' : ''
              }`}>
                <HelpCircle className="h-5 w-5 mr-3 text-slate-500" />
                Questionnaires
              </a>
            </Link>
            <Link href="/responses">
              <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                currentLocation.startsWith('/question/') ? 'border-l-4 border-primary bg-blue-50' : ''
              }`}>
                <MessageSquare className="h-5 w-5 mr-3 text-slate-500" />
                Responses
              </a>
            </Link>
          </div>
          
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Question Domains</h3>
            <div className="mt-2 space-y-1">
              <Link href="/domain/access-reviews">
                <a className={`flex items-center pl-6 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                  isLinkActive('/domain/access-reviews') ? 'border-l-4 border-primary bg-blue-50' : ''
                }`}>
                  {domainIcons["Access Reviews"]}
                  Access Reviews
                </a>
              </Link>
              <Link href="/domain/governance">
                <a className={`flex items-center pl-6 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                  isLinkActive('/domain/governance') ? 'border-l-4 border-primary bg-blue-50' : ''
                }`}>
                  {domainIcons["Generic Governance Questions"]}
                  Governance
                </a>
              </Link>
              <Link href="/domain/app-onboarding">
                <a className={`flex items-center pl-6 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                  isLinkActive('/domain/app-onboarding') ? 'border-l-4 border-primary bg-blue-50' : ''
                }`}>
                  {domainIcons["Application Onboarding"]}
                  App Onboarding
                </a>
              </Link>
              <Link href="/domain/sod">
                <a className={`flex items-center pl-6 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                  isLinkActive('/domain/sod') ? 'border-l-4 border-primary bg-blue-50' : ''
                }`}>
                  {domainIcons["Segregation of Duties (SOD)"]}
                  Segregation of Duties
                </a>
              </Link>
              <Link href="/domain/directory">
                <a className={`flex items-center pl-6 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                  isLinkActive('/domain/directory') ? 'border-l-4 border-primary bg-blue-50' : ''
                }`}>
                  {domainIcons["AD/Directory Services"]}
                  AD/Directory Services
                </a>
              </Link>
            </div>
          </div>
          
          {/* Admin Section (conditional rendering) */}
          {user?.role === 'Admin' && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administration</h3>
              <div className="mt-2 space-y-1">
                <Link href="/admin/tenants">
                  <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                    isLinkActive('/admin/tenants') ? 'border-l-4 border-primary bg-blue-50' : ''
                  }`}>
                    <Building className="h-5 w-5 mr-3 text-slate-500" />
                    Tenant Management
                  </a>
                </Link>
                <Link href="/admin/questions">
                  <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                    isLinkActive('/admin/questions') ? 'border-l-4 border-primary bg-blue-50' : ''
                  }`}>
                    <Edit className="h-5 w-5 mr-3 text-slate-500" />
                    Question Management
                  </a>
                </Link>
                <Link href="/admin/users">
                  <a className={`flex items-center pl-3 pr-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 ${
                    isLinkActive('/admin/users') ? 'border-l-4 border-primary bg-blue-50' : ''
                  }`}>
                    <Users className="h-5 w-5 mr-3 text-slate-500" />
                    User Management
                  </a>
                </Link>
              </div>
            </div>
          )}
        </nav>
        
        {/* Logout Button */}
        <div className="border-t border-slate-200 p-4">
          <button 
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3 text-slate-500" />
            Sign out
          </button>
        </div>
      </aside>
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button 
          className="rounded-full shadow-lg"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 md:px-6">
            <div className="flex md:hidden items-center">
              <div className="bg-primary p-1.5 rounded text-white">
                <span className="font-bold text-sm">IdG</span>
              </div>
              <h1 className="ml-2 text-lg font-bold text-slate-800">IdGov</h1>
            </div>
            
            <div className="flex items-center ml-auto">
              {user?.tenantId && (
                <span className="text-sm font-medium mr-2 text-slate-700">
                  {/* Tenant name would be fetched from an API in a real application */}
                  {user.role === 'Customer' ? 'My Company' : 'Customer Tenant'}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>New response added</DropdownMenuItem>
                  <DropdownMenuItem>Question updated</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
