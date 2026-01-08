import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import Link from 'next/link';
import { Users, Target, Award, Globe, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">
              About Us
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
              Empowering digital transformation in government organizations through innovative employee management solutions
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                To revolutionize employee management in government organizations by providing cutting-edge digital solutions that enhance efficiency, transparency, and accessibility while supporting India's Digital India initiative.
              </p>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                We are committed to creating a paperless, secure, and user-friendly platform that empowers both administrators and employees to manage workforce data effectively and efficiently.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Secure and compliant data management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Streamlined digital workflows</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Supporting Digital India vision</span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 lg:mt-0">
              <div className="bg-blue-50 rounded-lg p-6 sm:p-8">
                <Target className="h-16 sm:h-20 lg:h-24 w-16 sm:w-20 lg:w-24 text-blue-600 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Digital Excellence</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Driving innovation in government employee management through technology and best practices
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Vision
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To be the leading digital platform for government employee management, setting new standards for efficiency, security, and user experience in public sector technology solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Employee-Centric</h3>
              <p className="text-gray-600">
                Putting employees at the center of our design philosophy to create intuitive and accessible solutions
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Security First</h3>
              <p className="text-gray-600">
                Implementing robust security measures to protect sensitive employee data and maintain compliance
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Excellence</h3>
              <p className="text-gray-600">
                Continuously improving our platform to deliver exceptional performance and user satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive employee management solutions designed specifically for government organizations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Employee Profiles</h3>
              <p className="text-gray-600">
                Comprehensive employee database with personal, professional, and contact information management
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Document Management</h3>
              <p className="text-gray-600">
                Secure document storage with approval workflows and automated PDF conversion
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Digital Compliance</h3>
              <p className="text-gray-600">
                Built-in compliance features ensuring adherence to government regulations and standards
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Smart Notifications</h3>
              <p className="text-gray-600">
                Automated reminders for birthdays, work anniversaries, and important milestones
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Role-Based Access</h3>
              <p className="text-gray-600">
                Secure access control with separate admin and employee portals for enhanced security
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Real-time insights and reporting capabilities for informed decision making
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}