import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Calendar,
  BarChart3,
  Building2
} from 'lucide-react';
import { logout, getUser } from '@/lib/auth';
import api from '@/lib/api';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [hasTodayNotifications, setHasTodayNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) {
      checkTodayNotifications();
    }
  }, [isAdmin]);

  // Handle click outside to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle click outside on mobile when sidebar is open
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Check if we're on mobile (screen width < 1024px which is lg breakpoint)
        if (window.innerWidth < 1024) {
          onClose();
        }
      }
    };

    // Add event listener when sidebar is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    if (user?.role === 'admin') {
      router.push('/admin/profile');
    } else if (user?.role === 'superadmin') {
      router.push('/superadmin/profile');
    } else {
      router.push('/employee');
    }
    onClose();
  };

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Employees', href: '/admin/employees' },
    { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
    { icon: Calendar, label: 'Documents', href: '/admin/documents' },
  ];

  const employeeMenuItems = [
    { icon: User, label: 'Profile', href: '/employee' },
    { icon: Calendar, label: 'My Documents', href: '/employee/documents' },
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  return (
    <>
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <Building2 className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-lg font-semibold">
            {isAdmin ? 'Admin Panel' : 'Employee Portal'}
          </span>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors relative"
                onClick={() => onClose()}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="absolute bottom-0 w-full p-4">
            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors text-left cursor-pointer"
              >
                <User className="mr-3 h-5 w-5" />
                <div>
                  <p className="font-medium">{user?.profile?.firstName || 'User'}</p>
                  <p className="text-gray-400 text-xs hover:text-blue-400 transition-colors cursor-pointer">{user?.email}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-gray-700 rounded-lg transition-colors mt-2"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
};

export default Sidebar;