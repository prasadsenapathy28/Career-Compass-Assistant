import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                onAnalysisComplete={(data, id) => {
                  setAnalysisData(data)
                  setSessionId(id)
                }}
              />
            } 
          />
          <Route 
            path="/analysis" 
            element={
              <AnalysisPage 
                analysisData={analysisData} 
                sessionId={sessionId}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
