'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, Gift, Briefcase, AlertCircle, Users, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format, isToday, isThisMonth, differenceInDays } from 'date-fns';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  dateOfBirth?: string;
  marriageAnniversary?: string;
  joiningDate?: string;
  leavingDate?: string;
  status: string;
  user?: {
    role: string;
  };
}

interface NotificationGroup {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: NotificationItem[];
}

interface NotificationItem {
  id: string;
  employee: Employee;
  date: Date;
  type: 'birthday' | 'marriage_anniversary' | 'work_anniversary' | 'leaving_anniversary';
  message: string;
  daysUntil: number;
  status: 'today' | 'upcoming' | 'passed';
}

export default function NotificationsPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [todayNotifications, setTodayNotifications] = useState<NotificationItem[]>([]);
  const [thisMonthNotifications, setThisMonthNotifications] = useState<NotificationItem[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<NotificationItem[]>([]);
  const [allMarriageAnniversaries, setAllMarriageAnniversaries] = useState<NotificationItem[]>([]);
  const [allWorkAnniversaries, setAllWorkAnniversaries] = useState<NotificationItem[]>([]);
  const [allLeavingAnniversaries, setAllLeavingAnniversaries] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }

    fetchEmployees();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees?limit=1000'); // Get all employees
      const employeesData = Array.isArray(response.data.employees) ? response.data.employees : [];
      setEmployees(employeesData);
      processNotifications(employeesData);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to fetch employee data');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const processNotifications = (employeesData: Employee[]) => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
    const todayDay = today.getDate();
    const currentYear = today.getFullYear();
    
    const todayItems: NotificationItem[] = [];
    const thisMonthItems: NotificationItem[] = [];
    const birthdayItems: NotificationItem[] = [];
    const marriageItems: NotificationItem[] = [];
    const workItems: NotificationItem[] = [];
    const leavingItems: NotificationItem[] = [];

    const getEventStatus = (eventMonth: number, eventDay: number): 'today' | 'upcoming' | 'passed' => {
      if (eventMonth === todayMonth && eventDay === todayDay) return 'today';
      if (eventMonth === todayMonth && eventDay > todayDay) return 'upcoming';
      if (eventMonth === todayMonth && eventDay < todayDay) return 'passed';
      return 'upcoming'; // For other months, consider as upcoming
    };

    employeesData.forEach(employee => {
      // Skip inactive employees and admin users for most notifications
      if (employee.status !== 'active') return;
      
      // Skip admin users completely - they should not appear in any employee notifications
      // This is handled by the backend filtering, but adding extra safety check
      if (employee.user?.role !== 'employee') return;

      // Process Birthdays
      if (employee.dateOfBirth) {
        const birthDate = new Date(employee.dateOfBirth);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        const age = currentYear - birthDate.getFullYear();
        const status = getEventStatus(birthMonth, birthDay);
        
        const birthdayItem: NotificationItem = {
          id: `birthday-${employee.id}`,
          employee,
          date: new Date(currentYear, birthDate.getMonth(), birthDate.getDate()),
          type: 'birthday',
          message: `${employee.firstName} ${employee.lastName}'s ${age}${getOrdinalSuffix(age)} Birthday`,
          daysUntil: 0,
          status
        };

        birthdayItems.push(birthdayItem);
        
        // Check if it's today
        if (status === 'today') {
          todayItems.push(birthdayItem);
        }
        
        // Check if it's this month (include all events in current month)
        if (birthMonth === todayMonth) {
          thisMonthItems.push(birthdayItem);
        }
      }

      // Process Marriage Anniversaries
      if (employee.marriageAnniversary) {
        const marriageDate = new Date(employee.marriageAnniversary);
        const marriageMonth = marriageDate.getMonth() + 1;
        const marriageDay = marriageDate.getDate();
        const yearsMarried = currentYear - marriageDate.getFullYear();
        const status = getEventStatus(marriageMonth, marriageDay);
        
        const marriageItem: NotificationItem = {
          id: `marriage-${employee.id}`,
          employee,
          date: new Date(currentYear, marriageDate.getMonth(), marriageDate.getDate()),
          type: 'marriage_anniversary',
          message: `${employee.firstName} ${employee.lastName}'s ${yearsMarried}${getOrdinalSuffix(yearsMarried)} Marriage Anniversary`,
          daysUntil: 0,
          status
        };

        marriageItems.push(marriageItem);
        
        // Check if it's today
        if (status === 'today') {
          todayItems.push(marriageItem);
        }
        
        // Check if it's this month (include all events in current month)
        if (marriageMonth === todayMonth) {
          thisMonthItems.push(marriageItem);
        }
      }

      // Process Work Anniversaries
      if (employee.joiningDate) {
        const joiningDate = new Date(employee.joiningDate);
        const joiningMonth = joiningDate.getMonth() + 1;
        const joiningDay = joiningDate.getDate();
        const yearsWorked = currentYear - joiningDate.getFullYear();
        const status = getEventStatus(joiningMonth, joiningDay);
        
        // Only show if they've completed at least 1 year
        if (yearsWorked > 0) {
          const workItem: NotificationItem = {
            id: `work-${employee.id}`,
            employee,
            date: new Date(currentYear, joiningDate.getMonth(), joiningDate.getDate()),
            type: 'work_anniversary',
            message: `${employee.firstName} ${employee.lastName}'s ${yearsWorked}${getOrdinalSuffix(yearsWorked)} Work Anniversary`,
            daysUntil: 0,
            status
          };

          workItems.push(workItem);
          
          // Check if it's today
          if (status === 'today') {
            todayItems.push(workItem);
          }
          
          // Check if it's this month (include all events in current month)
          if (joiningMonth === todayMonth) {
            thisMonthItems.push(workItem);
          }
        }
      }

      // Process Leaving Anniversaries (for retired employees)
      if (employee.leavingDate && employee.status !== 'active') {
        const leavingDate = new Date(employee.leavingDate);
        const leavingMonth = leavingDate.getMonth() + 1;
        const leavingDay = leavingDate.getDate();
        const yearsRetired = currentYear - leavingDate.getFullYear();
        const status = getEventStatus(leavingMonth, leavingDay);
        
        if (yearsRetired > 0) {
          const leavingItem: NotificationItem = {
            id: `leaving-${employee.id}`,
            employee,
            date: new Date(currentYear, leavingDate.getMonth(), leavingDate.getDate()),
            type: 'leaving_anniversary',
            message: `${employee.firstName} ${employee.lastName}'s ${yearsRetired}${getOrdinalSuffix(yearsRetired)} Retirement Anniversary`,
            daysUntil: 0,
            status
          };

          leavingItems.push(leavingItem);
          
          // Check if it's today
          if (status === 'today') {
            todayItems.push(leavingItem);
          }
          
          // Check if it's this month (include all events in current month)
          if (leavingMonth === todayMonth) {
            thisMonthItems.push(leavingItem);
          }
        }
      }
    });

    // Sort all arrays by date
    const sortByDate = (a: NotificationItem, b: NotificationItem) => a.date.getTime() - b.date.getTime();
    
    setTodayNotifications(todayItems.sort(sortByDate));
    setThisMonthNotifications(thisMonthItems.sort(sortByDate));
    setAllBirthdays(birthdayItems.sort(sortByDate));
    setAllMarriageAnniversaries(marriageItems.sort(sortByDate));
    setAllWorkAnniversaries(workItems.sort(sortByDate));
    setAllLeavingAnniversaries(leavingItems.sort(sortByDate));
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Gift className="h-5 w-5 text-pink-500" />;
      case 'marriage_anniversary':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'work_anniversary':
        return <Briefcase className="h-5 w-5 text-green-500" />;
      case 'leaving_anniversary':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: 'today' | 'upcoming' | 'passed') => {
    switch (status) {
      case 'today':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Today
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Upcoming
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Passed
          </span>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { 
      id: 'today', 
      label: 'Today', 
      icon: <Clock className="h-4 w-4" />, 
      count: todayNotifications.length,
      data: todayNotifications,
      color: 'text-red-600'
    },
    { 
      id: 'thisMonth', 
      label: 'This Month', 
      icon: <Calendar className="h-4 w-4" />, 
      count: thisMonthNotifications.length,
      data: thisMonthNotifications,
      color: 'text-blue-600'
    },
    { 
      id: 'birthdays', 
      label: 'Birthdays (All)', 
      icon: <Gift className="h-4 w-4" />, 
      count: allBirthdays.length,
      data: allBirthdays,
      color: 'text-pink-600'
    },
    { 
      id: 'marriage', 
      label: 'Marriage Anniversaries (All)', 
      icon: <Calendar className="h-4 w-4" />, 
      count: allMarriageAnniversaries.length,
      data: allMarriageAnniversaries,
      color: 'text-purple-600'
    },
    { 
      id: 'work', 
      label: 'Work Anniversaries (All)', 
      icon: <Briefcase className="h-4 w-4" />, 
      count: allWorkAnniversaries.length,
      data: allWorkAnniversaries,
      color: 'text-green-600'
    },
    { 
      id: 'leaving', 
      label: 'Leaving Anniversaries (All)', 
      icon: <AlertCircle className="h-4 w-4" />, 
      count: allLeavingAnniversaries.length,
      data: allLeavingAnniversaries,
      color: 'text-orange-600'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const NotificationList = ({ items }: { items: NotificationItem[] }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notifications in this category</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                {getNotificationIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    Employee ID: NIC-{item.employee.employeeId?.padStart(3, '0')}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {format(item.date, 'MMM dd, yyyy')}
                </p>
                {getStatusBadge(item.status)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <DashboardLayout title="Notifications">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left Sidebar - Tabs */}
        <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-600">Employee events and important dates</p>
            {todayNotifications.length > 0 && (
              <div className="mt-3 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-800 text-sm font-medium">
                    {todayNotifications.length} event{todayNotifications.length !== 1 ? 's' : ''} today
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={activeTab === tab.id ? tab.color : 'text-gray-400'}>
                      {tab.icon}
                    </div>
                    <span className="text-sm font-medium truncate">{tab.label}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className={activeTabData?.color || 'text-gray-600'}>
                {activeTabData?.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {activeTabData?.label}
              </h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium flex-shrink-0">
                {activeTabData?.count || 0} items
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <NotificationList items={activeTabData?.data || []} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}