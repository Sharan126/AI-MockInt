import API from './api.js';

const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

const startInterview = async (
  role,
  resumeText,
  totalQuestions = 5,
  companyTrack = 'General',
  interviewerPersona = 'Natalie',
  jobDescription = ''
) => {
  const response = await API.post('/interview/start', {
    role,
    resumeText,
    totalQuestions,
    companyTrack,
    interviewerPersona,
    jobDescription,
  });
  return response.data.data;
};

const getInterview = async (id) => {
  const response = await API.get(`/interview/${id}`);
  return response.data.data;
};

const submitTextAnswer = async (interviewId, answer) => {
  const response = await API.post(`/interview/${interviewId}/answer`, { answer });
  return response.data.data;
};

const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  const response = await API.post('/interview/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const submitCode = async (interviewId, code, language) => {
  const response = await API.post(`/interview/${interviewId}/code`, { code, language });
  return response.data.data;
};

const endInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/end`);
  return response.data.data;
};

export {
  uploadResume,
  getResume,
  startInterview,
  getInterview,
  submitTextAnswer,
  transcribeAudio,
  submitCode,
  endInterview,
};