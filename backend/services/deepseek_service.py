import os
import aiohttp
from typing import List, Dict, Any, Optional
import json

class DeepseekService:
    def __init__(self):
        self.api_key = "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"
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "tngtech/deepseek-r1t2-chimera:free"
    


    async def chat(self, messages: List[Dict[str, str]], context: Optional[Dict[str, str]] = None) -> str:
        if not self.api_key:
            return "OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable."
        
        system_message = self._prepare_system_message(context)
        
        api_messages = [{"role": "system", "content": system_message}]
        api_messages.extend(messages)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://careercompass.app",
                        "X-Title": "Career Compass"
                    },
                    json={
                        "model": self.model,
                        "messages": api_messages,
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data['choices'][0]['message']['content']
                    else:
                        error_text = await response.text()
                        return f"Error from OpenRouter API: {response.status} - {error_text}"
        except Exception as e:
            return f"Error communicating with OpenRouter: {str(e)}"
    


    def _prepare_system_message(self, context: Optional[Dict[str, str]]) -> str:
        base_message = """You are an expert career advisor and job application specialist. 
You help students understand their job readiness and provide actionable guidance.
Be specific, supportive, and practical in your advice."""
        
        if context and (context.get("resume") or context.get("job_description")):
            base_message += "\n\nContext for this conversation:"
            
            if context.get("resume"):
                resume_preview = context["resume"][:500] + "..." if len(context["resume"]) > 500 else context["resume"]
                base_message += f"\n\nUser's Resume (excerpt):\n{resume_preview}"
            
            if context.get("job_description"):
                jd_preview = context["job_description"][:500] + "..." if len(context["job_description"]) > 500 else context["job_description"]
                base_message += f"\n\nJob Description (excerpt):\n{jd_preview}"
            
            base_message += "\n\nUse this context to provide personalized advice about the user's fit for the role."
        
        return base_message
    

    
    async def analyze_with_deepseek(self, resume_text: str, job_description_text: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"error": "Deepseek API key not configured"}
        
        prompt = f"""Analyze this resume against the job description and provide:
1. A detailed fit assessment (2-3 sentences)
2. Top 3 strengths that match the role
3. Top 3 areas for improvement
4. One specific, actionable tip to strengthen the application

Resume:
{resume_text[:1000]}

Job Description:
{job_description_text[:1000]}

Provide a JSON response with keys: fit_assessment, strengths, improvements, actionable_tip"""
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are a career advisor. Respond in valid JSON format."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1500
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data['choices'][0]['message']['content']
                        
                        try:
                            json_start = response_text.find('{')
                            json_end = response_text.rfind('}') + 1
                            if json_start != -1 and json_end > json_start:
                                json_str = response_text[json_start:json_end]
                                return json.loads(json_str)
                        except:
                            pass
                        
                        return {"raw_analysis": response_text}
                    else:
                        return {"error": f"API error: {response.status}"}
        except Exception as e:
            return {"error": str(e)}
