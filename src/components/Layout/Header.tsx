import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="w-full bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <span className="text-blue-300 mr-1">Ex</span>News
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-blue-300 transition-colors duration-200 font-medium">홈</Link>
            </li>
            <li>
              <Link href="/restaurants" className="hover:text-blue-300 transition-colors duration-200 font-medium border-b-2 border-blue-300">맛집</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 