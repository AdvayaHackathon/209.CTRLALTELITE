"use client";

import { FaPlane } from "react-icons/fa";
import Link from "next/link";

const Header = () => {
  return (
    <header className="py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <FaPlane className="text-primary text-2xl" />
          <h1 className="text-2xl font-bold text-dark">AI Travel Planner</h1>
        </Link>
        <nav>
          <ul className="flex items-center gap-6">
            <li>
              <Link href="/" className="text-dark hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="#" className="text-dark hover:text-primary transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="#" className="btn btn-primary">
                Start Planning
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
