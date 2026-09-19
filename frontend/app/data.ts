export const tracks = [
 {slug:'data-science',name:'Data Science',category:'Data & AI',icon:'chart',color:'blue',description:'Turn raw data into real-world insights. Explore, analyze, and tell stories with data.',skills:['Python','Pandas','Visualization'],weeks:8,projects:6},
 {slug:'machine-learning',name:'Machine Learning',category:'Data & AI',icon:'brain',color:'purple',description:'Go from your first prediction to deploying models that solve meaningful problems.',skills:['Scikit-learn','Python','ML models'],weeks:8,projects:8},
 {slug:'web-development',name:'Web Development',category:'Development',icon:'code',color:'orange',description:'Build responsive interfaces and full-stack applications people love to use.',skills:['React','JavaScript','APIs'],weeks:6,projects:6},
 {slug:'python',name:'Python Programming',category:'Development',icon:'terminal',color:'green',description:'Master the fundamentals and bring your ideas to life with practical Python projects.',skills:['Python','Automation','Problem solving'],weeks:6,projects:6},
 {slug:'artificial-intelligence',name:'Artificial Intelligence',category:'Data & AI',icon:'spark',color:'pink',description:'Explore intelligent systems through hands-on computer vision and NLP projects.',skills:['Neural networks','NLP','TensorFlow'],weeks:8,projects:6},
 {slug:'data-analytics',name:'Data Analytics',category:'Data & AI',icon:'pie',color:'cyan',description:'Ask better questions, discover patterns, and turn analysis into better decisions.',skills:['SQL','Excel','Power BI'],weeks:6,projects:6},
 {slug:'generative-ai',name:'AI / Generative AI',category:'Data & AI',icon:'spark',color:'purple',description:'Build useful AI applications with language models, retrieval, and responsible evaluation.',skills:['LLMs','RAG','Prompting'],weeks:8,projects:6},
 {slug:'cybersecurity',name:'Cybersecurity',category:'Security',icon:'shield',color:'blue',description:'Learn to protect systems through safe labs, threat analysis, and security projects.',skills:['Networking','Linux','Security'],weeks:8,projects:6}
];
export type Track = typeof tracks[number];
export const projectNames: Record<string,string[]> = {
 'machine-learning':['Python Data Analysis','Exploratory Data Analysis','Regression Project','Classification Project','Feature Engineering Project','End-to-End ML Project','Deployment Project','Final Capstone'],
 'data-science':['Data Cleaning Pipeline','Exploratory Data Analysis','Statistical Analysis','Predictive Modeling','Data Storytelling Dashboard','Final Capstone'],
 'web-development':['Responsive Portfolio','Interactive Web App','REST API','Full-Stack Application','Deployment Project','Final Capstone'],
 python:['Python Fundamentals','CLI Task Manager','API Data Collector','Automation Toolkit','Tested Python Package','Final Capstone'],
 'artificial-intelligence':['Search Algorithm Lab','Image Classification','Text Classification','Neural Network Project','Model Deployment','Final Capstone'],
 'data-analytics':['Spreadsheet Analysis','SQL Exploration','Business Metrics','Interactive Dashboard','Insights Report','Final Capstone'],
 'generative-ai':['Prompt Evaluation','Model API Application','Document Retrieval','RAG Application','Safety Evaluation','Final Capstone'],
 cybersecurity:['Network Analysis Lab','Linux Hardening Lab','Threat Model','Local Vulnerability Lab','Incident Response Plan','Final Capstone']
};
export function levelFor(i:number,n:number){return i<2?'Beginner':i<n-2?'Intermediate':'Advanced'}
export const resources:Record<string,{label:string,url:string}[]>={
 'data-science':[{label:'Kaggle Learn · data science courses',url:'https://www.kaggle.com/learn'}],
 'machine-learning':[{label:'Google · Machine Learning Crash Course',url:'https://developers.google.com/machine-learning/crash-course'}],
 python:[{label:'Harvard CS50 · Introduction to Programming with Python',url:'https://cs50.harvard.edu/python/'},{label:'Python official tutorial',url:'https://docs.python.org/3/tutorial/'}],
 'artificial-intelligence':[{label:'Harvard CS50 · Artificial Intelligence with Python',url:'https://cs50.harvard.edu/ai/'}],
 'generative-ai':[{label:'Hugging Face · LLM Course',url:'https://huggingface.co/learn/llm-course/chapter1/1'}],
 'data-analytics':[{label:'Microsoft Learn · Get started with data analytics',url:'https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/'},{label:'Kaggle Learn · practical data skills',url:'https://www.kaggle.com/learn'}],
 default:[{label:'Python official tutorial',url:'https://docs.python.org/3/tutorial/'},{label:'Kaggle Learn · practical data skills',url:'https://www.kaggle.com/learn'},{label:'freeCodeCamp · video lessons',url:'https://www.youtube.com/@freecodecamp/playlists'}],
 'web-development':[{label:'MDN Web development curriculum',url:'https://developer.mozilla.org/en-US/curriculum/'},{label:'React · Learn',url:'https://react.dev/learn'},{label:'freeCodeCamp · video lessons',url:'https://www.youtube.com/@freecodecamp/playlists'}],
 cybersecurity:[{label:'OWASP Web Security Testing Guide',url:'https://owasp.org/www-project-web-security-testing-guide/'},{label:'PortSwigger Web Security Academy',url:'https://portswigger.net/web-security'},{label:'Computerphile · video lessons',url:'https://www.youtube.com/@Computerphile/playlists'}]
};
