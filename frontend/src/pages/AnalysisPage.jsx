import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import ChatBox from '../components/ChatBox'

export default function AnalysisPage({ analysisData, sessionId }) {
  const navigate = useNavigate()
  const [showChat, setShowChat] = useState(false)

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-12 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No analysis data available</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-blue-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const matchScoreData = [
    { name: 'Your Match', value: analysisData.match_score, fill: '#3b82f6' },
    { name: 'Remaining', value: 10 - analysisData.match_score, fill: '#e5e7eb' }
  ]

  const skillsData = [
    { name: 'Matched', value: analysisData.skills_match.matched_count, fill: '#10b981' },
    { name: 'Missing', value: analysisData.skills_match.missing_count, fill: '#ef4444' },
    { name: 'Extra', value: analysisData.skills_match.extra_skills.length, fill: '#f59e0b' }
  ]

  const skillsMatchPercentage = analysisData.skills_match.match_percentage

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-blue-100 font-semibold mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Analysis Results</h1>
                <p className="text-gray-600">Your job readiness assessment</p>
              </div>
              <button
                onClick={() => setShowChat(!showChat)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <MessageCircle size={20} />
                {showChat ? 'Hide Chat' : 'Ask AI Advisor'}
              </button>
            </div>

            {/* MATCH SCORE CARD */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-600">
                <p className="text-gray-600 text-sm font-semibold mb-2">OVERALL MATCH</p>
                <p className="text-5xl font-bold text-blue-600 mb-2">
                  {analysisData.match_score}/10
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {analysisData.match_level}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-600">
                <p className="text-gray-600 text-sm font-semibold mb-2">SKILLS MATCH</p>
                <p className="text-5xl font-bold text-green-600 mb-2">
                  {analysisData.skills_match.matched_count}/{analysisData.skills_match.total_required}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {skillsMatchPercentage}% Match
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-600">
                <p className="text-gray-600 text-sm font-semibold mb-2">ACTIONABLE TIP</p>
                <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                  {analysisData.actionable_tip}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Match Score</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={matchScoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {matchScoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Skills Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {analysisData.hybrid_analysis?.readiness_breakdown && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Readiness Assessment</h2>
            <div className="space-y-6">
              {analysisData.hybrid_analysis.readiness_breakdown.map((item, idx) => (
                <div key={idx} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{item.area}</p>
                      <p className={`text-sm font-semibold ${
                        item.status === 'Strong' ? 'text-green-600' :
                        item.status === 'Moderate' ? 'text-yellow-600' :
                        item.status === 'Excellent' ? 'text-green-600' :
                        item.status === 'Good' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {item.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{item.percentage}%</p>
                      <p className="text-xs text-gray-600">{item.current} of {item.required}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        item.status === 'Strong' || item.status === 'Excellent' ? 'bg-green-500' :
                        item.status === 'Moderate' || item.status === 'Good' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisData.hybrid_analysis?.strength_visualization?.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Strengths & Advantages</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {analysisData.hybrid_analysis.strength_visualization.map((item, idx) => (
                <div key={idx} className="p-6 rounded-lg border-l-4" style={{ borderColor: item.color, backgroundColor: item.color + '15' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color }}>
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{item.strength}</p>
                      <p className="text-xs font-semibold mt-1" style={{ color: item.color }}>
                        {item.type}
                      </p>
                      {item.evidence && (
                        <p className="text-sm text-gray-600 mt-2">{item.evidence}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisData.hybrid_analysis?.gap_visualization?.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Skills to Develop</h2>
            <div className="space-y-4">
              {analysisData.hybrid_analysis.gap_visualization.map((item, idx) => (
                <div key={idx} className="p-6 rounded-lg border-l-4" style={{ borderColor: item.color, backgroundColor: item.color + '15' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{item.skill}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.recommendation}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: item.color, color: 'white' }}>
                      {item.priority} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Detailed Analysis & Insights</h2>
          
          {analysisData.deepseek_analysis?.structured_insights && (
            <>
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Assessment Summary</h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-600">
                  <p className="text-gray-800 mb-3">{analysisData.deepseek_analysis.structured_insights.summary}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {analysisData.deepseek_analysis.structured_insights.readiness_percentage || 0}%
                      </p>
                      <p className="text-sm text-gray-600">Readiness Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-800">
                        {analysisData.deepseek_analysis.structured_insights.fit_level}
                      </p>
                      <p className="text-sm text-gray-600">Fit Level</p>
                    </div>
                  </div>
                </div>
              </div>

              {analysisData.deepseek_analysis.structured_insights.key_strengths?.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Key Strengths</h3>
                  <div className="space-y-3">
                    {analysisData.deepseek_analysis.structured_insights.key_strengths.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <span className="text-green-600 font-bold text-lg">✓</span>
                        <div>
                          <p className="font-semibold text-gray-800">{item.strength}</p>
                          <p className="text-sm text-gray-600">{item.evidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisData.deepseek_analysis.structured_insights.critical_gaps?.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas to Improve</h3>
                  <div className="space-y-3">
                    {analysisData.deepseek_analysis.structured_insights.critical_gaps.map((item, idx) => (
                      <div key={idx} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-800">{item.gap}</p>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            item.priority === 'High' 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{item.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisData.deepseek_analysis.structured_insights.learning_path?.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Learning Roadmap</h3>
                  <div className="space-y-3">
                    {analysisData.deepseek_analysis.structured_insights.learning_path.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{item.skill}</p>
                          <p className="text-sm text-gray-600">{item.timeline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisData.deepseek_analysis.structured_insights.quick_wins?.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Wins (Do These First)</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {analysisData.deepseek_analysis.structured_insights.quick_wins.map((win, idx) => (
                      <div key={idx} className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-800 font-medium">{win}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisData.deepseek_analysis.structured_insights.next_steps?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Immediate Next Steps</h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-600">
                    <ol className="space-y-2">
                      {analysisData.deepseek_analysis.structured_insights.next_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="font-bold text-green-600 flex-shrink-0">{idx + 1}.</span>
                          <span className="text-gray-800">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Gap Analysis</h2>
          {analysisData.gap_analysis.length > 0 ? (
            <div className="space-y-4">
              {analysisData.gap_analysis.map((gap, idx) => (
                <div key={idx} className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{gap.skill}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      gap.severity === 'high' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {gap.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{gap.recommendation}</p>
                  {gap.transferable_skills.length > 0 && (
                    <p className="text-sm text-gray-600">
                      <strong>Transferable skills:</strong> {gap.transferable_skills.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No significant gaps found!</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Matched Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysisData.skills_match.matched_skills.map((skill, idx) => (
                <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysisData.skills_match.missing_skills.slice(0, 10).map((skill, idx) => (
                <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Extra Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysisData.skills_match.extra_skills.slice(0, 10).map((skill, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHAT BOX */}
      {showChat && sessionId && (
        <ChatBox sessionId={sessionId} onClose={() => setShowChat(false)} />
      )}
    </div>
  )
}
