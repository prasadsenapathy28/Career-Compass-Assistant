import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Upload, FileText, Loader } from 'lucide-react'

export default function HomePage({ onAnalysisComplete }) {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumeTab, setResumeTab] = useState('paste')
  const [jdTab, setJdTab] = useState('paste')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jdFileName, setJdFileName] = useState('')

  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setResumeFileName(`${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post('/api/upload-resume', formData)
      setResumeText(response.data.text)
      setError('')
    } catch (err) {
      setError('Error uploading resume: ' + err.message)
      setResumeFileName('')
    }
  }

  const handleJDFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setJdFileName(`${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post('/api/upload-jd', formData)
      setJobDescriptionText(response.data.text)
      setError('')
    } catch (err) {
      setError('Error uploading job description: ' + err.message)
      setJdFileName('')
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescriptionText.trim()) {
      setError('Please provide both resume and job description')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create session
      const sessionFormData = new FormData()
      sessionFormData.append('resume_text', resumeText)
      sessionFormData.append('job_description_text', jobDescriptionText)
      
      const sessionResponse = await axios.post('/api/session/create', sessionFormData)
      const sessionId = sessionResponse.data.session_id

      // Analyze
      const analysisResponse = await axios.post('/api/analyze', {
        resume_text: resumeText,
        job_description_text: jobDescriptionText
      })

      onAnalysisComplete(analysisResponse.data.data, sessionId)
      navigate('/analysis')
    } catch (err) {
      setError('Error analyzing: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl text-white mb-3 tracking-tight">Career Compass</h1>
          <p className="text-lg text-slate-300 mb-2">
            Understand your job readiness and strengthen your applications
          </p>
          <p className="text-slate-400">
            Paste or upload your resume and job description to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="text-blue-400" size={24} />
              </div>
              <h2 className="text-xl text-white">Your Resume</h2>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setResumeTab('paste')}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  resumeTab === 'paste'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setResumeTab('upload')}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  resumeTab === 'upload'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                Upload
              </button>
            </div>

            {resumeTab === 'paste' ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here..."
                className="w-full h-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200 resize-none"
              />
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-blue-500/50 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                {resumeFileName ? (
                  <>
                    <div className="text-green-400 mb-2">✓</div>
                    <p className="text-white font-medium mb-2">{resumeFileName}</p>
                    <label className="cursor-pointer">
                      <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm">
                        Upload another file
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto mb-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" size={40} />
                    <label className="cursor-pointer">
                      <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-slate-500 text-sm mt-2">
                      PDF, DOCX, or TXT
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="text-purple-400" size={24} />
              </div>
              <h2 className="text-xl text-white">Job Description</h2>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setJdTab('paste')}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  jdTab === 'paste'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                Paste
              </button>
              <button
                onClick={() => setJdTab('upload')}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  jdTab === 'upload'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                Upload
              </button>
            </div>

            {jdTab === 'paste' ? (
              <textarea
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-200 resize-none"
              />
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 hover:bg-white/5 transition-all duration-300 cursor-pointer group">
                {jdFileName ? (
                  <>
                    <div className="text-green-400 mb-2">✓</div>
                    <p className="text-white font-medium mb-2">{jdFileName}</p>
                    <label className="cursor-pointer">
                      <span className="text-purple-400 hover:text-purple-300 transition-colors duration-200 text-sm">
                        Upload another file
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleJDFileUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto mb-4 text-slate-400 group-hover:text-purple-400 transition-colors duration-200" size={40} />
                    <label className="cursor-pointer">
                      <span className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleJDFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-slate-500 text-sm mt-2">
                      PDF, DOCX, or TXT
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 mb-8 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-16">
          <button
            onClick={handleAnalyze}
            disabled={loading || !resumeText.trim() || !jobDescriptionText.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white py-4 px-12 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40 flex items-center justify-center gap-3 mx-auto shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-medium text-base"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={22} />
                Analyzing...
              </>
            ) : (
              'Analyze My Fit'
            )}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300 group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
            <h3 className="text-white mb-2">Smart Analysis</h3>
            <p className="text-slate-400 text-sm">Get an intelligent match score based on skills, experience, and keywords</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
            <h3 className="text-white mb-2">Gap Analysis</h3>
            <p className="text-slate-400 text-sm">Identify missing skills and get specific recommendations to improve</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all duration-300 group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">💬</div>
            <h3 className="text-white mb-2">AI Chat</h3>
            <p className="text-slate-400 text-sm">Chat with our AI advisor for personalized career guidance</p>
          </div>
        </div>
      </div>
    </div>
  )
}
