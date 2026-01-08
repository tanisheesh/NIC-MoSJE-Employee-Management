import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import Link from 'next/link';
import { Users, Shield, Calendar, BarChart3, Award, Globe, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      
      {/* Hero Section with Images */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">
                Digital Employee Management
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-6 sm:mb-8 text-blue-100">
                Empowering government organizations with modern workforce management solutions under the Digital India initiative
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base">Secure and compliant employee data management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base">Streamlined digital workflows and processes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base">Comprehensive document management system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm sm:text-base">Real-time notifications and analytics</span>
                </div>
              </div>
            </div>
            
            {/* Placeholder for Hero Image */}
            <div className="hidden lg:block">
              <div className="bg-white bg-opacity-10 rounded-lg p-6 lg:p-8 backdrop-blur-sm">
                <div className="aspect-video bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="h-12 lg:h-16 w-12 lg:w-16 mx-auto mb-4 text-white" />
                    <p className="text-white text-base lg:text-lg">Digital India Initiative</p>
                    <p className="text-blue-100 text-sm mt-2">Transforming Government Services</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Solutions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides end-to-end employee management capabilities designed for modern government organizations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Users className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Employee Profiles</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Comprehensive employee database with personal, professional, and contact information management
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Shield className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Secure Access</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Role-based access control ensuring data security with separate admin and employee portals
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FileText className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Document Management</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Digital document storage with approval workflows and automated PDF conversion
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Calendar className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Smart Notifications</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Automated reminders for birthdays, work anniversaries, and important milestones
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <BarChart3 className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Analytics Dashboard</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Real-time insights and reporting capabilities for informed decision making
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Award className="h-10 sm:h-12 w-10 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Compliance Ready</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Built-in compliance features ensuring adherence to government regulations and standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Government Initiatives Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
                Supporting Digital India
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                Our platform aligns with the Digital India initiative, promoting paperless governance and digital empowerment across government organizations.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm sm:text-base">Paperless document management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm sm:text-base">Digital workflow automation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm sm:text-base">Secure cloud infrastructure</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm sm:text-base">Mobile-first accessibility</span>
                </div>
              </div>
            </div>
            
            {/* Placeholder for Government Logo/Image */}
            <div className="text-center mt-8 lg:mt-0">
              <div className="bg-blue-50 rounded-lg p-6 sm:p-8">
                <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-16 sm:h-20 lg:h-24 w-16 sm:w-20 lg:w-24 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Government Certified</h3>
                <p className="text-gray-600 text-sm sm:text-base">Compliant with government standards and security protocols</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}