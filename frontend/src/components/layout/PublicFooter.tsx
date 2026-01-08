'use client';

import React from 'react';

const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Organization Details */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Employee Management System
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                A comprehensive digital platform for efficient workforce management, 
                supporting the Digital India initiative through secure and transparent 
                employee data management solutions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Developed By */}
              <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">
                  Developed By
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p className="font-medium text-white">National Informatics Centre (NIC)</p>
                  <p>Department of Social Justice & Empowerment</p>
                </div>
              </div>
              
              {/* Ministry Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">
                  Ministry
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>Ministry of Social Justice & Empowerment</p>
                  <p>Ministry of Electronics & Information Technology</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">
              Office Address
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p className="font-medium text-white">10th Floor, Antyodaya Bhawan</p>
              <p>CGO Complex, Lodhi Road</p>
              <p>New Delhi - 110003</p>
              <p className="mt-3 text-xs text-gray-400">
                Government of India
              </p>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>
        
        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-gray-300">
            Copyright © {new Date().getFullYear()} Government of India. All rights reserved.
          </p>
          
          {/* System Status - Below Copyright in Faded Colors */}
          <div className="mt-4 flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-300 rounded-full opacity-40 animate-ping"></div>
            </div>
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;