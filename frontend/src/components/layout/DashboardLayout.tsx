import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasTodayNotifications, setHasTodayNotifications] = useState(false);
  const router = useRouter();
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      checkTodayNotifications();
    }
  }, [isAdmin]);

  const checkTodayNotifications = async () => {
    try {
      const response = await api.get('/employees?limit=1000');
      const employees = Array.isArray(response.data.employees) ? response.data.employees : [];
      
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      
      const hasToday = employees.some((employee: any) => {
        if (employee.status !== 'active') return false;
        
        // Check birthday
        if (employee.dateOfBirth) {
          const birthDate = new Date(employee.dateOfBirth);
          const birthMonth = birthDate.getMonth() + 1;
          const birthDay = birthDate.getDate();
          if (birthMonth === todayMonth && birthDay === todayDay) return true;
        }
        
        // Check marriage anniversary
        if (employee.marriageAnniversary) {
          const marriageDate = new Date(employee.marriageAnniversary);
          const marriageMonth = marriageDate.getMonth() + 1;
          const marriageDay = marriageDate.getDate();
          if (marriageMonth === todayMonth && marriageDay === todayDay) return true;
        }
        
        // Check work anniversary
        if (employee.joiningDate) {
          const joiningDate = new Date(employee.joiningDate);
          const joiningMonth = joiningDate.getMonth() + 1;
          const joiningDay = joiningDate.getDate();
          const currentYear = today.getFullYear();
          const yearsWorked = currentYear - joiningDate.getFullYear();
          if (yearsWorked > 0 && joiningMonth === todayMonth && joiningDay === todayDay) return true;
        }
        
        return false;
      });
      
      setHasTodayNotifications(hasToday);
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    if (isAdmin) {
      router.push('/admin/notifications');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              {title && (
                <h1 className="ml-4 text-xl font-semibold text-gray-900">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotificationClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md relative"
              >
                <Bell className="h-6 w-6" />
                {hasTodayNotifications && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;