from typing import Dict, List, Any
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .document_parser import extract_skills, extract_experience_years
from .deepseek_service import DeepseekService
import re
import os
import asyncio

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMER = True
except ImportError:
    HAS_SENTENCE_TRANSFORMER = False

class AnalysisService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.common_skills = self._load_common_skills()
        self.deepseek_service = DeepseekService()
        
        self.semantic_model = None
        if HAS_SENTENCE_TRANSFORMER:
            try:
                self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Warning: Could not load semantic model: {e}")
                self.semantic_model = None
    


    def _load_common_skills(self) -> Dict[str, List[str]]:
        return {
            "languages": ["python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", "golang", "rust", "r", "scala"],
            "frontend": ["react", "vue", "angular", "svelte", "next.js", "nuxt", "html", "css", "sass", "tailwind", "bootstrap"],
            "backend": ["express", "django", "flask", "fastapi", "spring", "laravel", "rails", "asp.net"],
            "databases": ["sql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "dynamodb", "cassandra"],
            "devops": ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins", "github actions", "terraform"],
            "ai_ml": ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "scikit-learn", "keras"],
            "tools": ["git", "github", "gitlab", "jira", "confluence", "slack", "figma"],
        }
    


    async def analyze(self, resume_text: str, job_description_text: str) -> Dict[str, Any]:
        resume_skills = extract_skills(resume_text)
        jd_skills = extract_skills(job_description_text)
        resume_experience = extract_experience_years(resume_text)
        
        gap_analysis = self._perform_gap_analysis(resume_skills, jd_skills, resume_text, job_description_text)
        
        strengths = self._extract_strengths(resume_skills, jd_skills, resume_text, job_description_text)
        
        recommendations = self._generate_recommendations(gap_analysis, resume_skills, jd_skills)
        
        actionable_tip = self._generate_actionable_tip(resume_text, job_description_text, resume_skills, jd_skills)
        
        skills_match = self._analyze_skills_match(resume_skills, jd_skills)
        
        deepseek_analysis = await self._get_deepseek_detailed_analysis(resume_text, job_description_text, resume_skills, jd_skills, gap_analysis)
        
        # HYBRID SCORE CALCULATION
        hf_match_score = self._calculate_match_score(resume_text, job_description_text, resume_skills, jd_skills)
        deepseek_readiness = deepseek_analysis.get("structured_insights", {}).get("readiness_percentage", 50)
        
        hf_score_normalized = (hf_match_score / 10) * 100
        combined_match_score = (hf_score_normalized * 0.35) + (deepseek_readiness * 0.65)
        final_match_score = (combined_match_score / 100) * 10 
        match_level = self._get_match_level(final_match_score)
        
        hybrid_analysis = self._perform_hybrid_analysis(
            hf_strengths=strengths,
            hf_gaps=gap_analysis,
            hf_match_score=hf_match_score,
            deepseek_insights=deepseek_analysis.get("structured_insights", {}),
            resume_skills=resume_skills,
            jd_skills=jd_skills
        )
        
        return {
            "match_score": round(final_match_score, 1),
            "match_level": match_level,
            "skills_match": skills_match,
            "gap_analysis": gap_analysis,
            "strengths": strengths,
            "recommendations": recommendations,
            "actionable_tip": actionable_tip,
            "deepseek_analysis": deepseek_analysis,
            "hybrid_analysis": hybrid_analysis,
            "resume_skills_count": len(resume_skills),
            "jd_skills_count": len(jd_skills),
            "matched_skills_count": len(set(resume_skills) & set(jd_skills))
        }
    


    def _calculate_match_score(self, resume_text: str, jd_text: str, resume_skills: List[str], jd_skills: List[str]) -> float:
        scores = []
        
        if len(jd_skills) > 0:
            skill_match_ratio = len(set(resume_skills) & set(jd_skills)) / len(jd_skills)
        else:
            skill_match_ratio = 0
        scores.append(skill_match_ratio * 4)
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform([resume_text, jd_text])
            tfidf_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        except:
            tfidf_similarity = 0
        scores.append(tfidf_similarity * 3)
        
        semantic_similarity = 0
        if self.semantic_model:
            try:
                resume_embedding = self.semantic_model.encode(resume_text[:500], convert_to_tensor=False)
                jd_embedding = self.semantic_model.encode(jd_text[:500], convert_to_tensor=False)
                semantic_similarity = float(cosine_similarity([resume_embedding], [jd_embedding])[0][0])
            except Exception as e:
                print(f"Semantic similarity error: {e}")
                semantic_similarity = 0
        scores.append(semantic_similarity * 2)
        
        important_keywords = self._extract_important_keywords(jd_text)
        keyword_match = sum(1 for kw in important_keywords if kw.lower() in resume_text.lower()) / max(len(important_keywords), 1)
        scores.append(keyword_match * 1)
        
        score = sum(scores)
        return min(10, max(0, score))
    


    def _get_match_level(self, score: float) -> str:
        if score >= 8:
            return "Strong Match"
        elif score >= 6:
            return "Good Match"
        elif score >= 4:
            return "Moderate Match"
        elif score >= 2:
            return "Weak Match"
        else:
            return "Poor Match"
    


    def _perform_gap_analysis(self, resume_skills: List[str], jd_skills: List[str], resume_text: str, jd_text: str) -> List[Dict[str, Any]]:
        gaps = []
        missing_skills = set(jd_skills) - set(resume_skills)
        
        for skill in missing_skills:
            transferable = self._find_transferable_skills(skill, resume_skills)
            
            gaps.append({
                "skill": skill,
                "severity": "high" if skill in self._get_critical_skills(jd_text) else "medium",
                "transferable_skills": transferable,
                "recommendation": f"Consider learning {skill} or highlight related experience in {', '.join(transferable) if transferable else 'similar technologies'}"
            })
        
        return gaps[:10]
    


    def _extract_strengths(self, resume_skills: List[str], jd_skills: List[str], resume_text: str, jd_text: str) -> List[str]:
        strengths = []
        matched_skills = set(resume_skills) & set(jd_skills)
        
        for skill in list(matched_skills)[:5]:
            strengths.append(f"You have experience with {skill}, which is required for this role")
        
        if any(word in resume_text.lower() for word in ['led', 'managed', 'directed', 'spearheaded']):
            strengths.append("You demonstrate leadership experience")
        
        if any(word in resume_text.lower() for word in ['project', 'developed', 'built', 'created']):
            strengths.append("You have hands-on project experience")
        
        return strengths[:5]
    


    def _generate_recommendations(self, gap_analysis: List[Dict[str, Any]], resume_skills: List[str], jd_skills: List[str]) -> List[str]:
        recommendations = []
        
        high_priority_gaps = [g for g in gap_analysis if g['severity'] == 'high']
        if high_priority_gaps:
            skills_str = ', '.join([g['skill'] for g in high_priority_gaps[:3]])
            recommendations.append(f"Focus on learning these critical skills: {skills_str}")
        
        matched_count = len(set(resume_skills) & set(jd_skills))
        if matched_count < len(jd_skills) * 0.5:
            recommendations.append("Expand your technical skill set to better match job requirements")
        
        recommendations.append("Highlight projects that demonstrate the required skills")
        recommendations.append("Consider taking online courses for missing critical skills")
        
        return recommendations[:5]
    


    def _generate_actionable_tip(self, resume_text: str, jd_text: str, resume_skills: List[str], jd_skills: List[str]) -> str:
        missing_skills = set(jd_skills) - set(resume_skills)
        
        if missing_skills:
            most_important = list(missing_skills)[0]
            return f"The job description emphasizes '{most_important}' but your resume doesn't mention it. If you have experience with this, add a specific project or achievement that demonstrates your proficiency."
        
        matched_skills = set(resume_skills) & set(jd_skills)
        if matched_skills:
            top_skill = list(matched_skills)[0]
            return f"Your '{top_skill}' experience is a strong match. Consider adding a specific project or achievement that showcases this skill prominently in your resume."
        
        return "Review the job description carefully and ensure your resume clearly demonstrates how your experience aligns with each key requirement."
    


    def _analyze_skills_match(self, resume_skills: List[str], jd_skills: List[str]) -> Dict[str, Any]:
        
        matched = set(resume_skills) & set(jd_skills)
        missing = set(jd_skills) - set(resume_skills)
        extra = set(resume_skills) - set(jd_skills)
        
        return {
            "matched_skills": list(matched),
            "missing_skills": list(missing),
            "extra_skills": list(extra),
            "match_percentage": round((len(matched) / max(len(jd_skills), 1)) * 100, 1),
            "matched_count": len(matched),
            "missing_count": len(missing),
            "total_required": len(jd_skills)
        }
    


    def _find_transferable_skills(self, skill: str, resume_skills: List[str]) -> List[str]:

        skill_relationships = {
            "docker": ["kubernetes", "devops", "ci/cd"],
            "aws": ["azure", "gcp", "cloud"],
            "react": ["vue", "angular", "javascript", "frontend"],
            "python": ["java", "javascript", "programming"],
            "sql": ["mongodb", "databases", "data"],
        }
        
        transferable = skill_relationships.get(skill.lower(), [])
        return [s for s in transferable if s in resume_skills]
    


    def _get_critical_skills(self, jd_text: str) -> List[str]:

        critical_indicators = ['required', 'must have', 'essential', 'critical']
        critical_skills = []
        
        lines = jd_text.split('\n')
        for line in lines:
            if any(indicator in line.lower() for indicator in critical_indicators):
                words = line.split()
                critical_skills.extend(words)
        
        return critical_skills[:5]
    


    def _extract_important_keywords(self, text: str) -> List[str]:
        keywords = [
            'experience', 'skills', 'required', 'responsibilities', 'qualifications',
            'develop', 'design', 'implement', 'manage', 'lead', 'collaborate'
        ]
        
        found = [kw for kw in keywords if kw in text.lower()]
        return found
    


    async def _get_deepseek_detailed_analysis(self, resume_text: str, job_description_text: str, 
                                              resume_skills: List[str], jd_skills: List[str], 
                                              gap_analysis: List[Dict]) -> Dict[str, Any]:
        try:
            missing_skills = [g['skill'] for g in gap_analysis[:5]]
            matched_skills = list(set(resume_skills) & set(jd_skills))
            
            prompt = f"""Analyze this job fit and respond ONLY with valid JSON (no markdown, no extra text).

Resume Skills: {', '.join(resume_skills[:15]) if resume_skills else 'None'}
Required Skills: {', '.join(jd_skills[:15]) if jd_skills else 'None'}
Matched: {', '.join(matched_skills) if matched_skills else 'None'}
Missing: {', '.join(missing_skills) if missing_skills else 'None'}

Resume excerpt: {resume_text[:800]}
Job excerpt: {job_description_text[:800]}

Return ONLY this JSON structure (no other text):
{{
  "fit_score": <0-100>,
  "fit_level": "<Excellent/Good/Moderate/Needs Work>",
  "summary": "<2 sentence summary of fit>",
  "key_strengths": [
    {{"strength": "<strength>", "evidence": "<brief evidence from resume>"}}
  ],
  "critical_gaps": [
    {{"gap": "<skill/experience>", "priority": "<High/Medium>", "solution": "<how to address>"}}
  ],
  "learning_path": [
    {{"step": <1-3>, "skill": "<skill>", "timeline": "<timeframe>"}}
  ],
  "quick_wins": ["<achievable improvement>"],
  "readiness_percentage": <0-100>,
  "next_steps": ["<specific action>"]
}}"""

            response = await self.deepseek_service.chat(
                messages=[{"role": "user", "content": prompt}],
                context=None
            )
            
            try:
                json_str = response
                if "```json" in response:
                    json_str = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    json_str = response.split("```")[1].split("```")[0]
                
                structured_data = json.loads(json_str.strip())
                return {
                    "structured_insights": structured_data,
                    "analysis_source": "AI Analysis",
                    "timestamp": str(__import__('datetime').datetime.now())
                }
            except json.JSONDecodeError:
                return {
                    "structured_insights": {
                        "summary": response[:500],
                        "fit_score": 0,
                        "key_strengths": [],
                        "critical_gaps": [],
                        "learning_path": [],
                        "next_steps": ["Unable to parse detailed analysis. Please review the summary above."]
                    },
                    "analysis_source": "AI Analysis",
                    "timestamp": str(__import__('datetime').datetime.now())
                }
        except Exception as e:
            print(f"Error getting Deepseek analysis: {e}")
            return {
                "structured_insights": {
                    "summary": "Unable to fetch AI analysis at this moment. Please try again.",
                    "fit_score": 0,
                    "key_strengths": [],
                    "critical_gaps": [],
                    "learning_path": [],
                    "next_steps": []
                },
                "analysis_source": "Error",
                "error": str(e)
            }
    


    def _perform_hybrid_analysis(self, hf_strengths: List[str], hf_gaps: List[Dict], 
                                 hf_match_score: float, deepseek_insights: Dict,
                                 resume_skills: List[str], jd_skills: List[str]) -> Dict[str, Any]:

        matched_skills = list(set(resume_skills) & set(jd_skills))
        missing_skills = [g['skill'] for g in hf_gaps[:5]]
        
        hf_match_percentage = (len(matched_skills) / len(jd_skills) * 100) if jd_skills else 0
        deepseek_readiness = deepseek_insights.get("readiness_percentage", 0)
        
        readiness_breakdown = self._create_readiness_breakdown(
            hf_strengths, hf_gaps, deepseek_insights, matched_skills, missing_skills
        )
        
        gap_visualization = self._create_gap_visualization(hf_gaps, missing_skills)
        
        strength_visualization = self._create_strength_visualization(hf_strengths, deepseek_insights)
        
        return {
            "readiness_breakdown": readiness_breakdown,
            "gap_visualization": gap_visualization,
            "strength_visualization": strength_visualization,
            "matched_count": len(matched_skills),
            "missing_count": len(missing_skills),
            "total_required": len(jd_skills),
            "match_percentage": round(hf_match_percentage, 1),
            "ai_readiness": deepseek_readiness
        }
    


    def _create_readiness_breakdown(self, hf_strengths: List[str], hf_gaps: List[Dict],
                                    deepseek_insights: Dict, matched_skills: List[str],
                                    missing_skills: List[str]) -> Dict[str, Any]:
        readiness_areas = []
        
        readiness_areas.append({
            "area": "Technical Skills",
            "current": len(matched_skills),
            "required": len(matched_skills) + len(missing_skills),
            "percentage": round((len(matched_skills) / (len(matched_skills) + len(missing_skills)) * 100) if (len(matched_skills) + len(missing_skills)) > 0 else 0, 1),
            "status": "Strong" if len(matched_skills) / (len(matched_skills) + len(missing_skills)) >= 0.7 else "Moderate" if len(matched_skills) / (len(matched_skills) + len(missing_skills)) >= 0.5 else "Needs Work"
        })

        exp_gaps = len([g for g in hf_gaps if 'experience' in g.get('skill', '').lower()])
        readiness_areas.append({
            "area": "Experience Level",
            "current": max(0, len(hf_strengths) - exp_gaps),
            "required": len(hf_strengths),
            "percentage": round((max(0, len(hf_strengths) - exp_gaps) / len(hf_strengths) * 100) if hf_strengths else 0, 1),
            "status": "Strong" if exp_gaps == 0 else "Moderate" if exp_gaps <= 2 else "Needs Work"
        })
        
        domain_gaps = len([g for g in hf_gaps if g.get('severity') == 'high'])
        readiness_areas.append({
            "area": "Domain Knowledge",
            "current": len(hf_gaps) - domain_gaps,
            "required": len(hf_gaps),
            "percentage": round(((len(hf_gaps) - domain_gaps) / len(hf_gaps) * 100) if hf_gaps else 100, 1),
            "status": "Strong" if domain_gaps == 0 else "Moderate" if domain_gaps <= 2 else "Needs Work"
        })
        
        ai_readiness = deepseek_insights.get("readiness_percentage", 0)
        readiness_areas.append({
            "area": "Overall Readiness",
            "current": ai_readiness,
            "required": 100,
            "percentage": ai_readiness,
            "status": "Excellent" if ai_readiness >= 80 else "Good" if ai_readiness >= 60 else "Moderate" if ai_readiness >= 40 else "Needs Work"
        })
        
        return readiness_areas
    


    def _create_gap_visualization(self, hf_gaps: List[Dict], missing_skills: List[str]) -> List[Dict]:
        gaps_data = []
        
        high_priority = [g for g in hf_gaps if g.get('severity') == 'high'][:3]
        medium_priority = [g for g in hf_gaps if g.get('severity') == 'medium'][:2]
        
        for gap in high_priority:
            gaps_data.append({
                "skill": gap.get('skill', 'Unknown'),
                "priority": "High",
                "recommendation": gap.get('recommendation', ''),
                "color": "#ef4444"
            })
        
        for gap in medium_priority:
            gaps_data.append({
                "skill": gap.get('skill', 'Unknown'),
                "priority": "Medium",
                "recommendation": gap.get('recommendation', ''),
                "color": "#f59e0b"
            })
        
        return gaps_data
    


    def _create_strength_visualization(self, hf_strengths: List[str], deepseek_insights: Dict) -> List[Dict]:
        strengths_data = []
        
        for strength in hf_strengths[:3]:
            strengths_data.append({
                "strength": strength,
                "type": "Skill Match",
                "color": "#10b981"
            })
        
        deepseek_strengths = deepseek_insights.get("key_strengths", [])
        for item in deepseek_strengths[:2]:
            strengths_data.append({
                "strength": item.get("strength", ""),
                "type": "AI Assessment",
                "evidence": item.get("evidence", ""),
                "color": "#3b82f6"
            })
        
        return strengths_data
    

    
    def _categorize_skills(self, resume_skills: List[str], jd_skills: List[str]) -> List[Dict]:
        categories = {}
        common_skills = self._load_common_skills()
        
        for category, skills_list in common_skills.items():
            matched = [s for s in resume_skills if s.lower() in [sk.lower() for sk in skills_list]]
            required = [s for s in jd_skills if s.lower() in [sk.lower() for sk in skills_list]]
            
            if required:
                categories[category] = {
                    "category": category.replace("_", " ").title(),
                    "matched": len(matched),
                    "required": len(required),
                    "percentage": round((len(matched) / len(required) * 100) if required else 0, 1)
                }
        
        return list(categories.values())
