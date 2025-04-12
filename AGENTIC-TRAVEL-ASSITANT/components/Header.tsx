"use client";

import { FaPlane } from "react-icons/fa";
import Link from "next/link";

const Header = () => {
  return (
    <header className="py-5 border-b border-tan-200 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <FaPlane className="text-primary text-2xl" />
          <h1 className="text-2xl font-heading font-bold text-primary">AI Travel Planner</h1>
        </Link>
        <nav>
          <ul className="flex items-center gap-6">
            <li>
              <Link href="/" className="text-dark hover:text-primary transition-colors font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link href="#" className="text-dark hover:text-primary transition-colors font-medium">
                About
              </Link>
            </li>
            <li>
              <Link href="#" className="btn btn-primary shadow-md">
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
