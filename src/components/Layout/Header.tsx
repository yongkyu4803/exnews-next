import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <header className="w-full text-white py-3 shadow-md fixed top-0 left-0 right-0 z-[999]" style={{ background: 'linear-gradient(to right, #1e40af, #3b82f6, #1e40af)' }}>
      <div className="container max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <span className="text-blue-300 mr-1">Ex</span>
          <span className="text-white">News</span>
        </Link>
        <nav className="flex items-center">
          <ul className="flex space-x-6">
            <li>
              <Link 
                href="/" 
                className={`transition-colors duration-200 hover:text-blue-300 ${currentPath === '/' ? 'text-blue-300 font-semibold' : 'text-white'}`}
              >
                홈
              </Link>
            </li>
            <li>
              <Link 
                href="/restaurants" 
                className={`transition-colors duration-200 hover:text-blue-300 ${currentPath === '/restaurants' ? 'text-blue-300 font-semibold relative' : 'text-white'}`}
              >
                맛집
                {currentPath === '/restaurants' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-300 rounded-full"></span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 