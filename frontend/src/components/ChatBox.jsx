import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, X, Loader } from 'lucide-react'

const formatMessage = (content) => {
  if (!content) return ''
  
  let formatted = content
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*(?!\s)/g, '') 
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`/g, '') 
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[-_]{3,}/g, '')
    .replace(/\n\n\n+/g, '\n\n')
  
  return formatted.trim()
}

export default function ChatBox({ sessionId, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        session_id: sessionId
      })

      const assistantMessage = {
        role: 'assistant',
        content: formatMessage(response.data.response)
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-full md:w-96 h-[90vh] md:h-[600px] rounded-xl shadow-2xl bg-white flex flex-col z-50 border border-gray-200">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 flex items-center justify-between rounded-t-xl">
        <div>
          <h3 className="font-bold text-lg">AI Career Advisor</h3>
          <p className="text-xs text-blue-100">Ask about your job fit & career growth</p>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-3xl mb-3">💬</p>
            <p className="font-semibold mb-2 text-gray-700">Welcome to Career Advisor!</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ask me questions about:
            </p>
            <ul className="text-xs text-gray-600 mt-3 space-y-1">
              <li>• Your job readiness</li>
              <li>• Skills to learn</li>
              <li>• Career growth tips</li>
              <li>• How to improve your fit</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-sm px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm'
              }`}
            >
              <p className={`${msg.role === 'user' ? 'text-sm' : 'text-sm leading-relaxed'} whitespace-pre-wrap font-medium`}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-3 rounded-lg rounded-bl-none border border-gray-200 flex items-center gap-2 shadow-sm">
              <Loader size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Type your question..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
