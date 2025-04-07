import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <header className="w-full bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-4 shadow-lg sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <span className="text-blue-300 mr-1">Ex</span>
          <span className="text-white">News</span>
        </Link>
        <nav className="flex items-center">
          <ul className="flex space-x-6">
            <li className="relative">
              <Link 
                href="/" 
                className={`${currentPath === '/' ? 'active' : ''}`}
              >
                홈
              </Link>
            </li>
            <li className="relative">
              <Link 
                href="/restaurants" 
                className={`${currentPath === '/restaurants' ? 'active' : ''}`}
              >
                맛집
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-300 rounded-full"></span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 