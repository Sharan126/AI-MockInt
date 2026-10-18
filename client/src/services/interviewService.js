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
  jobDescription = '',
  pressureMode = false
) => {
  const response = await API.post('/interview/start', {
    role,
    resumeText,
    totalQuestions,
    companyTrack,
    interviewerPersona,
    jobDescription,
    pressureMode,
  });
  return response.data.data;
};

const getInterview = async (id) => {
  const response = await API.get(`/interview/${id}`);
  return response.data.data;
};

const submitTextAnswer = async (interviewId, answer, candidateAudio = null) => {
  const response = await API.post(`/interview/${interviewId}/answer`, {
    answer,
    candidateAudio,
  });
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

const auditWhiteboard = async (interviewId, whiteboardData) => {
  const response = await API.post(`/interview/${interviewId}/audit-whiteboard`, whiteboardData);
  return response.data.data;
};

const optimizeResume = async (resumeText, targetRole) => {
  const response = await API.post('/interview/optimize-resume', { resumeText, targetRole });
  return response.data.data;
};

const shareInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/share`);
  return response.data.data;
};

const getSharedInterview = async (token) => {
  const response = await API.get(`/interview/shared/${token}`);
  return response.data.data;
};

const updateGoal = async (goalData) => {
  const response = await API.post('/interview/goal', goalData);
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
  auditWhiteboard,
  optimizeResume,
  shareInterview,
  getSharedInterview,
  updateGoal,
};