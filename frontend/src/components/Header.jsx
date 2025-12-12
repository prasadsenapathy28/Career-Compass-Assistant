import React from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl text-white hover:text-blue-300 transition-colors duration-200">
          <Compass size={28} />
          <span>Career Compass</span>
        </Link>
      </div>
    </header>
  )
}
