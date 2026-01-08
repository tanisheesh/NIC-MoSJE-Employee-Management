'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, LogIn, UserPlus, Search } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: React.ComponentType<any>;
}

interface NavItem {
  label: string;
  href: string;
  dropdown: DropdownItem[] | null;
}

const PublicNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = document.getElementById('government-header')?.offsetHeight || 0;
      setIsScrolled(window.scrollY > headerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      dropdown: null
    },
    {
      label: 'About',
      href: '/about',
      dropdown: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Team', href: 'https://www.meity.gov.in/ministry/our-team', external: true },
        { label: 'Our Organizations', href: 'https://www.meity.gov.in/ministry/our-organisation', external: true },
        { label: 'Our Performance', href: 'https://www.meity.gov.in/ministry/our-performance', external: true }
      ]
    },
    {
      label: 'Media',
      href: '/media',
      dropdown: [
        { label: 'Photos', href: 'https://www.meity.gov.in/media', external: true },
        { label: 'Videos', href: 'https://www.meity.gov.in/media/videos', external: true }
      ]
    },
    {
      label: 'Login/Register',
      href: '/login',
      dropdown: [
        { label: 'Login', href: '/login', icon: LogIn },
        { label: 'Register', href: '/register', icon: UserPlus }
      ]
    }
  ];

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  // Accessibility SVG Components
  const SkipToMainIcon = () => (
    <svg width="35" height="31" viewBox="0 0 35 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.0335 5.69397H8.61686C8.04223 5.69397 7.49113 5.92224 7.0848 6.32857C6.67847 6.7349 6.4502 7.286 6.4502 7.86064V12.194H8.08324V7.19397H27.7002V23.694H8.06142V18.694H6.4502V23.0273C6.4502 23.6019 6.67847 24.153 7.0848 24.5594C7.49113 24.9657 8.04223 25.194 8.61686 25.194H27.0335C27.6082 25.194 28.1593 24.9657 28.5656 24.5594C28.9719 24.153 29.2002 23.6019 29.2002 23.0273V7.86064C29.2002 7.286 28.9719 6.7349 28.5656 6.32857C28.1593 5.92224 27.6082 5.69397 27.0335 5.69397ZM10.7835 18.694V16.5754H3.2002V14.694H10.7835V12.194L14.5 15.5L10.7835 18.694ZM24.8669 16H17.2835V14.3606H24.8669V16ZM24.8669 12.194H17.2835V10.694H24.8669V12.194ZM21.6169 20.194H17.2835V18.694H21.6169V20.194Z" fill="#1D0A69"/>
    </svg>
  );

  const TranslationIcon = () => (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.125 3.735V12H12.91V3.735H11.815V2.67H15.685V3.735H14.125ZM8.47 2.52C9.25 2.52 9.845 2.715 10.255 3.105C10.675 3.495 10.885 3.985 10.885 4.575C10.885 5.005 10.77 5.395 10.54 5.745C10.32 6.085 9.99 6.355 9.55 6.555C9.11 6.755 8.56 6.865 7.9 6.885L7.825 5.835C8.505 5.815 8.985 5.695 9.265 5.475C9.555 5.255 9.7 4.96 9.7 4.59C9.7 4.23 9.58 3.97 9.34 3.81C9.11 3.65 8.84 3.57 8.53 3.57C8.16 3.57 7.825 3.62 7.525 3.72C7.225 3.82 6.905 3.955 6.565 4.125L6.19 3.09C6.45 2.95 6.77 2.82 7.15 2.7C7.54 2.58 7.98 2.52 8.47 2.52ZM11.05 8.73C11.05 9.19 10.945 9.575 10.735 9.885C10.525 10.195 10.24 10.425 9.88 10.575C9.53 10.725 9.13 10.8 8.68 10.8C8.11 10.8 7.58 10.66 7.09 10.38C6.61 10.1 6.15 9.655 5.71 9.045C5.28 8.435 4.855 7.64 4.435 6.66L5.5 6.27C5.79 6.98 6.09 7.595 6.4 8.115C6.72 8.625 7.06 9.02 7.42 9.3C7.78 9.57 8.165 9.705 8.575 9.705C8.955 9.705 9.265 9.62 9.505 9.45C9.745 9.27 9.865 8.985 9.865 8.595C9.865 8.115 9.7 7.7 9.37 7.35C9.04 7 8.64 6.68 8.17 6.39L9.055 6.345L9.7 6.21C9.84 6.33 9.995 6.475 10.165 6.645C10.335 6.815 10.47 6.985 10.57 7.155L10.645 7.44C10.775 7.63 10.875 7.83 10.945 8.04C11.015 8.25 11.05 8.48 11.05 8.73ZM11.29 6.75C11.77 6.75 12.185 6.715 12.535 6.645C12.885 6.565 13.295 6.44 13.765 6.27V7.35C13.335 7.54 12.945 7.665 12.595 7.725C12.255 7.785 11.88 7.815 11.47 7.815C11.32 7.815 11.145 7.805 10.945 7.785C10.745 7.755 10.555 7.725 10.375 7.695C10.205 7.655 10.08 7.62 10 7.59L9.295 6.75L9.385 6.525C9.675 6.595 9.98 6.65 10.3 6.69C10.62 6.73 10.95 6.75 11.29 6.75Z" fill="#162F6A"/>
    </svg>
  );

  const AccessibilityIcon = () => (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.10943 11.1626C8.04754 11.1626 7.02744 11.1644 6.00735 11.1608C5.80813 11.1608 5.60625 11.1537 5.41059 11.1217C4.5817 10.9865 3.99295 10.2771 4.00006 9.43694C4.00718 8.61724 4.63684 7.89088 5.44883 7.77442C5.62403 7.74953 5.80279 7.74241 5.98067 7.74241C9.981 7.74064 13.9813 7.73886 17.9817 7.74508C18.2449 7.74508 18.5197 7.76642 18.7688 7.84377C19.5114 8.07403 19.9721 8.78171 19.9223 9.55963C19.8742 10.3118 19.2944 10.9794 18.5446 11.1101C18.2734 11.1572 17.9923 11.1581 17.7158 11.1599C16.7633 11.1652 15.8099 11.1617 14.7613 11.1617C14.82 12.0783 14.7666 12.9816 14.9543 13.8315C15.3945 15.823 15.9548 17.7878 16.4555 19.7659C16.6912 20.6985 16.1994 21.6044 15.3207 21.9032C14.3264 22.241 13.2796 21.6667 13.0279 20.6194C12.6864 19.196 12.368 17.7664 12.039 16.3404C12.0256 16.2817 12.0061 16.2248 11.9243 16.1652C11.7597 16.8818 11.5943 17.5993 11.4289 18.3159C11.2546 19.0724 11.0918 19.8317 10.9033 20.5847C10.6516 21.5867 9.71508 22.1485 8.73768 21.9058C7.79585 21.6711 7.22933 20.7127 7.47746 19.7303C7.92747 17.9451 8.35614 16.1537 8.86397 14.3845C9.16635 13.331 9.08898 12.2774 9.10854 11.1626H9.10943ZM11.9972 8.88306C10.0077 8.88306 8.01819 8.88306 6.0278 8.88306C5.8944 8.88306 5.75921 8.88039 5.62937 8.90173C5.33766 8.94796 5.14556 9.172 5.14289 9.4485C5.14022 9.73032 5.32165 9.94992 5.61692 10.0024C5.73609 10.0237 5.8606 10.0219 5.98244 10.0219C7.01588 10.0237 8.0502 10.0166 9.08364 10.0255C9.68307 10.0308 10.198 10.4051 10.2176 10.9394C10.2505 11.8587 10.3207 12.8011 10.1615 13.6955C9.91074 15.1002 9.48385 16.4737 9.12988 17.8607C8.94846 18.5701 8.75547 19.276 8.58026 19.9873C8.47976 20.3944 8.67898 20.7216 9.05162 20.8087C9.39669 20.8896 9.70708 20.6772 9.81469 20.2851C9.82359 20.2531 9.82625 20.2193 9.83337 20.1873C10.2336 18.435 10.632 16.6827 11.0393 14.9321C11.0865 14.7303 11.1514 14.5178 11.2661 14.3507C11.4636 14.0644 11.7659 13.948 12.1137 14.0129C12.5166 14.0884 12.7522 14.3418 12.8438 14.7392C13.2574 16.5449 13.6736 18.3505 14.089 20.1562C14.0961 20.1882 14.0978 20.2229 14.1058 20.2549C14.2108 20.6709 14.5221 20.895 14.876 20.8114C15.2602 20.7207 15.4479 20.3864 15.3394 19.957C15.0744 18.9142 14.804 17.8722 14.5319 16.8311C14.0578 15.0184 13.5002 13.2252 13.6656 11.3048C13.7385 10.4522 14.1085 10.0237 14.9739 10.021C15.9628 10.0184 16.9527 10.021 17.9417 10.0202C18.0528 10.0202 18.1649 10.0219 18.2734 10.0033C18.5989 9.94814 18.7999 9.70543 18.7821 9.40493C18.7643 9.11244 18.5589 8.91507 18.2334 8.88662C18.1231 8.87684 18.011 8.88039 17.8999 8.88039C15.9326 8.88039 13.9653 8.88039 11.9972 8.88039V8.88306Z" fill="#1D0A69"/>
    </svg>
  );

  return (
    <div className="bg-white shadow-lg">
      {/* Government Header Bar */}
      <div id="government-header" className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Government Logos */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              {/* MeitY Logo */}
              <div className="flex items-center">
                <img 
                  src="/images/logos/meity-logo.png" 
                  alt="Ministry of Electronics and Information Technology" 
                  className="h-8 sm:h-10 lg:h-14 w-auto"
                />
              </div>
              
              {/* MoSJE Logo */}
              <div className="flex items-center">
                <img 
                  src="/images/logos/mosje-logo.png" 
                  alt="Ministry of Social Justice and Empowerment" 
                  className="h-8 sm:h-10 lg:h-14 w-auto"
                />
              </div>
            </div>

            {/* Center - Search Bar (Hidden on mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Search className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>

            {/* Right Side - Digital India Logo and Accessibility */}
            <div className="flex items-center space-x-3 lg:space-x-6">
              {/* Digital India Logo */}
              <div className="flex items-center">
                <img 
                  src="/images/logos/digital-india-logo.png" 
                  alt="Digital India" 
                  className="h-8 sm:h-10 lg:h-14 w-auto"
                />
              </div>
              
              {/* Divider - Hidden on mobile */}
              <div className="hidden sm:block h-6 lg:h-8 w-px bg-gray-300"></div>
              
              {/* Accessibility Buttons - Responsive sizing */}
              <div className="flex items-center space-x-2 lg:space-x-3">
                <button 
                  className="p-1 lg:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Skip to Main Content"
                >
                  <div className="scale-75 lg:scale-100">
                    <SkipToMainIcon />
                  </div>
                </button>
                
                <div className="h-4 lg:h-6 w-px bg-gray-300"></div>
                
                <button 
                  className="p-1 lg:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Translation"
                >
                  <div className="scale-75 lg:scale-100">
                    <TranslationIcon />
                  </div>
                </button>
                
                <div className="h-4 lg:h-6 w-px bg-gray-300"></div>
                
                <button 
                  className="p-1 lg:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Accessibility Features"
                >
                  <div className="scale-75 lg:scale-100">
                    <AccessibilityIcon />
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pr-10 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav 
        id="main-navbar"
        className={`bg-white border-b border-gray-200 transition-all duration-300 ${
          isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : 'relative'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            {navItems.map((item) => (
              <div 
                key={item.label} 
                className="flex-1 relative group"
                onMouseEnter={() => item.dropdown ? setActiveDropdown(item.label) : null}
                onMouseLeave={() => item.dropdown ? setActiveDropdown(null) : null}
              >
                <div className="h-16 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors border-r border-gray-200 last:border-r-0">
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-700 hover:text-black font-medium px-4"
                    onClick={(e) => {
                      if (item.dropdown) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {item.dropdown && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`} />
                    )}
                  </Link>
                </div>

                {/* Dropdown Menu */}
                {item.dropdown && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 right-0 bg-black bg-opacity-70 text-white shadow-lg z-50">
                    <div className="py-2">
                      {item.dropdown.map((dropdownItem) => (
                        dropdownItem.external ? (
                          <a
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-3 hover:bg-black hover:text-white transition-colors"
                          >
                            {dropdownItem.icon && (
                              <dropdownItem.icon className="h-4 w-4 mr-2" />
                            )}
                            <span>{dropdownItem.label}</span>
                          </a>
                        ) : (
                          <Link
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="flex items-center px-4 py-3 hover:bg-black hover:text-white transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {dropdownItem.icon && (
                              <dropdownItem.icon className="h-4 w-4 mr-2" />
                            )}
                            <span>{dropdownItem.label}</span>
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <Link href="/" className="text-lg font-bold text-gray-900">
                Employee Portal
              </Link>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="bg-white border-t border-gray-200">
                {navItems.map((item) => (
                  <div key={item.label}>
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => item.dropdown ? handleDropdownToggle(item.label) : null}
                    >
                      <Link
                        href={item.href}
                        className="flex-1 text-gray-700 hover:text-blue-600 font-medium"
                        onClick={(e) => {
                          if (item.dropdown) {
                            e.preventDefault();
                            handleDropdownToggle(item.label);
                          } else {
                            setIsMobileMenuOpen(false);
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                      {item.dropdown && (
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                          activeDropdown === item.label ? 'rotate-180' : ''
                        }`} />
                      )}
                    </div>

                    {/* Mobile Dropdown */}
                    {item.dropdown && activeDropdown === item.label && (
                      <div className="bg-gray-50">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="flex items-center px-8 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                            onClick={() => {
                              setActiveDropdown(null);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {dropdownItem.icon && (
                              <dropdownItem.icon className="h-4 w-4 mr-2" />
                            )}
                            <span>{dropdownItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close dropdown - Remove this since we're using hover */}
      </nav>
    </div>
  );
};

export default PublicNavbar;