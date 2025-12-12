import PyPDF2
from docx import Document
import re
from typing import Union
import io


def parse_resume(content: bytes, filename: str) -> str:
    if filename.lower().endswith('.pdf'):
        return parse_pdf(content)
    elif filename.lower().endswith('.docx'):
        return parse_docx(content)
    elif filename.lower().endswith('.txt'):
        return content.decode('utf-8')
    else:
        raise ValueError(f"Unsupported file format: {filename}")



def parse_job_description(content: bytes, filename: str) -> str:
    if filename.lower().endswith('.pdf'):
        return parse_pdf(content)
    elif filename.lower().endswith('.docx'):
        return parse_docx(content)
    elif filename.lower().endswith('.txt'):
        return content.decode('utf-8')
    else:
        raise ValueError(f"Unsupported file format: {filename}")



def parse_pdf(content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise ValueError(f"Error parsing PDF: {str(e)}")



def parse_docx(content: bytes) -> str:
    try:
        doc = Document(io.BytesIO(content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        raise ValueError(f"Error parsing DOCX: {str(e)}")



def extract_skills(text: str) -> list:
    skills_keywords = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'golang', 'rust',
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'express', 'django', 'flask', 'fastapi',
        'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
        'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'heroku',
        'git', 'github', 'gitlab', 'bitbucket',
        'html', 'css', 'sass', 'tailwind',
        'rest', 'graphql', 'websocket',
        'machine learning', 'deep learning', 'nlp', 'computer vision',
        'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
        'agile', 'scrum', 'jira', 'confluence',
        'ci/cd', 'jenkins', 'github actions', 'gitlab ci',
        'linux', 'windows', 'macos',
        'api', 'microservices', 'serverless', 'lambda',
        'testing', 'jest', 'pytest', 'mocha', 'unittest',
        'communication', 'leadership', 'teamwork', 'problem-solving'
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in skills_keywords:
        if skill in text_lower:
            found_skills.append(skill)
    return list(set(found_skills))



def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*years?\s+of\s+experience',
        r'(\d+)\+?\s*yrs?\s+experience',
        r'(\d+)\+?\s*years?\s+(?:in|with)',
        r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience',
        r'(\d+)\+?\s*years?\s+(?:as|working)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    
    return 0
