import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="w-full bg-blue-900 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">ExNews</Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:text-blue-300">홈</Link>
            </li>
            <li>
              <Link href="/restaurants" className="hover:text-blue-300">맛집</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 